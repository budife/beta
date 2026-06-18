(function () {
  const state = {
    file: null,
    image: null,
    imageUrl: '',
    lines: [],
    draggingLine: null,
    slices: [],
    generated: null,
    templateDir: null,
    campaignParentDir: null,
    copiedCampaignDir: null,
    copiedHtmlFiles: [],
    finalHtmlNameManual: false,
    zoom: 1,
    zoomMode: 'fit'
  };

  const els = {
    dropZone: document.getElementById('drop-zone'),
    imageInput: document.getElementById('image-input'),
    campaignName: document.getElementById('campaign-name'),
    assetsFolder: document.getElementById('assets-folder'),
    emailWidth: document.getElementById('email-width'),
    useSourceWidth: document.getElementById('use-source-width'),
    imageFormat: document.getElementById('image-format'),
    exportWidth: document.getElementById('export-width'),
    exportDpi: document.getElementById('export-dpi'),
    imageQuality: document.getElementById('image-quality'),
    duplicateFolderName: document.getElementById('duplicate-folder-name'),
    templateYear: document.getElementById('template-year'),
    templateCampaignFolder: document.getElementById('template-campaign-folder'),
    campaignPathPreview: document.getElementById('campaign-path-preview'),
    templateCopyStatus: document.getElementById('template-copy-status'),
    templateSourceName: document.getElementById('template-source-name'),
    templateOutputName: document.getElementById('template-output-name'),
    chooseTemplateFolder: document.getElementById('choose-template-folder'),
    chooseCampaignParent: document.getElementById('choose-campaign-parent'),
    copyTemplateFolder: document.getElementById('copy-template-folder'),
    copyCampaignPath: document.getElementById('copy-campaign-path'),
    templateReview: document.getElementById('template-review'),
    templateReviewSource: document.getElementById('template-review-source'),
    templateReviewTarget: document.getElementById('template-review-target'),
    templateReviewHtml: document.getElementById('template-review-html'),
    templateReviewMkt: document.getElementById('template-review-mkt'),
    htmlTools: document.getElementById('html-tools'),
    htmlFileSelect: document.getElementById('html-file-select'),
    finalHtmlName: document.getElementById('final-html-name'),
    renameHtmlFile: document.getElementById('rename-html-file'),
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
    htmlPreview: document.getElementById('html-preview'),
    downloadHtml: document.getElementById('download-html'),
    downloadImages: document.getElementById('download-images'),
    saveFolder: document.getElementById('save-folder')
  };

  const ctx = els.canvas.getContext('2d');

  function slugify(value) {
    return String(value || 'layout-edm')
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'layout-edm';
  }

  function cleanPathSegment(value, fallback = 'campaign') {
    return String(value || fallback)
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback;
  }

  function cleanFolderName(value, fallback = 'template copy') {
    return String(value || fallback)
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || fallback;
  }

  function cleanFolderSegment(value, fallback) {
    return cleanFolderName(value, fallback);
  }

  function cleanHtmlFileName(value, fallback = 'index.html') {
    const cleaned = String(value || fallback)
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const withExt = cleaned || fallback;
    return /\.html?$/i.test(withExt) ? withExt : `${withExt}.html`;
  }

  function cleanNameForFile(value, fallback = 'campaign') {
    return String(value || fallback)
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback;
  }

  function parseFolderName(value) {
    const raw = String(value || '').trim();
    const dateMatch = raw.match(/(?:^|\s)(\d{1,2})[-/](\d{1,2})(?=\s|$)/);
    const campaignNoMatch = raw.match(/^\s*(\d{4})\b/);
    const campaignNo = campaignNoMatch?.[1] || '';
    const year = String(new Date().getFullYear());
    const month = dateMatch ? dateMatch[1].padStart(2, '0') : '';
    const day = dateMatch ? dateMatch[2].padStart(2, '0') : '';
    const dateToken = dateMatch ? `${month}${day}` : '';
    const fullDate = dateMatch ? `${year}${dateToken}` : '';
    const beforeDate = dateMatch ? raw.slice(0, dateMatch.index).trim() : raw;
    const afterDate = dateMatch ? raw.slice(dateMatch.index + dateMatch[0].length).trim() : '';
    const campaignName = beforeDate.replace(/^\d{4}\s*/, '').trim();
    const managerWord = afterDate.split(/\s+/).find(Boolean) || '';
    const managerCode = managerWord.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
    const suffix = managerCode || 'XX';
    const campaignFolder = campaignNo && fullDate ? `${campaignNo}-${fullDate}-${suffix}` : '';
    const fileParts = [
      campaignNo,
      cleanNameForFile(campaignName, 'Campaign')
    ].filter(Boolean);
    return {
      campaignNo,
      year,
      campaignFolder,
      fileName: fileParts.length ? `${fileParts.join('-')}.html` : ''
    };
  }

  function getSelectedTemplateHtml() {
    const selectedPath = els.htmlFileSelect?.value || state.copiedHtmlFiles[0]?.path || '';
    return state.copiedHtmlFiles.find((file) => file.path === selectedPath) || state.copiedHtmlFiles[0] || null;
  }

  function getSelectedTemplateHtmlName() {
    return getSelectedTemplateHtml()?.name || '';
  }

  function getSelectedTemplateHtmlPath() {
    return getSelectedTemplateHtml()?.path || '';
  }

  function getDuplicateFolderName() {
    return cleanFolderName(els.duplicateFolderName?.value || state.templateDir?.name || 'template copy', 'template copy');
  }

  function getEmailblastFolder() {
    return 'emailblast';
  }

  function getTemplateYear() {
    const value = String(els.templateYear?.value || '').replace(/\D/g, '').slice(0, 4);
    return value.length === 4 ? value : String(new Date().getFullYear());
  }

  function getTemplateMarket() {
    return 'MKT';
  }

  function getTemplateCampaignFolder() {
    return cleanFolderSegment(els.templateCampaignFolder?.value || 'campaign-folder', 'campaign-folder');
  }

  function getFolderNameTarget() {
    const parsed = parseFolderName(els.duplicateFolderName?.value || '');
    if (!parsed.campaignNo || !parsed.campaignFolder) return null;
    return {
      year: parsed.year,
      campaignFolder: parsed.campaignFolder,
      fileName: parsed.fileName
    };
  }

  function getFinalHtmlName() {
    const selectedHtml = getSelectedTemplateHtmlName();
    return selectedHtml || `${getDuplicateFolderName()}.html`;
  }

  function getResolvedFinalHtmlName() {
    const value = els.finalHtmlName?.value?.trim();
    if (!value) return getFinalHtmlName();
    return cleanHtmlFileName(value, getFinalHtmlName());
  }

  function getDuplicateTarget() {
    const folderTarget = getFolderNameTarget();
    if (folderTarget) {
      return {
        year: folderTarget.year,
        campaignFolder: folderTarget.campaignFolder,
        fileName: cleanHtmlFileName(folderTarget.fileName, getFinalHtmlName())
      };
    }

    return {
      year: getTemplateYear(),
      campaignFolder: getTemplateCampaignFolder(),
      fileName: getResolvedFinalHtmlName()
    };
  }

  function getCampaignPath() {
    const pasteLocation = state.campaignParentDir?.name || '[choose output folder]';
    const hasHtmlTarget = Boolean(getSelectedTemplateHtmlName() || els.finalHtmlName?.value?.trim());
    const targetHtmlPath = getStructuredHtmlPath();
    return hasHtmlTarget
      ? `${pasteLocation}/${getDuplicateFolderName()}/${targetHtmlPath}`
      : `${pasteLocation}/${getDuplicateFolderName()}`;
  }

  function getStructuredHtmlPath() {
    const target = getDuplicateTarget();
    return [
      getEmailblastFolder(),
      getTemplateMarket(),
      target.year,
      target.campaignFolder,
      target.fileName
    ].join('/');
  }

  function getSelectedMktPath() {
    const target = getDuplicateTarget();
    return [
      getTemplateMarket(),
      target.year,
      target.campaignFolder,
      target.fileName
    ].join('/');
  }

  function getSelectedHtmlPathParts() {
    const selectedPath = getSelectedTemplateHtmlPath();
    const parts = selectedPath ? selectedPath.split('/') : [];
    const mktIndex = parts.findIndex((part) => part.toLowerCase() === 'mkt');
    const emailblast = mktIndex > 0 ? parts[mktIndex - 1] : 'emailblast';
    return {
      emailblast,
      market: mktIndex >= 0 ? parts[mktIndex] : 'MKT',
      year: mktIndex >= 0 && parts[mktIndex + 1] ? parts[mktIndex + 1] : String(new Date().getFullYear()),
      campaignFolder: mktIndex >= 0 && parts[mktIndex + 2] ? parts[mktIndex + 2] : '',
      fileName: parts[parts.length - 1] || ''
    };
  }

  function syncTemplateFieldsFromSelectedHtml(force = false) {
    const parts = getSelectedHtmlPathParts();
    if (els.templateYear && (force || !els.templateYear.value.trim())) els.templateYear.value = parts.year;
    if (els.templateCampaignFolder && (force || !els.templateCampaignFolder.value.trim())) els.templateCampaignFolder.value = parts.campaignFolder;
    if (els.finalHtmlName && (force || !els.finalHtmlName.value.trim() || !state.finalHtmlNameManual)) els.finalHtmlName.value = parts.fileName || getFinalHtmlName();
  }

  function syncTemplateFieldsFromFolderName(forceFinalName = false) {
    const parsed = parseFolderName(els.duplicateFolderName?.value || '');
    if (!parsed.campaignNo) return;
    if (els.templateYear) els.templateYear.value = parsed.year;
    if (els.templateCampaignFolder && parsed.campaignFolder) els.templateCampaignFolder.value = parsed.campaignFolder;
    if (els.finalHtmlName && parsed.fileName && (forceFinalName || !state.finalHtmlNameManual || !els.finalHtmlName.value.trim())) {
      els.finalHtmlName.value = parsed.fileName;
      state.finalHtmlNameManual = false;
    }
    return true;
  }

  function normalizeFinalHtmlInput() {
    if (!els.finalHtmlName) return;
    els.finalHtmlName.value = getResolvedFinalHtmlName();
  }

  function setTemplateStatus(message, type = '') {
    if (!els.templateCopyStatus) return;
    els.templateCopyStatus.textContent = message;
    els.templateCopyStatus.className = type ? `is-${type}` : '';
  }

  function updateCampaignPathPreview() {
    if (els.finalHtmlName && !els.finalHtmlName.matches(':focus') && (!els.finalHtmlName.value.trim() || !state.finalHtmlNameManual)) {
      const syncedFromFolderName = syncTemplateFieldsFromFolderName(false);
      if (!syncedFromFolderName) syncTemplateFieldsFromSelectedHtml(false);
    }

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
    renderTemplateReview();
  }

  function canProcessTemplate() {
    return Boolean(
      state.templateDir
      && state.campaignParentDir
      && getDuplicateFolderName()
    );
  }

  function renderTemplateReview() {
    if (!els.templateReview) return;
    const hasTemplateContext = Boolean(state.templateDir || state.campaignParentDir || state.copiedHtmlFiles.length);
    els.templateReview.hidden = !hasTemplateContext;
    if (!hasTemplateContext) return;

    const selectedHtml = getSelectedTemplateHtmlPath() || 'No HTML file detected yet';
    els.templateReviewSource.textContent = state.templateDir
      ? `${state.templateDir.name} / ${selectedHtml}`
      : 'Choose template folder first';
    els.templateReviewTarget.textContent = state.campaignParentDir
      ? `${state.campaignParentDir.name} / ${getDuplicateFolderName()}`
      : 'Choose paste location';
    els.templateReviewHtml.textContent = `${selectedHtml} -> ${getResolvedFinalHtmlName()}`;
    if (els.templateReviewMkt) {
      els.templateReviewMkt.textContent = getSelectedMktPath() || 'No HTML file detected yet';
    }
  }

  function setStatus(message, type = '') {
    els.status.textContent = message;
    els.status.className = `slicer-status${type ? ` is-${type}` : ''}`;
  }

  function getEmailWidth() {
    if (els.useSourceWidth?.checked && state.image) return state.image.naturalWidth;
    const width = Number.parseInt(els.emailWidth.value, 10);
    return Number.isFinite(width) && width > 0 ? width : 600;
  }

  function getAutoSliceStep() {
    const width = Number.parseInt(els.emailWidth.value, 10);
    return Number.isFinite(width) && width > 0 ? width : 600;
  }

  function getAssetsFolder() {
    return slugify(els.assetsFolder.value || 'images');
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

  function formatFileName(index) {
    return `img_${String(index + 1).padStart(2, '0')}.${getExtension()}`;
  }

  function getScale() {
    if (!state.image || !els.canvas.width) return 1;
    return els.canvas.clientWidth / els.canvas.width;
  }

  function getFitZoom() {
    if (!state.image) return 1;
    const available = Math.max(240, els.canvasWrap.clientWidth - 56);
    return Math.min(1, Math.max(0.1, available / state.image.naturalWidth));
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
    const scaledWidth = Math.max(1, Math.round(state.image.naturalWidth * zoom));
    const scaledHeight = Math.max(1, Math.round(state.image.naturalHeight * zoom));
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

  function buildRulerTicks(length, axis) {
    const ticks = [];
    for (let position = 0; position <= length; position += 50) {
      const major = position % 100 === 0;
      const label = major ? position : '';
      const style = axis === 'x'
        ? `left:${position * state.zoom}px;`
        : `top:${position * state.zoom}px;`;
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
      `<div class="slicer-guide" data-guide-index="${index}" data-y="${line}" style="top:${line * state.zoom}px"></div>`
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

  function updateUi() {
    drawCanvas();
    renderRulers();
    renderGuides();
    renderSlices();
    const hasImage = Boolean(state.image);
    els.autoSlice.disabled = !hasImage;
    els.clearLines.disabled = !hasImage || state.lines.length === 0;
    els.generateOutput.disabled = !hasImage;
    els.zoomOut.disabled = !hasImage;
    els.zoomIn.disabled = !hasImage;
    els.zoomLevel.disabled = !hasImage;
    const hasGenerated = Boolean(state.generated);
    els.downloadHtml.disabled = !hasGenerated;
    els.downloadImages.disabled = !hasGenerated;
    els.saveFolder.disabled = !hasGenerated || typeof window.showDirectoryPicker !== 'function';
    if (els.emailWidth) els.emailWidth.disabled = Boolean(els.useSourceWidth?.checked);
    updateCampaignPathPreview();
  }

  function syncLinksFromInputs() {
    els.sliceList.querySelectorAll('[data-slice-link]').forEach((input) => {
      const index = Number(input.dataset.sliceLink);
      if (state.slices[index]) state.slices[index].link = input.value.trim();
    });
  }

  async function loadImageFile(file) {
    if (!file || !/^image\/(png|jpeg)$/.test(file.type)) {
      setStatus('Please choose a JPG or PNG file.', 'error');
      return;
    }

    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.file = file;
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
      els.campaignName.value = slugify(file.name);
      els.imageMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}px · ${Math.round(file.size / 1024)} KB`;
      if (els.exportWidth) els.exportWidth.value = image.naturalWidth;
      setStatus(`Image loaded at ${image.naturalWidth}px wide. Click the preview to add slice lines.`, 'success');
      updateUi();
    };
    image.onerror = () => setStatus('Unable to read this image.', 'error');
    image.src = state.imageUrl;
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
    syncLinksFromInputs();
    const type = els.imageFormat.value;
    const generatedSlices = [];

    for (const slice of state.slices) {
      const canvas = createSliceCanvas(slice);
      const blob = await canvasToBlob(canvas, type);
      const dataUrl = canvas.toDataURL(type, type === 'image/jpeg' ? getImageQuality() : undefined);
      generatedSlices.push({ ...slice, blob, dataUrl });
    }

    const html = buildEmailHtml(generatedSlices, false);
    const previewHtml = buildEmailHtml(generatedSlices, true);
    state.generated = { slices: generatedSlices, html, previewHtml };
    els.htmlPreview.srcdoc = previewHtml;
    setStatus(`Generated ${generatedSlices.length} slice(s) at ${getExportWidth()}px export width. HTML displays at ${getEmailWidth()}px.`, 'success');
    updateUi();
  }

  function buildEmailHtml(slices, useDataUrls) {
    const width = getEmailWidth();
    const assetsFolder = getAssetsFolder();
    const title = escapeHtml(els.campaignName.value || 'Layout eDM');
    const rows = slices.map((slice) => {
      const src = useDataUrls ? slice.dataUrl : `${assetsFolder}/${slice.fileName}`;
      const img = `<img class="img_scale" src="${src}" alt="image" width="${width}" border="0" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;text-decoration:none;">`;
      const imageMarkup = slice.link
        ? `<a href="${escapeAttribute(slice.link)}" target="_blank" style="border:0;text-decoration:none;">${img}</a>`
        : img;
      return `          <tr>
            <td align="center" valign="top" style="padding:0;line-height:0;font-size:0;">${imageMarkup}</td>
          </tr>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!-- Export note: images generated at ${getExportWidth()}px wide, ${getExportDpi()} DPI production note, ${els.imageQuality?.selectedOptions?.[0]?.text || 'Very high'} quality. -->
  <style type="text/css">
    body { margin:0; padding:0; background:#f2f2f2; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    @media only screen and (max-width:${width + 40}px) {
      table[class="table-wrapper"] { width:100% !important; }
      img[class="img_scale"] { width:100% !important; height:auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;">
  <table align="center" bgcolor="#f2f2f2" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f2f2f2;">
    <tr>
      <td align="center" valign="top">
        <table class="table-wrapper" align="center" bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" width="${width}" style="width:${width}px;background:#ffffff;">
${rows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

  function downloadHtml() {
    if (!state.generated) return;
    const fileName = `${slugify(els.campaignName.value)}.html`;
    downloadBlob(new Blob([state.generated.html], { type: 'text/html;charset=utf-8' }), fileName);
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
    await writeFile(root, `${slugify(els.campaignName.value)}.html`, state.generated.html);
    for (const slice of state.generated.slices) {
      await writeFile(assetDir, slice.fileName, slice.blob);
    }
    setStatus(`Saved HTML and ${state.generated.slices.length} image(s) to selected folder.`, 'success');
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
    state.copiedCampaignDir = null;
    if (els.duplicateFolderName && !els.duplicateFolderName.value.trim()) {
      els.duplicateFolderName.value = `${state.templateDir.name} copy`;
    }
    state.finalHtmlNameManual = false;
    renderCopiedHtmlFiles();
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
    const selectedTemplateHtmlPath = getSelectedTemplateHtmlPath();
    const targetName = getDuplicateTarget().fileName;
    const targetHtmlPath = getStructuredHtmlPath();
    setTemplateStatus('Processing duplicate...', 'loading');
    const duplicateDir = await getOrCreateDuplicateDirectory();
    const isPastingInsideTemplate = typeof state.templateDir.isSameEntry === 'function'
      && await state.templateDir.isSameEntry(state.campaignParentDir);
    await copyDirectory(state.templateDir, duplicateDir, isPastingInsideTemplate ? getDuplicateFolderName() : '');
    state.copiedCampaignDir = duplicateDir;
    state.copiedHtmlFiles = await listHtmlFiles(duplicateDir);
    const copiedEntry = selectedTemplateHtmlPath
      ? state.copiedHtmlFiles.find((file) => file.path === selectedTemplateHtmlPath)
      : null;
    if (!copiedEntry && selectedTemplateHtmlPath) {
      throw new Error(`Template HTML not found after copy: ${selectedTemplateHtmlPath}`);
    }
    if (copiedEntry && targetName) await moveCampaignDirectoryAndRenameHtml(copiedEntry, targetName);
    state.copiedHtmlFiles = await listHtmlFiles(duplicateDir);
    renderCopiedHtmlFiles();
    if (els.htmlFileSelect && copiedEntry && targetName) {
      const movedEntry = state.copiedHtmlFiles.find((file) => file.path === targetHtmlPath);
      if (movedEntry) els.htmlFileSelect.value = movedEntry.path;
      if (els.finalHtmlName) els.finalHtmlName.value = targetName;
    }
    updateCampaignPathPreview();
    setTemplateStatus(`Duplicated: ${getCampaignPath()}`, 'success');
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
    loadImageFile(event.dataTransfer.files[0]);
  });
  els.imageInput.addEventListener('change', () => loadImageFile(els.imageInput.files[0]));
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
  els.downloadHtml.addEventListener('click', downloadHtml);
  els.downloadImages.addEventListener('click', downloadImages);
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
  els.saveFolder.addEventListener('click', () => {
    saveToFolder().catch((error) => {
      if (error.name !== 'AbortError') setStatus(error.message || 'Unable to save files.', 'error');
    });
  });
  els.sliceList.addEventListener('input', (event) => {
    if (!event.target.matches('[data-slice-link]')) return;
    syncLinksFromInputs();
    state.generated = null;
    updateUi();
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
    els.campaignName,
    els.assetsFolder,
    els.emailWidth,
    els.useSourceWidth,
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
    input.addEventListener('input', () => {
      state.generated = null;
      if (input === els.finalHtmlName) state.finalHtmlNameManual = true;
      if (input === els.duplicateFolderName) {
        state.finalHtmlNameManual = false;
        syncTemplateFieldsFromFolderName(true);
      }
      updateCampaignPathPreview();
      updateUi();
    });
  });

  updateUi();
})();
