// Check before importing modules that open or migrate the database.
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WHATSAPP !== 'true') {
  throw new Error('WhatsApp integration is disabled pending its authorization and shared-database deployment audit. Set ENABLE_WHATSAPP=true to override.');
}
await import('./index.js');
