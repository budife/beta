const campaignRegistryService = window.CampaignRegistryService;

let username = localStorage.getItem('edm_username') || '';
let connected = false;
let generating = false;
let currentCampaignId = 0;
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
  const match = name.match(/\b(\d{4})\b/);
  return match ? match[1] : null;
}

function parseFolderInfo(name) {
  const idMatch = name.match(/\b(\d{4})\b\s+(.+)/);
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
  for (const [id, entries] of sorted) {
    const chip = document.createElement('div');
    chip.className = 'counter-folder-chip';
    chip.dataset.folderId = id;
    chip.setAttribute('tabindex', '0');

    const campaignItems = entries.map(e => `
      <span class="tooltip-campaign-item">
        <span class="tooltip-date">${escapeHtml(e.date || '—')}</span>
        <span class="tooltip-name">${escapeHtml(e.name || 'Unknown')}${e.manager ? ' - ' + escapeHtml(e.manager) : ''}</span>
      </span>`).join('');

    chip.innerHTML = `<code>${escapeHtml(id)}</code>`;

    // Create tooltip panel in portal
    const panel = document.createElement('div');
    panel.className = 'tooltip-panel';
    panel.dataset.folderId = id;
    panel.innerHTML = `
      <span class="tooltip-header">ID: ${escapeHtml(id)}</span>
      <span class="tooltip-campaign-list">${campaignItems}</span>`;
    document.getElementById('tooltip-portal').appendChild(panel);

    const showTooltip = () => {
      const rect = chip.getBoundingClientRect();
      panel.style.top = `${rect.top}px`;
      panel.style.left = `${rect.right + 8}px`;
      panel.classList.remove('flip-left');

      // Check if panel would overflow viewport on right
      const panelWidth = 280;
      const gap = 8;
      if (rect.right + gap + panelWidth > window.innerWidth - 12) {
        panel.classList.add('flip-left');
        panel.style.left = 'auto';
        panel.style.right = `${window.innerWidth - rect.left + gap}px`;
      } else {
        panel.style.left = `${rect.right + 8}px`;
        panel.style.right = 'auto';
      }

      // Check if panel would overflow viewport on bottom
      const maxHeight = window.innerHeight - 120;
      panel.style.maxHeight = `${maxHeight}px`;
      if (rect.top + panel.offsetHeight > window.innerHeight - 20) {
        panel.style.top = `${window.innerHeight - maxHeight - 20}px`;
      }

      panel.classList.add('visible');
    };

    const hideTooltip = () => {
      panel.classList.remove('visible', 'flip-left');
    };

    chip.addEventListener('mouseenter', showTooltip);
    chip.addEventListener('mouseleave', hideTooltip);
    chip.addEventListener('focus', showTooltip);
    chip.addEventListener('blur', hideTooltip);

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

function updateConflictState() {
  const idEl = document.getElementById('counter-last-id');
  const currentId = formatId(currentCampaignId);
  if (scannedFolderIds.has(currentId)) {
    idEl.classList.add('is-conflict');
  } else {
    idEl.classList.remove('is-conflict');
  }
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
      if (id) {
        const info = parseFolderInfo(name);
        if (!scannedFolderIds.has(id)) scannedFolderIds.set(id, []);
        scannedFolderIds.get(id).push(info);
      }
    }
    const btn = document.getElementById('pick-folder');
    const label = document.getElementById('folder-btn-label');
    if (btn) btn.classList.add('is-loaded');
    if (label) label.textContent = dirHandle.name;
    renderFolderList();
    console.log('[scanFolder] Found IDs:', [...scannedFolderIds.keys()]);
    console.log('[scanFolder] Current counter:', formatId(currentCampaignId));
    updateConflictState();

    // Save to Supabase as backup
    if (connected && username) {
      const entries = [];
      scannedFolderIds.forEach((infos, id) => {
        infos.forEach(info => {
          entries.push({
            campaign_id: id,
            campaign_name: info.name || '',
            folder_date: info.date || '',
            manager: info.manager || ''
          });
        });
      });
      if (entries.length) {
        try {
          await campaignRegistryService.saveFolderScan(username, dirHandle.name, entries);
        } catch (e) {
          console.warn('Folder scan backup failed', e);
        }
      }
    }

    setMessage(`${scannedFolderIds.size} unique campaign ID(s) found.`, 'success');
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
  const displayId = item => item.full_id ? escapeHtml(item.full_id) : formatId(item.campaign_id);
  list.innerHTML = items.map(item => `
    <article class="activity-row">
      <div class="activity-id-wrap">
        <code>${displayId(item)}</code>
        <button class="activity-copy" type="button" aria-label="Copy Campaign ID" title="Copy Campaign ID" data-id="${displayId(item)}">
          <i class="fa-regular fa-copy" aria-hidden="true"></i>
        </button>
      </div>
      <div class="activity-meta">
        ${actionLabel(item)} on ${escapeHtml(formatActivityDate(item.generated_at))} by ${escapeHtml(item.generated_by || 'Unknown')}
      </div>
    </article>`).join('');

  list.querySelectorAll('.activity-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        await navigator.clipboard.writeText(id);
        const icon = btn.querySelector('i');
        const original = icon?.className;
        if (icon) {
          icon.className = 'fa-solid fa-check';
          setTimeout(() => { icon.className = original; }, 1200);
        }
      } catch (err) {
        console.warn('Copy failed', err);
      }
    });
  });
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
  if (stepBack) stepBack.disabled = !connected || !username || generating || currentCampaignId <= 1;
}

