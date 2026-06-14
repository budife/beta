// Campaign Counter Script with Supabase Integration

const supabaseClient = window.supabase.createClient('https://neuyjcotcmjnndjyzbcq.supabase.co', 'sb_publishable_BGon7fPsvXNe59meFE9F4Q_SbjCa-Dp');
const campaignIdCore = window.CampaignIdCore;
const allocationCache = new Map();
let allocationTableAvailable = true;

const counters = {
  campaign1: { value: 1, color: 'primary', name: 'Name 1' },
  campaign2: { value: 1, color: 'success', name: 'Name 2' },
  campaign3: { value: 1, color: 'warning', name: 'Name 3' },
  campaign4: { value: 1, color: 'info', name: 'Name 4' }
};

let currentTab = 'campaign1';
let currentEditCounter = null;
let currentEditTab = null;

function createCampaignDirectories() {
  document.querySelectorAll('.tab-pane').forEach(pane => {
    const historyContainer = pane.querySelector('.history-container');
    if (!historyContainer || pane.querySelector('.campaign-directory')) return;

    const directory = document.createElement('section');
    directory.className = 'campaign-directory';
    directory.innerHTML = `
      <div class="campaign-directory-header">
        <div>
          <span class="campaign-directory-eyebrow">Monday / Supabase</span>
          <h2>Campaign counters</h2>
        </div>
        <span class="campaign-directory-count">${Object.keys(counters).length} counters</span>
      </div>
      <div class="campaign-card-grid">
        ${Object.keys(counters).map(type => `
          <button type="button" class="campaign-summary-card" data-campaign-select="${type}">
            <span class="campaign-summary-topline">
              <strong data-campaign-name="${type}">${counters[type].name}</strong>
              <span class="campaign-summary-status">Ready</span>
            </span>
            <span class="campaign-summary-values">
              <span>
                <small>Current</small>
                <b data-campaign-current="${type}">----</b>
              </span>
              <span>
                <small>Next available</small>
                <b data-campaign-next="${type}">----</b>
              </span>
            </span>
            <span class="campaign-summary-updated" data-campaign-updated="${type}">Waiting for sync</span>
          </button>
        `).join('')}
      </div>
    `;
    historyContainer.insertAdjacentElement('beforebegin', directory);
  });

  document.querySelectorAll('[data-campaign-select]').forEach(card => {
    card.addEventListener('click', () => selectCampaign(card.dataset.campaignSelect));
  });
  renderCampaignDirectory();
}

function renderCampaignDirectory() {
  Object.keys(counters).forEach(type => {
    const state = allocationCache.get(type);
    document.querySelectorAll(`[data-campaign-name="${type}"]`).forEach(element => {
      element.textContent = counters[type].name;
    });
    document.querySelectorAll(`[data-campaign-current="${type}"]`).forEach(element => {
      element.textContent = campaignIdCore.formatSequence(counters[type].value);
    });
    document.querySelectorAll(`[data-campaign-next="${type}"]`).forEach(element => {
      element.textContent = state?.next ? campaignIdCore.formatSequence(state.next) : '----';
    });
    document.querySelectorAll(`[data-campaign-updated="${type}"]`).forEach(element => {
      const updated = counters[type].lastUpdated
        ? `Updated ${formatDateTime(counters[type].lastUpdated)}`
        : 'Waiting for sync';
      element.textContent = state
        ? `${updated} · ${state.used.length} IDs`
        : updated;
    });
  });

  document.querySelectorAll('[data-campaign-select]').forEach(card => {
    const isActive = card.dataset.campaignSelect === currentTab;
    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', String(isActive));
  });
}

