/**
 * Recursive Input Sanitizer Middleware
 * Strips dangerous script tags, malicious event handlers, javascript pseudo-protocols,
 * and null-bytes from request parameters, queries, and bodies.
 */

function sanitizeValue(value) {
  if (typeof value === 'string') {
    // 1. Remove null bytes and invisible control characters (except newline, tab, carriage return)
    let cleaned = value.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // 2. Strip dangerous script tags and execution wrappers
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 3. Neutralize javascript: and vbscript: URIs
    cleaned = cleaned.replace(/javascript\s*:/gi, 'blocked-scheme:');
    cleaned = cleaned.replace(/vbscript\s*:/gi, 'blocked-scheme:');

    // 4. Neutralize inline event handlers in untrusted markup (e.g. onerror=, onload=, onclick=)
    cleaned = cleaned.replace(/\bon\w+\s*=/gi, (match) => `data-blocked-${match}`);

    return cleaned;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitizedObj = {};
    for (const [k, v] of Object.entries(value)) {
      // Disallow prototype pollution keys
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      sanitizedObj[k] = sanitizeValue(v);
    }
    return sanitizedObj;
  }

  return value;
}

export function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
}
