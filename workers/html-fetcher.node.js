const express = require('express');
const app = express();

const CONFIG = {
  allowedOrigins: [
    'https://budife.github.io',
    'https://budife.github.io/beta',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  allowedTargetHost: 'mail.hsbc.com.hk',
  maxResponseBytes: 10 * 1024 * 1024
};

function getCorsHeaders(origin) {
  const allowed = CONFIG.allowedOrigins.includes(origin) ? origin : CONFIG.allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function errorResponse(status, message, origin, res) {
  res.status(status)
    .set({ 'Content-Type': 'application/json', ...getCorsHeaders(origin) })
    .json({ error: message });
}

app.get('/fetch', async (req, res) => {
  const origin = req.headers.origin || '';
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).set(corsHeaders).send();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) return errorResponse(400, 'Missing url query parameter', origin, res);

  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return errorResponse(400, 'Invalid url query parameter', origin, res);
  }

  if (target.host.toLowerCase() !== CONFIG.allowedTargetHost) {
    return errorResponse(403, `Target host not allowed: ${target.host}`, origin, res);
  }

  target.protocol = 'https:';

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': req.headers['user-agent'] || 'eDM-Helper-HTML-Fetcher/1.0'
      }
    });

    if (!upstream.ok) {
      return errorResponse(upstream.status, `Upstream returned HTTP ${upstream.status}`, origin, res);
    }

    const contentType = upstream.headers.get('Content-Type') || 'text/html';
    const arrayBuffer = await upstream.arrayBuffer();

    if (arrayBuffer.byteLength > CONFIG.maxResponseBytes) {
      return errorResponse(413, 'Upstream response too large', origin, res);
    }

    res.status(200)
      .set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      })
      .send(Buffer.from(arrayBuffer));
  } catch (error) {
    errorResponse(502, `Failed to fetch upstream: ${error.message}`, origin, res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTML Fetcher listening on port ${PORT}`));
