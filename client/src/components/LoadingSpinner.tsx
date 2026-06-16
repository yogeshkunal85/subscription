import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<Props> = ({ size = 'md' }) => (
  <div className="spinner-wrap">
    <span className={`spinner spinner--${size}`} role="status" aria-label="Loading" />
  </div>
);

export default LoadingSpinner;
