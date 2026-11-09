// Never serialize provider errors: messages, stacks and nested responses can contain secrets.
const ERROR_NAMES = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'URIError', 'ValidationError', 'JsonWebTokenError', 'TokenExpiredError']);
const ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EADDRINUSE', 'SQLITE_BUSY', 'SQLITE_CONSTRAINT', 'ERR_SQLITE_ERROR']);

export function logSafeError(event, error, level = 'error') {
  const logger = level === 'warn' ? console.warn : console.error;
  if (process.env.NODE_ENV === 'development') {
    logger(event, error);
    return;
  }
  logger(event, {
    category: ERROR_NAMES.has(error?.name) ? error.name : 'Error',
    ...(ERROR_CODES.has(error?.code) ? { code: error.code } : {})
  });
}

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|email|phone|address|name|account|bank|comment|remark|payload|body|query|url/i;

export function sanitizeAuditDetails(value, depth = 0) {
  if (depth > 5) return '[TRUNCATED]';
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  // Freeform descriptions frequently contain names, credentials and academic records.
  if (typeof value === 'string') return '[REDACTED]';
  if (Array.isArray(value)) return value.slice(0, 50).map(item => sanitizeAuditDetails(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, item]) => [
      key, SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitizeAuditDetails(item, depth + 1)
    ]));
  }
  return '[REDACTED]';
}
