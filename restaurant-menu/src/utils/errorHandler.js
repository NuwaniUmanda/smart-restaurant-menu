// Error types and their corresponding user-friendly messages
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FIREBASE_ERROR: 'FIREBASE_ERROR',
  IMAGE_UPLOAD_ERROR: 'IMAGE_UPLOAD_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

// Firebase error codes mapping
export const FIREBASE_ERROR_CODES = {
  'auth/user-not-found': 'No account found with this email address',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Invalid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/operation-not-allowed': 'This operation is not allowed',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/invalid-credential': 'Invalid credentials',
  'auth/requires-recent-login': 'Please log in again to perform this action'
};

// HTTP status code mapping
export const HTTP_ERROR_MESSAGES = {
  400: 'Bad request. Please check your input and try again',
  401: 'Authentication required. Please log in again',
  403: 'Access denied. You don\'t have permission to perform this action',
  404: 'Resource not found',
  408: 'Request timeout. Please try again',
  429: 'Too many requests. Please wait a moment and try again',
  500: 'Server error. Please try again later',
  502: 'Bad gateway. Please try again later',
  503: 'Service unavailable. Please try again later',
  504: 'Gateway timeout. Please try again later'
};

/**
 * Classify error based on its type and content
 */
export const classifyError = (error) => {
  // Check if it's a Firebase auth error
  if (error.code && error.code.startsWith('auth/')) {
    return ERROR_TYPES.FIREBASE_ERROR;
  }

  // Check if it's a network error
  if (error.message && (
    error.message.includes('Network Error') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('ERR_NETWORK') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED')
  )) {
    return ERROR_TYPES.NETWORK_ERROR;
  }

  // Check if it's a timeout error
  if (error.message && error.message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT_ERROR;
  }

  // Check if it's an HTTP error
  if (error.status) {
    if (error.status === 401) return ERROR_TYPES.AUTHENTICATION_ERROR;
    if (error.status === 403) return ERROR_TYPES.AUTHORIZATION_ERROR;
    if (error.status === 400) return ERROR_TYPES.VALIDATION_ERROR;
    if (error.status >= 500) return ERROR_TYPES.SERVER_ERROR;
  }

  // Check response status if available
  if (error.response && error.response.status) {
    if (error.response.status === 401) return ERROR_TYPES.AUTHENTICATION_ERROR;
    if (error.response.status === 403) return ERROR_TYPES.AUTHORIZATION_ERROR;
    if (error.response.status === 400) return ERROR_TYPES.VALIDATION_ERROR;
    if (error.response.status >= 500) return ERROR_TYPES.SERVER_ERROR;
  }

  // Check for validation errors
  if (error.message && (
    error.message.includes('validation') ||
    error.message.includes('required') ||
    error.message.includes('invalid')
  )) {
    return ERROR_TYPES.VALIDATION_ERROR;
  }

  // Check for image upload errors
  if (error.message && (
    error.message.includes('image') ||
    error.message.includes('upload') ||
    error.message.includes('file')
  )) {
    return ERROR_TYPES.IMAGE_UPLOAD_ERROR;
  }

  return ERROR_TYPES.UNKNOWN_ERROR;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const errorType = classifyError(error);

  // Firebase auth errors
  if (errorType === ERROR_TYPES.FIREBASE_ERROR && error.code) {
    return FIREBASE_ERROR_CODES[error.code] || 'Authentication failed. Please try again.';
  }

  // Network errors
  if (errorType === ERROR_TYPES.NETWORK_ERROR) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (errorType === ERROR_TYPES.TIMEOUT_ERROR) {
    return 'Request timed out. Please try again.';
  }

  // HTTP errors
  if (error.status && HTTP_ERROR_MESSAGES[error.status]) {
    return HTTP_ERROR_MESSAGES[error.status];
  }

  if (error.response && error.response.status && HTTP_ERROR_MESSAGES[error.response.status]) {
    return HTTP_ERROR_MESSAGES[error.response.status];
  }

  // Authentication errors
  if (errorType === ERROR_TYPES.AUTHENTICATION_ERROR) {
    return 'Authentication required. Please log in again.';
  }

  // Authorization errors
  if (errorType === ERROR_TYPES.AUTHORIZATION_ERROR) {
    return 'Access denied. You don\'t have permission to perform this action.';
  }

  // Validation errors
  if (errorType === ERROR_TYPES.VALIDATION_ERROR) {
    return error.message || 'Please check your input and try again.';
  }

  // Server errors
  if (errorType === ERROR_TYPES.SERVER_ERROR) {
    return 'Server error. Please try again later.';
  }

  // Image upload errors
  if (errorType === ERROR_TYPES.IMAGE_UPLOAD_ERROR) {
    return 'Failed to upload image. Please try again with a different image.';
  }

  // Default error message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Log error for debugging (in development) or monitoring (in production)
 */
export const logError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    type: classifyError(error),
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // In production, you might want to send to an error reporting service
  // like Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorReportingService(errorInfo);
    console.error('Production error:', errorInfo);
  }
};

/**
 * Handle error with logging and return user-friendly message
 */
export const handleError = (error, context = '') => {
  logError(error, context);
  return getErrorMessage(error);
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Validate form data
 */
export const validateFormData = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];

    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = `${field} is required`;
    } else if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
    } else if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${field} must be no more than ${fieldRules.maxLength} characters`;
    } else if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || `${field} format is invalid`;
    } else if (value && fieldRules.custom) {
      const customError = fieldRules.custom(value, data);
      if (customError) errors[field] = customError;
    }
  });

  return errors;
};
