import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

export function useSocketEvents(events) {
  const { user, token } = useAuthStore();
  const socketRef = useRef(null);
  const eventsRef = useRef(events);

  // Mantener referencia actualizada de events sin causar re-renders
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!user || !token) return;

    // Inicializar socket con autenticación y reconexión automática
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      // Auto-join basado en rol (manejado por el servidor)
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket auth error:', error.message);
    });

    // Registrar eventos dinámicos pasados en el hook
    Object.entries(eventsRef.current).forEach(([eventName, callback]) => {
      socket.on(eventName, callback);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef.current;
}
