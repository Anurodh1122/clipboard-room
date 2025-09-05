import { io } from 'socket.io-client';

const backendUrl =
  window.__BACKEND_URL__ || `${window.location.protocol}//${window.location.hostname}:3080`;

const socket = io(backendUrl, {
  transports: ['websocket', 'polling']
});

export default socket;
