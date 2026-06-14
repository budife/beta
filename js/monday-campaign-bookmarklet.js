(function () {
  const PANEL_ID = 'edm-campaign-id-panel';
  const SUPABASE_URL = 'https://neuyjcotcmjnndjyzbcq.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_BGon7fPsvXNe59meFE9F4Q_SbjCa-Dp';
  const existing = document.getElementById(PANEL_ID);

  if (existing) {
    existing.remove();
    return;
  }

  const core = {
    normalize(values) {
      return [...new Set((values || [])
        .map(value => Number.parseInt(String(value), 10))
        .filter(value => Number.isInteger(value) && value >= 1 && value <= 9999))]
        .sort((a, b) => a - b);
    },
    next(values, requestedFloor) {
      const used = this.normalize(values);
      const parsedFloor = Number.parseInt(String(requestedFloor), 10);
      const floor = Number.isInteger(parsedFloor) && parsedFloor >= 1 && parsedFloor <= 9999
        ? parsedFloor
        : used[0] || 1;
      const usedSet = new Set(used);
      for (let value = floor; value <= 9999; value += 1) {
        if (!usedSet.has(value)) return value;
      }
      return null;
    },
    format(value) {
      return value ? String(value).padStart(4, '0') : '----';
    }
  };
  const campaignFloors = new Map();

  const mondayContext = (() => {
    const boardMatch = location.pathname.match(/\/boards\/(\d+)/i);
    const itemMatch = location.pathname.match(/\/(?:pulses|items)\/(\d+)/i);
    const title = document.querySelector('h1')?.textContent?.trim()
      || document.title.replace(/\s*-\s*monday\.com.*$/i, '').trim();
    return {
      boardId: boardMatch ? boardMatch[1] : '',
      itemId: itemMatch ? itemMatch[1] : '',
      campaignName: title || ''
    };
  })();

  const host = document.createElement('div');
  host.id = PANEL_ID;
  host.style.cssText = 'position:fixed;top:72px;right:20px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box}
      .panel{width:330px;color:#27272a;font:400 13px/1.45 "Segoe UI",Arial,sans-serif;background:#fff;border:1px solid #d4d4d8}
      .header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e7eb}
      .header strong{font-size:14px;font-weight:600}
      .close{width:28px;height:28px;color:#71717a;background:#fff;border:0;cursor:pointer}
      .body{display:grid;gap:12px;padding:14px}
      label{display:grid;gap:4px;color:#52525b;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
      input,select{width:100%;height:34px;padding:7px 9px;color:#27272a;font:400 12px "Segoe UI",Arial,sans-serif;background:#fff;border:1px solid #d4d4d8;border-radius:0;outline:0}
      input:focus,select:focus{border-color:#f27f86;outline:2px solid #fff0f1}
      .next{display:flex;align-items:end;justify-content:space-between;padding:12px;background:#fafafa;border:1px solid #e5e7eb}
      .next span{display:block;color:#71717a;font-size:10px;font-weight:600;text-transform:uppercase}
      .next strong{font:600 30px Consolas,monospace}
      .used{display:flex;flex-wrap:wrap;gap:6px}
      .used button{min-width:52px;height:28px;color:#9f3f45;font:500 11px Consolas,monospace;background:#fff0f1;border:1px solid #fecdd3;cursor:pointer}
      .primary{height:38px;color:#fff;font:600 12px "Segoe UI",Arial,sans-serif;background:#f27f86;border:1px solid #f27f86;cursor:pointer}
      .primary:disabled{cursor:wait;opacity:.65}
      .status{min-height:16px;margin:0;color:#71717a;font-size:10px}
      .status.error{color:#b4232d}
      .meta{color:#a1a1aa;font-size:10px}
    </style>
    <section class="panel">
      <header class="header">
        <strong>Campaign ID Tracker</strong>
        <button class="close" type="button" aria-label="Close">×</button>
      </header>
      <div class="body">
        <label>Campaign type<select id="type"></select></label>
        <label>Campaign name<input id="name" type="text"></label>
        <div class="next">
          <div><span>Next available</span><strong id="next">----</strong></div>
          <span id="sync">Loading</span>
        </div>
        <div>
          <label>Used nearby</label>
          <div id="used" class="used"></div>
        </div>
        <button id="use" class="primary" type="button">Use & Copy</button>
        <p id="status" class="status"></p>
        <div class="meta">Board ${mondayContext.boardId || 'unknown'} · Item ${mondayContext.itemId || 'unknown'}</div>
      </div>
    </section>
  `;
  document.body.appendChild(host);

  const elements = {
    type: shadow.getElementById('type'),
    name: shadow.getElementById('name'),
    next: shadow.getElementById('next'),
    used: shadow.getElementById('used'),
    use: shadow.getElementById('use'),
    status: shadow.getElementById('status'),
    sync: shadow.getElementById('sync')
  };
  let allocationTableAvailable = true;
  let currentState = { used: [], next: null };

  function headers(extra) {
    return Object.assign({
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }, extra || {});
  }

  async function request(path, options) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: headers(options?.headers)
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      error.code = data?.code;
      throw error;
    }
    return data;
  }

  async function loadTypes() {
    try {
      const rows = await request('campaign_counters?select=campaign_type,name,value&order=campaign_type.asc');
      const types = rows?.length ? rows : [
        { campaign_type: 'campaign1', name: 'Name 1' },
        { campaign_type: 'campaign2', name: 'Name 2' },
        { campaign_type: 'campaign3', name: 'Name 3' },
        { campaign_type: 'campaign4', name: 'Name 4' }
      ];
      elements.type.innerHTML = types.map(row => {
        campaignFloors.set(row.campaign_type, Number(row.value) || 1);
        return `<option value="${row.campaign_type}">${row.name || row.campaign_type}</option>`;
      }).join('');
    } catch {
      elements.type.innerHTML = ['campaign1', 'campaign2', 'campaign3', 'campaign4']
        .map((type, index) => `<option value="${type}">Name ${index + 1}</option>`)
        .join('');
    }
  }

  async function loadUsed(campaignType) {
    if (allocationTableAvailable) {
      try {
        const rows = await request(
          `campaign_id_allocations?select=sequence_number,campaign_name,source,status&campaign_type=eq.${encodeURIComponent(campaignType)}&status=in.(reserved,used)&order=sequence_number.asc`
        );
        return rows || [];
      } catch (error) {
        if (!['42P01', 'PGRST205'].includes(error.code)) throw error;
        allocationTableAvailable = false;
      }
    }

    const rows = await request(
      `campaign_history?select=value,action&campaign_type=eq.${encodeURIComponent(campaignType)}&order=created_at.asc`
    );
    return (rows || [])
      .filter(row => !['reverted', 'released'].includes(row.action))
      .map(row => ({ sequence_number: row.value, source: 'legacy-history', status: 'used' }));
  }

  function render(rows) {
    const used = core.normalize(rows.map(row => row.sequence_number));
    const floor = campaignFloors.get(elements.type.value) || used[0] || 1;
    const next = core.next(used, floor);
    currentState = { used, next, rows };
    elements.next.textContent = core.format(next);
    elements.sync.textContent = allocationTableAvailable ? 'Supabase' : 'Legacy';
    const nearby = used.filter(value => next && Math.abs(value - next) <= 5);
    const visible = nearby.length ? nearby : used.slice(-12);
    elements.used.innerHTML = visible.length
      ? visible.map(value => `<button type="button" data-value="${value}">${core.format(value)}</button>`).join('')
      : '<span class="status">No used IDs yet</span>';
    elements.used.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => navigator.clipboard?.writeText(core.format(button.dataset.value)));
    });
  }

  async function refresh() {
    elements.status.className = 'status';
    elements.status.textContent = 'Synchronizing campaign IDs...';
    try {
      render(await loadUsed(elements.type.value));
      elements.status.textContent = `${currentState.used.length} used IDs detected`;
    } catch (error) {
      elements.status.className = 'status error';
      elements.status.textContent = error.message;
    }
  }

  async function reserve() {
    if (!currentState.next) return;
    elements.use.disabled = true;
    elements.use.textContent = 'Reserving...';
    elements.status.className = 'status';
    try {
      let reserved = currentState.next;
      if (allocationTableAvailable) {
        try {
          const result = await request('rpc/reserve_next_campaign_id', {
            method: 'POST',
            body: JSON.stringify({
              p_campaign_type: elements.type.value,
              p_floor: campaignFloors.get(elements.type.value) || currentState.used[0] || 1,
              p_campaign_name: elements.name.value.trim() || null,
              p_monday_item_id: mondayContext.itemId || null,
              p_monday_board_id: mondayContext.boardId || null,
              p_source: 'monday-bookmarklet'
            })
          });
          reserved = Number(Array.isArray(result) ? result[0]?.sequence_number : result?.sequence_number);
        } catch (error) {
          if (!['42883', 'PGRST202'].includes(error.code)) throw error;
          allocationTableAvailable = false;
        }
      }

      if (!allocationTableAvailable) {
        await request('campaign_history', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            campaign_type: elements.type.value,
            action: 'monday_used',
            value: reserved,
            created_at: new Date().toISOString()
          })
        });
      }

      await navigator.clipboard?.writeText(core.format(reserved));
      elements.status.textContent = `${core.format(reserved)} marked as used and copied`;
      await refresh();
    } catch (error) {
      elements.status.className = 'status error';
      elements.status.textContent = error.message;
      await refresh();
    } finally {
      elements.use.disabled = false;
      elements.use.textContent = 'Use & Copy';
    }
  }

  shadow.querySelector('.close').addEventListener('click', () => host.remove());
  elements.type.addEventListener('change', refresh);
  elements.use.addEventListener('click', reserve);
  elements.name.value = mondayContext.campaignName;

  loadTypes().then(refresh);
})();
