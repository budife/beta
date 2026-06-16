(function () {
  const state = {
    file: null,
    image: null,
    imageUrl: '',
    lines: [],
    draggingLine: null,
    slices: [],
    generated: null
  };

  const els = {
    dropZone: document.getElementById('drop-zone'),
    imageInput: document.getElementById('image-input'),
    campaignName: document.getElementById('campaign-name'),
    assetsFolder: document.getElementById('assets-folder'),
    emailWidth: document.getElementById('email-width'),
    imageFormat: document.getElementById('image-format'),
    autoSlice: document.getElementById('auto-slice'),
    clearLines: document.getElementById('clear-lines'),
    generateOutput: document.getElementById('generate-output'),
    status: document.getElementById('slicer-status'),
    imageMeta: document.getElementById('image-meta'),
    sliceCount: document.getElementById('slice-count'),
    canvasWrap: document.getElementById('canvas-wrap'),
    canvas: document.getElementById('source-canvas'),
    canvasEmpty: document.getElementById('canvas-empty'),
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

  function setStatus(message, type = '') {
    els.status.textContent = message;
    els.status.className = `slicer-status${type ? ` is-${type}` : ''}`;
  }

  function getEmailWidth() {
    const width = Number.parseInt(els.emailWidth.value, 10);
    return Number.isFinite(width) && width > 0 ? width : 600;
  }

  function getAssetsFolder() {
    return slugify(els.assetsFolder.value || 'images');
  }

  function getExtension() {
    return els.imageFormat.value === 'image/png' ? 'png' : 'jpg';
  }

  function formatFileName(index) {
    return `img_${String(index + 1).padStart(2, '0')}.${getExtension()}`;
  }

  function getScale() {
    if (!state.image || !els.canvas.width) return 1;
    return els.canvas.clientWidth / els.canvas.width;
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

    ctx.save();
    ctx.strokeStyle = '#f3838b';
    ctx.lineWidth = Math.max(2, Math.round(state.image.naturalWidth / 300));
    ctx.setLineDash([12, 8]);
    state.lines.forEach((line) => {
      ctx.beginPath();
      ctx.moveTo(0, line);
      ctx.lineTo(state.image.naturalWidth, line);
      ctx.stroke();
    });
    ctx.restore();

    els.canvasEmpty.hidden = true;
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
    renderSlices();
    const hasImage = Boolean(state.image);
    els.autoSlice.disabled = !hasImage;
    els.clearLines.disabled = !hasImage || state.lines.length === 0;
    els.generateOutput.disabled = !hasImage;
    const hasGenerated = Boolean(state.generated);
    els.downloadHtml.disabled = !hasGenerated;
    els.downloadImages.disabled = !hasGenerated;
    els.saveFolder.disabled = !hasGenerated || typeof window.showDirectoryPicker !== 'function';
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
      els.campaignName.value = slugify(file.name);
      els.imageMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}px · ${Math.round(file.size / 1024)} KB`;
      setStatus('Image loaded. Click the preview to add slice lines.', 'success');
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
    const step = Math.max(100, getEmailWidth());
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
    canvas.width = state.image.naturalWidth;
    canvas.height = slice.height;
    const sliceCtx = canvas.getContext('2d');
    sliceCtx.drawImage(
      state.image,
      0,
      slice.top,
      state.image.naturalWidth,
      slice.height,
      0,
      0,
      state.image.naturalWidth,
      slice.height
    );
    return canvas;
  }

  function canvasToBlob(canvas, type) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, type === 'image/jpeg' ? 0.92 : undefined);
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
      const dataUrl = canvas.toDataURL(type, type === 'image/jpeg' ? 0.92 : undefined);
      generatedSlices.push({ ...slice, blob, dataUrl });
    }

    const html = buildEmailHtml(generatedSlices, false);
    const previewHtml = buildEmailHtml(generatedSlices, true);
    state.generated = { slices: generatedSlices, html, previewHtml };
    els.htmlPreview.srcdoc = previewHtml;
    setStatus(`Generated ${generatedSlices.length} slice(s).`, 'success');
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

  els.canvas.addEventListener('pointerdown', (event) => {
    if (!state.image) return;
    const y = canvasToImageY(event);
    const nearest = findNearestLine(y);
    if (nearest >= 0) {
      state.draggingLine = nearest;
      els.canvas.setPointerCapture(event.pointerId);
      return;
    }
    addLine(y);
  });

  els.canvas.addEventListener('pointermove', (event) => {
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

  els.canvas.addEventListener('pointerup', () => {
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
  [els.campaignName, els.assetsFolder, els.emailWidth, els.imageFormat].forEach((input) => {
    input.addEventListener('input', () => {
      state.generated = null;
      updateUi();
    });
  });

  updateUi();
})();
