import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConversationStates, SocketContext } from '../hooks/useSocket';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const state = useRef<ConversationStates>(ConversationStates.UNAVAILABLE);

  useEffect(() => {
    const newSocket = io('localhost:8090');

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('identity', {token: localStorage.token});
      newSocket.on('identity', (message) => {localStorage.token = message.token;})
      state.current = ConversationStates.AVAILABLE;
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      state.current = ConversationStates.UNAVAILABLE;
    });

    newSocket.on('state', (newState) => {
      // console.log('> STATE', newState);
      state.current = newState;
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const setNewState = (newState: ConversationStates, data = null) => {
    if (!isConnected) return;
    // console.log('> STATE', newState);
    if (Object.values(ConversationStates).includes(newState)) {
      state.current = newState;
      socket.emit(newState, data);
      console.warn('> STATE', newState);
    }
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, state, setState: setNewState}}>
      {children}
    </SocketContext.Provider>
  );
};