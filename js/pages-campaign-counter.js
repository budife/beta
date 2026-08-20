const campaignRegistryService = window.CampaignRegistryService;

let username = localStorage.getItem('edm_username') || '';
let connected = false;
let generating = false;
let lastCampaignId = 0;
const GENERATED_FROM_POINTER_NOTE = 'Generated from active counter';
let scannedFolderIds = new Map();

function formatId(value) {
  return String(Number.parseInt(value, 10) || 0).padStart(4, '0');
}

function formatDatestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function slugifyCampaignName(name) {
  return name
    .trim()
    .replace(/\s+/g, '') || 'nama-campaign';
}

function buildCopiedId(campaignId, campaignName, dateStamp) {
  const stamp = dateStamp || formatDatestamp(new Date());
  const slug = slugifyCampaignName(campaignName);
  return `${stamp}_${slug}_${formatId(campaignId)}`;
}

function parseFolderCampaignId(name) {
  const match = name.match(/^(\d{4})\b/);
  return match ? match[1] : null;
}

function parseFolderInfo(name) {
  const idMatch = name.match(/^(\d{4})\s+(.+)/);
  if (!idMatch) return { id: null, name: name, date: '', manager: '' };
  const id = idMatch[1];
  let rest = idMatch[2].replace(/\s*-\s*Copy(\s*\(\d+\))?/gi, '').trim();
  const dateMatch = rest.match(/\b(\d{1,2})-(\d{2,4})\b/);
  let date = '';
  let namePart = rest;
  if (dateMatch) {
    date = dateMatch[0];
    namePart = rest.slice(0, dateMatch.index).trim();
  }
  const parts = namePart.split(/\s+/);
  const campaignName = parts[0] || '';
  const manager = parts[1] || '';
  return { id, name: campaignName, date, manager };
}

function renderFolderList() {
  const container = document.getElementById('folder-items');
  const countEl = document.getElementById('folder-count');
  const listEl = document.getElementById('folder-list');
  const emptyEl = document.getElementById('folder-empty');
  if (!container || !countEl || !listEl) return;

  if (scannedFolderIds.size === 0) {
    listEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  listEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;
  countEl.textContent = `(${scannedFolderIds.size})`;
  container.innerHTML = '';

  const sorted = [...scannedFolderIds.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [id, fullName] of sorted) {
    const info = parseFolderInfo(fullName);
    const chip = document.createElement('div');
    chip.className = 'counter-folder-chip';
    chip.dataset.folderId = id;
    chip.innerHTML = `
      <code>${escapeHtml(id)}</code>
      <span class="counter-folder-tooltip">
        <span class="tooltip-date">${escapeHtml(info.date || 'No date')}</span>
        <span class="tooltip-name">${escapeHtml(info.name || 'Unknown')}</span>
        <span class="tooltip-manager">${escapeHtml(info.manager || '')}</span>
      </span>`;
    container.appendChild(chip);
  }
}

function markConflict(folderId) {
  const chip = document.querySelector(`.counter-folder-chip[data-folder-id="${folderId}"]`);
  if (chip) chip.classList.add('is-conflict');
}

function clearConflicts() {
  document.querySelectorAll('.counter-folder-chip.is-conflict').forEach(el => el.classList.remove('is-conflict'));
}

async function scanFolder() {
  if (typeof window.showDirectoryPicker !== 'function') {
    setMessage('Folder access is not supported in this browser.', 'error');
    return;
  }
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    scannedFolderIds.clear();
    for await (const [name] of dirHandle.entries()) {
      const id = parseFolderCampaignId(name);
      if (id) scannedFolderIds.set(id, name);
    }
    const btn = document.getElementById('pick-folder');
    const label = document.getElementById('folder-btn-label');
    if (btn) btn.classList.add('is-loaded');
    if (label) label.textContent = dirHandle.name;
    renderFolderList();
    setMessage(`${scannedFolderIds.size} campaign folder(s) found.`, 'success');
  } catch (error) {
    if (error.name !== 'AbortError') {
      setMessage('Unable to read folder. Please try again.', 'error');
    }
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setMessage(message = '', type = '') {
  const element = document.getElementById('counter-message');
  if (!element) return;
  element.textContent = message;
  element.className = `counter-message${type ? ` is-${type}` : ''}`;
}

function getManualSetErrorMessage(error, candidateId) {
  console.error('Set Campaign ID failed', error);
  const message = String(error?.message || '').trim();
  if (/campaign id .* already exists|duplicate key|unique constraint/i.test(message)) {
    return `Campaign ID ${formatId(candidateId)} already exists.`;
  }
  if (error?.code === '42702' || /column reference .* is ambiguous/i.test(message)) {
    return 'The Supabase manual-counter function needs its qualified-column fix applied.';
  }
  if (/unable to fetch|failed to fetch|network|connection/i.test(message)) {
    return 'Unable to connect to Supabase.';
  }
  if (/campaign id must be between|user name is required/i.test(message)) {
    return message;
  }
  return 'Unable to set the Campaign ID. Please try again.';
}

function setConnectionStatus(isConnected) {
  const element = document.getElementById('counter-connection-status');
  if (!element) return;
  element.textContent = isConnected ? 'Connected' : 'Offline';
  element.className = `counter-connection-status ${isConnected ? 'is-connected' : 'is-offline'}`;
}

function formatActivityDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'an unknown time';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}

function renderActivity(items) {
  const list = document.getElementById('activity-list');
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<p class="activity-empty">No Campaign IDs have been generated yet.</p>';
    return;
  }
  const actionLabel = item => item.action === 'manual_set' && item.note !== GENERATED_FROM_POINTER_NOTE
    ? 'manually set'
    : 'generated';
  list.innerHTML = items.map(item => `
    <article class="activity-row">
      <code>${formatId(item.campaign_id)}</code>
      <span>${actionLabel(item)} on ${escapeHtml(formatActivityDate(item.generated_at))} by ${escapeHtml(item.generated_by || 'Unknown')}</span>
    </article>`).join('');
}

