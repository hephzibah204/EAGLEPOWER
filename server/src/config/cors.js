const developmentOrigins = 'http://localhost:5173,http://localhost:4173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000';

export function createCorsOptions(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const origins = (env.CORS_ORIGIN || (production ? '' : developmentOrigins))
    .split(',').map(value => value.trim()).filter(Boolean);
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || (production && parsed.protocol !== 'https:') || !['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('CORS_ORIGIN must contain exact origins; production origins must use HTTPS.');
    }
  }
  return {
    origin(origin, callback) {
      if (!origin || origins.includes(origin) || (!production && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
        return callback(null, true);
      }
      const error = new Error('Request origin is not permitted.');
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Portal-Type', 'X-Eagle-Request']
  };
}

