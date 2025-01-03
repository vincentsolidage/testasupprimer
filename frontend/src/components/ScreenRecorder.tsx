// ScreenRecorder.tsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useSocket, ConversationStates} from "@/hooks/useSocket";
import {cn} from "@/lib/utils";

const ScreenRecorder = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [captures, setCaptures] = useState(0);

  const startCapturing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
        },
        audio: false,
        // @ts-expect-error : Its working
        preferCurrentTab: false,
        surfaceSwitching: "exclude",
        selfBrowserSurface: "exclude",
        monitorTypeSurfaces: "include",
      });

      streamRef.current = stream;
      
      // Create video element if it doesn't exist
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
      }
      
      // Create canvas element if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setIsCapturing(true);
      setCaptures(1);

      toast({
        title: "Capture d'écran activée",
        description: "La capture d'écran est maintenant active",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Error starting screen capture:", err);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la capture d'écran",
        variant: "destructive",
      });
    }
  };

  const stopCapturing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setCaptures(0);
    
    toast({
      title: "Capture terminée",
      description: "La capture d'écran est arrêtée",
    });
  };

  useEffect(() => {
    if (!socket) return;
    if (captures === 0) return;
    socket.on("screenshot", () => {
      setCaptures((prev) => prev + 1);
    })
    const get_screenshot = async () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.9);
        });
        return blob;
      } catch (error) {
        console.error("Error creating screenshot:", error);
      }
    };
    get_screenshot().then((blob) => {
      console.warn("Sending screenshot to assistant");
      socket.emit("user-screen", blob)
    });
  }, [socket, captures]);

  return (
    <Button
      variant={isCapturing ? "outline" : "secondary"}
      onClick={isCapturing ? stopCapturing : startCapturing}
      className={cn("flex items-center gap-2 text-white hover:text-white", isCapturing ? "bg-rose-500 hover:bg-rose-700" : "bg-teal-500 hover:bg-teal-600")}
    >
      <Camera className="w-5 h-5" />
      {isCapturing ? "Arrêter" : "Capturer l'écran"}
    </Button>
  );
};

export default ScreenRecorder;