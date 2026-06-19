const campaignIdCore = window.CampaignIdCore;
const campaignIdStore = window.CampaignIdLocalStore;

let allocationRows = [];
let campaignRecords = [];
let lastImport = null;
let lastGenerated = null;
let savedFolderHandle = null;
let unparsedFolders = [];
let currentFolderRecords = [];
let currentFolderName = '';
let counterValue = 1;
const COUNTER_MIN = 1;
const COUNTER_MAX = 1999;
const SCAN_MIN = 0;
const SCAN_MAX = 9999;

function formatId(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (parsed === 0) return '0000';
  return campaignIdCore.formatSequence(value);
}

function normalizeCounterSequence(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= COUNTER_MIN && parsed <= COUNTER_MAX
    ? parsed
    : null;
}

function normalizeScanSequence(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= SCAN_MIN && parsed <= SCAN_MAX
    ? parsed
    : null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(value) {
  return String(value || 'campaign')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'campaign';
}

function setImportStatus(message = '', type = '') {
  const status = document.getElementById('import-status');
  status.textContent = message;
  status.className = `used-id-import-status${type ? ` is-${type}` : ''}`;
}

function formatBlastDate(value) {
  if (!value) return 'Blast date unavailable';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'Blast date unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function getUsedValues() {
  return [...new Set(allocationRows
    .map(row => normalizeCounterSequence(row.sequenceNumber))
    .filter(value => value !== null))]
    .sort((a, b) => a - b);
}

function recordsBySequence() {
  return groupRecordsBySequence(campaignRecords);
}

function groupRecordsBySequence(records) {
  const groups = new Map();
  (records || []).forEach(record => {
    const sequence = normalizeScanSequence(record.sequenceNumber ?? record.sequence_number);
    if (sequence === null) return;
    if (!groups.has(sequence)) groups.set(sequence, []);
    groups.get(sequence).push(record);
  });
  groups.forEach(items => items.sort((a, b) => {
    const dateA = String(a.blastDate ?? a.blast_date ?? '');
    const dateB = String(b.blastDate ?? b.blast_date ?? '');
    return dateB.localeCompare(dateA);
  }));
  return groups;
}

function parseCampaignFolderName(folderName, defaultYear) {
  const trimmed = String(folderName || '').trim();
  const idMatch = trimmed.match(/(?:^|\s)(\d{4})(?:\s*-\s*(\d{4}))?\s+(.+)$/);
  if (!idMatch) return null;

  const startSequence = Number(idMatch[1]);
  const endSequence = idMatch[2] ? Number(idMatch[2]) : startSequence;
  const rest = idMatch[3].trim();
  const dateMatch = rest.match(/\b(\d{2})-(\d{2})\b/);
  if (!dateMatch) return null;

  const afterDateRaw = rest.slice(dateMatch.index + dateMatch[0].length).trim();
  const afterDate = afterDateRaw.replace(/(?:\s*-\s*Copy(?:\s*\(\d+\))?)+.*$/i, '').trim();
  const beforeDate = rest.slice(0, dateMatch.index).trim()
    .replace(/(?:\s*-\s*Copy(?:\s*\(\d+\))?)+.*$/i, '')
    .trim();
  let campaignName = beforeDate;
  let manager = afterDate;
  if (!manager && beforeDate.includes(' ')) {
    const parts = beforeDate.split(/\s+/);
    manager = parts.pop();
    campaignName = parts.join(' ');
  }

  const month = Number(dateMatch[1]);
  const day = Number(dateMatch[2]);
  const year = Number(defaultYear) || new Date().getFullYear();
  const date = new Date(Date.UTC(year, month - 1, day));
  const validSequence = startSequence >= SCAN_MIN
    && endSequence <= SCAN_MAX
    && endSequence >= startSequence;
  const validDate = validSequence
    && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
  if (!validDate || !campaignName) return null;

  const yyyymmdd = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  const cleanedFolderName = `${formatId(startSequence)}${endSequence > startSequence ? `-${formatId(endSequence)}` : ''} ${campaignName} ${manager ? `${manager} ` : ''}${dateMatch[0]}`;

  return Array.from({ length: endSequence - startSequence + 1 }, (_, index) => {
    const sequenceNumber = startSequence + index;
    const sequence = formatId(sequenceNumber);
    return {
      fullCampaignId: `${yyyymmdd}_${slugify(campaignName)}_${sequence}`,
      sequenceNumber,
      itemName: campaignName,
      itemType: 'folder',
      blastDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      manager,
      folderName: cleanedFolderName,
      folderPath: folderName,
      originalFolderName: folderName,
      cleanedFolderName,
      rangeStart: startSequence,
      rangeEnd: endSequence,
      isRange: endSequence > startSequence
    };
  });
}

function renderImportSummary() {
  const container = document.getElementById('import-summary');
  const usedValues = getUsedValues();
  const items = [
    ['Campaigns', campaignRecords.length],
    ['Unique IDs', usedValues.length],
    ['Reblasts', Math.max(0, campaignRecords.length - usedValues.length)],
    ['Unparsed', unparsedFolders.length]
  ];

  container.innerHTML = items.map(([label, value]) => `
    <span>
      <small>${label}</small>
      <strong>${value}</strong>
    </span>`).join('');
  container.hidden = false;
}

function renderCampaignTooltip(sequence, records) {
  const title = records.length === 1 ? '1 campaign' : `${records.length} campaigns`;
  const details = records.length
    ? records.map(record => `
        <div class="campaign-tooltip-record">
          <strong>${escapeHtml(record.itemName || record.folderName || record.fullCampaignId)}</strong>
          <span>${escapeHtml(formatBlastDate(record.blastDate))}${record.manager ? ` | ${escapeHtml(record.manager)}` : ''}</span>
          ${record.isRange ? `<span>Range ${formatId(record.rangeStart)}-${formatId(record.rangeEnd)}</span>` : ''}
          <code>${escapeHtml(record.cleanedFolderName || record.folderName || record.fullCampaignId)}</code>
          ${record.originalFolderName && record.originalFolderName !== record.cleanedFolderName
            ? `<code>Original: ${escapeHtml(record.originalFolderName)}</code>`
            : ''}
        </div>`).join('')
    : `
      <div class="campaign-tooltip-record">
        <strong>Locally generated ID</strong>
        <span>No folder detail is attached yet.</span>
      </div>`;

  return `
    <span class="campaign-id-tooltip" id="campaign-tooltip-${sequence}" role="tooltip">
      <span class="campaign-tooltip-title">${formatId(sequence)} | ${records.length ? title : 'used ID'}</span>
      ${details}
    </span>`;
}

function renderUsedIdBoxes(sourceRows, latest, groupedRecords) {
  const rows = [...new Set(sourceRows
    .map(row => normalizeScanSequence(row.sequenceNumber))
    .filter(value => value !== null))]
    .map(sequenceNumber => ({ sequenceNumber }))
    .sort((a, b) => Number(a.sequenceNumber) - Number(b.sequenceNumber));

  if (!rows.length) {
    return '<span class="series-id-empty">No used Campaign IDs in this series.</span>';
  }

  return rows.map(row => {
    const sequence = Number(row.sequenceNumber);
    const records = groupedRecords.get(sequence) || [];
    const rangeRecord = records.find(record => record.isRange);
    const rangeClass = rangeRecord
      ? sequence === Number(rangeRecord.rangeStart)
        ? ' is-range-start'
        : sequence === Number(rangeRecord.rangeEnd)
          ? ' is-range-end'
          : ' is-range-middle'
      : '';
    const badge = records.length > 1
        ? `<small aria-label="${records.length} campaigns">${records.length}</small>`
        : '';
    const outOfCounter = sequence > COUNTER_MAX;
    return `
      <span class="campaign-id-box${rangeClass}${sequence === latest ? ' is-latest' : ''}${sequence === counterValue ? ' is-current-counter' : ''}${outOfCounter ? ' is-out-of-counter' : ''}" tabindex="0"
        role="button" aria-expanded="false" aria-describedby="campaign-tooltip-${sequence}"
        data-campaign-tooltip="${sequence}" data-sequence="${sequence}">
        <code>${formatId(sequence)}</code>
        ${badge}
        ${renderCampaignTooltip(sequence, records)}
      </span>`;
  }).join('');
}

function getRangeGroups(records) {
  const groups = new Map();
  (records || []).forEach(record => {
    if (!record.isRange) return;
    const start = normalizeScanSequence(record.rangeStart);
    const end = normalizeScanSequence(record.rangeEnd);
    if (start === null || end === null || end <= start) return;
    const key = `${start}-${end}-${record.cleanedFolderName || record.folderName || ''}`;
    if (!groups.has(key)) {
      groups.set(key, {
        start,
        end,
        label: record.cleanedFolderName || record.folderName || `${formatId(start)}-${formatId(end)}`
      });
    }
  });
  return [...groups.values()].sort((a, b) => a.start - b.start || a.end - b.end);
}

function findNextFree(start = counterValue) {
  const usedValues = getUsedValues();
  const usedSet = new Set(usedValues);
  for (let value = Math.max(COUNTER_MIN, start); value <= COUNTER_MAX; value += 1) {
    if (!usedSet.has(value)) return value;
  }
  return null;
}

function getLatestUsed() {
  const used = getUsedValues();
  return used.length ? used[used.length - 1] : null;
}

function renderGenerator() {
  const total = document.getElementById('counter-total');
  const body = document.getElementById('counter-generator-body');
  const usedValues = getUsedValues();
  const isUsed = usedValues.includes(counterValue);
  const lastGeneratedValue = normalizeCounterSequence(lastGenerated?.sequenceNumber);
  if (total) {
    total.textContent = `${usedValues.length} used | ${campaignRecords.length} campaigns`;
  }
  if (!body) return;
  body.innerHTML = `
    <article class="counter-mini-card">
      <p class="counter-generator-title">Campaign counter</p>
      <input class="counter-big-input${isUsed ? ' is-used' : ''}" id="counter-value-input"
        type="text" inputmode="numeric" maxlength="4" value="${formatId(counterValue)}" aria-label="Campaign counter number">
      <div class="counter-state-line">
        <span>${isUsed ? 'Already used' : 'Ready'}</span>
        <span><i class="fa-solid fa-database" aria-hidden="true"></i> ${usedValues.length} used</span>
      </div>
      <div class="counter-next-line">
        <small>Last generated</small>
        <strong>${lastGeneratedValue === null ? 'None' : formatId(lastGeneratedValue)}</strong>
      </div>
      <div class="counter-actions">
        <button type="button" class="counter-ghost" id="candidate-prev" ${counterValue <= COUNTER_MIN ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i> Back
        </button>
        <button type="button" class="counter-ghost" id="candidate-next-free" ${findNextFree() === null ? 'disabled' : ''}>Next free</button>
        <button type="button" class="counter-ghost" id="candidate-next" ${counterValue >= COUNTER_MAX ? 'disabled' : ''}>
          Next <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
        <button type="button" class="counter-primary" id="candidate-use"
          ${isUsed || counterValue < COUNTER_MIN || counterValue > COUNTER_MAX ? 'disabled' : ''}>
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Generate new
        </button>
        <button type="button" class="counter-secondary" id="candidate-revert">
          <i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Revert
        </button>
      </div>
    </article>`;
}

function renderFolderBrowser() {
  const list = document.getElementById('series-counter-list');
  if (!currentFolderRecords.length) {
    list.innerHTML = `
      <div class="folder-empty-state">
        <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
        <strong>Open folder to scan Campaign IDs</strong>
        <span>Folder name format: <code>0004 Ramadan 04-20 Vivi</code></span>
      </div>`;
    return;
  }

  const scannedRows = currentFolderRecords.map(record => ({
    sequenceNumber: record.sequenceNumber
  }));
  const scannedValues = [...new Set(scannedRows
    .map(row => normalizeScanSequence(row.sequenceNumber))
    .filter(value => value !== null))]
    .sort((a, b) => a - b);
  const groupedRecords = groupRecordsBySequence(currentFolderRecords);
  const latest = scannedValues.length ? scannedValues[scannedValues.length - 1] : null;
  const outOfCounterCount = scannedValues.filter(value => value > COUNTER_MAX).length;
  const unparsedNote = unparsedFolders.length
    ? `<small class="folder-unparsed-note" title="${escapeHtml(unparsedFolders.join('\n'))}">${unparsedFolders.length} unparsed folder${unparsedFolders.length === 1 ? '' : 's'}</small>`
    : `<small>${outOfCounterCount ? `${outOfCounterCount} out of 0000-1999 range` : 'Hover or click an ID for campaign detail.'}</small>`;

  document.getElementById('series-counter-list').innerHTML = `
    <div class="folder-series-meta">
      <strong>${escapeHtml(currentFolderName || 'Scanned folder')}</strong>
      <span>${scannedValues.length} IDs</span>
      ${unparsedNote}
    </div>
    <div class="series-id-grid" aria-label="Scanned used Campaign IDs">
      <div class="range-bridge-layer" aria-hidden="true"></div>
      ${renderUsedIdBoxes(scannedRows, latest, groupedRecords)}
    </div>`;
}

function renderAll() {
  renderImportSummary();
  renderGenerator();
  renderFolderBrowser();

  const localStatus = document.getElementById('counter-local-status');
  localStatus.textContent = lastImport
    ? `Local only | ${formatBlastDate(lastImport.importedAt.slice(0, 10))}`
    : 'Local only | No folder scanned';

  const scanButton = document.getElementById('scan-folder');
  if (scanButton) {
    scanButton.innerHTML = savedFolderHandle
      ? '<i class="fa-solid fa-rotate-right"></i> Refresh folder'
      : '<i class="fa-solid fa-folder-open"></i> Scan folder';
  }

  bindRenderedEvents();
  requestAnimationFrame(renderRangeBridges);
}

function bindRenderedEvents() {
  document.getElementById('counter-value-input')?.addEventListener('change', event => {
    setCounterValue(event.target.value);
  });
  document.getElementById('candidate-prev')?.addEventListener('click', () => moveCandidate(-1));
  document.getElementById('candidate-next')?.addEventListener('click', () => moveCandidate(1));
  document.getElementById('candidate-next-free')?.addEventListener('click', resetCandidate);
  document.getElementById('candidate-revert')?.addEventListener('click', resetCandidate);
  document.getElementById('candidate-use')?.addEventListener('click', event => {
    reserveCandidate(event.currentTarget);
  });
  document.querySelectorAll('[data-campaign-tooltip]').forEach(box => {
    box.addEventListener('mouseenter', () => positionCampaignTooltip(box));
    box.addEventListener('focus', () => positionCampaignTooltip(box));
    box.addEventListener('click', event => {
      if (event.target.closest('.campaign-id-tooltip')) return;
      toggleCampaignTooltip(box);
    });
    box.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCampaignTooltip(box);
      } else if (event.key === 'Escape') {
        closeCampaignTooltips();
        box.focus();
      }
    });
  });

  const grid = document.querySelector('.folder-browser .series-id-grid');
  if (grid) {
    grid.onscroll = () => requestAnimationFrame(renderRangeBridges);
  }
}

