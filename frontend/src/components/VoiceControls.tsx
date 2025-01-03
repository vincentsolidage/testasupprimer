// VoiceControls.tsx
import { useRef } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket, ConversationStates} from "@/hooks/useSocket";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { useAudioContext } from '@/hooks/useAudio';

const VoiceControls = () => {

	const { toast } = useToast();
	const { setState } = useSocket();

	const { assistantIsPlaying, userIsRecording, startRecording, stopRecording, stopPlayback } = useAudioContext();

	const handleClick = async () => {
		if (assistantIsPlaying){
			setState(ConversationStates.STOPPED);
			stopRecording("forced");
			stopPlayback();
		} else if (userIsRecording) {
			setState(ConversationStates.STOPPED);
			stopRecording("forced");
		} else {
			setState(ConversationStates.AVAILABLE);
			await startRecording();
		}
	};

	return (
		<div className="relative flex-1">
			<Button
				variant="default"
				className={cn(
					"w-full text-white py-8 text-lg font-medium rounded-xl",
					userIsRecording || assistantIsPlaying ? 
					"bg-rose-500 hover:bg-rose-700" : "bg-teal-500 hover:bg-teal-600"
				)}
				onClick={handleClick}
				// disabled={assistantIsPlaying}
			>
				<span className="flex items-center gap-2">
					{assistantIsPlaying || userIsRecording ? (
						<>
							<Square className="h-5 w-5" />
							Arrêter la discussion
						</>
					) : (
						<>
							<Mic className="h-5 w-5" />
							Expliquer oralement
						</>
					)}
				</span>
			</Button>
		</div>
	);
};

VoiceControls.displayName = "VoiceControls";

export default VoiceControls;