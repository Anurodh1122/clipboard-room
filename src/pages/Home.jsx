import { useNavigate } from 'react-router-dom';
import styles from '../styles/pages/Home.module.css';
import CreateIcon from "../icons/create.svg?react";
import JoinIcon from "../icons/join.svg?react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.containerWrapper}>
      <h1 className={styles.pageTitle}>Clipboard Room</h1>
      <div className={styles.container}>
        {/* Left Side - Create Room */}
        <button
          className={styles.optionBtn}
          onClick={() => navigate('/create')}
          aria-label="Create a new room"
        >
          <CreateIcon className={`${styles.icon} ${styles.CreateIcon}`} />
          <span>Create</span>
        </button>

        {/* Right Side - Join Room */}
        <button
          className={styles.optionBtn}
          onClick={() => navigate("/join")}
          aria-label="Join an existing room"
        >
          <JoinIcon className={`${styles.icon} ${styles.JoinIcon}`} />
          <span>Join</span>
        </button>
      </div>
    </div>
    );
}