function renderRangeBridges() {
  const grid = document.querySelector('.folder-browser .series-id-grid');
  const layer = grid?.querySelector('.range-bridge-layer');
  if (!grid || !layer) return;

  layer.innerHTML = '';
  const gridRect = grid.getBoundingClientRect();
  const ranges = getRangeGroups(currentFolderRecords);

  ranges.forEach(range => {
    const boxes = [];
    for (let sequence = range.start; sequence <= range.end; sequence += 1) {
      const box = grid.querySelector(`[data-sequence="${sequence}"]`);
      if (box) boxes.push(box);
    }
    if (boxes.length < 2) return;

    const rows = new Map();
    boxes.forEach(box => {
      const rect = box.getBoundingClientRect();
      const key = Math.round(rect.top);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(rect);
    });

    rows.forEach(rects => {
      if (rects.length < 2) return;
      rects.sort((a, b) => a.left - b.left);
      const first = rects[0];
      const last = rects[rects.length - 1];
      const left = first.left - gridRect.left + (grid.scrollLeft || 0) + first.width / 2;
      const right = last.left - gridRect.left + (grid.scrollLeft || 0) + last.width / 2;
      const top = first.top - gridRect.top + (grid.scrollTop || 0) - 13;
      const bridge = document.createElement('span');
      bridge.className = 'range-bridge';
      bridge.style.left = `${left}px`;
      bridge.style.top = `${Math.max(6, top)}px`;
      bridge.style.width = `${Math.max(12, right - left)}px`;
      layer.appendChild(bridge);
    });
  });
}

