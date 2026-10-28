import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const START_PORT = Number(process.env.PORT || 5173);
const OPEN = !process.argv.includes('--no-open');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

function handler(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    const filePath = path.normalize(path.join(ROOT, pathname));
    const rel = path.relative(ROOT, filePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found: ' + pathname);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
}

function lanUrls(port) {
  const urls = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${port}`);
      }
    }
  }
  return urls;
}

const server = http.createServer(handler);
let port = START_PORT;
let attempts = 0;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && attempts < 20) {
    attempts += 1;
    port += 1;
    server.listen(port, '0.0.0.0');
    return;
  }
  console.error(err);
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  const local = `http://localhost:${port}`;
  console.log('');
  console.log('  冰壶大作战 · 原型已启动');
  console.log('  ----------------------------------------');
  console.log(`  本机试玩:  ${local}`);
  const lans = lanUrls(port);
  if (lans.length) {
    console.log('  手机试玩（同一 Wi-Fi）:');
    for (const url of lans) console.log(`    ${url}`);
  } else {
    console.log('  未检测到局域网地址（手机试玩请用本机 IP）');
  }
  console.log('  ----------------------------------------');
  console.log('  按 Ctrl+C 停止');
  console.log('');

  if (OPEN) {
    const cmd =
      process.platform === 'win32'
        ? `start "" "${local}"`
        : process.platform === 'darwin'
          ? `open "${local}"`
          : `xdg-open "${local}"`;
    exec(cmd, () => {});
  }
});
