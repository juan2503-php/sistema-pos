import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SOCKET_URL = '/';

export function useSocketEvents(events) {
  const { user } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Inicializar socket con reconexión automática
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
      // Unirse a sala basada en rol
      socket.emit('join:role', user.role);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    // Registrar eventos dinámicos pasados en el hook
    Object.entries(events).forEach(([eventName, callback]) => {
      socket.on(eventName, callback);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, events]); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef.current;
}
