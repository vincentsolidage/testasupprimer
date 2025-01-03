import React from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  isBot: boolean;
}

const MessageBubble = ({ message, isBot }: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "max-w-[80%] p-4 rounded-2xl",
        isBot
          ? "bg-primary/10 text-secondary-foreground ml-0 mr-auto rounded-bl-none animate-in slide-in-from-left"
          : "bg-primary/30 text-black ml-auto mr-0 rounded-br-none animate-in slide-in-from-right"
      )}
    >
      <p className="text-md leading-relaxed">{message}</p>
    </div>
  );
};

export default MessageBubble;