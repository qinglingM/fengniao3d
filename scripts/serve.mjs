import http from 'node:http';
import {readFile} from 'node:fs/promises';
const port = Number(process.env.STUDY_PORT || 4173);
const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    const data = await readFile(new URL('../dist/index.html', import.meta.url));
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(data);
  } catch {
    res.writeHead(503, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('The study is being prepared. Please refresh shortly.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Study 09: http://127.0.0.1:${port}`));
