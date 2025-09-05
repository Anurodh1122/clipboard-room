import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../utils/socket';
import {
  startWebRTC,
  handleOffer,
  handleAnswer,
  handleCandidate,
  setIsOfferer,
} from '../utils/webrtc';
import styles from '../styles/pages/JoinRoom.module.css';
import BackButton from '../components/BackButton';

export default function JoinRoom() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const codeRef = useRef('');
  const navigate = useNavigate();

  useEffect(() => {
    
    const onAnyHandler = (event, ...args) => {
      console.log(`Socket event received: ${event}`, args);
    };
    socket.onAny(onAnyHandler);
        

    async function onReady() {
      console.log('Join accepted');

      setIsOfferer(false);

      startWebRTC(
        socket,
        (msg) => {
          console.log('Sending signaling message:', msg);
          socket.emit('signal', msg);
        },
        (log) => console.log('WebRTC Log:', log),
        (ready) => {
          console.log('WebRTC ready status:', ready);
          if (ready) {
            navigate(`/room/${codeRef.current}`);
          }
        }
      );
    }
    async function onSignal({ type, data }) {
      if (type === 'offer') {
        await handleOffer(data, socket, (msg) => socket.emit('signal', msg), (log) => console.log('HandleOffer:', log), () => console.log('[JoinRoom] Data channel ready'));
      } else if (type === 'answer') {
        await handleAnswer(data, (log) => console.log('HandleAnswer:', log));
      } else if (type === 'candidate') {
        await handleCandidate(data, (log) => console.log('HandleCandidate:', log));
      }
    }

    function onError(msg) {
      setError(msg || 'Unable to join room');
    }

    function onJoined(room) {
      console.log(`[Socket] joined event received: ${room}`);
      // Optionally, you can show UI feedback here if needed
    }

    socket.on('signal', onSignal);
    socket.on('error', onError);
    socket.on('ready', onReady);
    socket.on('joined', onJoined);

    return () => {
      socket.off('signal', onSignal);
      socket.off('error', onError);
      socket.off('ready', onReady);
      socket.off('joined', onJoined);
      socket.offAny(onAnyHandler);
    };
  }, [navigate]);

  const handleJoin = () => {
    if (!code.trim()) {
      setError('Please enter a room code');
      return;
    }

    const upperCode = code.toUpperCase();
    codeRef.current = upperCode;
    setError('');

    console.log('Emitting join for room:', codeRef.current);
    socket.emit('join', upperCode);
  };

  return (
    <div className={styles.container}>
      < BackButton className={styles.backRight} />
      <h1 className={styles.title}>Enter the code below to join...</h1>

      <input
        type="text"
        placeholder="Room Code"
        className={styles.input}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={10}
        aria-label="Room code input"
      />

      <button
        onClick={handleJoin}
        className={styles.connectBtn}
        aria-label="Connect to room"
      >
        Connect
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
