import styles from './ClipboardDisplay.module.css';
import { copyToClipboard } from '../utils/clipboard';

export default function ClipboardDisplay({ clipboardText }) {
  return (
    <main className={styles.clipboardContainer}>
      <pre className={styles.clipboardBox} aria-label="Shared clipboard content">
        {clipboardText || 'No clipboard content yet...'}
      </pre>
      <button
        onClick={() => copyToClipboard(clipboardText)}
        disabled={!clipboardText}
        className={styles.copyBtn}
      >
        Copy
      </button>
    </main>
  );
}
