import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const iconStyles = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${typeStyles[type]}`}>
      <span className="text-lg font-bold flex-shrink-0">{iconStyles[type]}</span>
      <div className="flex-1">
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg font-bold hover:opacity-70"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};