function updateGenerateButton() {
  const button = document.getElementById('generate-campaign');
  if (!button) return;
  button.disabled = !connected || !username || generating;
  button.innerHTML = generating
    ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating...'
    : '<i class="fa-solid fa-plus" aria-hidden="true"></i> Generate Campaign ID';
}

function updateEditButton() {
  const button = document.getElementById('edit-last-campaign');
  if (button) button.disabled = !connected || !username || generating;

  const stepBack = document.getElementById('step-back-campaign');
  if (stepBack) stepBack.disabled = !connected || !username || generating || lastCampaignId <= 1;
}

async function refreshDashboard() {
  const connection = await campaignRegistryService.checkConnection();
  connected = connection.connected;
  setConnectionStatus(connected);
  updateGenerateButton();
  updateEditButton();

  if (!connected) {
    lastCampaignId = 0;
    document.getElementById('counter-last-id').textContent = '----';
    renderActivity([]);
    setMessage(connection.reason === 'config'
      ? 'Supabase is not configured for this deployment.'
      : 'Unable to reach Supabase. Check your connection and refresh.', 'error');
    return;
  }

  try {
    const [lastCampaign, activity] = await Promise.all([
      campaignRegistryService.loadLastCampaign(),
      campaignRegistryService.loadRecentActivity()
    ]);
    lastCampaignId = Number(lastCampaign?.campaign_id) || 0;
    document.getElementById('counter-last-id').textContent = formatId(lastCampaignId);
    updateEditButton();
    renderActivity(activity);
    setMessage('Supabase is connected.');
  } catch (error) {
    connected = false;
    lastCampaignId = 0;
    setConnectionStatus(false);
    updateGenerateButton();
    updateEditButton();
    renderActivity([]);
    setMessage('Unable to load Campaign Counter data. Please refresh and try again.', 'error');
  }
}

function openWelcomeDialog() {
  if (username) return;
  const dialog = document.getElementById('welcome-dialog');
  if (!dialog) return;
  dialog.showModal();
  dialog.querySelector('#username-input')?.focus();
}

function bindWelcomeDialog() {
  const dialog = document.getElementById('welcome-dialog');
  const form = document.getElementById('welcome-form');
  if (!dialog || !form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('username-input');
    const value = input.value.trim().replace(/\s+/g, ' ');
    if (!value) {
      input.setCustomValidity('Please enter your name.');
      input.reportValidity();
      return;
    }
    username = value;
    if (document.getElementById('remember-username').checked) localStorage.setItem('edm_username', username);
    dialog.close();
    updateGenerateButton();
    updateEditButton();
    setMessage('Ready to generate Campaign IDs.');
  });
}

