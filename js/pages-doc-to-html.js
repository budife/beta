(function () {
  const DOC_VERSION = '1.0.4';

  const els = {
    app: document.getElementById('d2h-app'),
    dropzone: document.getElementById('d2h-dropzone'),
    fileInput: document.getElementById('d2h-file-input'),
    chooseBtn: document.getElementById('d2h-choose-btn'),
    filebar: document.getElementById('d2h-filebar'),
    workspace: document.getElementById('d2h-workspace'),
    fileIcon: document.getElementById('d2h-file-icon'),
    outputFileName: document.getElementById('d2h-output-name'),
    fileSize: document.getElementById('d2h-file-size'),
    resetBtn: document.getElementById('d2h-reset-btn'),
    messages: document.getElementById('d2h-messages'),
    preview: document.getElementById('d2h-preview'),
    htmlOutput: document.getElementById('d2h-html-output'),
    elementCount: document.getElementById('d2h-element-count'),
    copyBtn: document.getElementById('d2h-copy-btn'),
    copyBottomBtn: document.getElementById('d2h-copy-bottom-btn'),
    downloadBtn: document.getElementById('d2h-download-btn'),
    tabPreview: document.getElementById('d2h-tab-preview'),
    tabHtml: document.getElementById('d2h-tab-html'),
    panelPreview: document.getElementById('d2h-panel-preview'),
    panelHtml: document.getElementById('d2h-panel-html'),
    pdfMode: document.getElementById('d2h-pdf-mode'),
    pdfEditableBtn: document.getElementById('d2h-pdf-editable'),
    pdfImageBtn: document.getElementById('d2h-pdf-image'),
    pdfCancelBtn: document.getElementById('d2h-pdf-cancel')
  };

  let pendingPdfFile = null;

  const documentCss = `
    :root { color: #111; background: #ececec; font-family: Arial, Helvetica, sans-serif; }
    * { box-sizing: border-box; }
    body { width: min(210mm, calc(100% - 32px)); min-height: 297mm; margin: 24px auto; padding: 22mm 20mm; background: #fff; box-shadow: 0 2px 18px rgba(0,0,0,.14); font-size: 11pt; line-height: 1.35; }
    h1, h2, h3, h4, h5, h6 { margin: 1em 0 .45em; line-height: 1.2; page-break-after: avoid; }
    h1 { font-size: 18pt; } h2 { font-size: 15pt; } h3 { font-size: 12pt; }
    p { margin: 0 0 .65em; }
    .document-title { margin-bottom: .2em; text-align: center; font-size: 16pt; }
    .document-subtitle { margin-top: 0; text-align: center; font-weight: 700; }
    .center, .centered, .docx-center { text-align: center; }
    .docx-justify { text-align: justify; text-align-last: left; }
    p.docx-center { margin: 0; line-height: 1.15; }
    p.docx-center + p.docx-center { margin-top: .08em; }
    p.docx-center + ol { margin-top: 1.25em; }
    ol, ul { margin: .35em 0 .8em; padding-left: 2em; }
    ol.has-continuation { margin-bottom: .18em; }
    li { margin: .25em 0; padding-left: .2em; }
    li > p { margin: 0; }
    ol li > ul { list-style-type: circle; }
    .list-continuation-main { margin-left: 2em; }
    .list-continuation-sub { margin-left: 4em; }
    table.list-continuation-main { width: calc(100% - 2em); }
    table.list-continuation-sub { width: calc(100% - 4em); }
    ol.list-continuation-sub { margin-left: 2em; }
    table { width: 100%; margin: .85em 0 1.1em; border-collapse: collapse; page-break-inside: avoid; }
    th, td { padding: 6px 8px; border: 1px solid #222; vertical-align: top; }
    th { padding: 5px 8px; background: #d00000; color: #fff; text-align: center; vertical-align: middle; font-weight: 700; line-height: 1.12; }
    table tr:first-child td { font-weight: 700; text-align: center; }
    td p, th p { margin: 0; }
    img { max-width: 100%; height: auto; }
    a { color: #0645ad; overflow-wrap: anywhere; }
    blockquote { margin: .8em 1.5em; padding-left: 1em; border-left: 3px solid #aaa; color: #444; }
    .document-header { margin: -8mm 0 10mm; padding: 10px 0 24px; border-bottom: 1px solid #e5e5e5; }
    .hsbc-logo { display: block; width: 116px; height: auto; }
    .document-footer { margin-top: 14mm; padding: 0; color: #242424; font-size: 10pt; line-height: 1.45; text-align: left; }
    .regulatory-text { margin: 0 0 18px; font-size: 9pt; }
    .hsbc-divider { display: block; width: 100%; height: 2px; margin: 0 0 18px; }
    .footer-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
    .footer-heading { display: block; margin-bottom: 7px; font-size: 13pt; font-weight: 400; }
    .social-icons { display: flex; gap: 10px; align-items: center; }
    .social-icon { display: inline-grid; place-items: center; width: 23px; height: 23px; color: #242424; }
    .social-icon svg { display: block; width: 100%; height: 100%; fill: currentColor; }
    .contact-block { text-align: right; }
    @media (max-width: 700px) { body { width: 100%; min-height: 0; margin: 0; padding: 24px 18px; box-shadow: none; } .document-header { margin-top: 0; padding-top: 18px; padding-bottom: 24px; } .footer-columns { grid-template-columns: 1fr; } .contact-block { text-align: left; } }
    @media print { :root { background: #fff; } body { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; } @page { size: A4; margin: 20mm; } }
  `;

  const documentHeaderHtml = `
    <header class="document-header">
      <svg class="hsbc-logo" viewBox="0 0 145 38" role="img" aria-label="HSBC" xmlns="http://www.w3.org/2000/svg">
        <g fill="#000"><path d="M94.3 20.1h-6.7v6.6h-3.4V11.2h3.4v6.3h6.7v-6.3h3.4v15.5h-3.4z"/><path d="M105.8 27c-3.3 0-6.1-1.3-6.2-5h3.4c0 1.7 1 2.6 2.9 2.6 1.4 0 2.9-.7 2.9-2.2 0-1.2-1.1-1.6-2.8-2.1l-1.1-.3c-2.4-.7-4.9-1.7-4.9-4.4 0-3.5 3.2-4.6 6.2-4.6 3 0 5.6 1.1 5.6 4.5h-3.4c-.1-1.4-.9-2.2-2.5-2.2-1.2 0-2.5.7-2.5 2 0 1.1 1 1.5 3.2 2.2l1.3.4c2.7.8 4.3 1.8 4.3 4.3 0 3.5-3.4 4.8-6.4 4.8z"/><path d="M114.1 11.2h5.4c1.7 0 2.4 0 3 .2 1.9.4 3.3 1.7 3.3 3.7s-1.3 3-3.1 3.5c2.1.4 3.6 1.5 3.6 3.8 0 3.5-3.5 4.3-6.2 4.3h-6zm5.4 6.5c1.5 0 3-.3 3-2.1 0-1.6-1.4-2-2.8-2h-2.4v4.1zm.4 6.7c1.6 0 3.1-.4 3.1-2.3 0-1.8-1.3-2.3-2.9-2.3h-2.7v4.5z"/><path d="M135.2 27c-5 0-7.3-3.2-7.3-7.9s2.5-8.2 7.4-8.2c3.1 0 6.1 1.4 6.2 4.9H138c-.2-1.5-1.2-2.4-2.7-2.4-3 0-3.9 3.3-3.9 5.7 0 2.5.9 5.3 3.8 5.3 1.5 0 2.6-.8 2.9-2.4h3.5c-.4 3.7-3.2 5-6.4 5z"/></g>
        <g fill="#db0011"><path d="m59.6 37.5 18.5-18.5L59.6.5zM22.5 37.5 4 19 22.5.5zM59.6.5 41 19 22.5.5zM22.5 37.5 41 19l18.6 18.5z"/></g>
      </svg>
    </header>`;

  const documentFooterHtml = `
    <footer class="document-footer">
      <p class="regulatory-text">PT Bank HSBC Indonesia berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK) dan Bank Indonesia (BI).</p>
      <svg class="hsbc-divider" viewBox="0 0 600 2" preserveAspectRatio="none" role="img" aria-label="divider image"><path fill="#db0011" d="M0 0h600v2H0z"/></svg>
      <div class="footer-columns">
        <div><span class="footer-heading">Ikuti kami</span><div class="social-icons">
          <span class="social-icon" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v2H6v4h3v7h4v-7h3l1-4h-4V9c0-1 0-1 1-1z"/></svg></span>
          <span class="social-icon" aria-label="Twitter"><svg viewBox="0 0 24 24"><path d="M18.5 3h3.7l-8.1 9.2L23.6 21h-7.4l-5.8-7.6L3.7 21H0l8.7-9.9L-.4 3h7.6l5.2 6.9zm-1.3 16h2L6.1 4.9H4z"/></svg></span>
          <span class="social-icon" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm11 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg></span>
        </div></div>
        <div class="contact-block"><span class="footer-heading">Hubungi kami</span><div>1 500 700 (Premier)<br>1 500 808 (Non Premier)</div></div>
      </div>
    </footer>`;

  function wrapWithDocumentTemplate(content, embedInDocumentContent = true) {
    const inner = `${documentHeaderHtml}\n${content}\n${documentFooterHtml}`;
    return embedInDocumentContent ? `<main class="document-content">${inner}</main>` : inner;
  }

  const styleMap = [
    "p[style-name='DocuHTML Justified']:ordered-list(1) => ol > li.docx-justify:fresh",
    "p[style-name='DocuHTML Justified']:ordered-list(2) => ul|ol > li.docx-justify > ol > li.docx-justify:fresh",
    "p[style-name='DocuHTML Justified']:ordered-list(3) => ul|ol > li.docx-justify > ul|ol > li.docx-justify > ol > li.docx-justify:fresh",
    "p[style-name='DocuHTML Justified']:unordered-list(1) => ul > li.docx-justify:fresh",
    "p[style-name='DocuHTML Justified']:unordered-list(2) => ul|ol > li.docx-justify > ul > li.docx-justify:fresh",
    "p[style-name='DocuHTML Justified']:unordered-list(3) => ul|ol > li.docx-justify > ul|ol > li.docx-justify > ul > li.docx-justify:fresh",
    "p[style-name='Title'] => h1.document-title:fresh",
    "p[style-name='Judul'] => h1.document-title:fresh",
    "p[style-name='Subtitle'] => p.document-subtitle:fresh",
    "p[style-name='Subjudul'] => p.document-subtitle:fresh",
    "p[style-name='Centered'] => p.centered:fresh",
    "p[style-name='Center'] => p.center:fresh",
    "p[style-name='DocuHTML Centered'] => p.docx-center:fresh",
    "p[style-name='DocuHTML Justified'] => p.docx-justify:fresh",
    "p[style-name='List Paragraph'] => p:fresh",
    "p[style-name='Normal'] => p:fresh",
    "p[style-name='Body Text'] => p:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "p[style-name='Heading 5'] => h5:fresh",
    "p[style-name='Heading 6'] => h6:fresh",
    "p[style-name='Block Text'] => blockquote:p:fresh",
    "p[style-name='Quote'] => blockquote:p:fresh",
    "p[style-name='Intense Quote'] => blockquote:p:fresh"
  ];

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatHtmlWithTabs(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const blockTags = new Set([
      'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'FIELDSET',
      'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4',
      'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE',
      'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
    ]);
    const voidTags = new Set(['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR']);
    const indent = (depth) => '\t'.repeat(depth);
    const openingTag = (element) => {
      const attributes = [...element.attributes]
        .map((attribute) => ` ${attribute.name}="${escapeHtml(attribute.value)}"`)
        .join('');
      return `<${element.tagName.toLowerCase()}${attributes}>`;
    };

    function serializeNode(node, depth) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        return text ? `${indent(depth)}${text}` : '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tagName = node.tagName.toLowerCase();
      const opening = openingTag(node);
      if (voidTags.has(node.tagName)) return `${indent(depth)}${opening}`;

      const hasBlockChild = [...node.children].some((child) => blockTags.has(child.tagName));
      if (!hasBlockChild) {
        return `${indent(depth)}${opening}${node.innerHTML}</${tagName}>`;
      }

      const lines = [];
      let inlineBuffer = '';
      const flushInline = () => {
        const value = inlineBuffer.replace(/\s+/g, ' ').trim();
        if (!value) return;
        if (!lines.length && ['LI', 'TD', 'TH'].includes(node.tagName)) {
          lines.push(`${indent(depth)}${opening}${value}`);
        } else {
          if (!lines.length) lines.push(`${indent(depth)}${opening}`);
          lines.push(`${indent(depth + 1)}${value}`);
        }
        inlineBuffer = '';
      };

      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && blockTags.has(child.tagName)) {
          flushInline();
          if (!lines.length) lines.push(`${indent(depth)}${opening}`);
          lines.push(serializeNode(child, depth + 1));
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'BR') {
          flushInline();
          if (!lines.length) lines.push(`${indent(depth)}${opening}`);
          const lastLine = lines[lines.length - 1];
          if (lastLine?.trim().match(/^(<br>)+$/)) {
            lines[lines.length - 1] = `${lastLine}<br>`;
          } else {
            lines.push(`${indent(depth + 1)}<br>`);
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          inlineBuffer += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          inlineBuffer += child.outerHTML;
        }
      });
      flushInline();
      if (!lines.length) lines.push(`${indent(depth)}${opening}`);
      const lastLine = lines[lines.length - 1];
      if (
        ['LI', 'TD', 'TH'].includes(node.tagName)
        && lastLine.startsWith(`${indent(depth)}${opening}`)
        && !lastLine.includes(`</${tagName}>`)
      ) {
        lines[lines.length - 1] = `${lastLine}</${tagName}>`;
      } else {
        lines.push(`${indent(depth)}</${tagName}>`);
      }
      return lines.filter(Boolean).join('\n');
    }

    const formatted = [...template.content.childNodes]
      .map((node) => serializeNode(node, 0))
      .filter(Boolean)
      .join('\n');

    return formatted.replace(/^(\t*)<br>\n\1<br>(?:\n\1<br>)*$/gm, (match, whitespace) => {
      const count = match.split('\n').length;
      return `${whitespace}${'<br>'.repeat(count)}`;
    });
  }

  function normalizeFileNameCharacters(value) {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 100);
  }

  function sanitizeFileName(value) {
    let sanitized = normalizeFileNameCharacters(value.replace(/\.html$/i, ''))
      .replace(/^_+|_+$/g, '');
    if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(sanitized)) {
      sanitized = `${sanitized}_file`;
    }
    return sanitized || 'document';
  }

  function formatBytes(bytes) {
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  let currentFileName = 'document';

  async function normalizeDocxListLevels(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentFile = zip.file('word/document.xml');
    const numberingFile = zip.file('word/numbering.xml');
    if (!documentFile || !numberingFile) return arrayBuffer;

    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const documentXml = parser.parseFromString(await documentFile.async('text'), 'application/xml');
    const numberingXml = parser.parseFromString(await numberingFile.async('text'), 'application/xml');
    if (documentXml.querySelector('parsererror') || numberingXml.querySelector('parsererror')) return arrayBuffer;

    const wordValue = (element, name) => element?.getAttributeNS(wordNamespace, name)
      ?? element?.getAttribute(`w:${name}`)
      ?? null;
    const setWordValue = (element, name, value) => {
      element.setAttributeNS(wordNamespace, `w:${name}`, String(value));
    };

    const abstractNumbering = new Map(
      [...numberingXml.getElementsByTagNameNS(wordNamespace, 'abstractNum')]
        .map((element) => [wordValue(element, 'abstractNumId'), element])
    );
    const numberingInstances = new Map(
      [...numberingXml.getElementsByTagNameNS(wordNamespace, 'num')].map((element) => {
        const abstractId = wordValue(element.getElementsByTagNameNS(wordNamespace, 'abstractNumId')[0], 'val');
        return [wordValue(element, 'numId'), abstractId];
      })
    );

    const depthForIndent = (indent) => {
      if (indent <= 480) return 0;
      if (indent <= 1000) return 1;
      return 2;
    };

    [...documentXml.getElementsByTagNameNS(wordNamespace, 'p')].forEach((paragraph) => {
      const paragraphProperties = [...paragraph.children]
        .find((element) => element.localName === 'pPr' && element.namespaceURI === wordNamespace);
      const numberingProperties = paragraphProperties
        ? [...paragraphProperties.children].find((element) => element.localName === 'numPr' && element.namespaceURI === wordNamespace)
        : null;
      if (!numberingProperties) return;

      const numIdElement = [...numberingProperties.children]
        .find((element) => element.localName === 'numId' && element.namespaceURI === wordNamespace);
      const levelElement = [...numberingProperties.children]
        .find((element) => element.localName === 'ilvl' && element.namespaceURI === wordNamespace);
      const abstract = abstractNumbering.get(numberingInstances.get(wordValue(numIdElement, 'val')));
      const baseLevel = abstract
        ? [...abstract.children].find((element) => element.localName === 'lvl' && wordValue(element, 'ilvl') === '0')
        : null;
      if (!levelElement || !baseLevel) return;

      const directIndent = paragraphProperties.getElementsByTagNameNS(wordNamespace, 'ind')[0];
      const numberingIndent = baseLevel.getElementsByTagNameNS(wordNamespace, 'ind')[0];
      const rawIndent = wordValue(directIndent, 'left')
        ?? wordValue(directIndent, 'start')
        ?? wordValue(numberingIndent, 'left')
        ?? wordValue(numberingIndent, 'start');
      const indent = Number.parseInt(rawIndent, 10);
      if (!Number.isFinite(indent)) return;

      const depth = depthForIndent(indent);
      setWordValue(levelElement, 'val', depth);
      if (depth > 0) {
        [...abstract.children]
          .filter((element) => element.localName === 'numStyleLink' && element.namespaceURI === wordNamespace)
          .forEach((element) => element.remove());
        [...abstract.children]
          .filter((element) => element.localName === 'lvl' && wordValue(element, 'ilvl') === String(depth))
          .forEach((element) => element.remove());
        const clonedLevel = baseLevel.cloneNode(true);
        setWordValue(clonedLevel, 'ilvl', depth);
        abstract.append(clonedLevel);
      }
    });

    zip.file('word/document.xml', serializer.serializeToString(documentXml));
    zip.file('word/numbering.xml', serializer.serializeToString(numberingXml));
    return zip.generateAsync({ type: 'arraybuffer' });
  }

  async function extractTableHeaderStyles(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) return [];

    const parser = new DOMParser();
    const wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const documentXml = parser.parseFromString(await documentFile.async('text'), 'application/xml');
    if (documentXml.querySelector('parsererror')) return [];

    const wordValue = (element, name) => element?.getAttributeNS(wordNamespace, name)
      ?? element?.getAttribute(`w:${name}`)
      ?? null;

    const textColorForBackground = (hexColor) => {
      const value = hexColor.replace('#', '');
      if (!/^[0-9a-f]{6}$/i.test(value)) return '#ffffff';
      const red = Number.parseInt(value.slice(0, 2), 16);
      const green = Number.parseInt(value.slice(2, 4), 16);
      const blue = Number.parseInt(value.slice(4, 6), 16);
      const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
      return brightness > 150 ? '#111111' : '#ffffff';
    };

    return [...documentXml.getElementsByTagNameNS(wordNamespace, 'tbl')].map((table) => {
      const firstRow = table.getElementsByTagNameNS(wordNamespace, 'tr')[0];
      const cells = firstRow ? [...firstRow.getElementsByTagNameNS(wordNamespace, 'tc')] : [];
      return {
        cells: cells.map((cell) => {
          const shading = cell.getElementsByTagNameNS(wordNamespace, 'shd')[0];
          const fill = wordValue(shading, 'fill');
          if (!fill || fill === 'auto' || !/^[0-9a-f]{6}$/i.test(fill)) return {};
          const backgroundColor = `#${fill}`;
          return { backgroundColor, color: textColorForBackground(backgroundColor) };
        })
      };
    });
  }

  async function extractLeadingTitleBreakCount(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) return 0;

    const parser = new DOMParser();
    const wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const documentXml = parser.parseFromString(await documentFile.async('text'), 'application/xml');
    if (documentXml.querySelector('parsererror')) return 0;

    const wordValue = (element, name) => element?.getAttributeNS(wordNamespace, name)
      ?? element?.getAttribute(`w:${name}`)
      ?? null;
    const paragraphs = [...documentXml.getElementsByTagNameNS(wordNamespace, 'p')];
    let sawTitle = false;
    let emptyAfterTitle = 0;

    for (const paragraph of paragraphs) {
      const text = [...paragraph.getElementsByTagNameNS(wordNamespace, 't')]
        .map((node) => node.textContent).join('').trim();
      const justification = wordValue(paragraph.getElementsByTagNameNS(wordNamespace, 'jc')[0], 'val');
      if (!text) { if (sawTitle) emptyAfterTitle += 1; continue; }
      if (justification === 'center' && emptyAfterTitle === 0) { sawTitle = true; continue; }
      break;
    }
    return emptyAfterTitle;
  }

  function correctWordNumberingLevels(documentNode) {
    function visit(node) {
      if (node.type === 'paragraph' && !node.numbering && node.alignment === 'center') {
        node.styleName = 'DocuHTML Centered';
      }
      if (node.type === 'paragraph' && ['both', 'justify'].includes(node.alignment)) {
        const isSemanticHeading = /^(Title|Subtitle|Heading|Judul|Subjudul)/i.test(node.styleName || '');
        if (!isSemanticHeading) node.styleName = 'DocuHTML Justified';
      }
      node.children?.forEach(visit);
      return node;
    }
    return visit(documentNode);
  }

  function normalizeNumbering(html, tableHeaderStyles = [], leadingTitleBreakCount = 0) {
    const container = document.createElement('div');
    container.innerHTML = html.replaceAll('\u2013', '-');

    if (leadingTitleBreakCount > 0) {
      const leadingCentered = [];
      for (const child of [...container.children]) {
        if (child.matches('p.docx-center, p.center, p.centered')) leadingCentered.push(child);
        else break;
      }
      const titleEnd = leadingCentered.at(-1);
      for (let index = 0; titleEnd && index < leadingTitleBreakCount; index += 1) {
        titleEnd.after(document.createElement('br'));
      }
    }

    container.querySelectorAll('table').forEach((table, tableIndex) => {
      const firstRow = table.rows[0];
      const cells = firstRow ? [...firstRow.cells] : [];
      const headerStyle = tableHeaderStyles[tableIndex];
      const hasSourceHeaderFill = headerStyle?.cells?.some((cellStyle) => cellStyle.backgroundColor);
      if (cells.length && (hasSourceHeaderFill || cells.every((cell) => cell.querySelector('strong')))) {
        cells.forEach((cell) => {
          const header = document.createElement('th');
          [...cell.attributes].forEach((attribute) => header.setAttribute(attribute.name, attribute.value));
          header.innerHTML = cell.innerHTML;
          cell.replaceWith(header);
        });
      }
      if (headerStyle?.cells?.length) {
        [...(table.rows[0]?.cells ?? [])].forEach((cell, cellIndex) => {
          const cellStyle = headerStyle.cells[cellIndex];
          if (!cellStyle?.backgroundColor || cell.tagName !== 'TH') return;
          cell.style.backgroundColor = cellStyle.backgroundColor;
          cell.style.color = cellStyle.color;
        });
      }
      table.querySelectorAll('td').forEach((cell) => {
        const text = cell.textContent.replace(/\s+/g, ' ').trim();
        if (text && /^(?:Rp\s*)?\$?[\d\s.,]+$/.test(text)) cell.style.textAlign = 'right';
      });
    });

    const hasDirectContent = (element) => [...element.childNodes].some((node) => {
      if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent.trim());
      return node.nodeType === Node.ELEMENT_NODE && !['OL', 'UL'].includes(node.tagName);
    });

    const unwrapSingleEmptyListItem = (list) => {
      let current = list;
      while (
        current.children.length === 1
        && current.firstElementChild?.tagName === 'LI'
        && !hasDirectContent(current.firstElementChild)
        && current.firstElementChild.children.length === 1
        && ['OL', 'UL'].includes(current.firstElementChild.firstElementChild?.tagName)
      ) {
        current = current.firstElementChild.firstElementChild;
      }
      return current;
    };

    container.querySelectorAll('li').forEach((item) => {
      const nestedLists = [...item.children].filter((child) => ['OL', 'UL'].includes(child.tagName));
      const previousItem = item.previousElementSibling;
      if (!hasDirectContent(item) && nestedLists.length === 1 && previousItem?.tagName === 'LI') {
        previousItem.append(nestedLists[0]);
        item.remove();
      }
    });

    const firstTopList = container.querySelector(':scope > ol');
    const firstTopItem = firstTopList?.querySelector(':scope > li:last-child');
    const subList = firstTopItem?.querySelector(':scope > ol');
    const subLastItem = subList?.querySelector(':scope > li:last-child');
    const splitWrapper = [...container.querySelectorAll(':scope > ul')].find(
      (list) => list.querySelector(':scope > li > ol')
    );

    if (firstTopList && subList && subLastItem && splitWrapper) {
      let sibling = firstTopList.nextElementSibling;
      while (sibling && sibling !== splitWrapper) {
        const next = sibling.nextElementSibling;
        subLastItem.append(sibling);
        sibling = next;
      }
      const wrapperItem = splitWrapper.querySelector(':scope > li');
      [...wrapperItem.children].forEach((child) => {
        if (child.tagName === 'OL') {
          [...child.children].forEach((item) => subList.append(item));
        } else if (child.tagName === 'UL') {
          const nested = unwrapSingleEmptyListItem(child);
          if (nested.tagName === 'OL') { nested.type = 'i'; subLastItem.append(nested); }
          else subLastItem.append(nested);
        }
      });
      splitWrapper.remove();
    }

    container.querySelectorAll(':scope > ul').forEach((list) => {
      const previousListItem = list.previousElementSibling?.matches('ol')
        ? list.previousElementSibling.querySelector(':scope > li:last-child')
        : null;
      const nextIsContinuedNumbering = list.nextElementSibling?.matches('ol');
      if (previousListItem && nextIsContinuedNumbering) previousListItem.append(list);
    });

    function mergeInterruptedOrderedLists(parent) {
      let list = parent.firstElementChild;
      while (list) {
        if (list.tagName !== 'OL') { list = list.nextElementSibling; continue; }
        let cursor = list.nextElementSibling;
        const interruptedContent = [];
        while (cursor && cursor.tagName !== 'OL' && unwrapSingleEmptyListItem(cursor).tagName !== 'OL') {
          const next = cursor.nextElementSibling;
          interruptedContent.push(cursor);
          cursor = next;
        }
        if (!cursor) { list = list.nextElementSibling; continue; }
        const lastItem = list.querySelector(':scope > li:last-child');
        if (lastItem) {
          const continuationList = cursor.tagName === 'OL' ? cursor : unwrapSingleEmptyListItem(cursor);
          let nestedContinuationTarget = cursor.tagName !== 'OL'
            ? lastItem.querySelector(':scope > ol:last-of-type')
            : null;
          if (cursor.tagName !== 'OL' && !nestedContinuationTarget) {
            nestedContinuationTarget = document.createElement('ol');
            interruptedContent.forEach((element) => lastItem.append(element));
            lastItem.append(nestedContinuationTarget);
            [...continuationList.children].forEach((item) => nestedContinuationTarget.append(item));
          } else if (nestedContinuationTarget) {
            const nestedLastItem = nestedContinuationTarget.querySelector(':scope > li:last-child');
            interruptedContent.forEach((element) => nestedLastItem?.append(element));
            [...continuationList.children].forEach((item) => nestedContinuationTarget.append(item));
          } else {
            interruptedContent.forEach((element) => lastItem.append(element));
            [...continuationList.children].forEach((item) => list.append(item));
          }
          cursor.remove();
          continue;
        }
        list = list.nextElementSibling;
      }
    }

    mergeInterruptedOrderedLists(container);
    container.querySelectorAll('li').forEach((item) => mergeInterruptedOrderedLists(item));

    const directOrderedLists = [...container.querySelectorAll(':scope > ol')];
    let nextTopLevelNumber = 1;
    directOrderedLists.forEach((list) => {
      list.removeAttribute('type');
      list.start = nextTopLevelNumber;
      nextTopLevelNumber += list.querySelectorAll(':scope > li').length;
    });

    function formatNestedLists(parent, depth = 1) {
      [...parent.children].forEach((child) => {
        if (child.tagName === 'OL') {
          child.type = depth === 1 ? 'a' : 'i';
          child.removeAttribute('start');
          [...child.children].forEach((item) => formatNestedLists(item, depth + 1));
        }
        if (child.tagName === 'UL') {
          [...child.children].forEach((item) => formatNestedLists(item, depth + 1));
        }
      });
    }

    directOrderedLists.forEach((list) => {
      [...list.children].forEach((item) => formatNestedLists(item));
    });

    const mainLists = [...container.querySelectorAll(':scope > ol:not([data-list-level])')];
    mainLists.forEach((list) => {
      const lastItem = list.querySelector(':scope > li:last-child');
      const continuationClass = lastItem?.querySelector(':scope > ol, :scope > ul')
        ? 'list-continuation-sub'
        : 'list-continuation-main';
      let sibling = list.nextElementSibling;
      let hasContinuation = false;
      while (sibling && !mainLists.includes(sibling)) {
        if (sibling.matches('p, table, ol[data-list-level]')) {
          sibling.classList.add(continuationClass);
          hasContinuation = true;
        }
        sibling = sibling.nextElementSibling;
      }
      list.classList.toggle('has-continuation', hasContinuation);
    });

    removeParagraphTags(container);
    return container.innerHTML;
  }

  function removeParagraphTags(container) {
    container.querySelectorAll('p').forEach((paragraph) => {
      if (!paragraph.closest('ol, ul, li, table')) return;
      const parent = paragraph.parentElement;
      const childNodes = [...parent.childNodes];
      const idx = childNodes.indexOf(paragraph);
      const hasTextBefore = childNodes.slice(0, idx).some((node) => node.nodeType === Node.TEXT_NODE ? Boolean(node.textContent.trim()) : node.nodeType === Node.ELEMENT_NODE);
      const hasTextAfter = childNodes.slice(idx + 1).some((node) => node.nodeType === Node.TEXT_NODE ? Boolean(node.textContent.trim()) : node.nodeType === Node.ELEMENT_NODE);
      if (hasTextBefore) paragraph.before(document.createElement('br'));
      [...paragraph.childNodes].forEach((child) => paragraph.before(child));
      if (hasTextAfter) paragraph.before(document.createElement('br'));
      paragraph.remove();
    });
  }

  function setBusy(busy) {
    els.dropzone.classList.toggle('busy', busy);
    els.chooseBtn.innerHTML = busy
      ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Converting...'
      : '<i class="fa-solid fa-file-circle-plus" aria-hidden="true"></i> Choose DOCX / PDF File';
  }

  function renderPreview(html) {
    els.preview.innerHTML = `<style>${documentCss}</style>${wrapWithDocumentTemplate(html)}`;
  }

  async function convertFile(file) {
    const ext = file?.name?.toLowerCase().split('.').pop();
    if (!file || (ext !== 'docx' && ext !== 'pdf')) {
      alert('Please choose a .docx or .pdf file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds the 20 MB limit.');
      return;
    }

    setBusy(true);
    try {
      if (ext === 'pdf') {
        await convertPdf(file);
      } else {
        await convertDocx(file);
      }
      els.dropzone.classList.add('d2h-hidden');
      els.filebar.classList.remove('d2h-hidden');
      els.workspace.classList.remove('d2h-hidden');
    } catch (error) {
      console.error(error);
      alert('Unable to convert this document. Make sure the file is not corrupted or password-protected.');
    } finally {
      setBusy(false);
    }
  }

  async function convertDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const tableHeaderStyles = await extractTableHeaderStyles(arrayBuffer);
    const leadingTitleBreakCount = await extractLeadingTitleBreakCount(arrayBuffer);
    const conversion = await mammoth.convertToHtml({ arrayBuffer }, {
      includeDefaultStyleMap: true,
      styleMap,
      transformDocument: correctWordNumberingLevels,
      convertImage: mammoth.images.imgElement((image) => image.read('base64').then((data) => ({
        src: `data:${image.contentType};base64,${data}`
      })))
    });

    const normalizedHtml = normalizeNumbering(conversion.value, tableHeaderStyles, leadingTitleBreakCount);
    currentFileName = sanitizeFileName(file.name.replace(/\.docx$/i, ''));
    els.outputFileName.value = currentFileName;
    els.fileSize.textContent = formatBytes(file.size);
    els.fileIcon.textContent = 'W';
    renderPreview(normalizedHtml || '<p>Document has no convertible content.</p>');
    els.htmlOutput.value = formatHtmlWithTabs(normalizedHtml);
    const count = els.preview.querySelectorAll('*').length;
    els.elementCount.textContent = `${count} elements`;

    if (conversion.messages.length) {
      els.messages.textContent = `${conversion.messages.length} conversion note(s) - some Word formatting may be simplified.`;
      els.messages.classList.remove('d2h-hidden');
    } else {
      els.messages.classList.add('d2h-hidden');
    }
  }

  async function convertPdf(file) {
    pendingPdfFile = file;
    els.dropzone.classList.add('d2h-hidden');
    els.pdfMode.classList.remove('d2h-hidden');
    setBusy(false);
  }

  async function convertPdfEditable(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    let pagesHtml = '';

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      let lastY = null;
      let pageContent = '';

      textContent.items.forEach((item) => {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          pageContent += '<br>';
        }
        const style = item.fontName?.includes('Bold') ? 'font-weight:700;' : '';
        const fontSize = Math.round(Math.abs(item.height) * 0.75) || 11;
        pageContent += `<span style="${style}font-size:${fontSize}pt;">${escapeHtml(item.str)}</span>`;
        lastY = y;
      });

      pagesHtml += `<div class="pdf-page-content">\n${pageContent}\n</div>\n`;
    }

    currentFileName = sanitizeFileName(file.name.replace(/\.pdf$/i, ''));
    els.outputFileName.value = currentFileName;
    els.fileSize.textContent = formatBytes(file.size);
    els.fileIcon.textContent = 'PDF';

    const fullHtml = wrapWithDocumentTemplate(pagesHtml);
    renderPreview(fullHtml);
    els.htmlOutput.value = formatHtmlWithTabs(fullHtml);
    els.elementCount.textContent = `${totalPages} pages`;
    els.messages.textContent = `PDF converted as editable text (${totalPages} pages). Layout may differ slightly from original.`;
    els.messages.classList.remove('d2h-hidden');
  }

  async function convertPdfImage(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const scale = 2;

    let pagesHtml = '';

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgDataUrl = canvas.toDataURL('image/png');
      pagesHtml += `<div class="pdf-page"><img src="${imgDataUrl}" alt="Page ${i}" style="width:100%;height:auto;display:block;"><p class="pdf-page-label">Page ${i} of ${totalPages}</p></div>\n`;
    }

    currentFileName = sanitizeFileName(file.name.replace(/\.pdf$/i, ''));
    els.outputFileName.value = currentFileName;
    els.fileSize.textContent = formatBytes(file.size);
    els.fileIcon.textContent = 'PDF';

    const fullHtml = wrapWithDocumentTemplate(pagesHtml);
    renderPreview(fullHtml);
    els.htmlOutput.value = formatHtmlWithTabs(fullHtml);
    els.elementCount.textContent = `${totalPages} pages`;
    els.messages.textContent = `PDF converted as ${totalPages} page image(s). Text is not editable in HTML.`;
    els.messages.classList.remove('d2h-hidden');
  }

  function buildFullDocument() {
    const titleTemplate = document.createElement('template');
    titleTemplate.innerHTML = els.htmlOutput.value;
    const documentTitle = [...titleTemplate.content.querySelectorAll(':scope > p.docx-center, :scope > p.center, :scope > p.centered')]
      .map((element) => element.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' ')
      || currentFileName;
    const safeTitle = escapeHtml(documentTitle);
    const isPdf = els.htmlOutput.value.includes('pdf-page');
    if (isPdf) {
      return `<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${safeTitle}</title>\n<style>body{margin:0;padding:24px;background:#e8e8e8;font-family:Arial,sans-serif;}.pdf-pages{max-width:min(210mm,calc(100% - 48px));margin:0 auto;}.pdf-page{background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.12);margin-bottom:20px;}.pdf-page img{display:block;width:100%;height:auto;}.pdf-page-label{padding:6px 0;text-align:center;color:#6b7280;font-size:12px;}</style>\n</head>\n<body>\n${els.htmlOutput.value}\n</body>\n</html>`;
    }
    const bodyHtml = formatHtmlWithTabs(wrapWithDocumentTemplate(els.htmlOutput.value, false));
    return `<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${safeTitle}</title>\n<style>${documentCss}</style>\n</head>\n<body>\n${bodyHtml}\n</body>\n</html>`;
  }

  async function copyHtml(button) {
    await navigator.clipboard.writeText(buildFullDocument());
    const oldText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => { button.textContent = oldText; }, 1600);
  }

  function downloadHtml() {
    const fullDocument = buildFullDocument();
    const url = URL.createObjectURL(new Blob([fullDocument], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${currentFileName}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function switchTab(tab) {
    const isPreview = tab === 'preview';
    els.tabPreview.classList.toggle('is-active', isPreview);
    els.tabHtml.classList.toggle('is-active', !isPreview);
    els.panelPreview.classList.toggle('d2h-hidden', !isPreview);
    els.panelHtml.classList.toggle('d2h-hidden', isPreview);
  }

  els.tabPreview.addEventListener('click', () => switchTab('preview'));
  els.tabHtml.addEventListener('click', () => switchTab('html'));

  els.chooseBtn.addEventListener('click', (event) => { event.stopPropagation(); els.fileInput.click(); });
  els.dropzone.addEventListener('click', () => els.fileInput.click());
  els.dropzone.addEventListener('keydown', (event) => { if (['Enter', ' '].includes(event.key)) els.fileInput.click(); });
  els.fileInput.addEventListener('change', () => convertFile(els.fileInput.files[0]));
  ['dragenter', 'dragover'].forEach((name) => els.dropzone.addEventListener(name, (event) => { event.preventDefault(); els.dropzone.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((name) => els.dropzone.addEventListener(name, (event) => { event.preventDefault(); els.dropzone.classList.remove('dragging'); }));
  els.dropzone.addEventListener('drop', (event) => convertFile(event.dataTransfer.files[0]));
  els.resetBtn.addEventListener('click', () => {
    els.filebar.classList.add('d2h-hidden');
    els.workspace.classList.add('d2h-hidden');
    els.pdfMode.classList.add('d2h-hidden');
    els.dropzone.classList.remove('d2h-hidden');
    els.fileInput.value = '';
  });
  els.pdfEditableBtn.addEventListener('click', async () => {
    els.pdfMode.classList.add('d2h-hidden');
    setBusy(true);
    try {
      await convertPdfEditable(pendingPdfFile);
      els.dropzone.classList.add('d2h-hidden');
      els.filebar.classList.remove('d2h-hidden');
      els.workspace.classList.remove('d2h-hidden');
    } catch (error) {
      console.error(error);
      alert('Unable to convert this PDF. Make sure the file is not corrupted or password-protected.');
      els.dropzone.classList.remove('d2h-hidden');
    } finally {
      setBusy(false);
      pendingPdfFile = null;
    }
  });
  els.pdfImageBtn.addEventListener('click', async () => {
    els.pdfMode.classList.add('d2h-hidden');
    setBusy(true);
    try {
      await convertPdfImage(pendingPdfFile);
      els.dropzone.classList.add('d2h-hidden');
      els.filebar.classList.remove('d2h-hidden');
      els.workspace.classList.remove('d2h-hidden');
    } catch (error) {
      console.error(error);
      alert('Unable to convert this PDF. Make sure the file is not corrupted or password-protected.');
      els.dropzone.classList.remove('d2h-hidden');
    } finally {
      setBusy(false);
      pendingPdfFile = null;
    }
  });
  els.pdfCancelBtn.addEventListener('click', () => {
    els.pdfMode.classList.add('d2h-hidden');
    els.dropzone.classList.remove('d2h-hidden');
    pendingPdfFile = null;
  });
  els.copyBtn.addEventListener('click', (event) => copyHtml(event.currentTarget));
  els.copyBottomBtn.addEventListener('click', (event) => copyHtml(event.currentTarget));
  els.downloadBtn.addEventListener('click', downloadHtml);
  els.outputFileName.addEventListener('input', (event) => {
    const normalized = normalizeFileNameCharacters(event.currentTarget.value);
    event.currentTarget.value = normalized;
    currentFileName = normalized || 'document';
  });
  els.outputFileName.addEventListener('blur', (event) => {
    currentFileName = sanitizeFileName(event.currentTarget.value);
    event.currentTarget.value = currentFileName;
  });
  els.htmlOutput.addEventListener('input', () => {
    renderPreview(els.htmlOutput.value);
  });
})();
