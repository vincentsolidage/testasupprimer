import { useContext, createContext, createRef } from 'react';
import { Socket } from 'socket.io-client';

export enum ConversationStates {
    STOPPED = 'STOPPED',
    AVAILABLE = 'AVAILABLE',
    UNAVAILABLE = 'UNAVAILABLE',

    USER_READY = 'USER_READY',
    USER_SPEAKING = 'USER_SPEAKING',
    USER_SILENCE = 'USER_SILENCE',
    USER_DONE_SPEAKING = 'USER_DONE_SPEAKING',

    ASSISTANT_THINKING = 'ASSISTANT_THINKING',
    ASSISTANT_SPEAKING = 'ASSISTANT_SPEAKING',
    ASSISTANT_DONE_SPEAKING = 'ASSISTANT_DONE_SPEAKING',
}

export interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    state: React.Ref<ConversationStates>;
    setState?: (state: ConversationStates, data?) => void;
}

export const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    state: createRef<ConversationStates>(),
    setState: () => { },
});

export const useSocket = () => useContext(SocketContext);
