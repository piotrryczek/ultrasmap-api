class ApiError extends Error {
  constructor(errorObj, nativeError = null) {
    const {
      status,
      type,
      message, // API response
    } = errorObj;

    if (nativeError) {
      super(nativeError.message);
    } else {
      super(message);
    }

    Object.assign(this, {
      userMessage: message,
      status,
      type,
    });
  }
}

export default ApiError;
