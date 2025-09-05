import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.css';

export default function BackButton({ className }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/', { replace: true });  // Go to Home page without adding history entry
    window.location.reload();           // Reload the page to reconnect to server
  };

  return (
    <button
      className={`${styles.backBtn} ${className || ""}`}
      onClick={handleBack}
      aria-label="Back to Home"
      type="button"
    >
      ← Home
    </button>
  );
}