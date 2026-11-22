// serve.ts — tiny static server for local playtesting of RUNEFUSION.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('./game/', import.meta.url).pathname;
const port = Number(process.env.PORT || 8901);
const types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
};

createServer((req, res) => {
  const path = decodeURIComponent(req.url?.split('?')[0] || '/');
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!existsSync(file) || file.includes('..')) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log('RUNEFUSION at http://localhost:' + port));
