import React, { useEffect } from 'react';

interface Props {
  message: string;
  onDismiss: () => void;
  duration?: number;
  variant?: 'success' | 'error';
}

const Toast: React.FC<Props> = ({
  message,
  onDismiss,
  duration = 4000,
  variant = 'success',
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <div className={`toast toast--${variant}`} role="status" aria-live="polite">
      <span className="toast__icon">{variant === 'success' ? '✓' : '⚠'}</span>
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
