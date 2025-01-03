// contexts/AudioContext.tsx
import { useRef, useState } from 'react';
import { useSocket, ConversationStates} from "@/hooks/useSocket";
import { AudioContextContext } from '@/hooks/useAudio';

export function AudioContextProvider({ children }) {

	const { socket, state, setState } = useSocket();

	const sharedAudioContext = useRef<AudioContext | null>(null);
	const analyserNode = useRef<AnalyserNode | null>(null);

	const userMediaStream = useRef<MediaStream | null>(null);
	const userMediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
	const userMediaRecorder = useRef<MediaRecorder | null>(null);
	const [userIsRecording, setUserIsRecording] = useState(false); // refresh
	const userMediaBuffers = useRef<Array<Blob>>([]);

	const assistantAudioBufferQueue = useRef<AudioBuffer[]>([]);
	const [assistantAudioBuffer, setAssistantAudioBuffer] = useState<AudioBuffer | null>(null); // refresh
	const [assistantIsPlaying, setAssistantIsPlaying] = useState(false); // refresh

	const silenceStartRef = useRef<number | null>(null);

	const silenceShortTimeout = 1_000;
	const silenceThreshold = -30;

	const isDetecting = useRef(false);
	const animationFrameRef = useRef<number>();
	const hasSentSilenceShort = useRef(false);

	const setupAudio = async () => {
		if (![ConversationStates.USER_READY, ConversationStates.AVAILABLE].includes(state.current)) return;
		if (sharedAudioContext.current) return;
		console.warn('Setting up audio');
		sharedAudioContext.current = new AudioContext({
			latencyHint: "interactive",
			sampleRate: 24_000,
		});
		analyserNode.current = sharedAudioContext.current.createAnalyser();
		analyserNode.current.fftSize = 1024;
		analyserNode.current.smoothingTimeConstant = 0.3;
	};

	const setupMediaRecorder = (stream) => {
		if (![ConversationStates.USER_READY, ConversationStates.AVAILABLE].includes(state.current)) return;
		console.warn('Setting up media recorder');
		userMediaRecorder.current?.stop();
		userMediaStreamSource.current?.disconnect();
		analyserNode.current?.disconnect();
		
		userMediaStreamSource.current = sharedAudioContext.current.createMediaStreamSource(stream);
		userMediaStreamSource.current.connect(analyserNode.current);
		userMediaRecorder.current = new MediaRecorder(stream, {
			mimeType: 'audio/webm;codecs=opus'
		});
		userMediaRecorder.current.ondataavailable = (event) => {
			userMediaBuffers.current.push(event.data);
		};
		userMediaRecorder.current.onstop = sendRecordedData;
		userMediaRecorder.current.start(300);
	};

	const sendRecordedData = async () => {
		console.log('Sending recorded data...', state.current);
		if (userMediaBuffers.current.length > 0 && state.current === ConversationStates.USER_SILENCE) {
			console.warn('Recording stopped, sending data...');
			const blob = new Blob(userMediaBuffers.current, { type: 'audio/webm' });
			setState(ConversationStates.USER_DONE_SPEAKING, blob);
		}
		userMediaBuffers.current = [];
	};

	const startRecording = async () => {
		if (state.current != ConversationStates.AVAILABLE) return;
		setState(ConversationStates.USER_READY);
		await setupAudio();
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				noiseSuppression: true,
				echoCancellation: true,
				facingMode: "  "
			},
			// @ts-expect-error : Its working
			systemAudio: "exclude",
			video: false,
		});
		userMediaStream.current = stream;
		setupMediaRecorder(stream);

		const isUserSilent = () => {
			const bufferLength = analyserNode.current?.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);
			analyserNode.current?.getByteFrequencyData(dataArray);
			const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
			const decibels = 20 * Math.log10(average / 255);
			return decibels < silenceThreshold;
		};

		const detectSilence = () => {
			if (!isDetecting.current) {
				console.warn("Stopped detecting", state);
				if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
				return
			}

			if (isUserSilent()) {
				if (silenceStartRef.current === null) {
					silenceStartRef.current = Date.now();
				}
				const timing = Date.now() - silenceStartRef.current;

				if (silenceShortTimeout <= timing && timing <= silenceShortTimeout + 50) {
					console.warn("Silence court détecté");
					isDetecting.current = false;
					setState(ConversationStates.USER_SILENCE);
					stopRecording("silence");
				}
				// } else if (silenceShortTimeout + 500 <= timing) {
				// 	hasSentSilenceShort.current = false;
				// }
			} else {
				console.log("User is speaking");
				silenceStartRef.current = null;
			}

			animationFrameRef.current = requestAnimationFrame(detectSilence);
		};
		setUserIsRecording(true);
		setState(ConversationStates.USER_SPEAKING);
		isDetecting.current = true;
		setTimeout(() => {
			isDetecting.current = true;
			animationFrameRef.current = requestAnimationFrame(detectSilence);
		}, 500);
	};

	const stopRecording = (reason: string = "unknown") => {
		console.error("> Stopping recording", reason);
		isDetecting.current = false;
		if (animationFrameRef) cancelAnimationFrame(animationFrameRef.current);
		userMediaRecorder.current?.stop();
		userMediaStreamSource.current?.disconnect();
		userMediaStream.current?.getTracks().forEach(track => track.stop());
		userMediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
		sharedAudioContext.current?.destination?.disconnect();
		silenceStartRef.current = null;
		setUserIsRecording(false);
	};

	//  ASSISTANT

	const startPlayback = async () => {
		console.warn("Starting playback...");
		await setupAudio();
	};

	const stopPlayback = () => {
		sharedAudioContext.current.destination?.disconnect();
		analyserNode.current?.disconnect();
		assistantAudioBufferQueue.current = [];
		setAssistantIsPlaying(false);
		setAssistantAudioBuffer(null);
	}

	const convertPCM16ToAudioBuffer = async (base64String: string) => {
		if (!sharedAudioContext.current) {
			throw new Error('AudioContext not initialized');
		}
		try {
			// Decode base64 to binary
			const binaryString = atob(base64String);
			const len = binaryString.length;
			const bytes = new Uint8Array(len);

			for (let i = 0; i < len; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			// Convert to Int16Array (PCM16 format)
			const pcmData = new Int16Array(bytes.buffer);

			const numberOfChannels = 1;
			const sampleRate = 26_000;
			const audioBuffer = sharedAudioContext.current?.createBuffer(
				numberOfChannels,
				pcmData.length,
				sampleRate
			);

			const channelData = audioBuffer.getChannelData(0);
			for (let i = 0; i < pcmData.length; i++) {
				// Convert Int16 to Float32
				channelData[i] = pcmData[i] / 32768.0;
			}

			return audioBuffer;
		} catch (error) {
			console.error('Error converting PCM16 to AudioBuffer:', error);
			throw error;
		}
	};

	const handlePlaybackData = async (base64PCM: string) => {
	// const handlePlaybackData = async (buffer: ArrayBuffer) => {
		console.log('Handling playback data...', state.current);
		if (!base64PCM || [ConversationStates.STOPPED, ConversationStates.UNAVAILABLE].includes(state.current)) return;
		try {
			const audioBuffer = await convertPCM16ToAudioBuffer(base64PCM);
			// const audioBuffer = await sharedAudioContext.current.decodeAudioData(buffer);
			assistantAudioBufferQueue.current.push(audioBuffer);

			if (!assistantIsPlaying) {
				setAssistantIsPlaying(true);
				await playAudioBuffer();
				socket.emit("assistant-voice:started")
			}
		} catch (error) {
			console.error('Error handling playback data:', error);
		}
	}

	const playAudioBuffer = async () => {
		if (assistantAudioBufferQueue.current?.length === 0 && state.current === ConversationStates.ASSISTANT_DONE_SPEAKING) {
			stopPlayback();
			setTimeout(async () => {
				setState(ConversationStates.AVAILABLE);
				await startRecording()
			}, 1000);
			return;
		}
		const buffer = assistantAudioBufferQueue.current?.shift();
		if (sharedAudioContext.current?.state.current === 'suspended') {
			await sharedAudioContext.current?.resume();
		}
		setAssistantAudioBuffer(buffer);
		const source = sharedAudioContext.current?.createBufferSource();
		source.buffer = buffer;

		sharedAudioContext.current?.destination?.disconnect();
		analyserNode.current?.disconnect();
		source.connect(analyserNode.current);
		analyserNode.current?.connect(sharedAudioContext.current?.destination);

		source.onended = () => {
			playAudioBuffer();
		};
		source.start();
	}

	return (
		<AudioContextContext.Provider value={{
			analyserNode: analyserNode.current,
			userIsRecording,  // analyzer
			startRecording,
			stopRecording,
			silenceThreshold,
			assistantIsPlaying,  // analyzer
			assistantAudioBuffer, // analyzer
			stopPlayback,
			startPlayback,
			handlePlaybackData
		}}>
			{children}
		</AudioContextContext.Provider>
	);
};