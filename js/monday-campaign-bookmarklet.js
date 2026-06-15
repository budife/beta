(function () {
  const PANEL_ID = 'edm-campaign-id-panel';
  const DB_NAME = 'edm-helper-campaign-ids';
  const DB_VERSION = 1;
  const existing = document.getElementById(PANEL_ID);

  if (existing) {
    existing.remove();
    return;
  }

  const seriesList = Array.from({ length: 10 }, (_, index) => ({
    key: index === 0 ? 'regular' : `series-${index}000`,
    label: index === 0 ? 'Regular' : String(index * 1000),
    start: index === 0 ? 1 : index * 1000,
    end: index === 0 ? 999 : (index * 1000) + 999
  }));
  const candidates = new Map();
  let used = [];
  let activeSeries = 'regular';
  let lastImport = null;

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

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function openDb() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('records')) {
        const records = db.createObjectStore('records', { keyPath: 'fullCampaignId' });
        records.createIndex('sequenceNumber', 'sequenceNumber');
      }
      if (!db.objectStoreNames.contains('allocations')) {
        db.createObjectStore('allocations', { keyPath: 'sequenceNumber' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    return requestResult(request);
  }

  async function loadLocal() {
    const db = await openDb();
    const transaction = db.transaction(['allocations', 'meta'], 'readonly');
    const allocationsRequest = transaction.objectStore('allocations').getAll();
    const metaRequest = transaction.objectStore('meta').get('lastImport');
    const [allocations, meta] = await Promise.all([
      requestResult(allocationsRequest),
      requestResult(metaRequest)
    ]);
    await transactionDone(transaction);
    db.close();
    used = normalize(allocations.map(row => row.sequenceNumber));
    lastImport = meta?.value || null;
  }

  async function saveImported(values, fileName, mode = 'merge', summary = null) {
    const db = await openDb();
    const transaction = db.transaction(['allocations', 'meta'], 'readwrite');
    const store = transaction.objectStore('allocations');
    const importedAt = new Date().toISOString();
    if (mode === 'replace') {
      const allocations = await requestResult(store.getAll());
      allocations
        .filter(allocation => allocation.source === 'xlsx')
        .forEach(allocation => store.delete(allocation.sequenceNumber));
    }
    values.forEach(sequenceNumber => store.put({ sequenceNumber, source: 'xlsx', updatedAt: importedAt }));
    transaction.objectStore('meta').put({
      key: 'lastImport',
      value: { importedAt, fileName, mode, recordCount: values.length, summary }
    });
    await transactionDone(transaction);
    db.close();
  }

  async function reserveLocal(sequenceNumber) {
    const db = await openDb();
    const transaction = db.transaction('allocations', 'readwrite');
    const store = transaction.objectStore('allocations');
    const existingAllocation = await requestResult(store.get(sequenceNumber));
    if (existingAllocation) {
      await transactionDone(transaction);
      db.close();
      throw new Error('Campaign ID is already used.');
    }
    store.put({ sequenceNumber, source: 'manual', updatedAt: new Date().toISOString() });
    await transactionDone(transaction);
    db.close();
  }

  async function resetLocal() {
    const db = await openDb();
    const transaction = db.transaction(['records', 'allocations', 'meta'], 'readwrite');
    transaction.objectStore('records').clear();
    transaction.objectStore('allocations').clear();
    transaction.objectStore('meta').clear();
    await transactionDone(transaction);
    db.close();
  }

  function findEocd(view) {
    for (let offset = view.byteLength - 22; offset >= Math.max(0, view.byteLength - 65557); offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) return offset;
    }
    throw new Error('Invalid XLSX ZIP structure.');
  }

  async function unzipXmlFiles(buffer) {
    const view = new DataView(buffer);
    const decoder = new TextDecoder();
    const eocd = findEocd(view);
    const entryCount = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);
    const files = [];

    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Invalid XLSX directory.');
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength));
      offset += 46 + nameLength + extraLength + commentLength;
      if (!name.endsWith('.xml')) continue;

      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(buffer, dataStart, compressedSize);
      let bytes;
      if (method === 0) {
        bytes = compressed;
      } else if (method === 8) {
        if (typeof DecompressionStream === 'undefined') {
          throw new Error('This browser cannot read XLSX locally. Use the latest Chrome or Edge.');
        }
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      } else {
        continue;
      }
      files.push(decoder.decode(bytes));
    }
    return files;
  }

  async function extractIdsFromXlsx(file) {
    const xmlFiles = await unzipXmlFiles(await file.arrayBuffer());
    const pattern = /\b20\d{6}_[A-Za-z0-9._-]+?_(\d{4})\b/g;
    const values = [];
    xmlFiles.forEach(xml => {
      let match;
      while ((match = pattern.exec(xml)) !== null) values.push(Number(match[1]));
    });
    const uniqueValues = normalize(values);
    return {
      values: uniqueValues,
      summary: {
        occurrenceCount: values.length,
        uniqueIdCount: uniqueValues.length,
        duplicateCount: Math.max(0, values.length - uniqueValues.length)
      }
    };
  }

  const host = document.createElement('div');
  host.id = PANEL_ID;
  host.style.cssText = 'position:fixed;top:72px;right:20px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box}
      .panel{width:430px;max-width:calc(100vw - 24px);max-height:min(460px,calc(100vh - 92px));overflow:hidden;color:#27272a;font:400 12px/1.4 "Segoe UI",Arial,sans-serif;background:#fff;border:1px solid #d4d4d8}
      .header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:11px 13px;background:#fff;border-bottom:1px solid #e4e4e7}
      .header strong{font-size:14px;font-weight:600}.close{width:28px;height:28px;padding:0;color:#71717a;font-size:18px;background:#fff;border:0;cursor:pointer}
      .body{display:grid;gap:9px;max-height:410px;overflow-y:auto;padding:12px}.actions{position:sticky;top:-12px;z-index:2;display:flex;gap:6px;padding:12px 0 4px;background:#fff}.actions button,.actions select{height:32px;padding:6px 9px;font:500 10px "Segoe UI",Arial,sans-serif;cursor:pointer}
      .upload{color:#fff;background:#f18c8e;border:1px solid #f18c8e}.reset{color:#52525b;background:#fff;border:1px solid #d4d4d8}
      .export{color:#52525b;background:#fff;border:1px solid #d4d4d8}.mode{min-width:76px;color:#52525b;background:#fff;border:1px solid #d4d4d8}
      .local{color:#166534;font-size:9px}.tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border-top:1px solid #e4e4e7;border-left:1px solid #e4e4e7}
      .tab{min-width:0;height:34px;color:#52525b;background:#fff;border:0;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;font:500 10px "Segoe UI",Arial,sans-serif;cursor:pointer}
      .tab.active{color:#9f3f45;background:#fff1f1;border-bottom:2px solid #f18c8e}.summary{display:grid;grid-template-columns:64px 1fr 50px;align-items:center;gap:8px}
      .latest{color:#b91c1c;font:400 12px Consolas,monospace}.nav{display:grid;grid-template-columns:26px 1fr 26px;border:1px solid #d4d4d8}
      .nav button{height:28px;padding:0;color:#52525b;background:#fff;border:0;cursor:pointer}.nav strong{align-self:center;font:400 12px Consolas,monospace;text-align:center}
      .use{height:28px;color:#fff;background:#f18c8e;border:1px solid #f18c8e;cursor:pointer}.ids{display:flex;flex-wrap:wrap;gap:4px;min-height:38px;padding:7px;background:#fff7f7;border:1px solid #f7c8ca}
      .ids{max-height:120px;overflow-y:auto;align-content:flex-start}
      .id{min-width:48px;padding:6px;color:#fff;background:#ef8b90;font:500 10px Consolas,monospace;text-align:center}.id.latest{border:2px solid #9f3f45}
      button:disabled{color:#a1a1aa!important;background:#f4f4f5!important;border-color:#e4e4e7!important;cursor:not-allowed!important}
      .status{min-height:14px;margin:0;color:#71717a;font-size:9px}.status.error{color:#b91c1c}.status.success{color:#166534}
      .import-summary{display:flex;gap:12px;color:#71717a;font-size:9px}.import-summary strong{color:#27272a;font-weight:500}
      .note{margin:0;padding:7px 8px;color:#71717a;font-size:9px;background:#fafafa;border:1px solid #e4e4e7}
    </style>
    <section class="panel">
      <header class="header"><strong>Campaign ID Tracker</strong><button class="close" type="button" aria-label="Close">&times;</button></header>
      <div class="body">
        <div class="actions">
          <button class="upload" id="upload" type="button">Upload XLSX</button>
          <select class="mode" id="mode" aria-label="Import mode">
            <option value="merge">Merge</option>
            <option value="replace">Replace</option>
          </select>
          <button class="export" id="export" type="button">Export</button>
          <button class="reset" id="reset" type="button">Reset</button>
          <input id="file" type="file" accept=".xlsx,.xls" hidden>
        </div>
        <span id="local" class="local">Local only</span>
        <div id="summary" class="import-summary"></div>
        <p class="note">Stored only on this Monday domain. Campaign Counter uses separate browser storage.</p>
        <div id="tabs" class="tabs"></div>
        <div class="summary">
          <span id="latest" class="latest">None</span>
          <div class="nav"><button id="prev" type="button">&lsaquo;</button><strong id="candidate">----</strong><button id="next" type="button">&rsaquo;</button></div>
          <button id="use" class="use" type="button">Use</button>
        </div>
        <div id="ids" class="ids"></div>
        <p id="status" class="status"></p>
      </div>
    </section>`;
  document.body.appendChild(host);

  const elements = Object.fromEntries(
    ['upload', 'mode', 'export', 'reset', 'file', 'local', 'summary', 'tabs', 'latest', 'candidate', 'prev', 'next', 'use', 'ids', 'status']
      .map(id => [id, shadow.getElementById(id)])
  );

  function setStatus(message, type = '') {
    elements.status.textContent = message;
    elements.status.className = `status${type ? ` ${type}` : ''}`;
  }

  function render() {
    const series = seriesList.find(item => item.key === activeSeries);
    const state = seriesState(series);
    const candidate = candidateFor(series);
    elements.tabs.innerHTML = seriesList.map(item => `
      <button type="button" class="tab${item.key === activeSeries ? ' active' : ''}" data-tab="${item.key}">
        ${item.label}
      </button>`).join('');
    elements.latest.textContent = state.latest === null ? 'None' : format(state.latest);
    elements.candidate.textContent = format(candidate);
    elements.prev.disabled = candidate <= series.start;
    elements.next.disabled = candidate >= series.end;
    elements.use.disabled = used.includes(candidate);
    elements.ids.innerHTML = state.used.length
      ? state.used.map(value => `<span class="id${value === state.latest ? ' latest' : ''}">${format(value)}</span>`).join('')
      : '<span class="status">No used IDs.</span>';
    elements.local.textContent = lastImport
      ? `Local only · ${lastImport.fileName} · ${lastImport.recordCount} IDs`
      : 'Local only · Upload Monday XLSX';
    const summary = lastImport?.summary;
    elements.summary.innerHTML = summary
      ? `<span><strong>${summary.uniqueIdCount}</strong> IDs</span><span><strong>${summary.occurrenceCount}</strong> occurrences</span><span><strong>${summary.duplicateCount}</strong> repeats</span>`
      : '';
    elements.tabs.querySelectorAll('[data-tab]').forEach(button => {
      button.addEventListener('click', () => {
        activeSeries = button.dataset.tab;
        render();
      });
    });
  }

  function move(amount) {
    const series = seriesList.find(item => item.key === activeSeries);
    candidates.set(series.key, Math.min(series.end, Math.max(series.start, candidateFor(series) + amount)));
    render();
  }

  async function copy(value) {
    const text = format(value);
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else window.prompt('Copy Campaign ID:', text);
  }

  elements.upload.addEventListener('click', () => elements.file.click());
  elements.file.addEventListener('change', async () => {
    const file = elements.file.files?.[0];
    if (!file) return;
    setStatus(`Reading ${file.name}...`);
    try {
      const { values, summary } = await extractIdsFromXlsx(file);
      if (!values.length) throw new Error('No Campaign IDs found in this XLSX.');
      await saveImported(values, file.name, elements.mode.value, summary);
      candidates.clear();
      await loadLocal();
      render();
      setStatus(`${values.length} IDs saved locally.`, 'success');
    } catch (error) {
      setStatus(error.message || 'Unable to read XLSX.', 'error');
    }
    elements.file.value = '';
  });
  elements.export.addEventListener('click', async () => {
    try {
      const db = await openDb();
      const transaction = db.transaction(['allocations', 'meta'], 'readonly');
      const allocationsRequest = transaction.objectStore('allocations').getAll();
      const metaRequest = transaction.objectStore('meta').get('lastImport');
      const [allocations, meta] = await Promise.all([
        requestResult(allocationsRequest),
        requestResult(metaRequest)
      ]);
      await transactionDone(transaction);
      db.close();
      const blob = new Blob([JSON.stringify({
        exportedAt: new Date().toISOString(),
        source: 'eDM Helper Monday bookmarklet',
        storage: 'local IndexedDB on Monday domain',
        allocations,
        lastImport: meta?.value || null
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monday-campaign-ids-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus('Local backup downloaded.', 'success');
    } catch (error) {
      setStatus(error.message || 'Unable to export local data.', 'error');
    }
  });
  elements.reset.addEventListener('click', async () => {
    if (!window.confirm('Reset all Campaign IDs stored locally for Monday?')) return;
    await resetLocal();
    candidates.clear();
    await loadLocal();
    render();
    setStatus('Local data reset.', 'success');
  });
  elements.prev.addEventListener('click', () => move(-1));
  elements.next.addEventListener('click', () => move(1));
  elements.use.addEventListener('click', async () => {
    const series = seriesList.find(item => item.key === activeSeries);
    const candidate = candidateFor(series);
    try {
      await reserveLocal(candidate);
      await copy(candidate);
      await loadLocal();
      candidates.set(series.key, seriesState(series).next ?? series.end);
      render();
      setStatus(`${format(candidate)} saved locally and copied.`, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
  shadow.querySelector('.close').addEventListener('click', () => host.remove());

  loadLocal().then(render).catch(error => setStatus(error.message || 'Unable to open local storage.', 'error'));
})();