let unsubscribeCounter = null;
let unsubscribeActivity = null;

async function refreshDashboard() {
  const connection = await campaignRegistryService.checkConnection();
  connected = connection.connected;
  setConnectionStatus(connected);
  updateGenerateButton();
  updateEditButton();

  if (!connected) {
    currentCampaignId = 0;
    document.getElementById('counter-last-id').textContent = '----';
    renderActivity([]);
    setMessage(connection.reason === 'config'
      ? 'Supabase is not configured for this deployment.'
      : 'Unable to reach Supabase. Check your connection and refresh.', 'error');
    return;
  }

  try {
    const [counterValue, activity] = await Promise.all([
      campaignRegistryService.loadCounter(),
      campaignRegistryService.loadRecentActivity()
    ]);
    currentCampaignId = Number(counterValue) || 0;
    const idEl = document.getElementById('counter-last-id');
    idEl.textContent = formatId(currentCampaignId);

    // Load previous folder scans (best-effort — SQL migration may not exist yet)
    try {
      const scans = await campaignRegistryService.loadFolderScans(username);
      scannedFolderIds.clear();
      scans.forEach(row => {
        const id = row.campaign_id;
        if (!scannedFolderIds.has(id)) scannedFolderIds.set(id, []);
        scannedFolderIds.get(id).push({
          name: row.campaign_name,
          date: row.folder_date,
          manager: row.manager
        });
      });
      renderFolderList();
    } catch (scanErr) {
      console.warn('Folder scan backup not available:', scanErr.message);
    }

    updateConflictState();
    updateEditButton();
    renderActivity(activity);
    setMessage('Supabase is connected.');
    if (typeof campaignRegistryService.subscribeCounter === 'function' && !unsubscribeCounter) {
      unsubscribeCounter = campaignRegistryService.subscribeCounter((value) => {
        currentCampaignId = Number(value) || 0;
        const idEl = document.getElementById('counter-last-id');
        idEl.textContent = formatId(currentCampaignId);
        updateConflictState();
        updateEditButton();
      });
    }
    if (typeof campaignRegistryService.subscribeActivity === 'function' && !unsubscribeActivity) {
      unsubscribeActivity = campaignRegistryService.subscribeActivity(() => {
        campaignRegistryService.loadRecentActivity().then(renderActivity);
      });
    }
  } catch (error) {
    connected = false;
    currentCampaignId = 0;
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
  document.getElementById('manual-current-id').textContent = formatId(currentCampaignId);
  const input = document.getElementById('manual-next-id');
  const reason = document.getElementById('manual-reason');
  const error = document.getElementById('manual-error');
  input.value = String(currentCampaignId + 1).padStart(4, '0');
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
    currentCampaignId = Number(result.campaign_id) || 0;
    const idEl = document.getElementById('counter-last-id');
    idEl.textContent = formatId(currentCampaignId);
    updateConflictState();
    updateEditButton();
    setMessage(`${formatId(currentCampaignId)} manually set.`, 'success');
    // Only refresh activity, don't reset counter from Supabase
    const activity = await campaignRegistryService.loadRecentActivity();
    renderActivity(activity);
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
  if (!connected || !username || generating || currentCampaignId <= 1) return;
  generating = true;
  updateGenerateButton();
  updateEditButton();
  setMessage(`Setting Campaign ID to ${formatId(currentCampaignId - 1)}...`);
  try {
    const result = await campaignRegistryService.backCampaign(username);
    if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
    currentCampaignId = Number(result.campaign_id) || 0;
    document.getElementById('counter-last-id').textContent = formatId(currentCampaignId);
    updateConflictState();
    updateEditButton();
    setMessage(`${formatId(currentCampaignId)} set.`, 'success');
  } catch (error) {
    setMessage('Unable to step back Campaign ID. Please try again.', 'error');
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
    const result = await campaignRegistryService.generateCampaign(username, dateStamp, campaignName);
    if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
    currentCampaignId = Number(result.campaign_id) || 0;
    const newId = formatId(currentCampaignId);
    const copiedId = buildCopiedId(currentCampaignId, campaignName, dateStamp);
    await navigator.clipboard?.writeText(copiedId);
    document.getElementById('counter-last-id').textContent = newId;
    updateConflictState();
    updateEditButton();
    if (scannedFolderIds.has(newId)) {
      markConflict(newId);
      setMessage(`${newId} generated and copied — conflict: folder already exists.`, 'error');
    } else {
      setMessage(`${copiedId} generated and copied.`, 'success');
    }
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
