// ChatControls.tsx
import React, { useState, useContext, useEffect } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import VoiceControls from "./VoiceControls";
import { useToast } from "./ui/use-toast";
import VoiceVisualizer from "./VoiceVisualizer";

import { ConversationStates, useSocket } from "@/hooks/useSocket";
import { useAudioContext } from '@/hooks/useAudio';

interface ChatControlsProps {
	onSendMessage: (message: string) => void;
}

const ChatControls = ({ onSendMessage }: ChatControlsProps) => {
	const { socket, state } = useSocket();
	const { toast } = useToast();
	
	const { userIsRecording, assistantIsPlaying, handlePlaybackData, startPlayback} = useAudioContext();
	const [inputMessage, setInputMessage] = useState("");

	const handleSendMessage = () => {
		if (inputMessage.trim()) {
			onSendMessage(inputMessage);
			setInputMessage("");
		}
	};

	useEffect(() => {
		if (!socket) return;
		socket.on("assistant-voice", handlePlaybackData);
		return () => {
			socket.off("assistant-voice");
		};
	}, [socket, handlePlaybackData, state]);

	return (
		<div className="mx-auto w-full sticky bottom-0 bg-white shadow-inner p-4">
			<div className="mx-auto max-w-2xl">
				{(userIsRecording || assistantIsPlaying) && (
					<VoiceVisualizer/>
				)}
				<div className="flex items-center gap-4 mb-4">
					<VoiceControls/>
				</div>
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<Input
							value={inputMessage}
							onChange={(e) => setInputMessage(e.target.value)}
							placeholder="Tapez votre message..."
							onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
							className="w-full"
						/>
					</div>
					<Button
						onClick={handleSendMessage}
						variant="secondary"
						size="icon"
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
				<p className="text-sm text-muted-foreground text-center mt-2">
					Marc de Super-zen AI peut faire des erreurs. Envisagez de vérifier les informations importantes.
				</p>
			</div>
		</div>
	);
}

export default ChatControls;