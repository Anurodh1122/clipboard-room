import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDataChannel, sendMessage } from '../utils/webrtc';
import styles from '../styles/pages/ChatRoom.module.css';
import ClipboardInput from '../components/ClipboardInput';
import ClipboardDisplay from '../components/ClipboardDisplay';
import BackButton from '../components/BackButton';
import DownloadIcon from "../icons/download.svg?react";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [clipboardText, setClipboardText] = useState('');
  const messagesEndRef = useRef(null);
  const [sentFile, setSentFile] = useState(null);
  const [sendProgress, setSendProgress] = useState(0);
  const [receivedFile, setReceivedFile] = useState(null);


  const incomingFileInfo = useRef(null);
  const incomingFileBuffer = useRef([]);
  const incomingFileReceivedSize = useRef(0);


  useEffect(() => {
    const dc = getDataChannel();
    if (!dc) return;

    const handleMessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'file-meta') {
            incomingFileInfo.current = data;
            incomingFileBuffer.current = [];
            incomingFileReceivedSize.current = 0;
            return;
          }
        } catch {
          // Not JSON — treat as normal text
        }
        setClipboardText(event.data);
      } else {
        // Binary chunk
        incomingFileBuffer.current.push(event.data);
        incomingFileReceivedSize.current += event.data.byteLength;

        if (incomingFileReceivedSize.current === incomingFileInfo.current.fileSize) {
          const blob = new Blob(incomingFileBuffer.current, { type: incomingFileInfo.current.fileType });
          const url = URL.createObjectURL(blob);
          setReceivedFile({ url, name: incomingFileInfo.current.fileName });
          setSentFile(null); // Reset sent when new file received
          // Reset buffers
          incomingFileInfo.current = null;
          incomingFileBuffer.current = [];
          incomingFileReceivedSize.current = 0;

        }
      }
    };

    dc.addEventListener('message', handleMessage);
    return () => {
      dc.removeEventListener('message', handleMessage);
    };
  }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessage(message, (log) => console.log(log));
    setClipboardText(message);
    setMessage('');
  };
  // New handler to go back home and reset state
  const handleFileSelect = (file) => {
    const dc = getDataChannel();
    if (!dc) {
      alert("No active connection yet");
      return;
    }

    setSentFile(file);
    setSendProgress(0);
    setReceivedFile(null); // Reset received when new file sent

    // Send file metadata first
    const metadata = JSON.stringify({
      type: 'file-meta',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    dc.send(metadata);

    const CHUNK_SIZE = 16 * 1024; // 16KB chunk size
    let offset = 0;
    const highWaterMark = 64 * 1024; // 64KB

    const reader = new FileReader();

    function readSlice(o) {
      const slice = file.slice(o, o + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    }

    reader.onload = (e) => {
      if (e.target.error) {
        console.error("File read error:", e.target.error);
        return;
      }
      function trySend() {
      if (dc.bufferedAmount > highWaterMark) {
        // Wait 100ms then try again
        setTimeout(trySend, 100);
      } else {
        dc.send(e.target.result);
        offset += e.target.result.byteLength;
        setSendProgress(Math.floor((offset / file.size) * 100));

        if (offset < file.size) {
          readSlice(offset);
        } else {
          setSendProgress(100);
          console.log("File sent successfully");
          setTimeout(() => setSendProgress(0), 30000);
        }
      }
    }

    trySend();
  };

  readSlice(0);
};

  return (
    <div className={styles.background}>
      <div className={styles.container}>
      
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.roomId}>Room: {roomId}</div>
          <BackButton className={styles.backRight} />
        </header>

        {/* Main Content Area */}
        <div className={styles.contentArea}>
          <ClipboardDisplay clipboardText={clipboardText} />

          {/* Sent File Panel */}
          {sentFile && (
            <div className={styles.sentFilePanel}>
              <button
                className={styles.closeBtn}
                aria-label="Close sent file panel"
                onClick={() => setSentFile(null)}
              >
                &times;
              </button>
              <h3>You sent:</h3>
              <p>
                {sentFile.name} ({(sentFile.size / 1024).toFixed(2)} KB)
              </p>
              {sendProgress > 0 && sendProgress < 100 && (
                <progress value={sendProgress} max="100" />
              )}
            </div>
          )}

          {/* Received File Panel */}
          {receivedFile && (
            <div className={styles.receivedFilePanel}>
              <button
                className={styles.closeBtn}
                aria-label="Close received file panel"
                onClick={() => setReceivedFile(null)}
              >
                &times;
              </button>
              <h3>Peer sent:</h3>
              <div className={styles.fileRow}>
                <span className={styles.fileName}>{receivedFile.name}</span>
                <a
                  href={receivedFile.url}
                  download={receivedFile.name}
                  className={styles.downloadBtn}
                  aria-label="Download file"
                >
                  <DownloadIcon
                    className={`${styles.icon} ${styles.DownloadIcon}`}
                  />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Input Area */}
        <ClipboardInput
          message={message}
          setMessage={setMessage}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div> 
  );
}