function selectCampaign(tabName) {
  switchTab(tabName);
  document.querySelectorAll('.counter-tabs').forEach(container => {
    container.querySelectorAll('.tab-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });
  });
}

function createAllocationPanels() {
  Object.keys(counters).forEach(type => {
    const container = document.querySelector(`#${type}-tab .counter-container`);
    if (!container || container.querySelector('.campaign-allocation-panel')) return;

    const panel = document.createElement('section');
    panel.className = 'campaign-allocation-panel';
    panel.innerHTML = `
      <div class="allocation-heading">
        <div>
          <span>Next available</span>
          <strong id="${type}-next-available">----</strong>
        </div>
        <button type="button" class="allocation-copy-btn" data-copy-next="${type}">
          <i class="fa-regular fa-copy"></i> Copy
        </button>
      </div>
      <div class="allocation-used">
        <span class="allocation-label">Used nearby</span>
        <div id="${type}-used-numbers" class="used-number-list"></div>
      </div>
      <p id="${type}-allocation-status" class="allocation-status">Synchronizing campaign IDs...</p>
    `;
    container.querySelector('.buttons')?.insertAdjacentElement('afterend', panel);
  });

  document.querySelectorAll('[data-copy-next]').forEach(button => {
    button.addEventListener('click', async () => {
      const type = button.dataset.copyNext;
      const state = allocationCache.get(type);
      if (!state || !state.next) return;
      await copyCampaignSequence(state.next);
      button.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      setTimeout(() => {
        button.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      }, 1200);
    });
  });
}

async function copyCampaignSequence(value) {
  const formatted = campaignIdCore.formatSequence(value);
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(formatted);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = formatted;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

async function loadAllocationRows(campaignType) {
  if (allocationTableAvailable) {
    const { data, error } = await supabaseClient
      .from('campaign_id_allocations')
      .select('sequence_number, campaign_name, monday_item_id, monday_board_id, source, status, created_at')
      .eq('campaign_type', campaignType)
      .in('status', ['reserved', 'used'])
      .order('sequence_number', { ascending: true });

    if (!error) return data || [];
    if (['42P01', 'PGRST205'].includes(error.code)) {
      allocationTableAvailable = false;
      console.warn('Campaign allocation migration is not installed; using campaign history fallback.');
    } else {
      console.error('Unable to load campaign allocations:', error);
    }
  }

  const { data, error } = await supabaseClient
    .from('campaign_history')
    .select('value, action, created_at')
    .eq('campaign_type', campaignType)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Unable to load legacy campaign IDs:', error);
    return [];
  }
  return (data || [])
    .filter(entry => !['reverted', 'released'].includes(entry.action))
    .map(entry => ({
      sequence_number: entry.value,
      source: 'legacy-history',
      status: 'used',
      created_at: entry.created_at
    }));
}

async function refreshAllocationState(campaignType) {
  const rows = await loadAllocationRows(campaignType);
  const values = rows.map(row => row.sequence_number);
  if (counters[campaignType].value > 1) values.push(counters[campaignType].value);
  const state = campaignIdCore.getAllocationState(values, counters[campaignType].value);
  state.rows = rows;
  allocationCache.set(campaignType, state);
  renderAllocationState(campaignType, state);
  renderCampaignDirectory();
  return state;
}

function renderAllocationState(campaignType, state) {
  const nextElement = document.getElementById(`${campaignType}-next-available`);
  const usedContainer = document.getElementById(`${campaignType}-used-numbers`);
  const statusElement = document.getElementById(`${campaignType}-allocation-status`);
  if (nextElement) nextElement.textContent = campaignIdCore.formatSequence(state.next);
  if (statusElement) {
    statusElement.textContent = allocationTableAvailable
      ? `${state.used.length} IDs synchronized with Supabase`
      : `${state.used.length} IDs loaded from legacy history`;
  }
  if (!usedContainer) return;

  usedContainer.innerHTML = state.nearbyUsed.length
    ? state.nearbyUsed.map(value => {
        const row = state.rows.find(item => Number(item.sequence_number) === value);
        const detail = row?.campaign_name || row?.source || 'Used campaign ID';
        return `<button type="button" class="used-number-btn" data-used-number="${value}" title="${detail}">${campaignIdCore.formatSequence(value)}</button>`;
      }).join('')
    : '<span class="allocation-empty">No used campaign IDs yet</span>';

  usedContainer.querySelectorAll('[data-used-number]').forEach(button => {
    button.addEventListener('click', () => copyCampaignSequence(button.dataset.usedNumber));
  });
}

async function reserveNextCampaignId(campaignType, source = 'campaign-counter') {
  const state = await refreshAllocationState(campaignType);
  if (!state.next) throw new Error('No campaign IDs are available.');

  if (allocationTableAvailable) {
    const { data, error } = await supabaseClient.rpc('reserve_next_campaign_id', {
      p_campaign_type: campaignType,
      p_floor: state.floor,
      p_campaign_name: counters[campaignType].name,
      p_monday_item_id: null,
      p_monday_board_id: null,
      p_source: source
    });

    if (!error && data) return Array.isArray(data) ? data[0] : data;
    if (!['42883', 'PGRST202'].includes(error?.code)) throw error;
    allocationTableAvailable = false;
    console.warn('Campaign allocation RPC is not installed; using legacy fallback.');
  }

  return {
    sequence_number: state.next,
    campaign_type: campaignType,
    source: 'legacy-history',
    status: 'used'
  };
}

async function loadCounterFromSupabase(campaignType) {
  try {
    const { data, error } = await supabaseClient
      .from('campaign_counters')
      .select('value, name')
      .eq('campaign_type', campaignType)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? { value: data.value, name: data.name } : null;
  } catch (error) {
    console.error('Error loading counter:', error);
    return null;
  }
}

async function saveCounterToSupabase(campaignType, value) {
  try {
    const { error } = await supabaseClient
      .from('campaign_counters')
      .upsert({ campaign_type: campaignType, value: value, name: counters[campaignType].name, updated_at: new Date().toISOString() }, { onConflict: 'campaign_type' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving counter:', error);
  }
}

async function saveTabNameToSupabase(campaignType, name) {
  try {
    const { error } = await supabaseClient
      .from('campaign_counters')
      .upsert({ campaign_type: campaignType, name: name, value: counters[campaignType].value, updated_at: new Date().toISOString() }, { onConflict: 'campaign_type' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving tab name:', error);
  }
}

async function saveHistoryToSupabase(campaignType, action, value) {
  try {
    const { error } = await supabaseClient
      .from('campaign_history')
      .insert({ campaign_type: campaignType, action: action, value: value, created_at: new Date().toISOString() });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

async function loadHistoryFromSupabase(campaignType) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data, error } = await supabaseClient
      .from('campaign_history')
      .select('*')
      .eq('campaign_type', campaignType)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  createAllocationPanels();
  createCampaignDirectories();
  try {
    for (const type of Object.keys(counters)) {
      const savedData = await loadCounterFromSupabase(type);
      if (savedData) {
        if (savedData.value !== null) counters[type].value = savedData.value;
        if (savedData.name) counters[type].name = savedData.name;
      }
    }
  } catch (error) {
    console.error('Error loading from Supabase, using defaults:', error);
  }
  setupTabs();
  loadTabNames();
  Object.keys(counters).forEach(type => {
    updateCounterDisplay(type);
    updateHistoryDisplay(type);
    refreshAllocationState(type);
  });
  subscribeToCampaignAllocations();
});

function loadTabNames() {
  Object.keys(counters).forEach(type => {
    document.querySelectorAll(`[data-tab="${type}"] .tab-name`).forEach(tabName => {
      tabName.textContent = counters[type].name;
    });
    document.querySelectorAll(`#${type}-tab .counter-container h2`).forEach(counterTitle => {
      counterTitle.innerHTML = `${counters[type].name} Counter
        <button class="edit-icon" onclick="editCounter('${type}')" title="Edit manually">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>`;
    });
    document.querySelectorAll(`[data-tab="${type}"]`).forEach(tabBtn => {
      tabBtn.title = `${counters[type].name} - Double click to edit`;
    });
  });
  renderCampaignDirectory();
}

function openTabNameModal(type) {
  currentEditTab = type;
  const modal = document.getElementById('tab-name-modal');
  const input = document.getElementById('tab-name-input');
  input.value = counters[type].name;
  modal.style.display = 'flex';
  input.focus();
  input.select();
}

function closeTabNameModal() {
  document.getElementById('tab-name-modal').style.display = 'none';
  currentEditTab = null;
}

async function confirmTabName() {
  const input = document.getElementById('tab-name-input');
  const newName = input.value.trim();
  if (newName && currentEditTab) {
    counters[currentEditTab].name = newName;
    await saveTabNameToSupabase(currentEditTab, newName);
    document.querySelectorAll(`[data-tab="${currentEditTab}"] .tab-name`).forEach(tabName => {
      tabName.textContent = newName;
    });
    document.querySelectorAll(`#${currentEditTab}-tab .counter-container h2`).forEach(counterTitle => {
      counterTitle.innerHTML = `${newName} Counter
        <button class="edit-icon" onclick="editCounter('${currentEditTab}')" title="Edit manually">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>`;
    });
    document.querySelectorAll(`[data-tab="${currentEditTab}"]`).forEach(tabBtn => {
      tabBtn.title = `${newName} - Double click to edit`;
    });
    renderCampaignDirectory();
    closeTabNameModal();
  }
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      selectCampaign(tabName);
    });
    btn.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      openTabNameModal(this.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
  currentTab = tabName;
  renderCampaignDirectory();
}

async function updateCounterDisplay(type) {
  const counter = counters[type];
  counter.lastUpdated = new Date();
  document.getElementById(`${type}-number`).textContent = String(counter.value).padStart(4, '0');
  const progress = ((counter.value % 100) / 100) * 100;
  document.getElementById(`${type}-progress`).style.width = progress + '%';
  const updatedEl = document.getElementById(`${type}-updated`);
  if (updatedEl) {
    updatedEl.textContent = 'Last updated: ' + formatDateTime(counter.lastUpdated);
  }
  try {
    const history = await loadHistoryFromSupabase(type);
    const cacheEl = document.getElementById(`${type}-cache`);
    if (cacheEl) {
      cacheEl.textContent = history.length;
    }
  } catch (error) {
    console.error('Error loading history count:', error);
  }
  renderCampaignDirectory();
}

async function addCounter(type) {
  const button = document.querySelector(`#${type}-tab .add-btn`);
  try {
    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Reserving';
    }
    const allocation = await reserveNextCampaignId(type);
    counters[type].value = Number(allocation.sequence_number);
    await saveCounterToSupabase(type, counters[type].value);
    await updateCounterDisplay(type);
    await addToHistory(type, counters[type].value, 'generated');
    await refreshAllocationState(type);
    await copyCampaignSequence(counters[type].value);
    console.log(`New ${type} ID: ` + String(counters[type].value).padStart(4, '0'));
  } catch (error) {
    console.error('Error in addCounter:', error);
    alert(error.message || 'Unable to reserve the next campaign ID.');
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-plus"></i> Use Next ID';
    }
  }
}

async function decrementCounter(type) {
  if (counters[type].value > 1) {
    try {
      counters[type].value--;
      await saveCounterToSupabase(type, counters[type].value);
      await updateCounterDisplay(type);
      await addToHistory(type, counters[type].value, 'reverted');
      console.log(`${type} ID reverted to: ` + String(counters[type].value).padStart(4, '0'));
    } catch (error) {
      console.error('Error in decrementCounter:', error);
      counters[type].value++;
    }
  }
}

function editCounter(type) {
  if (!counters[type]) {
    console.error('Counter type not found:', type);
    return;
  }
  currentEditCounter = type;
  const modal = document.getElementById('edit-modal');
  const input = document.getElementById('modal-input');
  const title = document.getElementById('modal-title');
  input.value = counters[type].value;
  title.textContent = `Edit ${counters[type].name} ID`;
  modal.style.display = 'flex';
  input.focus();
  input.select();
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  currentEditCounter = null;
}

async function confirmEditCounter() {
  const input = document.getElementById('modal-input');
  const newValue = parseInt(input.value);
  if (newValue >= 1 && newValue <= 9999 && currentEditCounter && counters[currentEditCounter]) {
    try {
      counters[currentEditCounter].value = newValue;
      await saveCounterToSupabase(currentEditCounter, counters[currentEditCounter].value);
      await updateCounterDisplay(currentEditCounter);
      await addToHistory(currentEditCounter, counters[currentEditCounter].value, 'manual_edit');
      await saveManualAllocation(currentEditCounter, counters[currentEditCounter].value);
      await refreshAllocationState(currentEditCounter);
      console.log(`${counters[currentEditCounter].name} ID updated to ` + String(counters[currentEditCounter].value).padStart(4, '0'));
      closeEditModal();
    } catch (error) {
      console.error('Error in confirmEditCounter:', error);
    }
  } else {
    alert('Please enter a valid number (1-9999)');
    input.focus();
  }
}

async function saveManualAllocation(campaignType, sequenceNumber) {
  if (!allocationTableAvailable) return;
  const { error } = await supabaseClient
    .from('campaign_id_allocations')
    .insert({
      campaign_type: campaignType,
      sequence_number: sequenceNumber,
      campaign_name: counters[campaignType].name,
      source: 'manual-edit',
      status: 'used',
      updated_at: new Date().toISOString()
    });
  if (error && !['23505', '42P01', 'PGRST205'].includes(error.code)) {
    console.error('Unable to save manual campaign allocation:', error);
  }
}

function subscribeToCampaignAllocations() {
  if (!supabaseClient.channel) return;
  supabaseClient
    .channel('campaign-id-allocations')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'campaign_id_allocations'
    }, payload => {
      const type = payload.new?.campaign_type || payload.old?.campaign_type;
      if (type && counters[type]) refreshAllocationState(type);
    })
    .subscribe();
}

