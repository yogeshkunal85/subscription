import React from 'react';

interface Props {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<Props> = ({ message, onRetry }) => (
  <div className="error-message" role="alert">
    <span className="error-message__icon">⚠️</span>
    <div className="error-message__body">
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <button className="error-message__retry" onClick={onRetry} type="button">
          Try Again
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;
