import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { onRequest } from '../functions/api/[[catchall]].js';

// Disposable preview. All HR writes go to memory, never the school databases.
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../migrations/hr/0001_staff.sql', import.meta.url), 'utf8'));
const HR_DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    const wrap = args => ({ bind: (...values) => wrap(values), all: async () => ({ results: stmt.all(...args) }), first: async () => stmt.get(...args) || null, run: async () => stmt.run(...args) });
    return wrap([]);
  },
  async batch(statements) { sqlite.exec('BEGIN'); try { const result = []; for (const stmt of statements) result.push(await stmt.run()); sqlite.exec('COMMIT'); return result; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } },
};
const root = resolve('out');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost:4176');
    if (url.pathname.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const request = new Request(url, { method: req.method, headers: req.headers, ...(body.length ? { body } : {}) });
      const response = await onRequest({ request, env: { HR_DB } });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    if (!extname(file)) file = resolve(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch (err) { console.error(err.message); res.writeHead(500); res.end('Preview error'); }
}).listen(4176, '127.0.0.1', () => console.log('Disposable HR preview: http://127.0.0.1:4176'));
