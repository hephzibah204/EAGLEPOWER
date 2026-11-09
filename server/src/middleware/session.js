export const SESSION_COOKIE = 'eagle_session';

export function readSessionCookie(req) {
  const entry = (req.headers.cookie || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(`${SESSION_COOKIE}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1)); } catch { return null; }
}

function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api' };
}

export function setSessionCookie(res, token, maxAge) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge });
  res.set('Cache-Control', 'no-store');
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  res.set('Cache-Control', 'no-store');
}

// A custom header prevents HTML form submissions; exact Origin validation also
// protects deployments where another origin has been allowed by a proxy.
export function requireSessionRequest(req, res, next) {
  const origin = req.headers.origin;
  const production = process.env.NODE_ENV === 'production';
  const configured = (process.env.CORS_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  const host = req.get ? req.get('host') : req.headers.host;
  const sameOrigin = host ? `${req.protocol || (production ? 'https' : 'http')}://${host}` : null;
  const allowed = [...configured, sameOrigin].filter(Boolean).filter(value => {
    try {
      const parsed = new URL(value);
      return parsed.origin === value && ['http:', 'https:'].includes(parsed.protocol) && (!production || parsed.protocol === 'https:');
    } catch { return false; }
  });
  const developmentLoopback = !production && typeof origin === 'string' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (req.headers['x-eagle-request'] !== '1' || !origin || (!allowed.includes(origin) && !developmentLoopback)) {
    return res.status(403).json({ success: false, message: 'Invalid session request origin.' });
  }
  return next();
}
