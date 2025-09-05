import { useRef } from 'react';
import styles from './ClipboardInput.module.css';
import UploadIcon from "../icons/upload.svg?react";


export default function ClipboardInput({ message, setMessage, onSend, onFileSelect }) {
  const fileInputRef = useRef();

  return (
    <div className={styles.inputArea}>
      <textarea
      id="messageInput"
      name="message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type or paste text here..."
        rows={6}
        className={styles.textareaInput}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSend();
          }
        }}
        aria-label="Message input"
      />

      {/* Right side: stacked buttons */}
      <div className={styles.buttonColumn}>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files.length > 0) onFileSelect(e.target.files[0]);
            e.target.value = '';
          }}
        />

        <button
          onClick={onSend}
          disabled={!message.trim()}
          className={styles.sendBtn}
          aria-label="Send message"
        >
          Send
        </button>

        <button
          type="uploadbutton"
          onClick={() => fileInputRef.current.click()}
          className={styles.attachBtn}
          aria-label="Attach file"
        >
          <span className={styles.innerBorder}>
            <UploadIcon className={`${styles.icon} ${styles.UploadIcon}`} />
          </span>
        </button>
      </div>
    </div>
  );
}
