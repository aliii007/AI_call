import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
  visible
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white" />;
      case 'info':
        return <Info className="h-5 w-5 text-white" />;
      default:
        return <CheckCircle className="h-5 w-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-600';
      case 'error':
        return 'bg-error-600';
      case 'info':
        return 'bg-primary-600';
      default:
        return 'bg-success-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 rounded-lg shadow-lg px-4 py-3 ${getBackgroundColor()}`}
        >
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="text-white font-medium">{message}</span>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            className="ml-2 text-white hover:text-gray-200 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};