import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (token) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (token) {
            socketRef.current = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                console.log('Socket connected:', socketRef.current.id);
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token]);

    return socketRef;
};
