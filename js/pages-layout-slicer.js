(function () {
  const state = {
    file: null,
    image: null,
    imageUrl: '',
    sourceFileSize: 0,
    lines: [],
    draggingLine: null,
    slices: [],
    generated: null,
    templateDir: null,
    campaignParentDir: null,
    templateDirectories: [],
    templateFileCount: 0,
    fullWorkflow: false,
    zoom: 1,
    zoomMode: 'fit'
  };

  const els = {
    campaignAccordion: document.querySelector('[data-slicer-section="campaign"]'),
    slicerAccordion: document.querySelector('[data-slicer-section="slicer"]'),
    campaignAccordionPanel: document.getElementById('campaign-section-panel'),
    slicerAccordionPanel: document.getElementById('slicer-section-panel'),
    dropZone: document.getElementById('drop-zone'),
    imageInput: document.getElementById('image-input'),
    imageFormat: document.getElementById('image-format'),
    exportWidth: document.getElementById('export-width'),
    exportDpi: document.getElementById('export-dpi'),
    imageQuality: document.getElementById('image-quality'),
    duplicateFolderName: document.getElementById('duplicate-folder-name'),
    campaignPathPreview: document.getElementById('campaign-path-preview'),
    templateCopyStatus: document.getElementById('template-copy-status'),
    templateSourceName: document.getElementById('template-source-name'),
    templateOutputName: document.getElementById('template-output-name'),
    chooseTemplateFolder: document.getElementById('choose-template-folder'),
    chooseCampaignParent: document.getElementById('choose-campaign-parent'),
    copyTemplateFolder: document.getElementById('copy-template-folder'),
    workflowCards: Array.from(document.querySelectorAll('[data-slicer-workflow]')),
    templateContents: document.getElementById('template-contents'),
    templateContentsSummary: document.getElementById('template-contents-summary'),
    templateContentsList: document.getElementById('template-contents-list'),
    autoSlice: document.getElementById('auto-slice'),
    clearLines: document.getElementById('clear-lines'),
    generateOutput: document.getElementById('generate-output'),
    status: document.getElementById('slicer-status'),
    imageMeta: document.getElementById('image-meta'),
    sliceCount: document.getElementById('slice-count'),
    canvasWrap: document.getElementById('canvas-wrap'),
    rulerTop: document.getElementById('ruler-top'),
    rulerLeft: document.getElementById('ruler-left'),
    stage: document.getElementById('slicer-stage'),
    canvas: document.getElementById('source-canvas'),
    guideLayer: document.getElementById('guide-layer'),
    canvasEmpty: document.getElementById('canvas-empty'),
    zoomOut: document.getElementById('zoom-out'),
    zoomIn: document.getElementById('zoom-in'),
    zoomLevel: document.getElementById('zoom-level'),
    sliceList: document.getElementById('slice-list'),
    downloadImages: document.getElementById('download-images'),
    saveFolder: document.getElementById('save-folder')
  };

  const ctx = els.canvas.getContext('2d');

  function setActiveAccordion(section) {
    const active = section === 'slicer' ? 'slicer' : 'campaign';
    [
      { key: 'campaign', item: els.campaignAccordion, panel: els.campaignAccordionPanel },
      { key: 'slicer', item: els.slicerAccordion, panel: els.slicerAccordionPanel }
    ].forEach(({ key, item, panel }) => {
      const isOpen = key === active;
      item?.classList.toggle('is-open', isOpen);
      if (panel) panel.hidden = !isOpen;
    });

    if (active === 'slicer' && state.image) {
      window.requestAnimationFrame(() => {
        if (state.zoomMode === 'fit') setZoom(getFitZoom(), 'fit');
      });
    }
  }

  function setWorkflow(workflow) {
    state.fullWorkflow = workflow === 'full';
    els.workflowCards.forEach((card) => {
      card.classList.toggle('is-active', card.dataset.slicerWorkflow === workflow);
    });
    setActiveAccordion(workflow === 'slice' ? 'slicer' : 'campaign');
    if (workflow === 'full') {
      setTemplateStatus('Copy a template folder first. Slicing will open automatically after the copy.', '');
    }
  }

  function cleanFolderName(value, fallback = 'template copy') {
    return String(value || fallback)
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || fallback;
  }

  function getDuplicateFolderName() {
    return cleanFolderName(els.duplicateFolderName?.value || state.templateDir?.name || 'template copy', 'template copy');
  }


  function getCampaignPath() {
    const pasteLocation = state.campaignParentDir?.name || '[choose output folder]';
    return `${pasteLocation}/${getDuplicateFolderName()}`;
  }

  function setTemplateStatus(message, type = '') {
    if (!els.templateCopyStatus) return;
    els.templateCopyStatus.textContent = message;
    els.templateCopyStatus.className = type ? `is-${type}` : '';
  }

  function updateCampaignPathPreview() {
    if (els.campaignPathPreview) els.campaignPathPreview.textContent = getCampaignPath();
    if (els.templateSourceName) {
      els.templateSourceName.textContent = state.templateDir?.name || 'Not selected';
    }
    if (els.templateOutputName) {
      els.templateOutputName.textContent = state.campaignParentDir?.name || 'Not selected';
    }
    if (els.copyTemplateFolder) {
      els.copyTemplateFolder.disabled = !canProcessTemplate();
    }
  }

  function canProcessTemplate() {
    return Boolean(
      state.templateDir
      && state.campaignParentDir
      && getDuplicateFolderName()
    );
  }

  function renderTemplateContents() {
    if (!els.templateContents || !els.templateContentsList || !els.templateContentsSummary) return;
    const hasTemplate = Boolean(state.templateDir);
    els.templateContents.hidden = !hasTemplate;
    if (!hasTemplate) return;

    const fileLabel = `${state.templateFileCount} file${state.templateFileCount === 1 ? '' : 's'}`;
    const folderLabel = `${state.templateDirectories.length} subfolder${state.templateDirectories.length === 1 ? '' : 's'}`;
    els.templateContentsSummary.textContent = `${folderLabel} · ${fileLabel}`;
    els.templateContentsList.replaceChildren();

    const entries = state.templateDirectories.length
      ? state.templateDirectories
      : ['No subfolders found. Files at the template root will still be copied.'];
    entries.forEach((path) => {
      const item = document.createElement('li');
      item.textContent = path;
      els.templateContentsList.appendChild(item);
    });
  }

  function setStatus(message, type = '') {
    els.status.textContent = message;
    els.status.className = `slicer-status${type ? ` is-${type}` : ''}`;
  }

  function getAutoSliceStep() {
    return 600;
  }

  function getAssetsFolder() {
    return 'images';
  }

  function getExtension() {
    return els.imageFormat.value === 'image/png' ? 'png' : 'jpg';
  }

  function getImageQuality() {
    const quality = Number.parseFloat(els.imageQuality?.value || '0.98');
    return Number.isFinite(quality) ? Math.min(1, Math.max(0.1, quality)) : 0.98;
  }

  function getExportWidth() {
    if (!state.image) return 1000;
    const width = Number.parseInt(els.exportWidth?.value, 10);
    if (!Number.isFinite(width) || width <= 0) return state.image.naturalWidth;
    return Math.min(3000, Math.max(320, width));
  }

  function getExportScale() {
    if (!state.image) return 1;
    return getExportWidth() / state.image.naturalWidth;
  }

  function getExportDpi() {
    const dpi = Number.parseInt(els.exportDpi?.value, 10);
    return Number.isFinite(dpi) ? Math.min(600, Math.max(72, dpi)) : 300;
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  function getQualityLabel() {
    return els.imageQuality?.selectedOptions?.[0]?.text || 'Very high';
  }

  function renderImageMeta() {
    if (!els.imageMeta) return;
    if (!state.image) {
      els.imageMeta.textContent = 'No image';
      return;
    }

    const extension = getExtension().toUpperCase();
    const sourceSize = formatFileSize(state.sourceFileSize);
    els.imageMeta.innerHTML = `
      <span><strong>Source</strong> ${state.image.naturalWidth} × ${state.image.naturalHeight}px${sourceSize ? ` · ${sourceSize}` : ''}</span>
      <span><strong>Export</strong> ${getExportWidth()}px wide · ${extension} · ${getQualityLabel()}</span>
    `;
  }

  function formatFileName(index) {
    return `img_${String(index + 1).padStart(2, '0')}.${getExtension()}`;
  }

  function getScale() {
    if (!state.image || !els.canvas.width) return 1;
    return els.canvas.clientWidth / els.canvas.width;
  }

  function getPreviewScaleFactor() {
    if (!state.image) return 1;
    return Math.min(1, getExportScale());
  }

  function getDisplayScale() {
    return state.zoom * getPreviewScaleFactor();
  }

  function getFitZoom() {
    if (!state.image) return 1;
    const available = Math.max(240, els.canvasWrap.clientWidth - 56);
    return Math.min(1, Math.max(0.1, available / (state.image.naturalWidth * getPreviewScaleFactor())));
  }

  function setZoom(value, mode = 'manual') {
    if (!state.image) return;
    state.zoomMode = mode;
    state.zoom = Math.min(3, Math.max(0.1, value));
    applyZoom();
    renderRulers();
    renderGuides();
  }

  function applyZoom() {
    if (!state.image) return;
    const zoom = state.zoomMode === 'fit' ? getFitZoom() : state.zoom;
    state.zoom = zoom;
    const displayScale = getDisplayScale();
    const scaledWidth = Math.max(1, Math.round(state.image.naturalWidth * displayScale));
    const scaledHeight = Math.max(1, Math.round(state.image.naturalHeight * displayScale));
    els.canvas.style.width = `${scaledWidth}px`;
    els.canvas.style.height = `${scaledHeight}px`;
    els.stage.style.width = `${scaledWidth}px`;
    els.stage.style.height = `${scaledHeight}px`;
    els.guideLayer.style.width = `${scaledWidth}px`;
    els.guideLayer.style.height = `${scaledHeight}px`;
    els.rulerTop.style.width = `${scaledWidth}px`;
    els.rulerLeft.style.height = `${scaledHeight}px`;
    els.zoomLevel.value = state.zoomMode === 'fit' ? 'fit' : String(state.zoom);
  }

  function normalizeLines(lines) {
    if (!state.image) return [];
    const maxY = state.image.naturalHeight;
    return Array.from(new Set(lines
      .map((line) => Math.round(Number(line)))
      .filter((line) => Number.isFinite(line) && line > 0 && line < maxY)))
      .sort((a, b) => a - b);
  }

  function getSliceRanges() {
    if (!state.image) return [];
    const points = [0, ...state.lines, state.image.naturalHeight];
    return points.slice(0, -1).map((top, index) => ({
      index,
      top,
      bottom: points[index + 1],
      height: points[index + 1] - top,
      fileName: formatFileName(index),
      link: state.slices[index]?.link || ''
    }));
  }

  function preserveSliceLinks(ranges) {
    const oldLinks = state.slices.map((slice) => slice.link || '');
    state.slices = ranges.map((range, index) => ({
      ...range,
      link: oldLinks[index] || range.link || ''
    }));
  }

  function drawCanvas() {
    if (!state.image) {
      els.canvas.width = 0;
      els.canvas.height = 0;
      els.canvasEmpty.hidden = false;
      return;
    }

    els.canvas.width = state.image.naturalWidth;
    els.canvas.height = state.image.naturalHeight;
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    ctx.drawImage(state.image, 0, 0);

    els.canvasEmpty.hidden = true;
  }

  function renderRulers() {
    if (!state.image) {
      els.rulerTop.innerHTML = '';
      els.rulerLeft.innerHTML = '';
      els.rulerTop.style.width = '0px';
      els.rulerLeft.style.height = '0px';
      return;
    }

    applyZoom();
    els.rulerTop.innerHTML = buildRulerTicks(state.image.naturalWidth, 'x');
    els.rulerLeft.innerHTML = buildRulerTicks(state.image.naturalHeight, 'y');
  }

  function getNiceRulerStep(rawStep) {
    const steps = [50, 100, 200, 250, 500, 1000, 2000];
    return steps.find((step) => step >= rawStep) || 5000;
  }

  function buildRulerTicks(length, axis) {
    const ticks = [];
    const displayScale = getDisplayScale();
    const majorStep = getNiceRulerStep(72 / Math.max(displayScale, 0.01));
    const minorStep = majorStep / 2;

    for (let position = 0; position <= length; position += minorStep) {
      const rounded = Math.round(position);
      const major = rounded % majorStep === 0;
      const label = major ? rounded : '';
      const style = axis === 'x'
        ? `left:${rounded * displayScale}px;`
        : `top:${rounded * displayScale}px;`;
      ticks.push(`<span class="slicer-ruler-tick${major ? ' is-major' : ''}" style="${style}">${label}</span>`);
    }
    return ticks.join('');
  }

  function renderGuides() {
    if (!state.image) {
      els.guideLayer.innerHTML = '';
      return;
    }
    els.guideLayer.innerHTML = state.lines.map((line, index) => (
      `<div class="slicer-guide" data-guide-index="${index}" data-y="${line}" style="top:${line * getDisplayScale()}px"></div>`
    )).join('');
  }

  function renderSlices() {
    const ranges = getSliceRanges();
    preserveSliceLinks(ranges);
    els.sliceCount.textContent = `${state.slices.length} slice${state.slices.length === 1 ? '' : 's'}`;

    if (!state.image) {
      els.sliceList.innerHTML = '<p class="slicer-muted">Slices will appear after you load an image.</p>';
      return;
    }

    els.sliceList.innerHTML = state.slices.map((slice, index) => `
      <article class="slicer-slice-card">
        <div class="slicer-slice-head">
          <div>
            <div class="slicer-slice-title">${slice.fileName}</div>
            <div class="slicer-slice-meta">y ${slice.top}-${slice.bottom} · ${slice.height}px</div>
          </div>
          ${index < state.slices.length - 1 ? `<button class="slicer-line-remove" type="button" data-remove-line="${index}">Remove line</button>` : ''}
        </div>
        <label>
          <span>Link URL optional</span>
          <input type="url" data-slice-link="${index}" value="${escapeAttribute(slice.link)}" placeholder="https://...">
        </label>
      </article>
    `).join('');
  }

  function escapeAttribute(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderImageSlices() {
    const ranges = getSliceRanges();
    preserveSliceLinks(ranges);
    els.sliceCount.textContent = `${state.slices.length} slice${state.slices.length === 1 ? '' : 's'}`;

    if (!state.image) {
      els.sliceList.innerHTML = '<p class="slicer-muted">Slices will appear after you load an image.</p>';
      return;
    }

    els.sliceList.innerHTML = state.slices.map((slice, index) => `
      <article class="slicer-slice-card">
        <div class="slicer-slice-head">
          <div>
            <div class="slicer-slice-title">${slice.fileName}</div>
            <div class="slicer-slice-meta">source y ${slice.top}-${slice.bottom} · ${slice.height}px</div>
            <div class="slicer-slice-meta">export ${getExportWidth()} × ${Math.max(1, Math.round(slice.height * getExportScale()))}px</div>
          </div>
          ${index < state.slices.length - 1 ? `<button class="slicer-line-remove" type="button" data-remove-line="${index}">Remove line</button>` : ''}
        </div>
      </article>
    `).join('');
  }

  function updateUi() {
    drawCanvas();
    renderRulers();
    renderGuides();
    renderImageSlices();
    renderImageMeta();
    const hasImage = Boolean(state.image);
    els.autoSlice.disabled = !hasImage;
    els.clearLines.disabled = !hasImage || state.lines.length === 0;
    els.generateOutput.disabled = !hasImage;
    els.zoomOut.disabled = !hasImage;
    els.zoomIn.disabled = !hasImage;
    els.zoomLevel.disabled = !hasImage;
    const hasGenerated = Boolean(state.generated);
    if (els.downloadImages) els.downloadImages.disabled = !hasGenerated;
    if (els.saveFolder) els.saveFolder.disabled = !hasGenerated || typeof window.showDirectoryPicker !== 'function';
    updateCampaignPathPreview();
  }

  function loadRasterImage(file, sourceSize = file.size) {
    setActiveAccordion('slicer');
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.file = file;
    state.sourceFileSize = sourceSize;
    state.imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      state.image = image;
      state.lines = [];
      state.slices = [];
      state.generated = null;
      state.zoomMode = 'fit';
      state.zoom = getFitZoom();
      if (els.exportWidth) els.exportWidth.value = image.naturalWidth;
      setStatus(`Image loaded at ${image.naturalWidth}px wide. Click the preview to add slice lines.`, 'success');
      updateUi();
    };
    image.onerror = () => setStatus('Unable to read this image.', 'error');
    image.src = state.imageUrl;
  }

  async function loadPdfFile(file) {
    setActiveAccordion('slicer');
    setStatus('Rendering the first PDF page for slicing...', '');
    try {
      const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const imageBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to prepare the PDF page as an image.')), 'image/png');
      });
      loadRasterImage(new File([imageBlob], `${file.name.replace(/\.pdf$/i, '')}.png`, { type: 'image/png' }), file.size);
      setStatus('PDF first page loaded. Add guides, then generate slices.', 'success');
    } catch (error) {
      setStatus(error.message || 'Unable to render this PDF. Try a JPG or PNG instead.', 'error');
    }
  }

  async function loadImageFile(file) {
    if (!file) return;
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      await loadPdfFile(file);
      return;
    }
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setStatus('Please choose a PDF, JPG, JPEG, or PNG file.', 'error');
      return;
    }
    loadRasterImage(file);
  }

  function canvasToImageY(event) {
    const rect = els.canvas.getBoundingClientRect();
    const scale = getScale() || 1;
    return Math.round((event.clientY - rect.top) / scale);
  }

  function findNearestLine(y) {
    const threshold = Math.max(8, state.image.naturalHeight * 0.006);
    return state.lines.findIndex((line) => Math.abs(line - y) <= threshold);
  }

  function addLine(y) {
    state.lines = normalizeLines([...state.lines, y]);
    state.generated = null;
    updateUi();
  }

  function autoSlice() {
    if (!state.image) return;
    const step = Math.max(100, getAutoSliceStep());
    const lines = [];
    for (let y = step; y < state.image.naturalHeight; y += step) {
      lines.push(y);
    }
    state.lines = normalizeLines(lines);
    state.generated = null;
    setStatus(`Created ${state.lines.length} automatic slice line(s). Adjust if needed.`, 'success');
    updateUi();
  }

  function createSliceCanvas(slice) {
    const canvas = document.createElement('canvas');
    const exportScale = getExportScale();
    canvas.width = Math.max(1, Math.round(state.image.naturalWidth * exportScale));
    canvas.height = Math.max(1, Math.round(slice.height * exportScale));
    const sliceCtx = canvas.getContext('2d');
    sliceCtx.drawImage(
      state.image,
      0,
      slice.top,
      state.image.naturalWidth,
      slice.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas;
  }

  function canvasToBlob(canvas, type) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, type === 'image/jpeg' ? getImageQuality() : undefined);
    });
  }

  async function generateOutput() {
    if (!state.image) return;
    const type = els.imageFormat.value;
    const generatedSlices = [];

    for (const slice of state.slices) {
      const canvas = createSliceCanvas(slice);
      const blob = await canvasToBlob(canvas, type);
      generatedSlices.push({ ...slice, blob });
    }

    state.generated = { slices: generatedSlices };
    setStatus(`Generated ${generatedSlices.length} image slice(s) at ${getExportWidth()}px export width.`, 'success');
    updateUi();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadImages() {
    if (!state.generated) return;
    state.generated.slices.forEach((slice, index) => {
      window.setTimeout(() => downloadBlob(slice.blob, slice.fileName), index * 120);
    });
  }

  async function saveToFolder() {
    if (!state.generated || typeof window.showDirectoryPicker !== 'function') return;
    const root = await window.showDirectoryPicker({ mode: 'readwrite' });
    const assetDir = await root.getDirectoryHandle(getAssetsFolder(), { create: true });
    for (const slice of state.generated.slices) {
      await writeFile(assetDir, slice.fileName, slice.blob);
    }
    setStatus(`Saved ${state.generated.slices.length} image(s) to ${getAssetsFolder()}.`, 'success');
  }

  async function writeFile(dirHandle, name, content) {
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function copyDirectory(sourceDir, targetDir, skipName = '') {
    for await (const [name, handle] of sourceDir.entries()) {
      if (skipName && name === skipName) continue;
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        await writeFile(targetDir, name, file);
        continue;
      }

      if (handle.kind === 'directory') {
        const nextTarget = await targetDir.getDirectoryHandle(name, { create: true });
        await copyDirectory(handle, nextTarget);
      }
    }
  }

  async function getDirectoryByParts(rootDir, parts) {
    let current = rootDir;
    for (const part of parts.filter(Boolean)) {
      current = await current.getDirectoryHandle(part);
    }
    return current;
  }

  async function ensureDirectoryByParts(rootDir, parts) {
    let current = rootDir;
    for (const part of parts.filter(Boolean)) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    return current;
  }

  function getSelectedCampaignDirectoryParts(path = getSelectedTemplateHtmlPath()) {
    const parts = path ? path.split('/') : [];
    return parts.slice(0, -1);
  }

  function getTargetCampaignDirectoryParts() {
    const target = getDuplicateTarget();
    return [
      getEmailblastFolder(),
      getTemplateMarket(),
      target.year,
      target.campaignFolder
    ];
  }

  function pathsMatch(left, right) {
    return left.join('/') === right.join('/');
  }

  async function getOrCreateDuplicateDirectory() {
    return state.campaignParentDir.getDirectoryHandle(getDuplicateFolderName(), { create: true });
  }

  async function listHtmlFiles(dirHandle, basePath = '', parentDir = dirHandle) {
    const files = [];
    for await (const [name, handle] of dirHandle.entries()) {
      const path = basePath ? `${basePath}/${name}` : name;
      if (handle.kind === 'file' && /\.html?$/i.test(name)) {
        files.push({ name, path, handle, parentDir });
        continue;
      }

      if (handle.kind === 'directory') {
        files.push(...await listHtmlFiles(handle, path, handle));
      }
    }
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  async function listDirectories(dirHandle, basePath = '') {
    const directories = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind !== 'directory') continue;
      const path = basePath ? `${basePath}/${name}` : name;
      directories.push(path, ...await listDirectories(handle, path));
    }
    return directories.sort((a, b) => a.localeCompare(b));
  }

  function renderCopiedHtmlFiles() {
    if (!els.htmlTools || !els.htmlFileSelect) return;
    els.htmlTools.hidden = state.copiedHtmlFiles.length === 0;
    els.htmlFileSelect.innerHTML = state.copiedHtmlFiles.map((file) => (
      `<option value="${escapeAttribute(file.path)}">${escapeHtml(file.path)}</option>`
    )).join('');
    syncTemplateFieldsFromSelectedHtml(false);
    renderTemplateReview();
  }

  async function chooseTemplateFolder() {
    if (typeof window.showDirectoryPicker !== 'function') {
      setTemplateStatus('Folder access is not supported in this browser.', 'error');
      return;
    }
    state.templateDir = await window.showDirectoryPicker({ mode: 'read' });
    state.copiedHtmlFiles = await listHtmlFiles(state.templateDir);
    state.templateDirectories = await listDirectories(state.templateDir);
    state.copiedCampaignDir = null;
    if (els.duplicateFolderName && !els.duplicateFolderName.value.trim()) {
      els.duplicateFolderName.value = `${state.templateDir.name} copy`;
    }
    state.finalHtmlNameManual = false;
    renderCopiedHtmlFiles();
    renderTemplateContents();
    syncTemplateFieldsFromSelectedHtml(true);
    syncTemplateFieldsFromFolderName();
    setTemplateStatus(`Template selected: ${state.templateDir.name} - ${state.copiedHtmlFiles.length} HTML file(s) found`, 'success');
    updateCampaignPathPreview();
  }

  async function chooseCampaignParent() {
    if (typeof window.showDirectoryPicker !== 'function') {
      setTemplateStatus('Folder access is not supported in this browser.', 'error');
      return;
    }
    state.campaignParentDir = await window.showDirectoryPicker({ mode: 'readwrite' });
    setTemplateStatus(`Paste location selected: ${state.campaignParentDir.name}`, 'success');
    updateCampaignPathPreview();
  }

  async function copyTemplateFolder() {
    if (!canProcessTemplate()) return;
    const folderSynced = syncTemplateFieldsFromFolderName(true);
    if (folderSynced) state.finalHtmlNameManual = false;
    updateCampaignPathPreview();
    setTemplateStatus('Processing duplicate...', 'loading');
    const duplicateDir = await getOrCreateDuplicateDirectory();
    const isPastingInsideTemplate = typeof state.templateDir.isSameEntry === 'function'
      && await state.templateDir.isSameEntry(state.campaignParentDir);
    await copyDirectory(state.templateDir, duplicateDir, isPastingInsideTemplate ? getDuplicateFolderName() : '');
    state.copiedCampaignDir = duplicateDir;
    state.copiedHtmlFiles = await listHtmlFiles(duplicateDir);
    renderCopiedHtmlFiles();
    updateCampaignPathPreview();
    setTemplateStatus(`Duplicated: ${getCampaignPath()}`, 'success');
    if (state.fullWorkflow) setActiveAccordion('slicer');
  }

  async function renameHtmlFileEntry(fileEntry, targetName) {
    const sourceFile = await fileEntry.handle.getFile();
    await writeFile(fileEntry.parentDir, targetName, sourceFile);
    if (targetName !== fileEntry.name) {
      await fileEntry.parentDir.removeEntry(fileEntry.name).catch(() => {});
    }
  }

  async function moveCampaignDirectoryAndRenameHtml(fileEntry, targetName) {
    const sourceDirParts = getSelectedCampaignDirectoryParts(fileEntry.path);
    const targetDirParts = getTargetCampaignDirectoryParts();
    const shouldMoveDirectory = sourceDirParts.length && !pathsMatch(sourceDirParts, targetDirParts);

    if (!shouldMoveDirectory) {
      await renameHtmlFileEntry(fileEntry, targetName);
      return;
    }

    const sourceDir = await getDirectoryByParts(state.copiedCampaignDir, sourceDirParts);
    const targetDir = await ensureDirectoryByParts(state.copiedCampaignDir, targetDirParts);
    await copyDirectory(sourceDir, targetDir);
    const movedFiles = await listHtmlFiles(targetDir);
    const movedEntry = movedFiles.find((file) => file.name === fileEntry.name) || movedFiles[0];
    if (movedEntry) await renameHtmlFileEntry(movedEntry, targetName);

    const sourceParent = await getDirectoryByParts(state.copiedCampaignDir, sourceDirParts.slice(0, -1));
    await sourceParent.removeEntry(sourceDirParts[sourceDirParts.length - 1], { recursive: true }).catch(() => {});
  }

  async function renameSelectedHtmlFile() {
    if (!state.copiedHtmlFiles.length) return;
    const currentPath = els.htmlFileSelect.value;
    const fileEntry = state.copiedHtmlFiles.find((file) => file.path === currentPath);
    if (!fileEntry) return;
    if (!state.copiedCampaignDir) {
      setTemplateStatus('Copy as campaign first, then rename the HTML in the copied folder.', 'error');
      return;
    }

    const targetName = getResolvedFinalHtmlName();
    await renameHtmlFileEntry(fileEntry, targetName);
    state.copiedHtmlFiles = await listHtmlFiles(state.copiedCampaignDir);
    renderCopiedHtmlFiles();
    els.htmlFileSelect.value = fileEntry.path.replace(/[^/]+$/, targetName);
    setTemplateStatus(`HTML ready: ${getCampaignPath().replace(/[^/]+$/, targetName)}`, 'success');
  }

  els.campaignAccordionTrigger?.addEventListener('click', () => setWorkflow('copy'));
  els.slicerAccordionTrigger?.addEventListener('click', () => setWorkflow('slice'));
  els.workflowCards.forEach((card) => {
    card.addEventListener('click', () => setWorkflow(card.dataset.slicerWorkflow));
  });
  els.dropZone.addEventListener('click', () => els.imageInput.click());
  els.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      els.imageInput.click();
    }
  });
  els.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    els.dropZone.classList.add('is-dragover');
  });
  els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('is-dragover'));
  els.dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    els.dropZone.classList.remove('is-dragover');
    loadImageFile(event.dataTransfer.files[0]).catch((error) => setStatus(error.message || 'Unable to load this file.', 'error'));
  });
  els.imageInput.addEventListener('change', () => {
    loadImageFile(els.imageInput.files[0]).catch((error) => setStatus(error.message || 'Unable to load this file.', 'error'));
  });
  els.chooseTemplateFolder?.addEventListener('click', () => {
    chooseTemplateFolder().catch((error) => {
      if (error.name !== 'AbortError') setTemplateStatus(error.message || 'Unable to choose template folder.', 'error');
    });
  });
  els.chooseCampaignParent?.addEventListener('click', () => {
    chooseCampaignParent().catch((error) => {
      if (error.name !== 'AbortError') setTemplateStatus(error.message || 'Unable to choose destination folder.', 'error');
    });
  });
  els.copyTemplateFolder?.addEventListener('click', () => {
    copyTemplateFolder().catch((error) => setTemplateStatus(error.message || 'Unable to copy template folder.', 'error'));
  });
  els.copyCampaignPath?.addEventListener('click', async () => {
    await navigator.clipboard?.writeText(getCampaignPath());
    setTemplateStatus('Target path copied.', 'success');
  });
  els.renameHtmlFile?.addEventListener('click', () => {
    renameSelectedHtmlFile().catch((error) => setTemplateStatus(error.message || 'Unable to rename HTML file.', 'error'));
  });
  els.htmlFileSelect?.addEventListener('change', () => {
    state.finalHtmlNameManual = false;
    syncTemplateFieldsFromSelectedHtml(true);
    syncTemplateFieldsFromFolderName();
    updateCampaignPathPreview();
  });
  els.finalHtmlName?.addEventListener('blur', () => {
    normalizeFinalHtmlInput();
    updateCampaignPathPreview();
  });

  els.canvas.addEventListener('pointerdown', (event) => {
    if (!state.image) return;
    const y = canvasToImageY(event);
    addLine(y);
  });

  els.guideLayer.addEventListener('pointerdown', (event) => {
    const guide = event.target.closest('[data-guide-index]');
    if (!guide) return;
    event.preventDefault();
    state.draggingLine = Number(guide.dataset.guideIndex);
    guide.setPointerCapture(event.pointerId);
  });

  document.addEventListener('pointermove', (event) => {
    if (state.draggingLine === null || !state.image) return;
    const y = canvasToImageY(event);
    const nextLines = [...state.lines];
    nextLines[state.draggingLine] = y;
    const draggedValue = normalizeLines([y])[0];
    state.lines = normalizeLines(nextLines);
    state.draggingLine = draggedValue ? state.lines.findIndex((line) => line === draggedValue) : null;
    state.generated = null;
    updateUi();
  });

  document.addEventListener('pointerup', () => {
    state.draggingLine = null;
  });

  els.autoSlice.addEventListener('click', autoSlice);
  els.clearLines.addEventListener('click', () => {
    state.lines = [];
    state.generated = null;
    setStatus('Slice lines cleared.', 'success');
    updateUi();
  });
  els.generateOutput.addEventListener('click', generateOutput);
  els.downloadImages?.addEventListener('click', downloadImages);
  els.zoomOut?.addEventListener('click', () => setZoom(state.zoom - 0.1));
  els.zoomIn?.addEventListener('click', () => setZoom(state.zoom + 0.1));
  els.zoomLevel?.addEventListener('change', () => {
    if (els.zoomLevel.value === 'fit') {
      setZoom(getFitZoom(), 'fit');
      return;
    }
    setZoom(Number.parseFloat(els.zoomLevel.value));
  });
  window.addEventListener('resize', () => {
    if (state.zoomMode === 'fit') setZoom(getFitZoom(), 'fit');
  });
  els.saveFolder?.addEventListener('click', () => {
    saveToFolder().catch((error) => {
      if (error.name !== 'AbortError') setStatus(error.message || 'Unable to save files.', 'error');
    });
  });
  els.sliceList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-line]');
    if (!button) return;
    const index = Number(button.dataset.removeLine);
    state.lines.splice(index, 1);
    state.lines = normalizeLines(state.lines);
    state.generated = null;
    updateUi();
  });
  [
    els.imageFormat,
    els.exportWidth,
    els.exportDpi,
    els.imageQuality,
    els.duplicateFolderName,
    els.templateYear,
    els.templateCampaignFolder,
    els.finalHtmlName
  ].forEach((input) => {
    if (!input) return;
    const handleFieldChange = () => {
      const hadGenerated = Boolean(state.generated);
      state.generated = null;
      if (hadGenerated && [els.imageFormat, els.exportWidth, els.exportDpi, els.imageQuality].includes(input)) {
        setStatus('Settings changed. Generate again to refresh slices.', 'success');
      }
      if (input === els.finalHtmlName) state.finalHtmlNameManual = true;
      if (input === els.duplicateFolderName) {
        state.finalHtmlNameManual = false;
        syncTemplateFieldsFromFolderName(true);
      }
      updateCampaignPathPreview();
      updateUi();
    };
    input.addEventListener('input', handleFieldChange);
    input.addEventListener('change', handleFieldChange);
  });

  updateUi();
})();
