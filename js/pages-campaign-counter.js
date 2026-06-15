const campaignIdCore = window.CampaignIdCore;
const campaignIdStore = window.CampaignIdLocalStore;

let allocationRows = [];
let campaignRecords = [];
let lastImport = null;
const candidates = new Map();
const SERIES_STORAGE_KEY = 'edm-helper-campaign-series';
let activeSeriesKey = sessionStorage.getItem(SERIES_STORAGE_KEY) || 'regular';

function formatId(value) {
  return campaignIdCore.formatSequence(value);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setImportStatus(message = '', type = '') {
  const status = document.getElementById('import-status');
  status.textContent = message;
  status.className = `used-id-import-status${type ? ` is-${type}` : ''}`;
}

function renderImportSummary(summary = lastImport?.summary) {
  const container = document.getElementById('import-summary');
  if (!summary) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }
  const items = [
    ['Campaigns', summary.campaignCount ?? 0],
    ['Unique IDs', summary.uniqueIdCount ?? 0],
    ['Reblasts', summary.reblastCount ?? 0],
    ['Failed rows', summary.failedRowCount ?? 0]
  ];
  container.innerHTML = items.map(([label, value]) => `
    <span>
      <small>${label}</small>
      <strong>${value}</strong>
    </span>`).join('');
  container.hidden = false;
}

function getUsedValues() {
  return campaignIdCore.normalizeUsedSequences(
    allocationRows.map(row => row.sequenceNumber)
  );
}

