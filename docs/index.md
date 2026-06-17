---
title: Documentation
description: Internal operating guide, privacy notes, and maintenance references for every eDM Helper tool.
icon: fa-solid fa-book-open
category: Reference
---

## Docs Navigation

- [Privacy](#privacy-network-behavior)
- [Basics](#global-navigation)
- [Database](#database-checker)
- [Tools](#bookmarklet)
- [Maintenance](#release-workflow)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits-dedication)

## Privacy & Network Behavior

eDM Helper is designed as a local-first internal helper. Files such as database TXT, XML config, XLSX imports, PDFs, pasted HTML, customer emails, and KRHRED values are processed in the browser unless a tool explicitly checks a public URL.

- Database, XML, XLSX, PDF, and generated output files are not uploaded by eDM Helper.
- Campaign Counter and Monday bookmarklet data stay in browser-local storage.
- TNC Uploader saves files to the folder selected by the user and only generates public URL text.
- Network access is only used by URL-based checks, layout fetching, PDF live checks, and holiday sync.
- Proxy fallback should only be enabled when browser CORS blocks direct access and the user accepts that the target public URL may be requested through a third-party proxy.

:::details What can contact a third-party service?

- Layout Checker URL loading may fetch the layout URL directly and, if enabled, through proxy fallbacks.
- Database Checker Layout Test may fetch the layout URL directly and, if enabled, through proxy fallbacks.
- TNC Uploader Check may verify a public PDF URL directly and, if enabled, through proxy fallbacks.
- WFH Tracker holiday sync requests public Indonesian holiday data by year.

These flows do not intentionally upload local files or customer databases. They only request the URL or year needed for the selected action.
:::

:::details What stays local?

- Database Checker package parsing and validation.
- Database Generator customer input and file generation.
- Config eDM XML parsing, editing, and saving.
- Campaign Counter XLSX import and ID history.
- Bookmarklet local campaign ID data.
- TNC PDF queue/history and generated links.
- WFH/WFO marks in the calendar.
:::

## Network Settings

Use these settings when working in stricter office environments. Changes are saved in this browser only.

{{privacy-settings}}

- Turn off external URL checks to prevent tools from fetching public layout/PDF URLs.
- Turn off proxy fallback to allow direct browser checks only.
- Turn off holiday auto-sync to keep WFH Tracker on the built-in local holiday fallback.

## Global Navigation

The app uses clean SPA routes with a fixed sidebar. Opening a tool changes only the content area, while sidebar and footer stay in place.

- Home: `/`
- Docs: `/docs`
- Database Checker: `/database-checker`
- Database Generator: `/database-generator`
- Bookmarklet: `/bookmarklet`
- Campaign Counter: `/campaign-counter`
- Config eDM: `/config-edm`
- Layout Checker: `/layout-checker`
- Layout Slicer: `/layout-slicer`
- TNC Uploader: `/tnc-uploader`
- WFH Tracker: `/wfh-tracker`

## Database Checker

:::details Purpose

Database Checker validates campaign database packages before delivery. It checks whether the package is static or dynamic, verifies required files, compares emails across files, validates field counts, detects KRHRED anomalies, and can test database values against a layout.
:::

:::details Required files

Each package should contain four file types:

- `CustMast` or `EmailCustMast`
- `CustPref`
- `CustSubs`
- `CustAttr`

The tool accepts both `CustMast` and `EmailCustMast` because both formats appear in real campaign packages.
:::

:::details Static vs dynamic validation

- Static database: validates package structure and invalid rows.
- Dynamic database: validates package structure plus KRHRED values in `CustAttr`.
- Dynamic KRHRED values are checked for empty values, dot-only values, outer whitespace, repeated spaces, and length limits.
:::

:::details Workflow

- Click Open Folder and select the database folder.
- Choose a detected package from the package list.
- Review Package Overview for type, date group, file count, sizes, and KRHRED units.
- Run Check Database Package.
- Use grouped findings to inspect invalid rows.
- Use Raw Data or View line when line-level inspection is needed.
- Use Layout Test when you want to confirm KRHRED values render into a public or pasted layout.
:::

:::details Network behavior

Package validation is local. Layout Test only contacts the network when a layout URL is used. If external URL checks are disabled, use pasted HTML or an HTML file fallback instead.
:::

## Database Generator

:::details Purpose

Database Generator creates static or dynamic campaign database files from customer emails and optional KRHRED values. It keeps the output format consistent with the existing eDM database workflow.
:::

:::details Workflow

- Enter Campaign ID.
- Choose Static or Dynamic.
- Add customer emails one by one or paste bulk emails.
- For dynamic campaigns, add KRHRED unit numbers such as `30`, `31`, or `32`.
- Fill KRHRED values per customer.
- Review the compact table.
- Generate and download the output files.
:::

:::details Important behavior

- Duplicate emails are allowed and remain separate records.
- Numeric KRHRED input is converted internally to `KRHRED_Unit_XX`.
- Static output and dynamic output keep existing generated file formats.
- Customer data is not sent outside the browser.
:::

## Bookmarklet

:::details Purpose

Bookmarklet contains small browser helpers for web pages and Monday workflows. It is meant to reduce repetitive browser actions while keeping actions manual and visible.
:::

:::details Campaign ID Tracker bookmarklet

The Campaign ID Tracker bookmarklet can load local Monday XLSX data, show used campaign IDs by series, and help select the next available ID. Data stays in browser-local storage.

If Monday subitems are collapsed in the visible page, browser scanning cannot read them. Export/upload XLSX when complete campaign ID coverage is needed.
:::

:::details Privacy behavior

Bookmarklet helpers run in the browser page where they are clicked. Campaign ID data is local. The current local workflow does not sync to Supabase.
:::

## Campaign Counter

:::details Purpose

Campaign Counter imports Monday XLSX exports locally and shows used Campaign ID numbers by range:

- Regular `0001-0999`
- `1000-1999`
- `2000-2999`
- `3000-3999`
- `4000-4999`
- `5000-5999`
- `6000-6999`
- `7000-7999`
- `8000-8999`
- `9000-9999`
:::

:::details Workflow

- Export XLSX from Monday.
- Import XLSX into Campaign Counter.
- Review used IDs in the selected series tab.
- Hover or open a used ID to see campaign names, full campaign IDs, and blast dates.
- Use Next / Back / Next free to choose an available number.
- Use Reset only when you want to clear browser-local imported data.
:::

:::details Reblast behavior

The same campaign number can appear multiple times for reblast scenarios. Campaign Counter groups duplicate numbers and shows all related campaign names/dates in the details view.
:::

:::details Storage

Imported XLSX data is stored in this browser only. It is not uploaded to Supabase or another third-party service.
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

:::details Network behavior

If a layout URL is used, the tool may request the layout directly. If direct browser access is blocked and proxy fallback is enabled, it may try proxy services. Disable external checks or proxy fallback in Docs when working with restricted material.
:::

## Layout Slicer

:::details Purpose

Layout Slicer turns a flat JPG or PNG eDM mockup into image slices and a simple email-safe HTML table layout. It uses guide lines first, then slices only when output is generated.
:::

:::details Workflow

- Drop or choose a JPG/PNG layout.
- Use the top and left rulers to read position.
- Click the preview once to add a horizontal guide line.
- Drag guide lines to adjust them.
- Add optional URLs to slices that should become linked images.
- Generate output.
- Preview, download HTML/images, or save everything to a selected folder.
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

:::details Local behavior

Image processing uses the browser Canvas API. Files stay in the browser unless you explicitly download them or save them to a chosen local folder.
:::

:::details Export quality and width

Layout Slicer exports each slice at the original uploaded image pixel width. The HTML display width controls how wide the email renders, so a 1000px source can still render as a 600px email.

Use **Use source width in HTML** when the generated HTML should render at the uploaded image width instead of the default email width.

JPG export uses very high browser quality. Browser Canvas export does not reliably write 300dpi metadata, but email and webmail rendering depends on pixel dimensions, so keeping the source pixel width is the important part.
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

:::details Live check behavior

Check only verifies whether a generated public PDF link appears reachable. It does not upload the PDF. If direct browser check fails and proxy fallback is enabled, it may use a proxy check. Disable proxy fallback if that is not allowed.
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

:::details Holiday auto-sync

WFH Tracker starts with local fallback holiday data. If holiday auto-sync is enabled, it fetches public Indonesian holiday/cuti bersama data for the visible year and caches it locally. It does not send personal WFH/WFO marks.
:::

## Release Workflow

:::details Checklist

- Update the visible app version.
- Update cache-busters when shipping frontend changes.
- Update Recent Updates on Home.
- Update `CHANGELOG.md`.
- Run syntax checks for edited JavaScript files.
- Run the test suite.
- Run `git diff --check`.
- Commit with a clear release message.
- Push to `origin main`.
:::

## Local Data & Storage

:::details Browser-local storage

The app uses browser storage for convenience:

- Campaign Counter imported IDs.
- Bookmarklet campaign tracker data.
- WFH/WFO marks.
- WFH holiday cache.
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

The tracker caches holiday data per year. Disable/enable holiday auto-sync or clear browser storage if you need a fresh fetch immediately.
:::

## Credits & Dedication

:::details A small note

Hi rakyat, terima kasih sudah menyempatkan waktu buat mengecek web app buatan saya.

Tujuan web app ini dibuat karena saya malas dan biar kerja repetitif jadi lebih sat set. It should be a sederhana web, but here we are: jauh dari kata sempurna, but it is useful.

100% aman untuk workflow lokal yang sensitif. Source code bisa dilihat di repo GitHub saya: [github.com/budife/beta](https://github.com/budife/beta).

Kalau mau utak-atik sendiri, fork aja. Kalau ada bug, request, atau complain, pakai form feedback dari creator modal. Form itu hanya membuka draft email ke `budi.indra94@gmail.com`.

Enjoy bro n sis.

Cheers,

**budd the Lazy**
:::

:::details Credits

- **budd the Lazy** - built, broke, fixed, tested, and kept going.
- **OpenAI Codex** - coding partner for planning, refactoring, debugging, and release notes.
- **GitHub & GitHub Pages** - source repository, version history, and deployment flow.
- **Vanilla JavaScript, CSS, and Markdown** - the simple stack behind the app shell and documentation.
- **Font Awesome** - icon set for the sidebar, buttons, and tool UI.
- **SheetJS/XLSX** - local Monday XLSX imports for Campaign Counter.
- **CodeMirror** - lightweight HTML editing in Layout Checker.
- **Browser APIs** - File System Access, IndexedDB, localStorage, drag-and-drop, and clipboard helpers.
- **Forks and feedback** - welcome, as long as it helps the workflow get less ribet.
- **The campaign workflow** - messy enough to deserve its own helper.
- **Local-first tools** - because not every file needs to leave the browser.
- **Deadline energy** - loud, stressful, but weirdly productive.
- **All the strange bugs** - annoying at first, useful eventually.
:::
