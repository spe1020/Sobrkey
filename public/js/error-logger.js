/**
 * Client-side error logging utility
 * Send errors to server for logging
 */
(function() {
  /**
   * Send an error to the server for logging
   * @param {Error|string} error - The error object or message
   * @param {Object} additionalContext - Additional context information
   * @returns {Promise<boolean>} Success status
   */
  async function logErrorToServer(error, additionalContext = {}) {
    try {
      let errorObj = {};
      
      if (error instanceof Error) {
        errorObj = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      } else {
        errorObj = {
          message: String(error),
          stack: null,
          name: 'CustomError'
        };
      }
      
      const context = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...additionalContext
      };
      
      const response = await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: errorObj.message,
          error: errorObj,
          context
        })
      });
      
      if (response.ok) {
        console.log('Error logged to server successfully');
        return true;
      } else {
        console.error('Failed to log error to server:', response.status);
        return false;
      }
    } catch (loggingError) {
      console.error('Error while logging to server:', loggingError);
      return false;
    }
  }
  
  // Global error handler
  window.addEventListener('error', function(event) {
    logErrorToServer({
      message: event.message,
      stack: event.error?.stack,
      name: event.error?.name || 'UnhandledError'
    }, {
      source: event.filename,
      lineNo: event.lineno,
      colNo: event.colno
    });
    
    // Don't prevent default - let the browser handle it normally
    return false;
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    logErrorToServer(error, {
      type: 'unhandledRejection',
      asyncContext: true
    });
    
    // Don't prevent default
    return false;
  });
  
  // Export to global scope
  window.ErrorLogger = {
    logError: logErrorToServer
  };
  
  console.log('Error logger initialized');
})();