function closeCampaignTooltips(except = null) {
  document.querySelectorAll('.campaign-id-box.is-open').forEach(box => {
    if (box === except) return;
    box.classList.remove('is-open');
    box.setAttribute('aria-expanded', 'false');
  });
}

function positionCampaignTooltip(box) {
  const tooltip = box.querySelector('.campaign-id-tooltip');
  if (!tooltip) return;

  const rect = box.getBoundingClientRect();
  const tooltipWidth = Math.min(320, window.innerWidth - 32);
  const left = Math.min(
    Math.max(16, rect.left),
    Math.max(16, window.innerWidth - tooltipWidth - 16)
  );
  const aboveTop = rect.top - 10;
  const top = aboveTop > 280 ? aboveTop : rect.bottom + 10;

  tooltip.style.setProperty('--tooltip-left', `${left}px`);
  tooltip.style.setProperty('--tooltip-top', `${top}px`);
  tooltip.style.setProperty('--tooltip-width', `${tooltipWidth}px`);
  tooltip.classList.toggle('is-below', top > rect.top);
}

function toggleCampaignTooltip(box) {
  const shouldOpen = !box.classList.contains('is-open');
  closeCampaignTooltips(box);
  if (shouldOpen) positionCampaignTooltip(box);
  box.classList.toggle('is-open', shouldOpen);
  box.setAttribute('aria-expanded', String(shouldOpen));
}

