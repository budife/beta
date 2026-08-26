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
