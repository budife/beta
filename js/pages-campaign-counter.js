const SUPABASE_URL = 'https://neuyjcotcmjnndjyzbcq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BGon7fPsvXNe59meFE9F4Q_SbjCa-Dp';
const CAMPAIGN_TYPE = 'campaign1';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const campaignIdCore = window.CampaignIdCore;

let allocationRows = [];
const candidates = new Map();
const expandedSeries = new Set();

function formatId(value) {
  return campaignIdCore.formatSequence(value);
}

function escapeHtml(value) {
  return String(value)
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

function getUsedValues() {
  return campaignIdCore.normalizeUsedSequences(
    allocationRows
      .filter(row => row.status === 'used' || row.status === 'reserved')
      .map(row => row.sequence_number)
  );
}

function getCandidate(series) {
  const state = campaignIdCore.getSeriesState(getUsedValues(), series.key);
  if (!candidates.has(series.key)) candidates.set(series.key, state.next ?? state.end);
  return candidates.get(series.key);
}

function renderSeriesRows() {
  const usedValues = getUsedValues();
  const usedSet = new Set(usedValues);
  const list = document.getElementById('series-counter-list');
  document.getElementById('counter-total').textContent = `${usedValues.length} used IDs`;

  list.innerHTML = campaignIdCore.SERIES.map(series => {
    const state = campaignIdCore.getSeriesState(usedValues, series.key);
    const candidate = getCandidate(series);
    const isUsed = usedSet.has(candidate);
    const isExpanded = expandedSeries.has(series.key);
    const detailRows = allocationRows
      .filter(row => Number(row.sequence_number) >= series.start
        && Number(row.sequence_number) <= series.end
        && ['used', 'reserved'].includes(row.status))
      .sort((a, b) => Number(a.sequence_number) - Number(b.sequence_number));

    return `
      <article class="series-counter-row${isUsed ? ' is-used' : ''}" data-series-row="${series.key}">
        <button type="button" class="series-name" data-toggle-series="${series.key}"
          aria-expanded="${isExpanded}" title="Show used IDs">
          <strong>${series.key === 'regular' ? 'Regular' : series.start}</strong>
          <small>${formatId(series.start)}–${formatId(series.end)}</small>
        </button>
        <span class="series-latest">${state.latest === null ? 'None' : formatId(state.latest)}</span>
        <div class="series-navigator">
          <button type="button" data-series-previous="${series.key}"
            aria-label="Previous ${series.label}" ${candidate <= series.start ? 'disabled' : ''}>&lsaquo;</button>
          <strong title="${isUsed ? 'Already used in Supabase' : 'Available'}">${formatId(candidate)}</strong>
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
        <div class="series-used-detail${isExpanded ? ' is-open' : ''}">
          ${detailRows.length
            ? detailRows.map(row => `
                <span class="used-id-chip is-used"
                  title="${escapeHtml(row.campaign_name || row.source || 'Used in Supabase')}">
                  ${formatId(row.sequence_number)}
                </span>`).join('')
            : '<span class="used-id-empty">No used IDs in this series.</span>'}
        </div>
      </article>
    `;
  }).join('');

  bindSeriesRowEvents();
}

function bindSeriesRowEvents() {
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
  document.querySelectorAll('[data-toggle-series]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.toggleSeries;
      if (expandedSeries.has(key)) expandedSeries.delete(key);
      else expandedSeries.add(key);
      renderSeriesRows();
    });
  });
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
  setImportStatus(`Reserving ${formatId(candidate)} in ${series.label}...`);
  try {
    const { data, error } = await supabaseClient
      .from('campaign_id_allocations')
      .insert({
        campaign_type: CAMPAIGN_TYPE,
        sequence_number: candidate,
        campaign_name: series.label,
        source: 'campaign-counter',
        status: 'used'
      })
      .select('sequence_number')
      .single();
    if (error) throw error;
    await copyId(data.sequence_number);
    await loadAllocations();
    resetCandidate(seriesKey);
    setImportStatus(`${formatId(data.sequence_number)} saved and copied.`, 'success');
  } catch (error) {
    console.error('Unable to reserve Campaign ID:', error);
    if (error.code === '23505') {
      await loadAllocations();
      resetCandidate(seriesKey);
      setImportStatus('That Campaign ID was already used. Moved to the next available number.', 'error');
    } else {
      setImportStatus(error.message || 'Unable to reserve this Campaign ID.', 'error');
      renderSeriesRows();
    }
  }
}

async function loadAllocations() {
  const { data, error } = await supabaseClient
    .from('campaign_id_allocations')
    .select('sequence_number, campaign_name, source, status, created_at')
    .eq('campaign_type', CAMPAIGN_TYPE)
    .in('status', ['reserved', 'used'])
    .order('sequence_number', { ascending: true });
  if (error) throw error;
  allocationRows = data || [];
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
  const records = [];
  const seen = new Set();
  workbook.SheetNames.forEach(sheetName => {
    const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false
    });
    rows.forEach((row, rowIndex) => {
      row.forEach(value => {
        campaignIdCore.extractCampaignIds(value).forEach(record => {
          if (seen.has(record.sequenceNumber)) return;
          seen.add(record.sequenceNumber);
          records.push({
            sequenceNumber: record.sequenceNumber,
            campaignId: record.campaignId,
            source: `monday-xlsx:${sheetName}:${rowIndex + 1}`
          });
        });
      });
    });
  });
  return records.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

async function importMondayXlsx(file) {
  if (!window.XLSX) {
    setImportStatus('XLSX reader failed to load. Refresh and try again.', 'error');
    return;
  }
  setImportStatus(`Reading ${file.name}...`);
  try {
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const records = extractCampaignRecords(workbook);
    if (!records.length) {
      setImportStatus('No Campaign IDs were found in this workbook.', 'error');
      return;
    }
    const existing = new Set(getUsedValues());
    const missing = records.filter(record => !existing.has(record.sequenceNumber));
    if (missing.length) {
      const { error } = await supabaseClient.from('campaign_id_allocations').insert(
        missing.map(record => ({
          campaign_type: CAMPAIGN_TYPE,
          sequence_number: record.sequenceNumber,
          campaign_name: record.campaignId,
          source: record.source,
          status: 'used'
        }))
      );
      if (error) throw error;
    }
    await loadAllocations();
    setImportStatus(
      `${records.length} IDs scanned. ${missing.length} added, ${records.length - missing.length} already existed.`,
      'success'
    );
  } catch (error) {
    console.error('Unable to import Monday XLSX:', error);
    setImportStatus(error.message || 'Unable to import this workbook.', 'error');
  }
}

function subscribeToAllocations() {
  if (!supabaseClient.channel) return;
  supabaseClient
    .channel('campaign-counter-series')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'campaign_id_allocations',
      filter: `campaign_type=eq.${CAMPAIGN_TYPE}`
    }, () => loadAllocations().catch(console.error))
    .subscribe();
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

  document.getElementById('series-counter-list').innerHTML =
    '<p class="series-loading">Loading Campaign IDs from Supabase...</p>';
  try {
    await loadAllocations();
  } catch (error) {
    console.error('Unable to load Campaign IDs:', error);
    document.getElementById('counter-total').textContent = 'Unavailable';
    document.getElementById('series-counter-list').innerHTML =
      '<p class="series-loading is-error">Unable to load Campaign IDs. Refresh the page to retry.</p>';
  }
  subscribeToAllocations();
});
