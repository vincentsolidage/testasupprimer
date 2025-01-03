import { createContext, useContext } from 'react';

export interface AudioContextState {
	analyserNode: AnalyserNode; // connected to userMediaStreamSource, or 

	// User microphone
	userIsRecording: boolean; // User
	startRecording: () => Promise<void>; // User
	stopRecording: (reason: string | null) => void; // User
	silenceThreshold: number;

	assistantIsPlaying: boolean; // Assistant
	assistantAudioBuffer: AudioBuffer | null;
	stopPlayback: () => void; // Assistant
	startPlayback: () => Promise<void>; // Assistant

	// handlePlaybackData: (chunk: ArrayBuffer) => Promise<void>; // Assistant
	handlePlaybackData: (base64PCM: string) => Promise<void>; // Assistant
}

export const AudioContextContext = createContext<AudioContextState | null>(null);

export const useAudioContext = () => {
    const context = useContext(AudioContextContext);
    if (!context) {
        throw new Error('useAudioContext must be used within an AudioContextProvider');
    }
    return context;
}

// Utils

