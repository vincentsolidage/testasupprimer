// ChatInterface.tsx
import React, { useRef, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import BotAvatar from "./BotAvatar";
import MessageBubble from "./MessageBubble";
import ChatControls from "./ChatControls";
import SoundPlayer from "./SoundPlayer";
import { useSocket, ConversationStates} from "@/hooks/useSocket";
import ScreenRecorder from "./ScreenRecorder";

const ChatInterface = () => {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState([
    {
      text: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      isBot: true,
    },
  ]);
  
  const { socket } = useSocket();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('assistant-message', (message: string) => {
      setMessages(prev => [...prev, { text: message, isBot: true }]);
    });

    socket.on('user-message', (message: string) => {
      setMessages(prev => [...prev, { text: message, isBot: false }]);
    });

    return () => {
      socket.off('assistant-message');
      socket.off('user-message');
    };
  }, [socket]);

  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, { text: message, isBot: false }]);
    if (socket) {
      socket.emit('user-message', message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-accent">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Marc de Super-zen</h1>
          <ScreenRecorder />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-2xl mx-auto p-6 flex flex-col items-center">
          <BotAvatar />
          <p className="text-md text-muted-foreground italic mt-6 text-center">
            "Je suis avec vous pour vous aider à utiliser votre ordinateur en toute simplicité."
          </p>
        
        
          <div 
            ref={chatContainerRef}
            className="w-full space-y-4 my-8 overflow-y-auto max-h-[calc(100vh-400px)] px-4"
          >
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg.text}
                isBot={msg.isBot}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="shadow-sm">
        <ChatControls onSendMessage={handleSendMessage} />
        <SoundPlayer />
      </div>
    </div>
  );
};

export default ChatInterface;