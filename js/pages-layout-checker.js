document.addEventListener('DOMContentLoaded', () => {
  if (new URLSearchParams(window.location.search).get('embed') === '1') {
    document.body.classList.add('is-embedded');
  }
});

/* ===================================
   ORIGINAL CODE
   =================================== */

// Cloudflare Worker URL for fetching remote HTML.
// Replace with your deployed Worker URL.
const HTML_FETCHER_WORKER_URL = 'https://html-fetcher.budi-indra94.workers.dev';

// ---- Extracted scripts from inline <script> blocks ----
// Initialize CodeMirror editor for htmlInput textarea
  const textarea = document.getElementById('htmlInput');
  const editor = CodeMirror.fromTextArea(textarea, {
    mode: 'htmlmixed',
    theme: 'material',
    lineNumbers: true,
    lineWrapping: true,
    autoCloseTags: true,
    matchBrackets: true,
  });

const originalUrlInput = document.getElementById('originalUrlInput');
  const htmlFileInput = document.getElementById('htmlFileInput');
  const layoutStatus = document.getElementById('layoutStatus');
  const codeTabBtn = document.getElementById('codeTabBtn');
  const previewTabBtn = document.getElementById('previewTabBtn');
  const codePanel = document.getElementById('codePanel');
  const previewPanel = document.getElementById('previewPanel');
  const layoutPreviewFrame = document.getElementById('layoutPreviewFrame');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadScreenshotBtn = document.getElementById('downloadScreenshotBtn');
  const openPreviewBtn = document.getElementById('openPreviewBtn');
  const manualPasteBtn = document.getElementById('manualPasteBtn');
  const textModeBtn = document.getElementById('textModeBtn');
  const highlightKrhredToggle = document.getElementById('highlightKrhredToggle');
  const progressContainer = document.getElementById('progressContainer');
  const progressText = document.getElementById('progressText');
  const stopBtn = document.getElementById('stopBtn');
  const krhredUnitsContainer = document.getElementById('krhredUnitsContainer');
  const resetKrhredBtn = document.getElementById('resetKrhredBtn');
  
  // AbortController for stopping operations
  let abortController = null;
  let currentOperation = null;
  let krhredPreviewTimer = null;
  let latestPreviewHtml = '';
  let latestPreviewSourceUrl = '';
  let html2canvasLoadPromise = null;
  const screenshotImageCache = new Map();

  function setLayoutStatus(state, text) {
    if (!layoutStatus) return;
    layoutStatus.dataset.state = state;
    layoutStatus.textContent = text;
  }

  function getPreviewBaseHref(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.origin + parsed.pathname.replace(/\/[^\/]*$/, '/');
    } catch {
      return '';
    }
  }

  function preparePreviewHtml(html, sourceUrl = '') {
    if (!html) return '';
    const baseHref = getPreviewBaseHref(sourceUrl);
    const baseTag = baseHref ? `<base href="${baseHref}">` : '';
    const highlightStyle = `<style>
      .edm-krhred-highlight {
        padding: 1px 3px !important;
        color: inherit !important;
        background: #fff3a3 !important;
        outline: 1px solid #f18c8e !important;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
    </style>`;
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}${highlightStyle}`);
    }
    return `${baseTag}${highlightStyle}${html}`;
  }

  function renderPreview(html, statusText = 'Preview ready', sourceUrl = '') {
    if (!layoutPreviewFrame) return;
    latestPreviewHtml = html || '';
    latestPreviewSourceUrl = sourceUrl || '';
    layoutPreviewFrame.srcdoc = preparePreviewHtml(latestPreviewHtml, latestPreviewSourceUrl);
    updatePreviewActions();
    setLayoutStatus(html ? 'ready' : 'empty', html ? statusText : 'No layout loaded');
  }

  function updatePreviewActions() {
    const hasPreview = Boolean(latestPreviewHtml && latestPreviewHtml.trim());
    if (openPreviewBtn) openPreviewBtn.disabled = !hasPreview;
    if (downloadScreenshotBtn) downloadScreenshotBtn.disabled = !hasPreview;
  }

  function getPreviewDocument() {
    return layoutPreviewFrame?.contentDocument || layoutPreviewFrame?.contentWindow?.document || null;
  }

  function getPreviewFileBaseName() {
    const fallback = 'layout-preview';
    const source = (originalUrlInput?.value || latestPreviewSourceUrl || '').trim();
    if (!source) return fallback;
    try {
      const name = new URL(source).pathname.split('/').pop() || fallback;
      return name.replace(/\.(html?|php|aspx?)$/i, '') || fallback;
    } catch {
      return fallback;
    }
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openPreviewInNewTab() {
    if (!latestPreviewHtml.trim()) {
      setLayoutStatus('error', 'Apply or load a layout before opening preview');
      return;
    }
    const blob = new Blob([preparePreviewHtml(latestPreviewHtml, latestPreviewSourceUrl)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasLoadPromise) return html2canvasLoadPromise;
    html2canvasLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.async = true;
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => reject(new Error('Unable to load screenshot library'));
      document.head.appendChild(script);
    });
    return html2canvasLoadPromise;
  }

  function waitForDocumentImages(documentRef, timeoutMs = 5000) {
    const images = Array.from(documentRef?.images || []);
    if (!images.length) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = false;
      let remaining = images.filter(image => !image.complete).length;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) finish();
      };

      if (!remaining) {
        finish();
        return;
      }

      images.forEach((image) => {
        if (image.complete) return;
        image.addEventListener('load', done, { once: true });
        image.addEventListener('error', done, { once: true });
      });
      window.setTimeout(finish, timeoutMs);
    });
  }

  function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Unable to read image'));
      reader.readAsDataURL(blob);
    });
  }

  function resolvePreviewAssetUrl(url, documentRef) {
    if (!url || /^(data:|blob:|about:|#)/i.test(url)) return '';
    try {
      return new URL(url, latestPreviewSourceUrl || documentRef?.baseURI || window.location.href).href;
    } catch {
      return '';
    }
  }

  function getImageFetchAttempts(url) {
    const attempts = [{ url, via: 'direct' }];
    if (window.EDM_PRIVACY?.get?.('proxyFallbacks') === false) return attempts;

    const cleanUrl = url.replace(/^https?:\/\//, '');
    return [
      ...attempts,
      { url: `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`, via: 'Weserv Image' },
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, via: 'AllOrigins Raw' },
      { url: `https://corsproxy.io/?${encodeURIComponent(url)}`, via: 'CorsProxy' },
      { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, via: 'CodeTabs' }
    ];
  }

  async function fetchImageAsDataUrl(url) {
    if (!url) return '';
    if (screenshotImageCache.has(url)) return screenshotImageCache.get(url);
    if (window.EDM_PRIVACY?.get?.('externalChecks') === false) return '';

    const controllers = [];
    const fetchAttempt = async (attempt) => {
      const controller = new AbortController();
      controllers.push(controller);
      const timeoutId = window.setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(attempt.url, {
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit',
          headers: { Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' }
        });
        if (!response.ok) throw new Error(`${attempt.via} HTTP ${response.status}`);
        const blob = await response.blob();
        if (!blob || !blob.size) throw new Error(`${attempt.via} returned an empty image`);
        return await readBlobAsDataUrl(blob);
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    try {
      const dataUrl = await Promise.any(getImageFetchAttempts(url).map(fetchAttempt));
      screenshotImageCache.set(url, dataUrl);
      return dataUrl;
    } catch (error) {
      console.warn('Unable to prepare image for screenshot:', url, error);
      screenshotImageCache.set(url, '');
      return '';
    } finally {
      controllers.forEach(controller => controller.abort());
    }
  }

  async function runLimited(items, limit, worker) {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        await worker(item);
      }
    });
    await Promise.all(workers);
  }

  function collectScreenshotImageTasks(documentRef) {
    const tasks = [];
    const addTask = (element, attribute, rawUrl) => {
      const url = resolvePreviewAssetUrl(rawUrl, documentRef);
      if (!url) return;
      tasks.push({ element, attribute, rawUrl, url });
    };

    Array.from(documentRef.images || []).forEach((image) => {
      addTask(image, 'src', image.getAttribute('src') || image.currentSrc || image.src);
    });

    Array.from(documentRef.querySelectorAll('[background]')).forEach((element) => {
      addTask(element, 'background', element.getAttribute('background'));
    });

    Array.from(documentRef.querySelectorAll('[style*="url("]')).forEach((element) => {
      const styleValue = element.getAttribute('style') || '';
      const matches = styleValue.matchAll(/url\((['"]?)(.*?)\1\)/gi);
      for (const match of matches) {
        addTask(element, 'style', match[2]);
      }
    });

    return tasks;
  }

  async function preparePreviewImagesForScreenshot(documentRef) {
    const tasks = collectScreenshotImageTasks(documentRef);
    if (!tasks.length) return { total: 0, converted: 0 };

    let completed = 0;
    let converted = 0;
    const styleDataUrls = new Map();

    await runLimited(tasks, 6, async (task) => {
      const dataUrl = await fetchImageAsDataUrl(task.url);
      completed += 1;
      setLayoutStatus('loading', `Preparing screenshot images ${completed}/${tasks.length}`);
      if (!dataUrl) return;
      converted += 1;

      if (task.attribute === 'src') {
        task.element.removeAttribute('srcset');
        task.element.removeAttribute('sizes');
        task.element.crossOrigin = 'anonymous';
        task.element.src = dataUrl;
        return;
      }

      if (task.attribute === 'background') {
        task.element.setAttribute('background', dataUrl);
        return;
      }

      if (!styleDataUrls.has(task.element)) styleDataUrls.set(task.element, []);
      styleDataUrls.get(task.element).push([task.rawUrl, dataUrl]);
    });

    styleDataUrls.forEach((replacements, element) => {
      let styleValue = element.getAttribute('style') || '';
      replacements.forEach(([rawUrl, dataUrl]) => {
        const escaped = rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        styleValue = styleValue.replace(new RegExp(escaped, 'g'), dataUrl);
      });
      element.setAttribute('style', styleValue);
    });

    await waitForDocumentImages(documentRef, 8000);
    return { total: tasks.length, converted };
  }

  async function downloadPreviewScreenshot() {
    if (!latestPreviewHtml.trim()) {
      setLayoutStatus('error', 'Apply or load a layout before downloading screenshot');
      return;
    }

    try {
      if (downloadScreenshotBtn) {
        downloadScreenshotBtn.disabled = true;
        downloadScreenshotBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Capturing';
      }
      setLayoutStatus('loading', 'Capturing visible preview');
      setLayoutView('preview');
      const previewDocument = getPreviewDocument();
      await waitForDocumentImages(previewDocument);
      if (!previewDocument?.documentElement) throw new Error('Preview is not ready yet');
      const imageResult = await preparePreviewImagesForScreenshot(previewDocument);
      const target = previewDocument.body || previewDocument.documentElement;
      if (!target) throw new Error('Preview is not ready yet');
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 12000,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          setLayoutStatus('error', 'Screenshot could not be created');
          return;
        }
        downloadBlob(blob, `${getPreviewFileBaseName()}-screenshot.png`);
        const suffix = imageResult.total
          ? ` (${imageResult.converted}/${imageResult.total} images embedded)`
          : '';
        setLayoutStatus('ready', `Screenshot downloaded${suffix}`);
      }, 'image/png');
    } catch (error) {
      console.error('Unable to capture layout screenshot.', error);
      setLayoutStatus('error', 'Screenshot failed. Try again after the preview finishes loading.');
    } finally {
      if (downloadScreenshotBtn) {
        downloadScreenshotBtn.innerHTML = '<i class="fa-solid fa-download"></i> Screenshot';
        updatePreviewActions();
      }
    }
  }

  function setLayoutView(view) {
    const showPreview = view === 'preview';
    if (codeTabBtn) {
      codeTabBtn.classList.toggle('is-active', !showPreview);
      codeTabBtn.setAttribute('aria-selected', String(!showPreview));
    }
    if (previewTabBtn) {
      previewTabBtn.classList.toggle('is-active', showPreview);
      previewTabBtn.setAttribute('aria-selected', String(showPreview));
    }
    if (codePanel) {
      codePanel.hidden = showPreview;
      codePanel.classList.toggle('is-active', !showPreview);
    }
    if (previewPanel) {
      previewPanel.hidden = !showPreview;
      previewPanel.classList.toggle('is-active', showPreview);
    }
    if (!showPreview) {
      setTimeout(() => editor.refresh(), 0);
    }
  }

  if (codeTabBtn) codeTabBtn.addEventListener('click', () => setLayoutView('code'));
  if (previewTabBtn) {
    previewTabBtn.addEventListener('click', () => {
      const currentHtml = editor.getValue();
      if (currentHtml.trim()) {
        const rendered = renderLayoutWithKrhredValues();
        if (!rendered) {
          renderPreview(currentHtml, 'Preview ready', originalUrlInput.value.trim());
        }
      }
      setLayoutView('preview');
    });
  }
  if (openPreviewBtn) openPreviewBtn.addEventListener('click', openPreviewInNewTab);
  if (downloadScreenshotBtn) downloadScreenshotBtn.addEventListener('click', downloadPreviewScreenshot);

  // Progress indicator functions
  function showProgress(text, operation) {
    progressText.textContent = text;
    progressContainer.classList.remove('hidden');
    currentOperation = operation;
    abortController = new AbortController();
    setLayoutStatus('loading', text);
  }

  function hideProgress() {
    progressContainer.classList.add('hidden');
    currentOperation = null;
    abortController = null;
    const hasContent = editor.getValue().trim().length > 0;
    setLayoutStatus(hasContent ? 'ready' : 'empty', hasContent ? 'Layout ready' : 'No layout loaded');
  }

  // Stop button functionality
  stopBtn.addEventListener('click', () => {
    if (abortController) {
      abortController.abort();
      console.log('Operation stopped');
      hideProgress();
    }
  });

  // Helper function to validate URL
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getKrhredInputs() {
    return krhredUnitsContainer.querySelectorAll('input[id^="krhred_unit_"]');
  }

  function bindReplaceOnFocus(field) {
    if (!field || field.dataset.replaceOnFocus === 'true') return;
    field.dataset.replaceOnFocus = 'true';
    let preserveInitialSelection = false;
    field.addEventListener('mousedown', () => {
      preserveInitialSelection = document.activeElement !== field;
    });
    field.addEventListener('focus', () => {
      if (field.value) field.select();
    });
    field.addEventListener('mouseup', (event) => {
      if (preserveInitialSelection
        && document.activeElement === field
        && field.value
        && field.selectionStart === 0
        && field.selectionEnd === field.value.length) {
        event.preventDefault();
      }
      preserveInitialSelection = false;
    });
  }

  function updateKrhredInputFeedback(input) {
    const length = input.value.trim().length;
    if (length > 60) {
      input.style.backgroundColor = 'red';
    } else if (length > 0) {
      input.style.backgroundColor = 'lightgreen';
    } else {
      input.style.backgroundColor = '';
    }
  }

  function bindKrhredInput(input) {
    if (!input || input.dataset.bound === 'true') return;
    input.dataset.bound = 'true';
    bindReplaceOnFocus(input);
    input.addEventListener('input', () => {
      updateKrhredInputFeedback(input);
      if (!previewPanel || previewPanel.hidden || !editor.getValue().trim()) return;
      clearTimeout(krhredPreviewTimer);
      krhredPreviewTimer = setTimeout(() => {
        renderLayoutWithKrhredValues();
      }, 180);
    });
  }

  function ensureKrhredInput(unitNumber) {
    const cleanNumber = String(unitNumber).replace(/\D/g, '');
    if (!cleanNumber) return null;

    const existing = document.getElementById(`krhred_unit_${cleanNumber}`);
    if (existing) {
      bindKrhredInput(existing);
      return existing;
    }

    const inputGrid = krhredUnitsContainer.querySelector('#inputGrid');
    if (!inputGrid) return null;

    const div = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `krhred_unit_${cleanNumber}`;
    input.name = `krhred_unit_${cleanNumber}`;
    input.placeholder = cleanNumber;
    input.className = 'lc-input-field';
    div.appendChild(input);

    const existingWrappers = [...inputGrid.querySelectorAll('div')];
    const newNumber = Number(cleanNumber);
    const insertBefore = existingWrappers.find(wrapper => {
      const wrapperInput = wrapper.querySelector('input[id^="krhred_unit_"]');
      if (!wrapperInput) return false;
      return Number(wrapperInput.id.replace('krhred_unit_', '')) > newNumber;
    });

    if (insertBefore) {
      inputGrid.insertBefore(div, insertBefore);
    } else {
      inputGrid.appendChild(div);
    }

    bindKrhredInput(input);
    return input;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function collectKrhredValues() {
    const values = {};
    let hasValue = false;

    getKrhredInputs().forEach(input => {
      const unit = `KRHRED_Unit_${input.id.replace('krhred_unit_', '')}`;
      const value = input.value ? input.value.trim() : '';
      values[unit] = value;
      if (value) hasValue = true;
    });

    return { values, hasValue };
  }

  function replaceKrhredPlaceholders(html, values, shouldHighlight) {
    const source = String(html || '');
    let insideTag = false;
    let quote = '';
    let output = '';

    for (let index = 0; index < source.length;) {
      const placeholder = source.slice(index).match(
        /^<%\s*\[\s*KRHRED(?:_Unit)?_(\d+)\s*\]\s*\|?\s*%>/i
      );

      if (placeholder) {
        const unit = `KRHRED_Unit_${placeholder[1]}`;
        const value = Object.prototype.hasOwnProperty.call(values, unit) ? values[unit] : '';
        output += String(value).trim() === ''
          ? ''
          : shouldHighlight && !insideTag
            ? `<mark class="edm-krhred-highlight" title="${unit}">${value}</mark>`
            : value;
        index += placeholder[0].length;
        continue;
      }

      const character = source[index];
      output += character;
      if (insideTag && quote) {
        if (character === quote) quote = '';
      } else if (insideTag && (character === '"' || character === "'")) {
        quote = character;
      } else if (!insideTag && character === '<' && /[a-z!/]/i.test(source[index + 1] || '')) {
        insideTag = true;
      } else if (insideTag && character === '>') {
        insideTag = false;
      }
      index += 1;
    }

    return output;
  }

  function renderLayoutWithKrhredValues() {
    const content = editor.getValue();
    console.log('Editor content length:', content.length);
    console.log('Editor content preview:', content.substring(0, 200));
    
    const { values, hasValue } = collectKrhredValues();
    const shouldHighlight = Boolean(highlightKrhredToggle && highlightKrhredToggle.checked);
    const processedValues = replaceKrhredPlaceholders(
      content,
      values,
      shouldHighlight
    );
    
    console.log('Has valid KRHRED:', hasValue);
    
    if (!hasValue) {
      console.log('No KRHRED values to apply. Please fill in KRHRED values first.');
      return false;
    }
    
    // Fix image URLs to absolute URLs if original URL is provided
    const originalUrlValue = document.getElementById('originalUrlInput').value.trim();
    console.log('Original URL:', originalUrlValue);
    
    // Convert relative image URLs to absolute URLs
    let processedContent = processedValues;
    if (originalUrlValue) {
      try {
        const baseUrl = new URL(originalUrlValue);
        const baseUrlString = baseUrl.origin + baseUrl.pathname.replace(/\/[^\/]*$/, '/');
        
        // Convert relative URLs to absolute
        processedContent = processedValues.replace(/src="(?!https?:\/\/)([^"]+)"/g, (match, p1) => {
          const relativePath = p1.replace(/"/g, '');
          // Don't convert if already absolute, data URL, or protocol-relative
          if (relativePath.startsWith('data:') || relativePath.startsWith('//')) {
            return match;
          }
          return `src="${baseUrlString}${relativePath}"`;
        });
        console.log('Processed content with absolute URLs');
      } catch (e) {
        console.error('Error processing URLs:', e);
        processedContent = processedValues; // Fallback to original content
      }
    }
    
    renderPreview(processedContent, shouldHighlight ? 'Preview ready - KRHRED highlighted' : 'Preview ready', originalUrlValue);
    setLayoutView('preview');

    console.log('Layout checked successfully! Preview updated.');
    return true;
  }

  if (highlightKrhredToggle) {
    highlightKrhredToggle.addEventListener('change', () => {
      if (!previewPanel || previewPanel.hidden || !editor.getValue().trim()) return;
      renderLayoutWithKrhredValues();
    });
  }

  if (htmlFileInput) {
    htmlFileInput.addEventListener('change', async () => {
      const file = htmlFileInput.files && htmlFileInput.files[0];
      if (!file) return;

      try {
        setLayoutStatus('loading', 'Loading HTML file');
        const content = await file.text();
        editor.setValue(content);
        generateKrhredColumns(content);
        renderPreview(content, `${file.name} loaded`);
        originalUrlInput.value = '';
        setLayoutStatus('ready', `${file.name} loaded`);
      } catch (error) {
        console.error('Failed to read HTML file:', error);
        setLayoutStatus('error', 'Unable to read HTML');
      } finally {
        htmlFileInput.value = '';
      }
    });
  }

  // Input color feedback for existing inputs
  const existingInputs = getKrhredInputs();
  existingInputs.forEach(input => {
    bindKrhredInput(input);
  });

  // Show/hide download button based on URL input
  originalUrlInput.addEventListener('input', () => {
    if (originalUrlInput.value.trim()) {
      downloadBtn.style.display = 'flex';
      manualPasteBtn.style.display = 'flex';
      textModeBtn.style.display = 'flex';
      // Auto-trigger download after a short delay if URL looks valid
      const url = originalUrlInput.value.trim();
      if (isValidUrl(url)) {
        setTimeout(() => {
          if (originalUrlInput.value.trim() === url) {
            downloadBtn.click();
          }
        }, 0);
      }
    } else {
      downloadBtn.style.display = 'none';
      manualPasteBtn.style.display = 'none';
      textModeBtn.style.display = 'none';
    }
  });

  // Manual paste button functionality
  manualPasteBtn.addEventListener('click', () => {
    const url = originalUrlInput.value.trim();
    if (!url) {
      console.log('Please enter a URL first.');
      return;
    }
    
    // Show progress
    showProgress('Opening page in new tab...', 'open-tab');
    
    // Open URL in new tab after a short delay
    setTimeout(() => {
      window.open(url, '_blank');
      localStorage.setItem('layoutCheckerURL', url);
      console.log('Page opened in new tab. Please copy source code (Ctrl+U or Right-click → View Page Source) and paste it here.');
      setTimeout(() => {
        hideProgress();
      }, 1000);
    }, 500);
  });

  // Text mode button functionality
  textModeBtn.addEventListener('click', async () => {
    const url = originalUrlInput.value.trim();
    if (!url) {
      console.log('Please enter a URL first.');
      return;
    }
    
    // Show progress
    showProgress('Fetching as plain text...', 'fetch-text');
    
    try {
      if (window.EDM_PRIVACY?.get?.('externalChecks') === false) {
        throw new Error('External URL checks are disabled in Documentation privacy settings.');
      }

      const response = await fetch(url, {
        headers: {
          'Accept': 'text/plain,text/html,*/*;q=0.8'
        },
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      
      const content = await response.text();
      
      if (content && content.includes('<html')) {
        editor.setValue(content);
        console.log('Content loaded successfully!');
        generateKrhredColumns(content);
      } else {
        console.log('Unable to fetch content as plain text. Please use Manual Paste option.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch cancelled');
      } else {
        console.log('Failed to fetch content. Please use Manual Paste option.');
      }
    } finally {
      hideProgress();
    }
  });

  // Helper function to validate URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Function to detect krhred_unit_xx in HTML and generate columns
  function generateKrhredColumns(htmlContent, showNotification = true) {
    // DEBUG: Log function start
    console.log('=== generateKrhredColumns START ===');
    console.log('HTML content length:', htmlContent.length);
    console.log('HTML content preview:', htmlContent.substring(0, 200) + '...');
    
    // Find all krhred_unit_xx patterns in HTML
    const regex = /<%\[KRHRED_Unit_(\d+)\]\|%>/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(htmlContent)) !== null) {
      const unitNumber = parseInt(match[1], 10);
      if (!matches.includes(unitNumber)) {
        matches.push(unitNumber);
      }
    }
    
    // DEBUG: Log regex matches
    console.log('Regex matches found:', matches);
    console.log('Matches sorted:', matches.sort((a, b) => a - b));
    
    // Sort matches
    matches.sort((a, b) => a - b);
    
    // Get input grid container
    const inputGrid = krhredUnitsContainer.querySelector('#inputGrid');
    if (!inputGrid) {
      console.log('ERROR: inputGrid not found!');
      return;
    }
    
    // DEBUG: Log grid container
    console.log('Input grid container found:', inputGrid);
    
    // Get existing krhred inputs (don't clear them)
    const currentInputs = krhredUnitsContainer.querySelectorAll('input[id^="krhred_unit_"]');
    const existingNumbers = Array.from(currentInputs).map(input => 
      parseInt(input.id.replace('krhred_unit_', ''), 10)
    );
    
    // DEBUG: Log existing inputs
    console.log('Existing inputs found:', existingNumbers);
    console.log('Existing input elements:', currentInputs.length);
    
    // Remove units that are not in the HTML (including default units if not in HTML)
    currentInputs.forEach(input => {
      const unitNumber = parseInt(input.id.replace('krhred_unit_', ''), 10);
      if (!matches.includes(unitNumber)) {
        console.log(`Removing unit ${unitNumber} - not in HTML`);
        input.parentElement.remove();
      }
    });
    
    // Add new units that are in HTML but don't exist
    matches.forEach((unitNumber, index) => {
      if (!existingNumbers.includes(unitNumber)) {
        // DEBUG: Log each unit creation
        console.log(`Creating unit ${unitNumber} at index ${index}`);
        
        // Calculate position for 4x2 grid (8 units per row)
        const rowPosition = Math.floor(index / 8); // Which row (0-indexed)
        const columnPosition = index % 8; // Which position in row (0-7)
        const gridColumn = Math.floor(columnPosition / 2); // Which column (0-3)
        const gridRow = Math.floor(columnPosition / 2); // Which row in column (0-1)
        
        // DEBUG: Log positioning calculation
        console.log(`Unit ${unitNumber}: rowPosition=${rowPosition}, columnPosition=${columnPosition}, gridColumn=${gridColumn}, gridRow=${gridRow}`);
        
        // Create new input
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'flex-start';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `krhred_unit_${unitNumber}`;
        input.name = `krhred_unit_${unitNumber}`;
        input.placeholder = unitNumber.toString();
        input.className = 'lc-input-field';
        div.appendChild(input);
        inputGrid.appendChild(div);
        
        // Add input color feedback
        input.addEventListener('input', () => {
          const length = input.value.trim().length;
          if (length > 60) {
            input.style.backgroundColor = 'red';
          } else if (length > 0) {
            input.style.backgroundColor = 'lightgreen';
          } else {
            input.style.backgroundColor = '';
          }
        });
        
        // Add auto-save event listener
        input.addEventListener('input', () => {});
      } else {
        // DEBUG: Log skipped units
        console.log(`Skipping unit ${unitNumber} - already exists`);
      }
    });
    
    // DEBUG: Log final state
    const finalInputs = krhredUnitsContainer.querySelectorAll('input[id^="krhred_unit_"]');
    console.log('Final input count:', finalInputs.length);
    console.log('=== generateKrhredColumns END ===');
    
    // Show combined toast notification for HTML fetch and KRHRED units found
    if (showNotification) {
      if (matches.length > 0) {
        console.log(`Generated ${matches.length} krhred_unit columns:`, matches);
        console.log(`HTML fetched! Found ${matches.length} KRHRED units: ${matches.join(', ')}`);
      } else {
        console.log('HTML fetched! No KRHRED units found. Showing default layout.');
      }
    }
  }

  // Download and auto-paste HTML source code
  downloadBtn.addEventListener('click', async () => {
    const url = originalUrlInput.value.trim();
    if (!url) {
      console.log('Please enter a URL first.');
      return;
    }

    try {
      // Show progress
      showProgress('Fetching HTML content...', 'download');
      
      // Disable button during fetch
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px; animation: spin 1s linear infinite;"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>Fetching...';

      const result = await fetchRemoteHtmlFast(url);
      editor.setValue(result.html);
      renderPreview(result.html, `Layout loaded via ${result.via}`, url);
      setLayoutView('preview');
      generateKrhredColumns(result.html);

    } catch (error) {
      console.error('Error fetching HTML:', error);
      console.log('Failed to fetch HTML content. Please try again or use Manual Paste option.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Load URL';
      hideProgress();
    }
  });

  async function fetchRemoteHtmlFast(url) {
    if (window.EDM_PRIVACY?.get?.('externalChecks') === false) {
      throw new Error('External URL checks are disabled in Documentation privacy settings.');
    }

    const targetUrl = new URL(url);
    if (targetUrl.host.toLowerCase() !== 'mail.hsbc.com.hk') {
      throw new Error('Only mail.hsbc.com.hk URLs are allowed.');
    }

    const workerUrl = `${HTML_FETCHER_WORKER_URL}?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const abortFromGlobal = () => controller.abort();
    abortController?.signal?.addEventListener('abort', abortFromGlobal, { once: true });

    try {
      const response = await fetch(workerUrl, {
        signal: controller.signal,
        headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
      });
      if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(`Worker HTTP ${response.status}: ${message}`);
      }
      const html = await response.text();
      if (!html || !/<html|<!doctype|<table|<body/i.test(html)) {
        throw new Error('Worker response is not valid HTML');
      }
      return { html, via: 'Cloudflare Worker' };
    } finally {
      clearTimeout(timeoutId);
      abortController?.signal?.removeEventListener('abort', abortFromGlobal);
    }
  }

  // Apply krhred values functionality
  const applyKrhredBtn = document.getElementById('applyKrhredBtn');
  const krhredInput = document.getElementById('krhredInput');
  const subjectInput = document.getElementById('subjectInput');
  const subjectOutput = document.getElementById('subjectOutput');

  bindReplaceOnFocus(originalUrlInput);
  bindReplaceOnFocus(krhredInput);
  bindReplaceOnFocus(subjectInput);

  if (resetKrhredBtn) {
    resetKrhredBtn.addEventListener('click', () => {
      performClearAll();
      const sourceHtml = editor.getValue();
      if (sourceHtml.trim()) {
        renderPreview(sourceHtml, 'Preview reset', originalUrlInput.value.trim());
        setLayoutView('preview');
      } else {
        renderPreview('', 'No layout loaded');
      }
      console.log('KRHRED preview reset to source HTML.');
    });
  }

  applyKrhredBtn.addEventListener('click', () => {
    console.log('Apply KRHRED button clicked');
    const krhredText = krhredInput.value.trim();
    console.log('KRHRED text length:', krhredText.length);
    console.log('KRHRED text preview:', krhredText.substring(0, 200));
    
    if (!krhredText) {
      console.log('No bulk KRHRED text. Applying manual KRHRED input fields.');
      if (editor.getValue().trim()) {
        renderLayoutWithKrhredValues();
      }
      return;
    }

    // Parse krhred values in new format: attr:KRHRED_Unit_XX : <next line value>
    const lines = krhredText.split('\n');
    const krhredValues = {};
    console.log('Total lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/^attr:\s*(KRHRED_Unit_\d+)\s*:?\s*$/i);
      if (match) {
        const key = match[1];
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        const nextIsAttr = /^attr:\s*KRHRED_Unit_\d+\s*:?\s*$/i.test(nextLine);
        const value = nextIsAttr ? '' : nextLine;
        krhredValues[key] = value;
        console.log(`Parsed: ${key} = ${value}`);
        if (!nextIsAttr) {
          i++; // skip value line
        }
      }
    }
    
    console.log('KRHRED values found:', krhredValues);

    // Apply values to corresponding input fields
    Object.keys(krhredValues).forEach(key => {
      const unitNumber = key.replace('KRHRED_Unit_', '');
      const inputField = ensureKrhredInput(unitNumber);
      console.log(`Looking for input: krhred_unit_${unitNumber}`);
      if (inputField) {
        inputField.value = krhredValues[key];
        inputField.dispatchEvent(new Event('input')); // color update
        console.log(`Applied value to unit ${unitNumber}`);
      } else {
        console.log(`Input field not found for unit ${unitNumber}`);
      }
    });
    
    console.log('KRHRED values applied successfully!');

    // Apply KRHRED replacements to subject field if present
    if (subjectInput && subjectOutput) {
      const { values } = collectKrhredValues();
      const processedSubject = replaceKrhredPlaceholders(subjectInput.value, values, false);
      subjectOutput.textContent = processedSubject;
    }

    if (Object.keys(krhredValues).length && editor.getValue().trim()) {
      renderLayoutWithKrhredValues();
    }
  });

  function performClearAll() {
    // Clear all KRHRED unit values only
    const inputs = krhredUnitsContainer.querySelectorAll('input[id^="krhred_unit_"]');
    inputs.forEach(input => {
      input.value = '';
      input.style.backgroundColor = '';
    });

    // Clear KRHRED textarea only
    document.getElementById('krhredInput').value = '';

    // Clear subject fields
    if (subjectInput) subjectInput.value = '';
    if (subjectOutput) subjectOutput.textContent = '';
  }

  // Handle F5 refresh - clear data without prompt
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
      e.preventDefault();
      performClearAll();
      console.log('Data cleared. Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  });

  // Check for stored source when page loads
  window.addEventListener('load', () => {
    const storedSource = localStorage.getItem('layoutCheckerSource');
    const storedURL = localStorage.getItem('layoutCheckerURL');

    if (storedSource) {
      editor.setValue(storedSource);
      // generateKrhredColumns will be called by editor.on('change') event
      if (storedURL) {
        originalUrlInput.value = storedURL;
        downloadBtn.style.display = 'flex';
        manualPasteBtn.style.display = 'flex';
      }
      console.log('Source code automatically pasted from previous page!');
    }
    localStorage.removeItem('layoutCheckerSource');
    localStorage.removeItem('layoutCheckerURL');
  });

  // State persistence - DISABLED
  // function saveState() {
  //   const state = {
  //     htmlContent: editor.getValue(),
  //     originalUrl: document.getElementById('originalUrlInput').value,
  //     krhredValues: {}
  //   };
  //   const krhredInputs = document.querySelectorAll('input[id^="krhred_unit_"]');
  //   krhredInputs.forEach(input => {
  //     state.krhredValues[input.id] = input.value;
  //   });
  //   localStorage.setItem('layoutChecker_state', JSON.stringify(state));
  // }

  // function loadState() {
  //   const saved = localStorage.getItem('layoutChecker_state');
  //   if (saved) {
  //     try {
  //       const state = JSON.parse(saved);
  //       if (state.htmlContent) { 
  //         editor.setValue(state.htmlContent);
  //         // generateKrhredColumns will be called by editor.on('change') event
  //       }
  //       if (state.originalUrl) {
  //         document.getElementById('originalUrlInput').value = state.originalUrl;
  //         document.getElementById('downloadBtn').style.display = 'flex';
  //         document.getElementById('manualPasteBtn').style.display = 'flex';
  //       }
  //       if (state.krhredValues) {
  //         Object.keys(state.krhredValues).forEach(inputId => {
  //           const input = document.getElementById(inputId);
  //           if (input) {
  //             input.value = state.krhredValues[inputId];
  //             input.dispatchEvent(new Event('input'));
  //           }
  //         });
  //       }
  //     } catch (e) {
  //       console.error('Error loading state:', e);
  //     }
  //   }
  // }

  // Auto-save on input changes - DISABLED
  editor.on('change', () => {
    const content = editor.getValue();
    if (content.trim()) {
      generateKrhredColumns(content, false);
      setLayoutStatus('ready', 'Layout ready');
    } else {
      setLayoutStatus('empty', 'No layout loaded');
    }
    //  // DISABLED
  });
  // document.getElementById('originalUrlInput').addEventListener('input', saveState); // DISABLED
  // document.getElementById('krhredInput').addEventListener('input', saveState); // DISABLED


  // Auto-save for existing krhred inputs - DISABLED
  const existingKrhredInputs = document.querySelectorAll('input[id^="krhred_unit_"]');
  existingKrhredInputs.forEach(input => {
    // input.addEventListener('input', saveState); // DISABLED
  });


  // Load state when page loads - DISABLED
  // window.addEventListener('load', loadState); // DISABLED

  // Save state before leaving page - DISABLED
  // window.addEventListener('beforeunload', saveState); // DISABLED
