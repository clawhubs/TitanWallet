import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, 'dist');
const indexPath = join(rootDir, 'index.html');
const port = Number.parseInt(process.env.PORT || '4173', 10);
const host = process.env.HOST || '0.0.0.0';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const militaryGradeTarget = 'https://dev.yieldboostai.xyz/api/dev/store/military-grade';

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const requestPath = decodeURIComponent(url.pathname);

    if (requestPath === '/api/dev/store/military-grade') {
      const upstream = await fetch(militaryGradeTarget, {
        method: request.method,
        headers: {
          'Content-Type': request.headers['content-type'] || 'application/json',
          ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
        },
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : await readRequestBody(request),
      });
      const payload = await upstream.text();
      response.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      response.end(payload);
      return;
    }

    const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const assetPath = join(rootDir, safePath);

    if (existsSync(assetPath) && statSync(assetPath).isFile()) {
      const ext = extname(assetPath).toLowerCase();
      response.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      createReadStream(assetPath).pipe(response);
      return;
    }

    const indexHtml = await readFile(indexPath);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    response.end(indexHtml);
  } catch (error) {
    response.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end(error instanceof Error ? error.message : 'Internal server error');
  }
});

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

server.listen(port, host, () => {
  console.log(`TITAN Wallet listening on http://${host}:${port}`);
});
