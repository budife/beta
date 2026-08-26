# HTML Fetcher Worker untuk eDM Helper

Kumpulan worker/proxy untuk eDM Helper Layout Checker agar bisa mengambil remote HTML dari `mail.hsbc.com.hk` tanpa terkena CORS di browser.

## Arsitektur

```
GitHub Pages frontend  →  Worker/Proxy  →  mail.hsbc.com.hk
         ↑                      ↓
    CORS response         HTML body
```

## File

- `html-fetcher.js` — Cloudflare Workers (ES modules).
- `html-fetcher.deno.js` — Deno Deploy.
- `html-fetcher.vercel.js` — Vercel Edge Function.
- `html-fetcher.netlify.js` — Netlify Edge Function.
- `html-fetcher.node.js` — Node.js/Express untuk Railway/Render/Fly.io.

## Konfigurasi Umum

Semua worker menggunakan konfigurasi yang sama:

- **Allowed origins**: `https://budife.github.io`, `http://localhost:5500`, `http://127.0.0.1:5500`, dll.
- **Target host**: `mail.hsbc.com.hk`
- **Max response size**: 10 MB

Sesuaikan konstanta `CONFIG` di masing-masing file jika perlu.

---

## 1. Cloudflare Workers

### a. Default `*.workers.dev`

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. **Workers & Pages** → **Create application** → **Create Worker**.
3. Beri nama, misalnya `html-fetcher`.
4. Hapus default code, paste `html-fetcher.js`.
5. Klik **Deploy**.
6. URL: `https://html-fetcher.<account>.workers.dev`

### b. Custom Domain (rekomendasi untuk jaringan yang blok `*.workers.dev`)

1. Di Worker, buka tab **Triggers**.
2. Klik **Add Custom Domain**.
3. Masukkan subdomain yang kamu miliki, misal `html-fetcher.yourdomain.com`.
4. Pastikan DNS subdomain sudah pointing ke Cloudflare.
5. URL: `https://html-fetcher.yourdomain.com`

---

## 2. Deno Deploy

