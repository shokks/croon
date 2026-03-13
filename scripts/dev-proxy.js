#!/usr/bin/env node
// Local-only iTunes CORS proxy for web development.
// Run alongside `expo start --web`:  node scripts/dev-proxy.js
const http = require('http');
const https = require('https');

const PORT = 8787;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const params = new URLSearchParams(reqUrl.searchParams);
  const upstream = `https://itunes.apple.com/search?${params.toString()}`;

  https.get(upstream, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Content-Type': apiRes.headers['content-type'] ?? 'application/json',
    });
    apiRes.pipe(res);
  }).on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Upstream fetch failed' }));
  });
});

server.listen(PORT, () => {
  console.log(`iTunes dev proxy running at http://localhost:${PORT}`);
});
