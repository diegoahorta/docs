#!/usr/bin/env node
/** Servidor estático mínimo para desenvolvimento (sem dependências). Uso: node tools/serve.mjs [porta] */
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const port = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.vtt': 'text/vtt', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root) || file.includes('node_modules')) { res.writeHead(403).end(); return; }
    let st = await stat(file).catch(() => null);
    if (st?.isDirectory()) { file = join(file, 'index.html'); st = await stat(file).catch(() => null); }
    if (!st) { res.writeHead(404).end('Not found'); return; }
    const type = TYPES[extname(file)] || 'application/octet-stream';
    const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
    if (range) { // necessário para avançar/voltar no áudio
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500).end(String(e)); }
}).listen(port, () => console.log(`ODU CREATIVE em http://localhost:${port}`));
