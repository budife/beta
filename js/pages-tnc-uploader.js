(function () {
  'use strict';

  if (new URLSearchParams(window.location.search).get('embed') === '1') {
    document.body.classList.add('is-embedded');
  }

  const STORE_KEY = 'edm-helper-tnc-uploader-items-v1';
  const DEFAULT_PUBLIC_BASE_URL = 'https://mail.hsbc.com.hk/id/emailblast';
  const DIRECT_LINK_CHECK_TIMEOUT_MS = 2500;
  const PROXY_LINK_CHECK_TIMEOUT_MS = 6500;
  const elements = {};
  const state = {
    items: [],
    directoryHandle: null,
    mode: 'normal',
    replaceInfo: null,
    baseUrl: DEFAULT_PUBLIC_BASE_URL,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function initElements() {
    [
      'supportBadge',
      'yearInput',
      'marketInput',
      'prefixInput',
      'targetPath',
      'normalModeBtn',
      'replaceModeBtn',
      'replaceFields',
      'replaceLinkInput',
      'replaceSummary',
      'chooseFolderBtn',
      'dropZone',
      'dropTitle',
      'dropHint',
      'droppedList',
      'fileInput',
      'clearBtn',
      'downloadBtn',
      'saveBtn',
      'statusText',
      'copyAllLinksBtn',
      'checkAllBtn',
      'clearHistoryBtn',
      'fileCount',
      'fileList',
    ].forEach((id) => {
      elements[id] = $(id);
    });
  }

  function supportsDirectoryWrite() {
    return typeof window.showDirectoryPicker === 'function';
  }

  function normalizeSegment(value, fallback) {
    const clean = String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return clean || fallback;
  }

  function stripPdfExtension(name) {
    return name.replace(/\.pdf$/i, '');
  }

  function sanitizePdfName(name, prefix = '') {
    const base = stripPdfExtension(name)
      .replace(/\s+-\s+/g, '-')
      .replace(/\s*\((?:copy|\d+)\)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/-+/g, '-')
      .replace(/^[_-]+|[_-]+$/g, '');
    const safeBase = base || 'tnc';
    const cleanPrefix = normalizeSegment(prefix, '').replace(/-/g, '_');
    const withPrefix = cleanPrefix && !safeBase.toLowerCase().startsWith(`${cleanPrefix.toLowerCase()}_`)
      ? `${cleanPrefix}_${safeBase}`
      : safeBase;
    return `${withPrefix}.pdf`;
  }

  function sanitizeExistingPdfName(name) {
    const cleanName = String(name || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/^[-\s]+|[-\s]+$/g, '');
    return /\.pdf$/i.test(cleanName) ? cleanName : `${cleanName || 'tnc'}.pdf`;
  }

  function formatBytes(size) {
    if (!Number.isFinite(size)) return 'Unknown size';
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTodayParts() {
    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
    };
  }

  function getTodayPrefix() {
    const today = getTodayParts();
    return `TC${today.month}${today.day}`;
  }

  function getTargetParts() {
    if (state.mode === 'replace' && state.replaceInfo) {
      return [state.replaceInfo.market, state.replaceInfo.year, 'tnc'];
    }
    const year = normalizeSegment(elements.yearInput.value, String(new Date().getFullYear()));
    const market = normalizeSegment(elements.marketInput.value, 'MKT').toUpperCase();
    return [market, year, 'tnc'];
  }

  function getTargetPath() {
    return ['emailblast', ...getTargetParts()].join('/');
  }

  function getDirectoryParts() {
    return ['emailblast', ...getTargetParts()];
  }

  function getFolderPathForUrl() {
    return getTargetParts().join('/');
  }

  function getBaseUrl() {
    return String(state.baseUrl || DEFAULT_PUBLIC_BASE_URL)
      .trim()
      .replace(/\/+$/g, '');
  }

  function buildPublicUrl(fileName) {
    const pathParts = [getFolderPathForUrl(), fileName]
      .join('/')
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${getBaseUrl()}/${pathParts}`;
  }

  function getTargetName(file) {
    if (state.mode === 'replace' && state.replaceInfo) {
      return state.replaceInfo.fileName;
    }
    return sanitizePdfName(file.name, elements.prefixInput.value.trim());
  }

  function parseReplaceLink(value) {
    const source = String(value || '').trim();
    if (!source) return null;

    try {
      const parsed = new URL(source);
      const segments = parsed.pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));
      const emailblastIndex = segments.findIndex((segment) => segment.toLowerCase() === 'emailblast');
      const baseIndex = emailblastIndex >= 0 ? emailblastIndex : segments.length - 5;
      const market = segments[baseIndex + 1];
      const year = segments[baseIndex + 2];
      const folder = segments[baseIndex + 3];
      const fileName = segments[baseIndex + 4];

      if (!market || !year || !folder || !fileName || !/\.pdf$/i.test(fileName)) {
        throw new Error('Missing PDF path parts');
      }

      if (!/^\d{4}$/.test(year) || folder.toLowerCase() !== 'tnc') {
        throw new Error('Expected /MARKET/YYYY/tnc/file.pdf');
      }

      const basePath = emailblastIndex >= 0
        ? `/${segments.slice(0, emailblastIndex + 1).map(encodeURIComponent).join('/')}`
        : parsed.pathname.replace(/\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/i, '');

      return {
        baseUrl: `${parsed.origin}${basePath}`.replace(/\/+$/g, ''),
        market: normalizeSegment(market, 'MKT').toUpperCase(),
        year,
        fileName: sanitizeExistingPdfName(fileName),
        url: source,
      };
    } catch (error) {
      console.warn('Unable to parse replacement PDF link.', error);
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setStatus(message, type = '') {
    elements.statusText.textContent = message;
    elements.statusText.classList.toggle('is-success', type === 'success');
    elements.statusText.classList.toggle('is-error', type === 'error');
  }

  function createItemId(fileName, targetName) {
    return `${getTargetPath()}/${targetName || fileName}`.toLowerCase();
  }

  function serializeItem(item) {
    const {
      id,
      originalName,
      targetName,
      targetPath,
      url,
      size,
      lastModified,
      status,
      httpStatus,
      verifiedVia,
      checkedAt,
      savedAt,
      downloadedAt,
    } = item;
    return {
      id,
      originalName,
      targetName,
      targetPath,
      url,
      size,
      lastModified,
      status,
      httpStatus,
      verifiedVia,
      checkedAt,
      savedAt,
      downloadedAt,
    };
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.items.map(serializeItem)));
    } catch (error) {
      console.warn('Unable to persist TNC uploader history.', error);
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      state.items = parsed.map((item) => ({
        ...item,
        file: null,
        status: item.status || 'history',
      }));
    } catch (error) {
      console.warn('Unable to load TNC uploader history.', error);
    }
  }

  function isPdf(file) {
    return file
      && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
  }

  function createItemFromFile(file) {
    const targetName = getTargetName(file);
    return {
      id: createItemId(file.name, targetName),
      file,
      originalName: file.name,
      targetName,
      targetPath: getTargetPath(),
      url: buildPublicUrl(targetName),
      size: file.size,
      lastModified: file.lastModified,
      status: 'queued',
      httpStatus: '',
      verifiedVia: '',
      checkedAt: '',
      savedAt: '',
      downloadedAt: '',
    };
  }

  function refreshItemTargets({ keepStatus = true } = {}) {
    state.items = state.items.map((item) => {
      if (!item.file) return item;

      const targetName = state.mode === 'replace' && state.replaceInfo
        ? state.replaceInfo.fileName
        : sanitizePdfName(item.originalName || item.targetName, elements.prefixInput.value.trim());
      return {
        ...item,
        id: createItemId(item.originalName || targetName, targetName),
        targetName,
        targetPath: getTargetPath(),
        url: buildPublicUrl(targetName),
        status: keepStatus ? item.status : 'queued',
        httpStatus: keepStatus ? item.httpStatus : '',
        verifiedVia: keepStatus ? item.verifiedVia : '',
        checkedAt: keepStatus ? item.checkedAt : '',
      };
    });
    saveHistory();
  }

  function addFiles(fileList) {
    if (state.mode === 'replace' && !state.replaceInfo) {
      setStatus('Paste a valid old PDF link before dropping the replacement file.', 'error');
      return;
    }

    let incoming = Array.from(fileList || []).filter(isPdf);
    let trimmedForReplace = false;
    if (state.mode === 'replace' && incoming.length > 1) {
      incoming = incoming.slice(0, 1);
      trimmedForReplace = true;
    }
    if (state.mode === 'replace' && incoming.length) {
      state.items = state.items.filter((item) => !item.file);
    }
    incoming.forEach((file) => {
      const item = createItemFromFile(file);
      const existingIndex = state.items.findIndex((current) => current.id === item.id);
      if (existingIndex >= 0) {
        state.items[existingIndex] = {
          ...state.items[existingIndex],
          ...item,
        };
      } else {
        state.items.unshift(item);
      }
    });

    if (!incoming.length) {
      setStatus('No PDF found. Drop or choose .pdf files only.', 'error');
    } else if (trimmedForReplace) {
      setStatus('Replace mode uses one PDF at a time. Added the first PDF and cleared the active queue.', 'error');
    } else if (state.mode === 'replace') {
      setStatus('Replacement PDF added. Active queue is limited to this one file.', 'success');
    } else {
      setStatus(`${incoming.length} PDF file(s) added.`, 'success');
    }

    saveHistory();
    renderItems();
  }

  function renderDroppedList() {
    const droppedItems = getFileBackedItems();
    if (!droppedItems.length) {
      elements.droppedList.innerHTML = '<span>No dropped PDFs yet.</span>';
      return;
    }

    elements.droppedList.innerHTML = `
      <strong>${droppedItems.length} dropped PDF${droppedItems.length === 1 ? '' : 's'}</strong>
      <ul>
        ${droppedItems.map((item) => `
          <li title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</li>
        `).join('')}
      </ul>
    `;
  }

  function getFileBackedItems() {
    return state.items.filter((item) => item.file);
  }

  function getLinkItems() {
    return state.items.filter((item) => item.url);
  }

  function updateButtons() {
    const fileBackedCount = getFileBackedItems().length;
    const linkCount = getLinkItems().length;
    const fileCountLabel = `${state.items.length} PDF${state.items.length === 1 ? '' : 's'}`;
    elements.fileCount.textContent = fileCountLabel;
    elements.saveBtn.disabled = !fileBackedCount || !state.directoryHandle;
    elements.downloadBtn.disabled = !fileBackedCount;
    elements.copyAllLinksBtn.disabled = !linkCount;
    elements.checkAllBtn.disabled = !linkCount;
  }

  function getStatusLabel(item) {
    const labels = {
      queued: 'Queued',
      saved: 'Saved',
      downloaded: 'Downloaded',
      live: 'Live',
      checking: 'Checking',
      not_found: 'Not found',
      cannot_verify: 'Cannot verify',
      error: 'Error',
      history: 'History',
    };
    return labels[item.status] || 'Queued';
  }

  function getStatusClass(item) {
    if (item.status === 'saved' || item.status === 'live') return 'is-live';
    if (item.status === 'checking') return 'is-checking';
    if (item.status === 'not_found') return 'is-not-found';
    if (item.status === 'error' || item.status === 'cannot_verify') return 'is-error';
    return '';
  }

  function getItemNote(item) {
    if (item.status === 'live' && item.httpStatus) return `HTTP ${item.httpStatus} · checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'not_found') return `HTTP 404 · checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'cannot_verify') return `Browser could not verify · checked ${formatTime(item.checkedAt)}`;
    if (item.savedAt) return `Saved ${formatTime(item.savedAt)}`;
    if (item.downloadedAt) return `Downloaded ${formatTime(item.downloadedAt)}`;
    if (!item.file) return 'Stored history only. Drop the PDF again to save/download.';
    return 'Ready to save.';
  }

  function getItemNoteDisplay(item) {
    const via = item.verifiedVia ? ` via ${item.verifiedVia}` : '';
    if (item.status === 'live' && item.httpStatus) return `HTTP ${item.httpStatus}${via} - checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'not_found') return `HTTP 404${via} - checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'cannot_verify') return `Could not verify automatically - checked ${formatTime(item.checkedAt)}`;
    return getItemNote(item);
  }

  function renderItems() {
    updateButtons();
    renderDroppedList();

    if (!state.items.length) {
      elements.fileList.innerHTML = `
        <div class="tnc-empty">
          <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
            <p>No PDF selected or saved yet.</p>
        </div>
      `;
      return;
    }

    elements.fileList.innerHTML = state.items.map((item) => `
      <article class="tnc-file-item" data-item-id="${escapeHtml(item.id)}">
        <div class="tnc-file-details">
          <div class="tnc-file-row">
            <span>Original file</span>
            <strong class="tnc-file-name" title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</strong>
          </div>
          <div class="tnc-file-row">
            <span>Renamed file</span>
            <code class="tnc-file-target" title="${escapeHtml(`${item.targetPath}/${item.targetName}`)}">${escapeHtml(item.targetName)}</code>
          </div>
          <div class="tnc-file-row">
            <span>Public link</span>
            <code class="tnc-file-link" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</code>
          </div>
        </div>
        <div class="tnc-file-bottom">
          <div class="tnc-file-meta">
            <span>${escapeHtml(formatBytes(item.size))}</span>
            <span class="tnc-status-badge ${getStatusClass(item)}">${escapeHtml(getStatusLabel(item))}</span>
            <span>${escapeHtml(getItemNoteDisplay(item))}</span>
          </div>
          <div class="tnc-file-actions">
            <button class="tnc-file-action" type="button" data-action="copy" data-id="${escapeHtml(item.id)}">Copy link</button>
            <button class="tnc-file-action" type="button" data-action="open" data-id="${escapeHtml(item.id)}">Open</button>
            <button class="tnc-file-action" type="button" data-action="check" data-id="${escapeHtml(item.id)}">Check</button>
            <button class="tnc-remove" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.originalName)}">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function findItem(id) {
    return state.items.find((item) => item.id === id);
  }

  function removeItem(id) {
    state.items = state.items.filter((item) => item.id !== id);
    saveHistory();
    renderItems();
    setStatus(state.items.length ? 'Item removed.' : 'Queue cleared.');
  }

  async function chooseFolder() {
    if (!supportsDirectoryWrite()) {
      setStatus('Saving to a folder is not supported in this browser. Use Chrome/Edge or download the ready PDFs.', 'error');
      return;
    }

    try {
      state.directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      renderItems();
      setStatus(`Destination folder selected: ${state.directoryHandle.name}.`, 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        setStatus('Unable to select folder. Please try again.', 'error');
      }
    }
  }

  async function ensureDirectory(rootHandle, parts) {
    let current = rootHandle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    return current;
  }

  async function saveFiles() {
    const fileBackedItems = getFileBackedItems();
    if (!state.directoryHandle) {
      setStatus('Pick a destination folder first.', 'error');
      return;
    }

    if (!fileBackedItems.length) {
      setStatus('Drop PDF files again before saving. History rows only keep metadata.', 'error');
      return;
    }

    elements.saveBtn.disabled = true;
    setStatus('Saving PDF files...');

    try {
      const targetDir = await ensureDirectory(state.directoryHandle, getDirectoryParts());
      const now = new Date().toISOString();
      for (const item of fileBackedItems) {
        const fileHandle = await targetDir.getFileHandle(item.targetName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(item.file);
        await writable.close();
        item.status = 'saved';
        item.savedAt = now;
        item.file = null;
      }
      elements.fileInput.value = '';
      saveHistory();
      renderItems();
      setStatus(`${fileBackedItems.length} PDF file(s) saved. Queue cleared; saved links remain in history.`, 'success');
    } catch (error) {
      console.error(error);
      setStatus('Save failed. Check folder permission or download the ready PDFs.', 'error');
    } finally {
      renderItems();
    }
  }

  function downloadRenamedFiles() {
    const fileBackedItems = getFileBackedItems();
    if (!fileBackedItems.length) {
      setStatus('Drop PDF files again before downloading. History rows only keep metadata.', 'error');
      return;
    }

    const now = new Date().toISOString();
    fileBackedItems.forEach((item, index) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(item.file);
      link.download = item.targetName;
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        URL.revokeObjectURL(link.href);
        link.remove();
      }, index * 120);
      item.status = 'downloaded';
      item.downloadedAt = now;
    });
    saveHistory();
    renderItems();
    setStatus(`${fileBackedItems.length} ready PDF download(s) started.`, 'success');
  }

  function clearQueue() {
    state.items = state.items.filter((item) => !item.file);
    elements.fileInput.value = '';
    saveHistory();
    renderItems();
    setStatus(state.items.length ? 'Current file queue cleared. History remains.' : 'Queue cleared.');
  }

  function clearHistory() {
    state.items = [];
    elements.fileInput.value = '';
    saveHistory();
    renderItems();
    setStatus('TNC uploader history cleared.');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Link copied.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Unable to copy link. Select and copy it manually.', 'error');
    }
  }

  function copyAllLinks() {
    const links = getLinkItems().map((item) => item.url).join('\n');
    if (!links) return;
    copyText(links);
  }

  function openItemLink(id) {
    const item = findItem(id);
    if (!item?.url) return;
    window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  function createTimeoutSignal(timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return { controller, timeoutId };
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = PROXY_LINK_CHECK_TIMEOUT_MS) {
    const { controller, timeoutId } = createTimeoutSignal(timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: options.cache || 'no-store',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function getProxyAttempts(url) {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return [
      { url: `https://r.jina.ai/http://${cleanUrl}`, via: 'Jina HTTP' },
      { url: `https://r.jina.ai/https://${cleanUrl}`, via: 'Jina HTTPS' },
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, via: 'AllOrigins Raw' },
      { url: `https://corsproxy.io/?${encodeURIComponent(url)}`, via: 'CorsProxy' },
      { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, via: 'CodeTabs' },
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, via: 'AllOrigins', json: true },
    ];
  }

  async function verifyProxyAttempt(attempt) {
    const response = await fetchWithTimeout(attempt.url, { method: 'GET' });
    if (!response.ok && response.status !== 404) {
      throw new Error(`${attempt.via} returned HTTP ${response.status}`);
    }

    if (attempt.json) {
      const data = await response.json();
      const contents = String(data?.contents || '');
      if (response.ok && contents) {
        return { ok: true, status: response.status, via: attempt.via };
      }
      throw new Error(`${attempt.via} returned an empty response`);
    }

    return {
      ok: response.ok,
      status: response.status,
      via: attempt.via,
    };
  }

  async function verifyLink(url) {
    if (window.EDM_PRIVACY?.get?.('externalChecks') === false) {
      return {
        ok: false,
        status: '',
        via: '',
        cannotVerify: true,
        disabled: true,
      };
    }

    try {
      const response = await fetchWithTimeout(url, {
        method: 'HEAD',
        cache: 'no-store',
      }, DIRECT_LINK_CHECK_TIMEOUT_MS);

      if (response.ok || response.status === 404) {
        return {
          ok: response.ok,
          status: response.status,
          via: 'Direct',
        };
      }
    } catch (error) {
      console.warn('Direct HEAD check failed.', error);
    }

    if (window.EDM_PRIVACY?.get?.('proxyFallbacks') === false) {
      return {
        ok: false,
        status: '',
        via: '',
        cannotVerify: true,
      };
    }

    try {
      return await Promise.any(getProxyAttempts(url).map(verifyProxyAttempt));
    } catch (error) {
      console.warn('Proxy link checks failed.', error);
    }

    return {
      ok: false,
      status: '',
      via: '',
      cannotVerify: true,
    };
  }

  async function checkItemLink(id) {
    const item = findItem(id);
    if (!item?.url) return;

    item.status = 'checking';
    item.httpStatus = '';
    item.verifiedVia = '';
    renderItems();

    const result = await verifyLink(item.url);
    item.httpStatus = result.status ? String(result.status) : '';
    item.verifiedVia = result.via || '';
    item.checkedAt = new Date().toISOString();

    if (result.ok) {
      item.status = 'live';
      const via = result.via && result.via !== 'Direct' ? ` via ${result.via}` : '';
      setStatus(`${item.targetName} is live${via}.`, 'success');
    } else if (result.status === 404) {
      item.status = 'not_found';
      setStatus(`${item.targetName} was not found online.`, 'error');
    } else if (result.cannotVerify) {
      item.status = 'cannot_verify';
      setStatus(result.disabled
        ? 'External URL checks are disabled in Documentation privacy settings.'
        : 'Automatic check was blocked. Use Open to verify manually.', 'error');
    } else {
      item.status = 'error';
      setStatus(`${item.targetName} returned HTTP ${result.status || 'unknown'}.`, 'error');
    }

    saveHistory();
    renderItems();
  }

  async function checkAllLinks() {
    const items = getLinkItems();
    for (const item of items) {
      await checkItemLink(item.id);
    }
  }

  function renderReplaceMode() {
    const isReplace = state.mode === 'replace';
    elements.normalModeBtn.classList.toggle('is-active', !isReplace);
    elements.replaceModeBtn.classList.toggle('is-active', isReplace);
    elements.normalModeBtn.setAttribute('aria-selected', String(!isReplace));
    elements.replaceModeBtn.setAttribute('aria-selected', String(isReplace));
    elements.replaceFields.hidden = !isReplace;
    elements.prefixInput.disabled = isReplace;
    elements.fileInput.multiple = !isReplace;
    elements.dropTitle.textContent = isReplace ? 'Drop replacement PDF here' : 'Drop PDF here';
    elements.dropHint.textContent = isReplace
      ? 'or click to choose one replacement PDF'
      : 'or click to choose one or more PDFs';
    elements.dropZone.setAttribute(
      'aria-label',
      isReplace ? 'Drop one replacement PDF or choose one file' : 'Drop PDF files or choose files'
    );

    if (!isReplace) {
      elements.replaceSummary.textContent = 'Paste an existing PDF link to reuse its folder and file name.';
      elements.replaceSummary.className = 'tnc-replace-summary';
      state.replaceInfo = null;
      state.baseUrl = DEFAULT_PUBLIC_BASE_URL;
    }
  }

  function applyReplaceLink() {
    if (state.mode !== 'replace') return;
    const info = parseReplaceLink(elements.replaceLinkInput.value);
    state.replaceInfo = info;

    if (!elements.replaceLinkInput.value.trim()) {
      elements.replaceSummary.textContent = 'Paste an existing PDF link to reuse its folder and file name.';
      elements.replaceSummary.className = 'tnc-replace-summary';
      updateTargetPath();
      return;
    }

    if (!info) {
      elements.replaceSummary.textContent = 'Invalid PDF link. Expected /emailblast/MKT/YYYY/tnc/file.pdf.';
      elements.replaceSummary.className = 'tnc-replace-summary is-error';
      updateTargetPath();
      return;
    }

    state.baseUrl = info.baseUrl;
    elements.marketInput.value = info.market;
    elements.yearInput.value = info.year;
    elements.replaceSummary.textContent = `Replace mode: ${info.market} / ${info.year} / tnc / ${info.fileName}`;
    elements.replaceSummary.className = 'tnc-replace-summary is-ready';
    updateTargetPath();
  }

  function setUploadMode(mode) {
    state.mode = mode === 'replace' ? 'replace' : 'normal';
    if (state.mode === 'replace' && getFileBackedItems().length) {
      state.items = state.items.filter((item) => !item.file);
      elements.fileInput.value = '';
      saveHistory();
      setStatus('Replace mode is one PDF at a time. Active dropped files were cleared; saved history remains.');
    }
    renderReplaceMode();
    if (state.mode === 'replace') {
      applyReplaceLink();
    } else {
      updateTargetPath();
    }
  }

  function updateTargetPath() {
    elements.targetPath.textContent = getTargetPath();
    refreshItemTargets();
    renderItems();
  }

  function updateSupportBadge() {
    if (supportsDirectoryWrite()) {
      elements.supportBadge.textContent = 'Folder write supported';
      elements.supportBadge.className = 'tnc-support-badge is-ready';
      return;
    }
    elements.supportBadge.textContent = 'Download fallback only';
    elements.supportBadge.className = 'tnc-support-badge is-limited';
    elements.chooseFolderBtn.disabled = true;
    elements.saveBtn.title = 'This browser cannot write directly to a folder. Use Download ready PDFs.';
  }

  function bindEvents() {
    elements.yearInput.value = getTodayParts().year;
    elements.prefixInput.placeholder = `Example: ${getTodayPrefix()}`;
    ['input', 'change'].forEach((eventName) => {
      elements.yearInput.addEventListener(eventName, updateTargetPath);
      elements.marketInput.addEventListener(eventName, updateTargetPath);
      elements.prefixInput.addEventListener(eventName, updateTargetPath);
    });

    elements.chooseFolderBtn.addEventListener('click', chooseFolder);
    elements.clearBtn.addEventListener('click', clearQueue);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.saveBtn.addEventListener('click', saveFiles);
    elements.downloadBtn.addEventListener('click', downloadRenamedFiles);
    elements.copyAllLinksBtn.addEventListener('click', copyAllLinks);
    elements.checkAllBtn.addEventListener('click', checkAllLinks);
    elements.normalModeBtn.addEventListener('click', () => setUploadMode('normal'));
    elements.replaceModeBtn.addEventListener('click', () => setUploadMode('replace'));
    elements.replaceLinkInput.addEventListener('input', applyReplaceLink);

    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        elements.fileInput.click();
      }
    });

    elements.fileInput.addEventListener('change', (event) => addFiles(event.target.files));

    ['dragenter', 'dragover'].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropZone.classList.add('is-dragging');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropZone.classList.remove('is-dragging');
      });
    });

    elements.dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));

    elements.fileList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const id = button.dataset.id;
      const action = button.dataset.action;
      if (action === 'copy') copyText(findItem(id)?.url || '');
      if (action === 'open') openItemLink(id);
      if (action === 'check') checkItemLink(id);
      if (action === 'remove') removeItem(id);
    });
  }

  function init() {
    initElements();
    loadHistory();
    updateSupportBadge();
    bindEvents();
    renderReplaceMode();
    elements.targetPath.textContent = getTargetPath();
    renderItems();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
