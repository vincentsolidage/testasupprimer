// components/VoiceVisualizer.tsx
import { useState, useRef, useEffect } from "react";
import { useAudioContext } from '@/hooks/useAudio';

const VoiceVisualizer = () => {

	const { silenceThreshold, userIsRecording, assistantIsPlaying, analyserNode } = useAudioContext();
	const type = userIsRecording ? "user" : assistantIsPlaying ? "assistant" : null;

	const config = {
		user: {
			bgColor: "bg-[#40B3A2]",
			label: "C'est à vous de parler",
		},
		assistant: {
			bgColor: "bg-blue-500",
			label: "Marc",
		},
	}[type];

	const BAR_WIDTH = 8;
	const BAR_GAP = 4;
	const HEIGHT_MULTIPLIER = 0.1;
	const MIN_HEIGHT = 0;

	// === Audio Visualization ===
	const [audioData, setAudioData] = useState<number[]>(new Array(32).fill(0));
	const animationFrameRef = useRef<number>();

	useEffect(() => {

		const processFrequencyData = (data: Uint8Array, scale: number): number[] => {
			const sampleRate = 44100;
			const fftSize = 1024;
			const binSize = sampleRate / fftSize;
			
			const startBin = Math.floor(500 / binSize);
			const endBin = Math.floor(2500 / binSize);
			
			const NB_BINS = 32;
			const processed: number[] = new Array(NB_BINS).fill(0);
			const samplesPerBin = Math.floor((endBin - startBin) / NB_BINS);
			
			for (let i = 0; i < NB_BINS; i++) {
			let sum = 0;
			const binStart = startBin + (i * samplesPerBin);
			
			for (let j = 0; j < samplesPerBin; j++) {
				if (binStart + j < data.length) {
				sum += data[binStart + j];
				}
			}
			
			// Normalize and apply scaling
			processed[i] = Math.max(Math.pow((sum / samplesPerBin) / 100, scale) * 100, 200)
			// processed[i] = Math.pow((sum / samplesPerBin) / 255, 1.8) * 255;
			}
			
			return processed;
		};

		function updateVisualization(scale: number){
			if (!analyserNode) return;
			const bufferLength = analyserNode.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);
			analyserNode.getByteFrequencyData(dataArray);
			const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
			const decibels = 20 * Math.log10(average / 255);
			let processedData: number[] = [];
			// if (decibels < silenceThreshold) {
				// processedData = new Array(32).fill(200);
			// }else {
			processedData = processFrequencyData(dataArray, scale);
			// }
			setAudioData(processedData);
			if (userIsRecording || assistantIsPlaying) {
				animationFrameRef.current = requestAnimationFrame(updateVisualization);
			}
		};
		if (userIsRecording || assistantIsPlaying) {
			updateVisualization(type === "user" ? 1.8 : 1.2);
		} else {
		  	cancelAnimationFrame(animationFrameRef.current);
		}
	}, [userIsRecording, assistantIsPlaying, analyserNode, type, silenceThreshold]);

	return (
		<div className={`${config.bgColor} p-4 rounded-xl text-white w-full mb-2 mx-auto`}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-lg font-medium"><b>{config.label}</b></span>
			</div>
			
			<div className="h-20 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center px-4">
				<div className="flex items-center gap-[4px] h-full py-2">
					{audioData.map((value, i) => (
						<div
							key={i}
							className="bg-white/90 rounded-sm transition-all duration-50"
							style={{
								height: `${Math.min(100, (value / 255) * 100 * HEIGHT_MULTIPLIER)}%`,
								width: `${BAR_WIDTH}px`,
								marginRight: `${BAR_GAP}px`,
								transform: `scaleY(${Math.min(Math.max(MIN_HEIGHT, value / 255), 1)})`,
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default VoiceVisualizer;