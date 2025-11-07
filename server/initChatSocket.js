import initChatSocket from './chatSocket.js';

// Accepts an existing io instance, does not create a new one
export default function setupChatSocket(io) {
  initChatSocket(io);
}
