class ApiError extends Error {
  constructor(errorObj) {
    const { status, type, message } = errorObj;

    super(message);

    Object.assign(this, {
      status,
      type,
    });
  }
}

export default ApiError;