async function addToHistory(type, value, action) {
  await saveHistoryToSupabase(type, action, value);
  await updateHistoryDisplay(type);
}

async function updateHistoryDisplay(type) {
  const historyList = document.getElementById(`${type}-history`);
  if (!historyList) return;
  try {
    const history = await loadHistoryFromSupabase(type);
    historyList.innerHTML = history.slice(0, 10).map(entry => `
      <div class="history-item">
        <i class="fa-solid fa-${entry.action === 'generated' ? 'plus-circle' : entry.action === 'reverted' ? 'rotate-left' : 'edit'}"></i>
        <div>
          <strong>${String(entry.value).padStart(4, '0')}</strong>
          <time>${formatTime(entry.created_at)}</time>
        </div>
      </div>
    `).join('');
    const cacheEl = document.getElementById(`${type}-cache`);
    if (cacheEl) {
      cacheEl.textContent = history.length;
    }
  } catch (error) {
    console.error('Error updating history display:', error);
    historyList.innerHTML = '<p style="color: #666;">Unable to load history</p>';
  }
}

function formatDateTime(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatTime(timestamp) {
  return formatDateTime(timestamp);
}

async function loadMoreHistory(type) {
  const historyList = document.getElementById(`${type}-history`);
  const currentCount = historyList.children.length;
  const history = await loadHistoryFromSupabase(type);
  const moreItems = history.slice(currentCount, currentCount + 10);
  moreItems.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <i class="fa-solid fa-${entry.action === 'generated' ? 'plus-circle' : entry.action === 'reverted' ? 'rotate-left' : 'edit'}"></i>
      <div>
        <strong>${String(entry.value).padStart(4, '0')}</strong>
        <time>${formatTime(entry.created_at)}</time>
      </div>
    `;
    historyList.appendChild(item);
  });
  if (currentCount + 10 >= history.length) {
    event.target.style.display = 'none';
  }
}

document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeEditModal();
});

document.getElementById('tab-name-modal').addEventListener('click', function(e) {
  if (e.target === this) closeTabNameModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeEditModal();
    closeTabNameModal();
  }
});

document.getElementById('modal-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') confirmEditCounter();
});

document.getElementById('tab-name-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') confirmTabName();
});

document.getElementById('modal-input').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});
