import React, { useEffect, useRef } from "react";
import { useSocket, ConversationStates} from "@/hooks/useSocket";

const VoicePlayer = () => {
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound =  (sound_name: string, volume: number = 0.5) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${sound_name}`;
      audioRef.current.volume = volume;
      audioRef.current.play().catch((err) => {
        console.error("Error playing the audio:", err);
      });
      // volume
    }
  }

  useEffect(() => {
    if (!socket) return;

    socket.on("play-sound", (data): void => {
      console.log("Playing sound", data);
      playSound(data.sound_name, data.volume);
    });

    socket.on("stop-sound", (): void => {
      audioRef.current?.pause();
    });

    return () => {
      socket.off("play-sound");
    };
  }, [socket]);

  return (
    <div>
      <audio ref={audioRef} controls autoPlay style={{display: "none"}}/>
    </div>
  );
};

export default VoicePlayer;