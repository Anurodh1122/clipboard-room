import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../utils/socket';
import {
  startWebRTC,
  createOffer,
  setIsOfferer,
  handleAnswer,
  handleCandidate,
} from '../utils/webrtc';
import styles from '../styles/pages/CreateRoom.module.css';
import BackButton from '../components/BackButton';


export default function CreateRoom() {
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();
  const roomCodeRef = useRef(''); 

  useEffect(() => {
     // mark immediately to avoid double-run

    const onAnyHandler = (event, ...args) => {
      console.log(`Socket event received: ${event}`, args);
    };
    socket.onAny(onAnyHandler);
        

    // Listen for when peer joins room (depends on your server message)
    async function onReady() {
      console.log('Ready event received, starting WebRTC as offerer');

      startWebRTC(
        socket,
        (msg) => {
            console.log('Sending signaling message:', msg);
            socket.emit('signal', msg);
        }, // send signaling data to server
        (log) => console.log('WebRTC log:', log),
        (ready) => {
          console.log('WebRTC ready status:', ready);  
          if (ready) {
            navigate(`/room/${roomCodeRef.current}`);
          }
        }
      );

      await createOffer(socket, (log) => console.log('createOffer log:', log));
    }
    async function onSignal({ type, data }) {
      if (type === 'answer') {
        await handleAnswer(data, (log) => console.log('HandleAnswer:', log));
      } else if (type === 'candidate') {
        await handleCandidate(data, (log) => console.log('HandleCandidate:', log));
      }
    }

    function onError(msg) {
      console.error('Error:', msg);
      // optionally show to user
    }
    function onJoined(room) {
      console.log(`[Socket] joined event received: ${room}`);
      // You can add UI feedback here if you want
    }

    socket.on('ready', onReady);
    socket.on('signal', onSignal);
    socket.on('error', onError);
    socket.on('joined', onJoined);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    roomCodeRef.current = code;

    setIsOfferer(true);

    // Join room on server
    socket.emit('join', code);

    return () => {
      socket.off('ready', onReady);
      socket.off('signal', onSignal);
      socket.off('error', onError);
      socket.off('joined', onJoined);
      socket.offAny(onAnyHandler);
    
    };
  }, [navigate]);
      

  return (
    <div className={styles.container}>
      
      < BackButton className={styles.backRight} />
      
      <h1 className={styles.title}>Room ID:</h1>
      <div className={styles.roomId}>{roomCode}</div>
      <p className={styles.instruction}>
        Share this code to connect:
      </p>
      

      <p className={styles.waiting}>Waiting for peer to join...</p>
    </div>
  );
}