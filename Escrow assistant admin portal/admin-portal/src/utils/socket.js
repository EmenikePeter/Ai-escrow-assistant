import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_OPTIONS } from '../config';

let socketInstance;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(API_BASE_URL || undefined, SOCKET_OPTIONS);
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = undefined;
  }
};