function setCounterValue(value) {
  const parsed = Number.parseInt(String(value), 10);
  counterValue = Number.isInteger(parsed)
    ? Math.min(COUNTER_MAX, Math.max(COUNTER_MIN, parsed))
    : COUNTER_MIN;
  renderAll();
}

function moveCandidate(amount) {
  setCounterValue(counterValue + amount);
}

function resetCandidate() {
  const next = findNextFree(COUNTER_MIN);
  counterValue = next ?? COUNTER_MAX;
  renderAll();
}

async function copyId(value) {
  const text = formatId(value);
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

async function reserveCandidate(button) {
  const candidate = counterValue;
  if (getUsedValues().includes(candidate)) return;

  button.disabled = true;
  button.textContent = 'Saving...';
  setImportStatus(`Saving ${formatId(candidate)} locally...`);
  try {
    await campaignIdStore.reserve(candidate);
    await copyId(candidate);
    await loadCampaignData();
    resetCandidate();
    setImportStatus(`${formatId(candidate)} saved locally and copied.`, 'success');
  } catch (error) {
    await loadCampaignData();
    resetCandidate();
    setImportStatus(error.message || 'Unable to save this Campaign ID locally.', 'error');
  }
}

async function loadCampaignData() {
  const data = await campaignIdStore.load();
  allocationRows = data.allocations || [];
  campaignRecords = data.records || [];
  lastImport = data.lastImport;
  lastGenerated = data.lastGenerated;
  savedFolderHandle = data.folderHandle || null;
  unparsedFolders = lastImport?.summary?.unparsedFolders || [];
  currentFolderRecords = campaignRecords.filter(record => record.itemType === 'folder');
  currentFolderName = currentFolderRecords.length
    ? lastImport?.fileName || 'Saved folder scan'
    : '';

  if (counterValue < COUNTER_MIN || counterValue > COUNTER_MAX) resetCandidate();

  renderAll();

  const folderSelected = document.getElementById('folder-selected');
  if (folderSelected) {
    folderSelected.textContent = currentFolderName
      ? `Selected folder: ${currentFolderName}`
      : 'No folder scanned yet.';
  }
}

async function ensureFolderReadPermission(handle) {
  if (!handle) return false;
  if (typeof handle.queryPermission !== 'function') return true;
  const options = { mode: 'read' };
  if (await handle.queryPermission(options) === 'granted') return true;
  if (typeof handle.requestPermission !== 'function') return false;
  return await handle.requestPermission(options) === 'granted';
}

async function scanCampaignHandle(handle) {
  const defaultYear = /^\d{4}$/.test(handle.name) ? Number(handle.name) : new Date().getFullYear();
  const records = [];
  const failed = [];

  for await (const entry of handle.values()) {
    if (entry.kind !== 'directory') continue;
    const parsedRecords = parseCampaignFolderName(entry.name, defaultYear);
    if (parsedRecords?.length) records.push(...parsedRecords);
    else failed.push(entry.name);
  }

  if (!records.length) {
    unparsedFolders = failed;
    currentFolderRecords = [];
    currentFolderName = handle.name;
    document.getElementById('folder-selected').textContent = `Selected folder: ${handle.name}`;
    renderAll();
    setImportStatus('No valid campaign folders found. Expected: 0004 Ramadan 04-20 Vivi.', 'error');
    return;
  }

  const uniqueIdCount = new Set(records.map(record => record.sequenceNumber)).size;
  const summary = {
    campaignCount: records.length,
    uniqueIdCount,
    reblastCount: Math.max(0, records.length - uniqueIdCount),
    failedRowCount: failed.length,
    unparsedFolders: failed
  };
  const mode = document.getElementById('import-mode').value;
  await campaignIdStore.importRecords(records, handle.name, mode, summary);
  currentFolderRecords = records;
  currentFolderName = handle.name;
  document.getElementById('folder-selected').textContent = `Selected folder: ${handle.name}`;
  await loadCampaignData();
  setImportStatus(
    `${records.length} folders refreshed | ${uniqueIdCount} unique IDs | ${failed.length} unparsed`,
    failed.length ? 'error' : 'success'
  );
}

async function scanCampaignFolder(forceChoose = false) {
  if (!window.showDirectoryPicker) {
    setImportStatus('Folder scan needs Chrome or Edge with File System Access API.', 'error');
    return;
  }

  try {
    let handle = forceChoose ? null : savedFolderHandle;
    if (handle && !(await ensureFolderReadPermission(handle))) {
      handle = null;
    }

    if (!handle) {
      setImportStatus('Choose the parent folder that contains campaign folders...');
      handle = await window.showDirectoryPicker({ mode: 'read' });
      try {
        await campaignIdStore.saveFolderHandle(handle);
        savedFolderHandle = handle;
      } catch (saveError) {
        console.warn('Unable to save folder handle for refresh:', saveError);
        savedFolderHandle = null;
      }
    }

    setImportStatus(`Refreshing ${handle.name}...`);
    await scanCampaignHandle(handle);
  } catch (error) {
    if (error.name === 'AbortError') {
      setImportStatus('');
      return;
    }
    console.error('Unable to scan campaign folder:', error);
    setImportStatus(error.message || 'Unable to scan this folder.', 'error');
  }
}

async function exportLocalData() {
  const data = await campaignIdStore.load();
  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'eDM Helper Campaign Counter',
    storage: 'local IndexedDB',
    ...data
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  link.href = url;
  link.download = `campaign-counter-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setImportStatus('Local Campaign Counter backup downloaded.', 'success');
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('scan-folder').addEventListener('click', () => {
    scanCampaignFolder();
  });
  document.getElementById('scan-folder').addEventListener('dblclick', () => {
    scanCampaignFolder(true);
  });
  document.getElementById('export-local').addEventListener('click', () => {
    exportLocalData().catch(error => {
      setImportStatus(error.message || 'Unable to export local data.', 'error');
    });
  });
  document.getElementById('reset-local').addEventListener('click', async () => {
    if (!window.confirm('Reset all locally stored Campaign IDs and folder scan details on this browser?')) {
      return;
    }
    await campaignIdStore.reset();
    allocationRows = [];
    campaignRecords = [];
    lastImport = null;
    lastGenerated = null;
    savedFolderHandle = null;
    unparsedFolders = [];
    currentFolderRecords = [];
    currentFolderName = '';
    counterValue = COUNTER_MIN;
    document.getElementById('folder-selected').textContent = 'No folder scanned yet.';
    await loadCampaignData();
    setImportStatus('Local Campaign Counter data has been reset.', 'success');
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.campaign-id-box')) closeCampaignTooltips();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCampaignTooltips();
  });
  window.addEventListener('resize', () => {
    requestAnimationFrame(renderRangeBridges);
  });

  try {
    await loadCampaignData();
  } catch (error) {
    console.error('Unable to load Campaign IDs:', error);
    const total = document.getElementById('counter-total');
    const list = document.getElementById('series-counter-list');
    if (total) total.textContent = 'Unavailable';
    if (list) {
      list.innerHTML =
        '<p class="series-loading is-error">Unable to load Campaign IDs. Refresh the page to retry.</p>';
    }
  }
});
