import styles from './RetryCountdown.module.css';

interface RetryCountdownProps {
  attempt: number;
  totalAttempts: number;
  secondsRemaining: number;
}

/**
 * Componente presentacional puro (SPEC-011, TASK-011-1): sin estado ni
 * fetch propios, solo renderiza el countdown de reintentos que produce
 * useRetryingFetch (tarea separada, sin dependencia entre ambas). Se usa
 * tanto en PLP como en PDP mientras el fetch reintenta el cold-start del
 * backend en Render.
 *
 * `role="status"` + `aria-live="polite"` en el contenedor: lectores de
 * pantalla anuncian el cambio de countdown sin interrumpir al usuario.
 */
function RetryCountdown({ attempt, totalAttempts, secondsRemaining }: RetryCountdownProps) {
  return (
    <div className={styles.countdown} role="status" aria-live="polite">
      <span className={styles.emoji} aria-hidden="true">
        ⏰
      </span>
      <p className={styles.message}>
        El servidor no está despierto todavía. Reintentando en {secondsRemaining}s… (intento{' '}
        {attempt}/{totalAttempts})
      </p>
    </div>
  );
}

export default RetryCountdown;
