(function () {
  const PANEL_ID = 'edm-campaign-id-panel';
  const SUPABASE_URL = 'https://neuyjcotcmjnndjyzbcq.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_BGon7fPsvXNe59meFE9F4Q_SbjCa-Dp';
  const CAMPAIGN_TYPE = 'campaign1';
  const BRIDGE_ORIGIN = 'https://budife.github.io';
  const BRIDGE_URL = `${BRIDGE_ORIGIN}/beta/tools/campaign-id-bridge.html?v=6.9.0`;
  const existing = document.getElementById(PANEL_ID);

  if (existing) {
    existing.__edmCleanup?.();
    existing.remove();
    return;
  }

  const seriesList = Array.from({ length: 10 }, (_, index) => ({
    key: index === 0 ? 'regular' : `series-${index}000`,
    label: index === 0 ? 'REG' : String(index * 1000),
    name: index === 0 ? 'Regular' : `${index}000 Series`,
    start: index === 0 ? 1 : index * 1000,
    end: index === 0 ? 999 : (index * 1000) + 999
  }));
  const candidates = new Map();
  const bridgeRequests = new Map();
  let used = [];
  let bridgeRequestId = 0;

  function format(value) {
    return Number.isInteger(value) ? String(value).padStart(4, '0') : '----';
  }

  function normalize(values) {
    return [...new Set((values || [])
      .map(value => Number.parseInt(String(value), 10))
      .filter(value => Number.isInteger(value) && value >= 1 && value <= 9999))]
      .sort((a, b) => a - b);
  }

  function seriesState(series) {
    const seriesUsed = used.filter(value => value >= series.start && value <= series.end);
    const latest = seriesUsed.length ? seriesUsed[seriesUsed.length - 1] : null;
    const usedSet = new Set(seriesUsed);
    let next = latest === null ? series.start : latest + 1;
    while (next <= series.end && usedSet.has(next)) next += 1;
    return { used: seriesUsed, latest, next: next <= series.end ? next : null };
  }

  function candidateFor(series) {
    const state = seriesState(series);
    if (!candidates.has(series.key)) candidates.set(series.key, state.next ?? series.end);
    return candidates.get(series.key);
  }

  const host = document.createElement('div');
  host.id = PANEL_ID;
  host.style.cssText = 'position:fixed;top:72px;right:20px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box}
      .panel{width:410px;max-width:calc(100vw - 24px);max-height:calc(100vh - 92px);overflow:auto;color:#27272a;font:400 12px/1.4 "Segoe UI",Arial,sans-serif;background:#fff;border:1px solid #d4d4d8}
      .header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:11px 13px;background:#fff;border-bottom:1px solid #e4e4e7}
      .header strong{font-size:14px;font-weight:600}.close{width:28px;height:28px;padding:0;color:#71717a;font-size:18px;background:#fff;border:0;cursor:pointer}
      .body{display:grid;gap:10px;padding:12px}
      label{display:grid;gap:4px;color:#52525b;font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
      input{width:100%;height:32px;padding:6px 8px;color:#27272a;font:400 12px "Segoe UI",Arial,sans-serif;background:#fff;border:1px solid #d4d4d8;outline:0}
      input:focus{border-color:#f18c8e;outline:2px solid #fff1f1}
      .columns,.row{display:grid;grid-template-columns:54px 58px 1fr 48px;align-items:center;gap:7px}
      .columns{padding:0 4px;color:#71717a;font-size:8px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
      .rows{display:grid;border:1px solid #e4e4e7;border-bottom:0}
      .row{padding:6px;border-bottom:1px solid #e4e4e7}
      .row.is-used{background:#fef2f2}
      .series{font:500 11px Consolas,monospace}.latest{color:#b91c1c;font:400 11px Consolas,monospace}
      .nav{display:grid;grid-template-columns:26px 1fr 26px;align-items:center;border:1px solid #d4d4d8}
      .nav button{width:26px;height:28px;padding:0;color:#52525b;background:#fff;border:0;cursor:pointer}
      .nav button:first-child{border-right:1px solid #e4e4e7}.nav button:last-child{border-left:1px solid #e4e4e7}
      .nav strong{font:400 12px Consolas,monospace;text-align:center}
      .row.is-used .nav{border-color:#f18c8e}.row.is-used .nav strong{color:#b91c1c}
      .use{height:28px;padding:4px 6px;color:#fff;font:500 10px "Segoe UI",Arial,sans-serif;background:#f18c8e;border:1px solid #f18c8e;cursor:pointer}
      button:disabled{color:#a1a1aa!important;background:#f4f4f5!important;border-color:#e4e4e7!important;cursor:not-allowed!important}
      .status{min-height:14px;margin:0;color:#71717a;font-size:9px}.status.error{color:#b91c1c}.status.success{color:#166534}
    </style>
    <section class="panel">
      <header class="header"><strong>Campaign ID Tracker</strong><button class="close" type="button" aria-label="Close">&times;</button></header>
      <div class="body">
        <label>Campaign name<input id="name" type="text" placeholder="Optional campaign name"></label>
        <div class="columns"><span>Series</span><span>Latest</span><span>Candidate</span><span>Use</span></div>
        <div id="rows" class="rows"></div>
        <p id="status" class="status">Loading Campaign IDs...</p>
      </div>
    </section>`;
  document.body.appendChild(host);

  const bridge = document.createElement('iframe');
  bridge.id = `${PANEL_ID}-bridge`;
  bridge.src = BRIDGE_URL;
  bridge.title = 'Campaign ID data connection';
  bridge.hidden = true;
  const bridgeReady = new Promise(resolve => bridge.addEventListener('load', resolve, { once: true }));
  document.body.appendChild(bridge);

  const elements = {
    rows: shadow.getElementById('rows'),
    name: shadow.getElementById('name'),
    status: shadow.getElementById('status')
  };

  function headers(extra) {
    return Object.assign({
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }, extra || {});
  }

  async function request(path, options = {}) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: headers(options.headers)
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const error = new Error(data?.message || `HTTP ${response.status}`);
        error.code = data?.code;
        throw error;
      }
      return data;
    } catch (error) {
      const action = options.method === 'POST' ? 'reserve' : 'load';
      const payload = action === 'reserve' ? JSON.parse(options.body || '{}') : {};
      return bridgeRequest(action, {
        sequenceNumber: payload.sequence_number,
        campaignName: payload.campaign_name
      }, error);
    }
  }

  async function bridgeRequest(action, payload, originalError) {
    await bridgeReady;
    const id = ++bridgeRequestId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        bridgeRequests.delete(id);
        reject(originalError);
      }, 7000);
      bridgeRequests.set(id, { resolve, reject, timeout });
      bridge.contentWindow?.postMessage({
        source: 'edm-campaign-id-panel',
        id,
        action,
        payload
      }, BRIDGE_ORIGIN);
    });
  }

  function handleBridgeMessage(event) {
    if (event.origin !== BRIDGE_ORIGIN || event.source !== bridge.contentWindow
      || event.data?.source !== 'edm-campaign-id-bridge') return;
    const pending = bridgeRequests.get(event.data.id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    bridgeRequests.delete(event.data.id);
    if (event.data.ok) pending.resolve(event.data.data);
    else {
      const error = new Error(event.data.error || 'Campaign ID bridge failed.');
      error.code = event.data.code;
      pending.reject(error);
    }
  }
  window.addEventListener('message', handleBridgeMessage);
  host.__edmCleanup = () => {
    window.removeEventListener('message', handleBridgeMessage);
    bridgeRequests.forEach(pending => clearTimeout(pending.timeout));
    bridgeRequests.clear();
    bridge.remove();
  };

  function setStatus(message, type = '') {
    elements.status.textContent = message;
    elements.status.className = `status${type ? ` ${type}` : ''}`;
  }

  function render() {
    const usedSet = new Set(used);
    elements.rows.innerHTML = seriesList.map(series => {
      const state = seriesState(series);
      const candidate = candidateFor(series);
      const isUsed = usedSet.has(candidate);
      return `
        <div class="row${isUsed ? ' is-used' : ''}">
          <span class="series" title="${series.name}">${series.label}</span>
          <span class="latest">${state.latest === null ? 'None' : format(state.latest)}</span>
          <div class="nav">
            <button type="button" data-prev="${series.key}" ${candidate <= series.start ? 'disabled' : ''}>&lsaquo;</button>
            <strong title="${isUsed ? 'Already used in Supabase' : 'Available'}">${format(candidate)}</strong>
            <button type="button" data-next="${series.key}" ${candidate >= series.end ? 'disabled' : ''}>&rsaquo;</button>
          </div>
          <button type="button" class="use" data-use="${series.key}" ${isUsed ? 'disabled' : ''}>Use</button>
        </div>`;
    }).join('');

    elements.rows.querySelectorAll('[data-prev]').forEach(button => {
      button.addEventListener('click', () => move(button.dataset.prev, -1));
    });
    elements.rows.querySelectorAll('[data-next]').forEach(button => {
      button.addEventListener('click', () => move(button.dataset.next, 1));
    });
    elements.rows.querySelectorAll('[data-use]').forEach(button => {
      button.addEventListener('click', () => reserve(button.dataset.use, button));
    });
  }

  function move(seriesKey, amount) {
    const series = seriesList.find(item => item.key === seriesKey);
    candidates.set(seriesKey, Math.min(series.end, Math.max(series.start, candidateFor(series) + amount)));
    render();
  }

  async function loadIds() {
    setStatus('Synchronizing with Supabase...');
    const rows = await request(
      `campaign_id_allocations?select=sequence_number&campaign_type=eq.${CAMPAIGN_TYPE}&status=in.(reserved,used)&order=sequence_number.asc`
    );
    used = normalize((rows || []).map(row => row.sequence_number));
    seriesList.forEach(series => {
      const current = candidates.get(series.key);
      if (current === undefined || current < series.start || current > series.end) {
        candidates.set(series.key, seriesState(series).next ?? series.end);
      }
    });
    render();
    setStatus(`${used.length} used Campaign IDs loaded.`);
  }

  async function copy(value) {
    const text = format(value);
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  async function reserve(seriesKey, button) {
    const series = seriesList.find(item => item.key === seriesKey);
    const candidate = candidateFor(series);
    if (used.includes(candidate)) return;
    button.disabled = true;
    button.textContent = '...';
    setStatus(`Saving ${format(candidate)}...`);
    try {
      const result = await request('campaign_id_allocations?select=sequence_number', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          campaign_type: CAMPAIGN_TYPE,
          sequence_number: candidate,
          campaign_name: elements.name.value.trim() || series.name,
          source: 'monday-bookmarklet',
          status: 'used'
        })
      });
      await copy(Number(result?.[0]?.sequence_number || candidate));
      await loadIds();
      candidates.set(seriesKey, seriesState(series).next ?? series.end);
      render();
      setStatus(`${format(candidate)} saved and copied.`, 'success');
    } catch (error) {
      if (error.code === '23505') {
        await loadIds();
        candidates.set(seriesKey, seriesState(series).next ?? series.end);
        render();
        setStatus('ID already used. Moved to the next available number.', 'error');
      } else {
        setStatus(error.message || 'Unable to save Campaign ID.', 'error');
        render();
      }
    }
  }

  shadow.querySelector('.close').addEventListener('click', () => {
    host.__edmCleanup();
    host.remove();
  });
  loadIds().catch(error => setStatus(error.message || 'Unable to connect to Supabase.', 'error'));
})();
