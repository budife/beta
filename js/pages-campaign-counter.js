const campaignRegistryService = window.CampaignRegistryService;

let username = localStorage.getItem('edm_username') || '';
let connected = false;
let generating = false;
let lastCampaignId = 0;
const GENERATED_FROM_POINTER_NOTE = 'Generated from active counter';

function formatId(value) {
  return String(Number.parseInt(value, 10) || 0).padStart(4, '0');
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
  generating = true;
  updateGenerateButton();
  setMessage('Generating Campaign ID...');
  try {
    const result = await campaignRegistryService.generateCampaign(lastCampaignId, username);
    if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
    await navigator.clipboard?.writeText(formatId(result.campaign_id));
    setMessage(`${formatId(result.campaign_id)} generated and copied.`, 'success');
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
  bindWelcomeDialog();
  bindManualDialog();
  document.getElementById('generate-campaign')?.addEventListener('click', generateCampaign);
  document.getElementById('step-back-campaign')?.addEventListener('click', stepBackCampaign);
  document.getElementById('edit-last-campaign')?.addEventListener('click', openManualDialog);
  openWelcomeDialog();
  await refreshDashboard();
});