function openManualDialog() {
  if (!connected || !username || generating) return;
  const dialog = document.getElementById('manual-dialog');
  if (!dialog) return;
  document.getElementById('manual-current-id').textContent = formatId(lastCampaignId);
  const input = document.getElementById('manual-next-id');
  const reason = document.getElementById('manual-reason');
  const error = document.getElementById('manual-error');
  input.value = String(lastCampaignId + 1).padStart(4, '0');
  reason.value = '';
  error.textContent = '';
  dialog.showModal();
  input.focus();
  input.select();
}

function bindManualDialog() {
  const dialog = document.getElementById('manual-dialog');
  const form = document.getElementById('manual-form');
  if (!dialog || !form) return;
  document.getElementById('manual-cancel')?.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!connected || generating) return;
    const input = document.getElementById('manual-next-id');
    const error = document.getElementById('manual-error');
    const nextId = Number.parseInt(input.value.trim(), 10);
    if (!/^\d{1,4}$/.test(input.value.trim()) || !Number.isInteger(nextId)) {
      error.textContent = 'Enter a Campaign ID from 0001 to 9999.';
      input.focus();
      return;
    }
    generating = true;
    updateGenerateButton();
    updateEditButton();
    document.getElementById('manual-save').disabled = true;
    try {
      const result = await campaignRegistryService.setNextCampaignId(
        nextId,
        username,
        document.getElementById('manual-reason').value.trim()
      );
      if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
      dialog.close();
      setMessage(`${formatId(result.campaign_id)} manually set.`, 'success');
      await refreshDashboard();
    } catch (serviceError) {
      error.textContent = getManualSetErrorMessage(serviceError, nextId);
    } finally {
      generating = false;
      document.getElementById('manual-save').disabled = false;
      updateGenerateButton();
      updateEditButton();
    }
  });
}

async function stepBackCampaign() {
  if (!connected || !username || generating || lastCampaignId <= 1) return;
  const nextId = lastCampaignId - 1;
  generating = true;
  updateGenerateButton();
  updateEditButton();
  setMessage(`Setting Last Campaign to ${formatId(nextId)}...`);
  try {
    const result = await campaignRegistryService.setNextCampaignId(nextId, username, 'Stepped back one Campaign ID');
    if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
    setMessage(`${formatId(result.campaign_id)} manually set.`, 'success');
    await refreshDashboard();
  } catch (error) {
    setMessage(getManualSetErrorMessage(error, nextId), 'error');
  } finally {
    generating = false;
    updateGenerateButton();
    updateEditButton();
  }
}

async function generateCampaign() {
  if (!connected || !username || generating) return;
  const dateInput = document.getElementById('campaign-date-input');
  const nameInput = document.getElementById('campaign-name-input');
  const dateStamp = dateInput ? dateInput.value.trim() : '';
  const campaignName = nameInput ? nameInput.value : '';
  generating = true;
  clearConflicts();
  updateGenerateButton();
  setMessage('Generating Campaign ID...');
  try {
    const result = await campaignRegistryService.generateCampaign(lastCampaignId, username);
    if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
    const newId = formatId(result.campaign_id);
    if (scannedFolderIds.has(newId)) {
      markConflict(newId);
      setMessage(`${newId} generated and copied — conflict: folder already exists.`, 'error');
    } else {
      setMessage(`${buildCopiedId(result.campaign_id, campaignName, dateStamp)} generated and copied.`, 'success');
    }
    const copiedId = buildCopiedId(result.campaign_id, campaignName, dateStamp);
    await navigator.clipboard?.writeText(copiedId);
    await refreshDashboard();
  } catch (error) {
    setMessage('Unable to generate a Campaign ID. Please try again.', 'error');
  } finally {
    generating = false;
    updateGenerateButton();
    updateEditButton();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const dateInput = document.getElementById('campaign-date-input');
  const nameInput = document.getElementById('campaign-name-input');
  if (dateInput && !dateInput.value) dateInput.value = formatDatestamp(new Date());
  nameInput?.addEventListener('input', () => { nameInput.value = nameInput.value.replace(/\s/g, ''); });
  document.getElementById('pick-folder')?.addEventListener('click', scanFolder);
  bindWelcomeDialog();
  bindManualDialog();
  document.getElementById('generate-campaign')?.addEventListener('click', generateCampaign);
  document.getElementById('step-back-campaign')?.addEventListener('click', stepBackCampaign);
  document.getElementById('edit-last-campaign')?.addEventListener('click', openManualDialog);
  openWelcomeDialog();
  await refreshDashboard();
});
