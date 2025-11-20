import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { classifyError, ERROR_TYPES } from '../utils/errorHandler';

const ErrorAlert = ({ 
  error, 
  onClose, 
  showClose = true, 
  className = '', 
  autoHide = false,
  autoHideDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const errorType = classifyError(error);
  const message = error?.message || error || 'An error occurred';

  // Determine alert type and styling based on error classification
  let alertConfig = {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-400',
    title: 'Error'
  };

  switch (errorType) {
    case ERROR_TYPES.NETWORK_ERROR:
      alertConfig = {
        icon: AlertTriangle,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-400',
        title: 'Network Error'
      };
      break;
    case ERROR_TYPES.AUTHENTICATION_ERROR:
      alertConfig = {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-400',
        title: 'Authentication Required'
      };
      break;
    case ERROR_TYPES.AUTHORIZATION_ERROR:
      alertConfig = {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-400',
        title: 'Access Denied'
      };
      break;
    case ERROR_TYPES.VALIDATION_ERROR:
      alertConfig = {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-400',
        title: 'Validation Error'
      };
      break;
    case ERROR_TYPES.SERVER_ERROR:
      alertConfig = {
        icon: AlertTriangle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-400',
        title: 'Server Error'
      };
      break;
    case ERROR_TYPES.TIMEOUT_ERROR:
      alertConfig = {
        icon: AlertTriangle,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-400',
        title: 'Timeout Error'
      };
      break;
    default:
      break;
  }

  const IconComponent = alertConfig.icon;

  return (
    <div className={`rounded-lg border p-4 ${alertConfig.bgColor} ${alertConfig.borderColor} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${alertConfig.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${alertConfig.textColor}`}>
              {alertConfig.title}
            </h3>
            {showClose && (
              <button
                onClick={handleClose}
                className={`ml-auto inline-flex flex-shrink-0 rounded-md p-1.5 ${alertConfig.textColor} hover:bg-opacity-20 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className={`mt-2 text-sm ${alertConfig.textColor}`}>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success alert component
export const SuccessAlert = ({ 
  message, 
  onClose, 
  showClose = true, 
  className = '', 
  autoHide = false,
  autoHideDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-green-800">
              Success
            </h3>
            {showClose && (
              <button
                onClick={handleClose}
                className="ml-auto inline-flex flex-shrink-0 rounded-md p-1.5 text-green-800 hover:bg-opacity-20 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-green-800">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Info alert component
export const InfoAlert = ({ 
  message, 
  onClose, 
  showClose = true, 
  className = '', 
  autoHide = false,
  autoHideDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-800">
              Information
            </h3>
            {showClose && (
              <button
                onClick={handleClose}
                className="ml-auto inline-flex flex-shrink-0 rounded-md p-1.5 text-blue-800 hover:bg-opacity-20 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-blue-800">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