1. Buat akun di [Deno Deploy](https://deno.com/deploy).
2. Buat project baru, misal `html-fetcher`.
3. Pilih **Deploy from GitHub** atau **Playground**.
4. Kalau pakai Playground, paste isi `html-fetcher.deno.js`.
5. URL: `https://html-fetcher-<random>.deno.dev`

### File: `html-fetcher.deno.js`

```js
// Paste ke Deno Deploy playground
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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

function errorResponse(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
  });
}

serve(async (request) => {
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return errorResponse(405, 'Method not allowed', origin);
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) return errorResponse(400, 'Missing url query parameter', origin);

  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return errorResponse(400, 'Invalid url query parameter', origin);
  }

  if (target.host.toLowerCase() !== CONFIG.allowedTargetHost) {
    return errorResponse(403, `Target host not allowed: ${target.host}`, origin);
  }

  target.protocol = 'https:';

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': request.headers.get('User-Agent') || 'eDM-Helper-HTML-Fetcher/1.0'
      }
    });

    if (!upstream.ok) {
      return errorResponse(upstream.status, `Upstream returned HTTP ${upstream.status}`, origin);
    }

    const contentType = upstream.headers.get('Content-Type') || 'text/html';
    const body = await upstream.arrayBuffer();

    if (body.byteLength > CONFIG.maxResponseBytes) {
      return errorResponse(413, 'Upstream response too large', origin);
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    return errorResponse(502, `Failed to fetch upstream: ${error.message}`, origin);
  }
});
```

---

## 3. Vercel Edge Function

1. Buat project/repo baru.
2. Buat file `api/fetch.js` di root repo.
3. Paste isi `html-fetcher.vercel.js`.
4. Deploy ke Vercel.
5. URL: `https://yourproject.vercel.app/api/fetch`

### File: `api/fetch.js`

```js
export const config = { runtime: 'edge' };

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

function errorResponse(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
  });
}

export default async function handler(request) {
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return errorResponse(405, 'Method not allowed', origin);
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) return errorResponse(400, 'Missing url query parameter', origin);

  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return errorResponse(400, 'Invalid url query parameter', origin);
  }

  if (target.host.toLowerCase() !== CONFIG.allowedTargetHost) {
    return errorResponse(403, `Target host not allowed: ${target.host}`, origin);
  }

  target.protocol = 'https:';

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': request.headers.get('User-Agent') || 'eDM-Helper-HTML-Fetcher/1.0'
      }
    });

    if (!upstream.ok) {
      return errorResponse(upstream.status, `Upstream returned HTTP ${upstream.status}`, origin);
    }

    const contentType = upstream.headers.get('Content-Type') || 'text/html';
    const body = await upstream.arrayBuffer();

    if (body.byteLength > CONFIG.maxResponseBytes) {
      return errorResponse(413, 'Upstream response too large', origin);
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    return errorResponse(502, `Failed to fetch upstream: ${error.message}`, origin);
  }
}
```

---

## 4. Netlify Edge Function

1. Buat project/repo baru.
2. Buat folder `netlify/edge-functions/`.
3. Buat file `netlify/edge-functions/fetch.js`.
4. Paste isi `html-fetcher.netlify.js`.
5. Deploy ke Netlify.
6. URL: `https://yourproject.netlify.app/.netlify/functions/fetch`

### File: `netlify/edge-functions/fetch.js`

```js
export default async (request, context) => {
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

  function errorResponse(status, message, origin) {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
    });
  }

  const origin = request.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return errorResponse(405, 'Method not allowed', origin);
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) return errorResponse(400, 'Missing url query parameter', origin);

  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return errorResponse(400, 'Invalid url query parameter', origin);
  }

  if (target.host.toLowerCase() !== CONFIG.allowedTargetHost) {
    return errorResponse(403, `Target host not allowed: ${target.host}`, origin);
  }

  target.protocol = 'https:';

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': request.headers.get('User-Agent') || 'eDM-Helper-HTML-Fetcher/1.0'
      }
    });

    if (!upstream.ok) {
      return errorResponse(upstream.status, `Upstream returned HTTP ${upstream.status}`, origin);
    }

    const contentType = upstream.headers.get('Content-Type') || 'text/html';
    const body = await upstream.arrayBuffer();

    if (body.byteLength > CONFIG.maxResponseBytes) {
      return errorResponse(413, 'Upstream response too large', origin);
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    return errorResponse(502, `Failed to fetch upstream: ${error.message}`, origin);
  }
};

export const config = { path: '/.netlify/functions/fetch' };
```

---

## 5. Railway / Render / Fly.io (Node.js + Express)

Cocok untuk VPS kecil. Deploy file `html-fetcher.node.js` sebagai service Node.js.

1. Buat repo dengan `package.json`:

```json
{
  "name": "html-fetcher",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": { "express": "^4.18.2" }
}
```

2. Rename `html-fetcher.node.js` jadi `server.js`.
3. Deploy ke Railway/Render/Fly.io.
4. URL: `https://yourproject.railway.app/fetch`

### File: `server.js`

```js
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
```

---

## Testing

Setelah deploy, coba buka di browser (atau langsung di Layout Checker):

```
https://your-worker-url/?url=https://mail.hsbc.com.hk/id/emailblast/MKT/2026/1508-20260211-BI_b/1508-PIL-Regular.html
```

Jika berhasil, akan muncul source HTML dari URL tersebut.

---

## Menggunakan Multiple Worker URLs di Layout Checker

Setelah deploy beberapa worker, masukkan semua URL di setting **HTML Fetcher Worker** di Layout Checker, dipisahkan dengan koma atau baris baru:

```
https://html-fetcher.yourdomain.com,https://html-fetcher-<random>.deno.dev,https://yourproject.vercel.app/api/fetch
```

Layout Checker akan mencoba setiap URL secara berurutan sampai ada yang berhasil.
