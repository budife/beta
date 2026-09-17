---
title: Documentation
description: Complete documentation for workflows, local data security, external connections, backups, and tool audits.
icon: fa-solid fa-book-open
category: Reference
---

## On This Page

- [Security proof](#security-proof)
- [Security summary](#privacy-network-behavior)
- [Data by tool](#data-handling-by-tool-plain-english-summary)
- [Network controls](#network-settings)
- [Local backup](#local-data-backup)
- [Recovery and audit](#recovery-and-audit)
- [Credits](#credits)

Use the search field to find a tool, data type, setting, filename, or error message quickly. This page combines the former Documentation and Maintenance pages and includes an auditable security proof.

## Security Proof

The detailed, source-based evidence and reproducible audit steps are in **Security Proof And Audit Evidence** below. The short result is: BETA has no silent upload path for local work files; only deliberately entered public URLs and declared static libraries can use the network.

## Privacy & Network Behavior

eDM Helper is a local-first static web application. Local files and campaign data are processed by JavaScript in the browser. There is no application upload endpoint, server-side campaign database, or automatic cloud sync for local work data.

- Local files and work data stay in the browser or a folder explicitly selected by the user unless the user deliberately uses an external URL workflow.
- External requests are limited to the optional URL workflows and static libraries identified in the table below.

:::details What can contact a third-party service?

- Layout Checker may send an entered public layout URL to its selected fetch provider or proxy.
- Database Checker may request an entered public layout URL when Layout Test uses a URL instead of pasted HTML.
- Browser pages may request CDN libraries such as Font Awesome, Mammoth, CodeMirror, html2canvas, JSZip, or PDF.js.

These flows do not intentionally upload local files, PDFs, DOCX files, customer databases, Campaign Counter data, or WFH marks. URL providers receive only the public URL required for the selected request.
:::

## Network Settings

Use these controls before working with stricter campaign data. Settings are saved in this browser only.

- Turn off external URL checks to prevent optional URL fetch workflows.
- Turn off proxy fallback to prevent third-party proxy requests.

{{privacy-settings}}

## Data Handling By Tool - Plain-English Summary

| Tool | What stays on this computer | What may go online |
| --- | --- | --- |
| Campaign Counter | Counter, activity, folder scan, JSON backup | **Nothing from the tool** |
| Config eDM | XML files, edits, and selected folders | **Nothing from the tool** |
| Database Checker | **Database files stay on this computer.** Pasted HTML and validation results are also local. | **The database never leaves BETA. Only the public layout URL you deliberately enter may be requested during Layout Test.** |
| Database Generator | Customer inputs and generated files | **Nothing from the tool** |
| DOCX to HTML | DOCX conversion, edits, and generated HTML | **Program libraries may load from a CDN; your DOCX does not** |
| Layout Checker | Pasted HTML, customer test values, and local preview | **Only a URL you choose to fetch, plus optional image/screenshot libraries** |
| Layout Slicer | PDF/image processing, slices, and selected folders | **PDF.js may load from a CDN; your PDF/image does not** |
| TNC Uploader | PDF queue, history, selected folder, and generated links | **Nothing; there is no automatic PDF upload or link checker** |
| Text Correction | Pasted text and corrected output | **Nothing from the tool** |
| WFH Tracker | Calendar marks, statistics, and built-in holidays | **Nothing from the tool** |
| Bookmarklet | Browser-local helper data | **It runs on the page where you deliberately click it** |

## Security Proof And Audit Evidence

This section is a source-level proof that local work data is not silently uploaded. It is intentionally specific so another developer can reproduce the audit.

| Proof check | Evidence in this repository | Result |
| --- | --- | --- |
| No application upload endpoint | Static app contains no backend upload route; standalone tools use Blob downloads and selected File System Access folders | Local files have no automatic BETA upload path |
| Campaign Counter storage | `js/campaign-counter-local.js` uses `localStorage`; `js/pages-campaign-counter.js` uses folder picker and Blob export | Counter and JSON backup stay local |
| WFH storage | `js/pages-wfh-tracker.js` opens IndexedDB `CalendarDB`; holiday data is bundled in the script | Marks and holiday data stay local |
| TNC storage | `js/pages-tnc-uploader.js` uses browser storage and selected folder actions | PDF queue/history stay local; no PDF upload |
| Config storage | `js/pages-config.js` uses selected folders and `localStorage` | XML state stays local |
| Generated files | Generator, DOCX, Layout Slicer, and Layout Checker use `Blob`, download, canvas, or selected folder APIs | Output leaves the browser only when the user downloads/saves it |
| URL requests | `pages-database-checker.js` and `pages-layout-checker.js` call `fetch` only for entered URL workflows | Only the deliberately entered URL can follow the external path |
| CDN requests | HTML pages reference Font Awesome and selected conversion/rendering libraries | Static library requests may expose normal browser request metadata, not local work files |

### Reproducible browser audit

1. Open the deployed tool in Edge or Chrome.
2. Open DevTools with `F12`, select the **Network** tab, and enable **Preserve log**.
3. Clear the network log and perform one workflow at a time.
4. For a local-only tool, select local files, generate output, and confirm requests are limited to the app shell and any declared static CDN assets.
5. For Database Checker or Layout Checker, paste HTML instead of entering a URL and disable external checks/proxy fallback in Documentation.
6. If a request appears, inspect its URL, method, and request payload. Local files should not appear in the request body for the documented workflows.
7. Inspect browser Application storage to see `localStorage` and IndexedDB records; these are origin-local and are not server databases.

### What this proof does and does not claim

- It proves that BETA has no silent application upload path for local campaign files, PDFs, DOCX files, database data, Campaign Counter state, or WFH marks.
- It does not claim that a browser, operating system, browser extension, hosting provider, CDN, or manually opened external website cannot observe ordinary network metadata.
- It does not claim that an external public URL is private after the user chooses to fetch it.
- It does not claim that a file is safe after the user manually uploads it to another website or copies it into another service.
- The safest mode is: paste content instead of entering URLs, disable external checks and proxy fallbacks, and mirror optional CDN libraries locally when the environment requires zero third-party requests.

## Backup Recovery Notes

Backup files are generated and downloaded by the browser. They are not uploaded by eDM Helper.

{{local-backup}}

## Recovery And Audit

- Importing a backup changes matching local browser data only.
- Folder permissions are managed by the browser and are not included in backups.
- Campaign Counter also has its own JSON Export/Import controls.
- Browser DevTools Network can audit requests while a tool is running.
- For strict mode, disable external URL checks and proxy fallback, paste HTML instead of entering a layout URL, and mirror CDN assets locally.

## Technical Audit

- Static HTML, CSS, and JavaScript are served without a backend upload API.
- Local storage uses browser `localStorage`, IndexedDB, and user-selected File System Access folders.
- The source code is available in the repository for review.
- External URL paths are limited to explicitly used Layout Checker and Database Checker URL workflows.

## Global Navigation

The app uses clean SPA routes with a fixed sidebar. Opening a tool changes only the content area, while sidebar and footer stay in place.

- Home: `/`
- Docs: `/docs`
- Legacy Maintenance URL: `/maintenance` (opens this page)
- Bookmarklet: `/bookmarklet`
- Campaign Counter: `/campaign-counter`
- Config eDM: `/config-edm`
- Layout Checker: `/layout-checker`
- Layout Slicer: `/layout-slicer`
- TNC Uploader: `/tnc-uploader`
- WFH Tracker: `/wfh-tracker`

## Bookmarklet

:::details Purpose

Bookmarklet contains small browser helpers for web pages and Monday workflows. It is meant to reduce repetitive browser actions while keeping actions manual and visible.
:::

:::details Campaign ID Tracker bookmarklet

The Campaign ID Tracker bookmarklet can load local Monday XLSX data, show used campaign IDs by series, and help select the next available ID. Data stays in browser-local storage.

If Monday subitems are collapsed in the visible page, browser scanning cannot read them. Export/upload XLSX when complete campaign ID coverage is needed.
:::

:::details Data process and privacy

1. The bookmarklet runs only after you activate it on the current browser page.
2. Typo Scanner reads visible text and highlights matches locally.
3. Campaign ID data comes from a selected local XLSX file or browser-local IndexedDB data.
4. Copy and export use browser clipboard or download APIs.

**Data path:** browser page or selected file → browser JavaScript → screen, clipboard, download, or IndexedDB. There is no BETA upload endpoint or Supabase sync. The bookmarklet can interact with the page where you deliberately click it; that page is outside BETA’s control.
:::

## Campaign Counter

:::details Purpose

Campaign Counter stores the current Campaign ID, activity, folder scans, and JSON backups locally in this browser.
:::

:::details Workflow

- Enter a name once, then use Generate, Back, or manual adjustment.
- Scan a campaign folder to detect existing four-digit IDs and conflicts.
- Export a JSON backup before moving to another browser or clearing data.
- Import a JSON backup and choose Replace or Merge.
- Use Reset only when you want to clear the saved folder scan.
:::

:::details Reblast behavior

The same campaign number can appear multiple times for reblast scenarios. Folder scanning groups duplicate numbers and shows all related campaign names, dates, and managers in the details view.
:::

:::details Data process and privacy

1. Generate, Back, and manual adjustment use the current browser-local counter.
2. Counter, activity, username, and folder scans are stored in `localStorage`.
3. Folder scanning reads only the directory selected through the browser picker.
4. Export downloads JSON with a `YYYYMMDD-HHmmss` timestamp; Import replaces or merges selected JSON data.

**Data path:** typed values or selected folder → JavaScript → `localStorage`, screen, or local JSON download. No `fetch`, upload endpoint, database server, or third-party sync is used.
:::


## Config eDM

:::details Purpose

Config eDM edits campaign XML config values such as Campaign ID, Subject, and Link. It is designed for fast repeated edits across many XML files.
:::

:::details Workflow

- Open a folder containing XML files.
- Select an XML file from the sidebar.
- Update Campaign ID, Subject, and Link.
- Use PROD/UAT toggle to add or remove the `-UAT` suffix.
- Use NOW to update the `YYYYMMDD` date segment to today.
- Apply changes.
- Use Back / Next XML for file-by-file processing.
:::

:::details Editing behavior

After paste/apply, fields can auto-select for quick replacement. Selection can be cancelled and fields can still be edited manually. The workflow is local and does not upload XML files.
:::

:::details Data process and privacy

1. The browser reads XML files from a folder selected by the user.
2. XML values are parsed and edited in memory.
3. Apply writes output to a local download or selected folder.
4. Draft state is kept in `localStorage` for same-browser recovery.

**Data path:** selected XML files → browser parser and form state → local download or selected folder. XML contents are not sent to a remote endpoint. URLs typed into XML fields are campaign output values, not requests made by the tool.
:::

## Database Checker

:::details Purpose and workflow

Select or drop the supported database files, run validation, and review filenames, dates, email relationships, KRHRED values, package structure, warnings, and optional CSV reports. Validation workers run locally in the browser.
:::

:::details Data process and privacy

Normal validation stays in the browser. **The selected database files never leave BETA and are never attached to an external request.** If Layout Test is run with a public layout URL, only that entered URL may be fetched directly or through an enabled proxy provider. Disable `externalChecks` and `proxyFallbacks` for strict local-only validation.
:::

## Database Generator

:::details Purpose and workflow

Enter or paste customer and KRHRED values, review the generated TXT/CSV/XML preview, then download the files or save them to a folder selected through the browser.
:::

:::details Data process and privacy

Customer inputs and generated files are processed locally in memory. Download and Save to Folder use browser Blob and File System Access APIs. No network request is required and source customer data is not uploaded.
:::

## DOCX to HTML

:::details Purpose and workflow

Select a DOCX, convert it to editable HTML in the browser, review or edit the preview, then download the HTML or save it to a selected folder.
:::

:::details Data process and privacy

The DOCX is parsed locally by browser libraries and is not posted to a BETA server. The page may download Mammoth, JSZip, CodeMirror, and Font Awesome libraries from a CDN; these are program assets, not the selected DOCX.
:::

## Layout Checker

:::details Purpose

Layout Checker loads or accepts HTML source, detects KRHRED placeholders, applies test values, and previews the personalized eDM layout before publishing.
:::

:::details Workflow

- Paste a layout URL or open an HTML file.
- Use Code/Preview tabs to inspect source and rendered output.
- Enter KRHRED values manually or paste bulk values.
- Apply values.
- Toggle KRHRED highlighting in preview when needed.
- Reset values to restore the original placeholders.
:::

:::details Data process and privacy

1. Pasted HTML stays in the browser preview; a URL workflow fetches only the URL entered by the user.
2. KRHRED placeholders and customer test values are processed locally.
3. Screenshot capture may load `html2canvas` from a CDN.
4. HTML, screenshots, and reports are downloaded locally when requested.

**Data path:** pasted HTML → local preview → screen/download. A URL workflow may contact the target or selected proxy/image provider, but local database files, pasted local HTML, and test values are not attached automatically. Disable external checks and proxy fallback for strict local-only testing.
:::

## Layout Slicer

:::details Copy Folder

Choose the template folder, then choose the output parent folder. The new campaign name becomes the outer project folder; the editable `Root/Team/Year/Campaign Folder` eDM structure is created inside it. Copy Folder lists only direct child folders and lets each HTML file keep its original name or receive a new name before copying. The preview updates as names change. After a successful copy, use Copy Path or Duplicate Another; browsers cannot force-open Windows Explorer, but Open Folder opens the selected handle in the browser folder picker when supported.
:::

:::details Purpose

Layout Slicer turns a flat JPG or PNG eDM mockup into ordered image slices. It uses guide lines first, then generates image assets only when output is generated.
:::

:::details Workflow

- Drop or choose a JPG/PNG layout.
- Use the top and left rulers to read position.
- Click the preview once to add a horizontal guide line.
- Drag guide lines to adjust them.
- Generate slices.
- Download the generated images or save them into a selected local folder.
:::

:::details Data process and privacy

1. JPG, PNG, and PDF inputs are decoded with browser image/canvas APIs and PDF.js.
2. Guides, slices, and generated image Blobs remain in browser memory.
3. Downloads and Save to Folder write only to locations selected by the user.
4. PDF.js may load from a CDN, but source images, PDFs, and copied folders are not uploaded.
:::

:::details Campaign location helper

The Location panel can copy an existing template folder into a new campaign path.

- Choose the template folder to copy.
- Choose the campaign parent folder as the save target, for example `MKT/2026`.
- Fill HTML File Name first, for example `1112 ANA Premium Pertralite 06-17 Bianca`.
- The helper can parse campaign number, short blast date, prefix, and manager from that name.
- You can still edit Campaign No, Blast Date, Manager, or Prefix manually after parsing.
- The tool creates `NNNN-YYYYMMDD-MGR/emailblast/MKT/YYYY/NNNN-YYYYMMDD-MGR`.
- Do not choose an existing campaign folder as the target parent, otherwise the campaign folder would be nested inside another campaign folder.
- HTML files are scanned when the template folder is selected. Rename only happens when the manual Rename selected HTML button is clicked.
- The target path preview can be copied for reference.
- After copy, HTML files in the copied folder are listed so the selected ID/INDO file can be renamed to the final campaign HTML filename.

Folder copying uses the browser File System Access API and stays local.
:::

:::details Export quality and width

Layout Slicer exports each slice using the selected Export Width. The preview metadata shows both the original source dimensions and the current export settings so the source and output sizes stay clear.

JPG export uses the selected browser quality. Browser Canvas export does not reliably write 300dpi metadata, but email and webmail rendering depends on pixel dimensions, so choosing the right export width is the important part.
:::

## TNC Uploader

:::details Purpose

TNC Uploader prepares PDF files for the `emailblast/MKT/YYYY/tnc` folder structure, generates the final public link, and can save renamed PDFs into a selected local folder.
:::

:::details Workflow

- Choose year and market.
- Choose save folder.
- Drop PDF files into the queue.
- Review each file item and generated link.
- Save to folder or download renamed files.
- Copy links per item or copy all links.
:::

:::details Replace PDF link mode

Use Replace PDF link when an existing public PDF URL must be replaced. Paste the old PDF link and the tool derives year, target folder, and final filename from the old URL.
:::

:::details Data process and privacy

1. Dropped PDFs are queued and renamed locally.
2. Queue and activity history use browser `localStorage`.
3. Save to Folder and Download create local output; generated public links are text values.
4. There is no PDF upload endpoint or automatic link checker.
:::

## WFH Tracker

:::details Purpose

WFH Tracker marks WFH/WFO days on a monthly calendar and shows a compact monthly summary.
:::

:::details Workflow

- Click a normal work day once for WFH.
- Click again for WFO.
- Click again to clear the day.
- Use Today to return to the current month.
- Use Clear to remove WFH/WFO marks for the current month.
:::

:::details Colors

- WFH: yellow.
- WFO: green.
- Holiday/cuti bersama: red.
- Weekend: grey.
:::

:::details Data process and privacy

1. Calendar marks and summaries are calculated in the browser.
2. Calendar state is stored in IndexedDB on the current device.
3. Holiday and cuti bersama dates are bundled in the tool source.
4. WFH/WFO marks are not sent to a server by the tool.
:::

## Release Workflow

:::details Versioning

eDM Helper now uses two version layers:

- **Core version** tracks the shared shell, sidebar, router, footer, shared style, and deployment cache-busters.
- **Tool versions** track each tool independently in `js/tool-versions.js`.

Stable tools show a small subtle badge in the tool header. Beta tools show a clearer amber `beta` badge. Home keeps the global Core version because it describes the whole app shell.
:::

:::details Header privacy labels

Tool headers show a privacy label explaining where the tool's data is processed and whether an optional network path exists. The label describes capability, not an automatic upload.

| Badge | Meaning | Tools |
| --- | --- | --- |
| **Local only** | Local files and work data stay in the browser or a user-selected folder. The tool has no required third-party data request. | Bookmarklet, Config eDM, Campaign Counter, Database Generator, TNC Uploader, Text Correction, WFH Tracker, Documentation |
| **External checks optional** | The core workflow is local, but an entered public URL can be fetched when the related external check is used and enabled. | Database Checker |
| **Local + CDN assets** | Work data is processed locally, but the page may download static libraries from a CDN. | DOCX to HTML, Layout Slicer |
| **External + CDN assets** | The tool may fetch an entered public layout URL through a selected provider/proxy and may download static CDN libraries. | Layout Checker |

How to read the badge:

- **Local** refers to campaign files, pasted content, generated output, and tool state being processed in the browser or selected local folder.
- **External** refers only to an optional URL-based request. It does not mean local files are uploaded automatically.
- **CDN assets** are downloaded libraries; they are not destinations for campaign files.
- **Optional** means the request is triggered only when the feature is used. Pasting HTML instead of entering a URL avoids the URL-fetch path.
- Generated public links are text values. Creating or copying a link does not upload the local PDF or campaign file.

The badge does not promise that the browser, extensions, operating system, hosting provider, or a manually opened external website cannot observe normal network metadata. Use the Security Proof and audit steps above for deployment-specific verification.
:::

:::details Checklist

- Update the Core version only when shared shell/deployment behavior changes.
- Update the affected tool version in `js/tool-versions.js` when a specific tool changes.
- Update cache-busters when shipping frontend changes.
- Update Recent Updates on Home.
- Update `CHANGELOG.md`.
- Run syntax checks for edited JavaScript files.
- Run the test suite.
- Run `git diff --check`.
- Commit with a clear release message.
- Push to `origin main`.
:::

:::details Release helper

Use `scripts/release.ps1` to reduce manual release edits.

- Core release: `scripts/release.ps1 -Version 6.13.0 -UpdateNote "Updated shared shell maintenance tools."`
- Tool release: `scripts/release.ps1 -Tool layout-slicer -ToolVersion 0.2.2 -UpdateNote "Improved duplicate folder naming."`

The helper updates Recent Updates and `CHANGELOG.md`. Core releases also update cache-busters unless `-NoCacheBuster` is used.
:::

## Local Data Backup

:::details Backup and restore

Use the Local Data Backup section above to export or import browser-local data. The backup downloads as JSON and is not uploaded by eDM Helper.

Use this before clearing browser data, switching machines, or moving between office browser profiles.
:::

## Local Data & Storage

:::details Browser-local storage

The app uses browser storage for convenience:

- Campaign Counter imported IDs.
- Bookmarklet campaign tracker data.
- WFH/WFO marks.
- Built-in WFH holiday data.
- TNC queue/history.
- Layout drafts such as recent URL/source where applicable.

Clearing browser data can remove these local states.
:::

:::details File System Access

Some tools can save to a local folder selected by the user. This requires browser support and user permission. The app cannot write outside the selected folder unless the browser grants access.
:::

## Troubleshooting

:::details Refresh route shows missing styling or loading state

Check GitHub Pages base path and cache-busters. The app should load assets relative to `/beta` on GitHub Pages and clean routes should fall back through `404.html`.
:::

:::details Layout URL cannot be fetched

The remote server may block browser CORS. Use HTML file fallback or paste source. If proxy fallback is allowed, enable it in Docs.
:::

:::details TNC link cannot be verified

Browser checks may be blocked even when the link is valid. Use Open to verify manually, or enable proxy fallback if allowed.
:::

:::details WFH holiday data looks stale

The tracker uses the built-in holiday list. Update the local holiday list in the tool source when a new year needs to be added.
:::

## Credits

:::details A Note From BETA

Hi everyone, thank you for taking the time to review this web app.

This app was built to reduce repetitive work and keep daily tasks moving quickly. It is far from perfect, but it is useful.

For local workflows, BETA processes data in the browser or a local folder according to the active tool.

For internal deployment, follow the security and maintenance procedures required by the target environment.

Enjoy, bro n sis.

Cheers,

**BETA internal toolkit**
:::

:::details People Behind BETA

- **Budi Indra Ilham** - creator and maintainer of BETA.
- **Yuda Andi Nofariawan** - contributor, collaborator, and coach.
- **MKT testers** - colleagues who tested the tools in real campaign workflows and shared practical feedback.
:::

:::details Built With
**App stack**

- **BETA** - internal campaign operations toolkit.
- **HTML5, CSS3, Vanilla JavaScript, and Markdown** - the core application and documentation stack.

**Hosting & development**

- **GitHub Pages** - static hosting and deployment.
- **Python `http.server`** - local development server.
- **Visual Studio Code** - code editing and project development.

**Browser APIs**

- **File System Access API** - selected folder read/write workflows.
- **IndexedDB and localStorage** - browser-local structured data and preferences.
- **Canvas API** - image processing and screenshot/export workflows.
- **Web Workers** - local background processing for larger validations.
- **Clipboard API and drag-and-drop** - copying results and importing files.

**Libraries**

- **Font Awesome** - icons for the sidebar, buttons, and tool UI.
- **SheetJS/XLSX** - local Monday XLSX imports for Campaign Counter.
- **CodeMirror** - lightweight HTML editing in Layout Checker.
- **PDF.js** - local PDF reading in Layout Slicer.
- **Mammoth.js** - DOCX conversion in DOCX to HTML.
- **JSZip** - document and archive processing.
- **html2canvas** - preview screenshot capture.

**AI assistance**

- **OpenCode** - AI coding assistant used during development and maintenance.
- **GPT-5.6 Luna** - model used through OpenCode for development assistance.
- **Kimi 2, Kimi 3, DeepSeek, Muse, NVIDIA Nemotron Lightning, Mimo 2.5, and MiniMax** - AI assistance used during exploration and development.
:::

:::details The Spirit of It
- **Forks and feedback** - welcome when they make the workflow simpler.
- **The campaign workflow** - messy enough to deserve its own helper.
- **Local-first tools** - because not every file needs to leave the browser.
- **Deadline energy** - loud, stressful, but weirdly productive.
- **All the strange bugs** - annoying at first, useful eventually.
:::
