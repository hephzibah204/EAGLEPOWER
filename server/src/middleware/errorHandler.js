/**
 * Global Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  
  // In production, mask internal server errors (500) so raw database/system details are not exposed
  let message = err.message || 'An unexpected internal server error occurred.';
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'An unexpected internal server error occurred. Please contact the system administrator.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