function getCandidate(series) {
  const state = campaignIdCore.getSeriesState(getUsedValues(), series.key);
  if (!candidates.has(series.key)) candidates.set(series.key, state.next ?? state.end);
  return candidates.get(series.key);
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

function recordsBySequence() {
  return campaignIdCore.groupCampaignRecords(campaignRecords);
}

function renderCampaignTooltip(sequence, records, allocation) {
  const countLabel = records.length === 1 ? '1 campaign' : `${records.length} campaigns`;
  const details = records.length
    ? records.map(record => `
        <div class="campaign-tooltip-record">
          <strong>${escapeHtml(record.itemName || record.fullCampaignId)}</strong>
          <span>${escapeHtml(formatBlastDate(record.blastDate))}</span>
          <code>${escapeHtml(record.fullCampaignId)}</code>
        </div>`).join('')
    : `
      <div class="campaign-tooltip-record">
        <strong>Locally reserved ID</strong>
        <span>No campaign detail is attached yet.</span>
      </div>`;

  return `
    <span class="campaign-id-tooltip" id="campaign-tooltip-${sequence}" role="tooltip">
      <span class="campaign-tooltip-title">${formatId(sequence)} | ${records.length ? countLabel : 'used ID'}</span>
      ${details}
    </span>`;
}

function renderUsedIdBoxes(series, latest, groupedRecords) {
  const rows = allocationRows
    .filter(row => Number(row.sequenceNumber) >= series.start
      && Number(row.sequenceNumber) <= series.end)
    .sort((a, b) => Number(a.sequenceNumber) - Number(b.sequenceNumber));

  if (!rows.length) {
    return '<span class="series-id-empty">No used Campaign IDs in this series.</span>';
  }

  return rows.map(row => {
    const sequence = Number(row.sequenceNumber);
    const records = groupedRecords.get(sequence) || [];
    const recordBadge = records.length > 1
      ? `<small aria-label="${records.length} campaigns">${records.length}</small>`
      : '';
    return `
      <span class="campaign-id-box${sequence === latest ? ' is-latest' : ''}" tabindex="0"
        role="button" aria-expanded="false" aria-describedby="campaign-tooltip-${sequence}"
        data-campaign-tooltip="${sequence}">
        <code>${formatId(sequence)}</code>
        ${recordBadge}
        ${renderCampaignTooltip(sequence, records, row)}
      </span>`;
  }).join('');
}

function renderSeriesRows() {
  const usedValues = getUsedValues();
  const usedSet = new Set(usedValues);
  const groupedRecords = recordsBySequence();
  const list = document.getElementById('series-counter-list');
  const tabs = document.getElementById('series-tabs');
  document.getElementById('counter-total').textContent =
    `${usedValues.length} used IDs | ${campaignRecords.length} campaigns`;
  document.getElementById('counter-local-status').textContent = lastImport
    ? `Local only | ${formatBlastDate(lastImport.importedAt.slice(0, 10))}`
    : 'Local only | No XLSX imported';
  renderImportSummary();

  if (!campaignIdCore.SERIES.some(series => series.key === activeSeriesKey)) {
    activeSeriesKey = 'regular';
  }

  tabs.innerHTML = campaignIdCore.SERIES.map(series => {
    const state = campaignIdCore.getSeriesState(usedValues, series.key);
    const label = series.key === 'regular' ? 'Regular' : String(series.start);
    return `
      <button type="button" class="series-tab${series.key === activeSeriesKey ? ' is-active' : ''}"
        role="tab" aria-selected="${series.key === activeSeriesKey}"
        aria-controls="series-counter-list" data-series-tab="${series.key}">
        <span>${label}</span>
        <small>${state.used.length}</small>
      </button>`;
  }).join('');

  const series = campaignIdCore.SERIES.find(item => item.key === activeSeriesKey);
  const state = campaignIdCore.getSeriesState(usedValues, series.key);
  const candidate = getCandidate(series);
  const isUsed = usedSet.has(candidate);
  list.innerHTML = `
    <article class="series-counter-row${isUsed ? ' is-used' : ''}" data-series-row="${series.key}">
      <div class="series-summary">
        <div class="series-name">
          <strong>${series.key === 'regular' ? 'Regular' : series.start}</strong>
          <small>${formatId(series.start)}–${formatId(series.end)}</small>
        </div>
        <div class="series-latest-wrap">
          <small>Latest used</small>
          <span class="series-latest">${state.latest === null ? 'None' : formatId(state.latest)}</span>
        </div>
        <div class="series-navigator">
          <button type="button" data-series-previous="${series.key}"
            aria-label="Previous ${series.label}" ${candidate <= series.start ? 'disabled' : ''}>&lsaquo;</button>
          <strong title="${isUsed ? 'Already used in local storage' : 'Available'}">${formatId(candidate)}</strong>
          <button type="button" data-series-next="${series.key}"
            aria-label="Next ${series.label}" ${candidate >= series.end ? 'disabled' : ''}>&rsaquo;</button>
        </div>
        <div class="series-row-actions">
          <button type="button" class="series-reset" data-series-reset="${series.key}"
            ${state.next === null ? 'disabled' : ''}>Next free</button>
          <button type="button" class="series-use" data-series-use="${series.key}"
            ${isUsed || candidate < series.start || candidate > series.end ? 'disabled' : ''}>
            Use &amp; Copy
          </button>
        </div>
      </div>
      <div class="series-id-grid" aria-label="${series.label} used Campaign IDs">
        ${renderUsedIdBoxes(series, state.latest, groupedRecords)}
      </div>
    </article>`;

  bindSeriesRowEvents();
}

function bindSeriesRowEvents() {
  document.querySelectorAll('[data-series-tab]').forEach(button => {
    button.addEventListener('click', () => {
      activeSeriesKey = button.dataset.seriesTab;
      sessionStorage.setItem(SERIES_STORAGE_KEY, activeSeriesKey);
      renderSeriesRows();
    });
  });
  document.querySelectorAll('[data-series-previous]').forEach(button => {
    button.addEventListener('click', () => moveCandidate(button.dataset.seriesPrevious, -1));
  });
  document.querySelectorAll('[data-series-next]').forEach(button => {
    button.addEventListener('click', () => moveCandidate(button.dataset.seriesNext, 1));
  });
  document.querySelectorAll('[data-series-reset]').forEach(button => {
    button.addEventListener('click', () => resetCandidate(button.dataset.seriesReset));
  });
  document.querySelectorAll('[data-series-use]').forEach(button => {
    button.addEventListener('click', () => reserveCandidate(button.dataset.seriesUse, button));
  });
  document.querySelectorAll('[data-campaign-tooltip]').forEach(box => {
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
}

function closeCampaignTooltips(except = null) {
  document.querySelectorAll('.campaign-id-box.is-open').forEach(box => {
    if (box === except) return;
    box.classList.remove('is-open');
    box.setAttribute('aria-expanded', 'false');
  });
}

function toggleCampaignTooltip(box) {
  const shouldOpen = !box.classList.contains('is-open');
  closeCampaignTooltips(box);
  box.classList.toggle('is-open', shouldOpen);
  box.setAttribute('aria-expanded', String(shouldOpen));
}

function moveCandidate(seriesKey, amount) {
  const series = campaignIdCore.SERIES.find(item => item.key === seriesKey);
  const nextValue = Math.min(series.end, Math.max(series.start, getCandidate(series) + amount));
  candidates.set(seriesKey, nextValue);
  renderSeriesRows();
}

function resetCandidate(seriesKey) {
  const state = campaignIdCore.getSeriesState(getUsedValues(), seriesKey);
  if (state?.next !== null) candidates.set(seriesKey, state.next);
  renderSeriesRows();
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

async function reserveCandidate(seriesKey, button) {
  const series = campaignIdCore.SERIES.find(item => item.key === seriesKey);
  const candidate = getCandidate(series);
  if (getUsedValues().includes(candidate)) return;

  button.disabled = true;
  button.textContent = 'Saving...';
  setImportStatus(`Saving ${formatId(candidate)} locally...`);
  try {
    await campaignIdStore.reserve(candidate);
    await copyId(candidate);
    await loadCampaignData();
    resetCandidate(seriesKey);
    setImportStatus(`${formatId(candidate)} saved locally and copied.`, 'success');
  } catch (error) {
    await loadCampaignData();
    resetCandidate(seriesKey);
    setImportStatus(error.message || 'Unable to save this Campaign ID locally.', 'error');
  }
}

async function loadCampaignData() {
  const data = await campaignIdStore.load();
  allocationRows = data.allocations;
  campaignRecords = data.records;
  lastImport = data.lastImport;
  campaignIdCore.SERIES.forEach(series => {
    const state = campaignIdCore.getSeriesState(getUsedValues(), series.key);
    const current = candidates.get(series.key);
    if (current === undefined || current < series.start || current > series.end) {
      candidates.set(series.key, state.next ?? series.end);
    }
  });
  renderSeriesRows();
}

function extractCampaignRecords(workbook) {
  const records = new Map();
  const failedRows = new Set();

  workbook.SheetNames.forEach(sheetName => {
    const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false
    });
    campaignIdCore.extractCampaignRecordsFromRows(rows, sheetName)
      .forEach(record => records.set(record.fullCampaignId, record));
    rows.forEach((row, rowIndex) => {
      const malformed = row.some(value => {
        const candidates = String(value || '').match(/\b20\d{6}_[^\s,;]+/g) || [];
        return candidates.some(candidate => {
          const cleaned = candidate.replace(/[)"'\]}>,.:]+$/g, '');
          return !campaignIdCore.parseCampaignId(cleaned);
        });
      });
      if (malformed) failedRows.add(`${sheetName}:${rowIndex + 1}`);
    });
  });

  const result = [...records.values()].sort((a, b) =>
    a.sequenceNumber - b.sequenceNumber || a.fullCampaignId.localeCompare(b.fullCampaignId));
  const uniqueIdCount = new Set(result.map(record => record.sequenceNumber)).size;
  return {
    records: result,
    summary: {
      campaignCount: result.length,
      uniqueIdCount,
      reblastCount: Math.max(0, result.length - uniqueIdCount),
      failedRowCount: failedRows.size
    }
  };
}

async function importMondayXlsx(file) {
  if (!window.XLSX) {
    setImportStatus('XLSX reader failed to load. Refresh and try again.', 'error');
    return;
  }
  setImportStatus(`Reading ${file.name}...`);
  try {
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const { records, summary } = extractCampaignRecords(workbook);
    if (!records.length) {
      setImportStatus('No Campaign IDs were found in this workbook.', 'error');
      return;
    }

    const existingIds = new Set(campaignRecords.map(record => record.fullCampaignId));
    const newRecordCount = records.filter(record => !existingIds.has(record.fullCampaignId)).length;
    const previousNumbers = new Set(getUsedValues());
    const addedAllocations = new Set(records.map(record => record.sequenceNumber)
      .filter(sequence => !previousNumbers.has(sequence))).size;
    const mode = document.getElementById('import-mode').value;
    await campaignIdStore.importRecords(records, file.name, mode, summary);
    await loadCampaignData();
    setImportStatus(
      `${records.length} campaigns scanned | ${newRecordCount} new | `
      + `${records.length - newRecordCount} updated | ${addedAllocations} new numbers`,
      'success'
    );
  } catch (error) {
    console.error('Unable to import Monday XLSX:', error);
    setImportStatus(error.message || 'Unable to import this workbook.', 'error');
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
  const importButton = document.getElementById('import-xlsx');
  const fileInput = document.getElementById('xlsx-input');
  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (file) await importMondayXlsx(file);
    fileInput.value = '';
  });
  document.getElementById('export-local').addEventListener('click', () => {
    exportLocalData().catch(error => {
      setImportStatus(error.message || 'Unable to export local data.', 'error');
    });
  });
  document.getElementById('reset-local').addEventListener('click', async () => {
    if (!window.confirm('Reset all locally stored Campaign IDs and imported campaign details on this browser?')) {
      return;
    }
    await campaignIdStore.reset();
    candidates.clear();
    await loadCampaignData();
    setImportStatus('Local Campaign Counter data has been reset.', 'success');
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.campaign-id-box')) closeCampaignTooltips();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCampaignTooltips();
  });

  document.getElementById('series-counter-list').innerHTML =
    '<p class="series-loading">Loading local Campaign IDs...</p>';
  try {
    await loadCampaignData();
  } catch (error) {
    console.error('Unable to load Campaign IDs:', error);
    document.getElementById('counter-total').textContent = 'Unavailable';
    document.getElementById('series-counter-list').innerHTML =
      '<p class="series-loading is-error">Unable to load Campaign IDs. Refresh the page to retry.</p>';
  }
});
