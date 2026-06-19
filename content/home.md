---
title: eDM Helper
description: Email marketing utilities, campaign references, and everyday productivity tools in one workspace.
icon: fa-solid fa-layer-group
category: Home
---

## Quick Access

- [Database Checker](/database-checker)
- [Config eDM](/config-edm)
- [Layout Checker](/layout-checker)
- [Layout Slicer](/layout-slicer)
- [Campaign Counter](/campaign-counter)

## Tool Sitemap

### Database

- [Database Checker](/database-checker) - Validate campaign database files.
- [Database Generator](/database-generator) - Generate campaign data and formatted output.

### Tools

- [Bookmarklet](/bookmarklet) - Browser shortcuts for repetitive daily tasks.
- [Campaign Counter](/campaign-counter) - Campaign tracking workspace.
- [Config eDM](/config-edm) - eDM configuration editor.
- [Layout Checker](/layout-checker) - HTML and layout inspection.
- [Layout Slicer](/layout-slicer) - Convert flat JPG/PNG layouts into ordered image slices.
- [TNC Uploader](/tnc-uploader) - Drop PDF terms and conditions into the server folder structure.
- [WFH Tracker](/wfh-tracker) - WFH and office-day calendar.

## Recent Updates

- **Core v6.13.5 - 19 June 2026** - Refreshed cache-busters for the Campaign Counter unparsed-folder note cleanup.
- **Campaign Counter v1.4.2 beta - 19 June 2026** - Removed the long unparsed folder list from the workspace and kept failed-folder counts available as a compact hover note.
- **Core v6.13.4 - 19 June 2026** - Refreshed cache-busters for the latest Campaign Counter folder-scan fixes.
- **Campaign Counter v1.4.1 beta - 19 June 2026** - Added reusable folder refresh, saved last generated ID, smarter folder-name parsing, unique ID chips, range brackets, and aligned campaign ID boxes.
- **Core v6.13.3 - 19 June 2026** - Refreshed cache-busters after the Campaign Counter beta UI updates so iframe CSS and JS changes load reliably.
- **Core v6.13.2 - 18 June 2026** - Refreshed cache-busters for the latest Layout Slicer and TNC Uploader changes.
- **Layout Slicer v0.3.0 beta - 18 June 2026** - Reworked slicing into a pure image-assets workflow with accordion sections, clearer actions, adaptive rulers, export metadata, and image-only save/download output.
- **TNC Uploader v0.3.1 beta - 18 June 2026** - Tightened the PDF queue workflow so saved files clear from the active drop queue, replace-link mode accepts one PDF, and action labels feel clearer.
- **Core v6.13.1 - 18 June 2026** - Moved update status out of the sidebar and added automatic Recent Updates badges that show new update for entries from the last three days.
- **Core v6.13.0 - 18 June 2026** - Added Maintenance with local backup restore, per-tool smoke tests, privacy controls, and release helper workflow.
- **Layout Slicer v0.2.1 beta - 18 June 2026** - Removed the extra markdown section so the tool opens directly after the header, and tightened template duplicate naming so generated folders and HTML filenames follow the campaign folder name.
- **v6.12.6 · 17 June 2026** - Improved Layout Slicer naming flow: HTML filename now sits first, parses campaign number/date/prefix/manager, scans template HTML files early, and keeps rename manual.
- **v6.12.5 · 17 June 2026** - Fixed Layout Slicer campaign parent selection so copied template folders create `campaign/emailblast/MKT/YYYY/...` without repeating inside another campaign folder.
- **v6.12.4 · 17 June 2026** - Added Layout Slicer campaign location helper for copying template folders into campaign folders and preparing ID/INDO HTML filenames.
- **v6.12.3 · 17 June 2026** - Marked Layout Slicer as beta with a yellow italic badge and added an in-tool testing warning before production use.
- **v6.12.2 · 17 June 2026** - Improved Layout Slicer export quality, clarified HTML display width vs source pixels, and added a source-width HTML option.
- **v6.12.1 · 17 June 2026** - Refined Layout Slicer with top/left rulers, Photoshop-like guide lines, and slimmer markdown content with detailed notes moved to Documentation.
- **v6.12.0 · 17 June 2026** - Added Layout Slicer for local JPG/PNG slicing, email-safe HTML generation, optional slice links, preview, downloads, and save-to-folder export.
- **v6.11.8 · 16 June 2026** - Expanded the creator Built with credits with GitHub Pages, CSS, Font Awesome, SheetJS/XLSX, CodeMirror, File System Access, IndexedDB, localStorage, and browser APIs.
- **v6.11.7 · 16 June 2026** - Added Fork the repo and Send feedback actions to the creator modal, including a local mailto feedback form for bug reports, requests, or complaints.
- **v6.11.6 · 16 June 2026** - Cleaned up the creator note header and added compact Built with credits for OpenAI Codex, GitHub, Vanilla JS, and Markdown.
- **v6.11.5 · 16 June 2026** - Kept the `budd` hover interaction but changed it into a "meet the maker" creator note with a personal message, GitHub repo link, and Credits & Dedication in Documentation.
- **v6.11.4 · 16 June 2026** - Changed Documentation navigation from a long table of contents into a compact sticky tab bar with coral active state.
- **v6.11.3 · 16 June 2026** - Fixed Documentation table-of-contents anchors so they scroll inside the eDM Helper content viewport and support direct `/docs#section` links.
- **v6.11.2 · 16 June 2026** - Expanded Documentation into a complete tool guide with collapsible sections, added browser-local privacy/network toggles for external checks, proxy fallback, and holiday sync, and aligned Docs typography with the main app pages.
- **v6.11.1 · 16 June 2026** - Added the missing repository changelog file and aligned Documentation typography with the main eDM Helper markdown style.
- **v6.11.0 · 16 June 2026** - Added TNC Uploader with local PDF queueing, replace-link mode, generated public links and live checks, added lazy Docs, and upgraded WFH Tracker with browser-local marks plus auto-updating Indonesian holiday/cuti bersama data with fallback caching.
- **v6.10.2 · 16 June 2026** - Matched creator hover popovers across Home and footer areas, normalized Recent Updates version colors, and expanded the full changelog history.
- **v6.10.1 · 16 June 2026** - Added maintainer polish: centralized footer rendering, a release helper script, full changelog notes, clearer local backup guidance, refreshed cache-busters, and a smaller `budd` hover label.
- **v6.10.0 · 16 June 2026** - Moved Campaign Counter and the Monday bookmarklet to browser-local XLSX workflows, added series/reblast tooling, preserved folder sessions, and improved database/layout editing polish.
- **v6.9.0 · 15 June 2026** - Rebuilt Campaign Counter around Regular-to-9000 ID series, added Monday XLSX synchronization, introduced the compact Monday allocator bookmarklet, and added a GitHub Pages data bridge for environments that block direct Supabase requests.
- **v6.8.1 · 14 June 2026** - Moved the Database Generator Add action below the email field, streamlined Config eDM with same-file saving and a NOW date shortcut, and added the hoverable `budd` creator footer with website and social links.
- **v6.8.0 · 14 June 2026** - Corrected the four-file database package standard to use `EmailCustMast`, including package validation, raw-data inspection, layout testing, and generated database filenames.
- **v6.7.3 · 14 June 2026** - Fixed Layout Checker KRHRED highlighting to match Database Checker previews and enlarged the primary Apply action.
- **v6.7.2 · 14 June 2026** - Restored the complete release timeline from Alpha Sensei through every eDM Helper version.
- **v6.7.1 · 14 June 2026** - Preserved the complete Recent Updates history while keeping the timeline compact and scrollable.
- **v6.7.0 · 14 June 2026** - Refined Layout Checker with faster URL loading, embedded code/preview tabs, full-height workspace panels, reliable image base paths, manual and bulk KRHRED application, reset-to-source preview, and optional KRHRED highlighting.
- **v6.6.0 · 14 June 2026** - Redesigned Config eDM into a compact file workflow with field locking, PROD/UAT campaign toggles, Apply & Save, automatic XML renaming, file filtering and status, validation summaries, and Back/Next XML navigation.
- **v6.5.0 · 14 June 2026** - Redesigned Database Generator with compact Campaign controls, always-visible statistics and bulk paste, removable KRHRED chips, denser sticky customer tables, and responsive two-column desktop workflows.
- **v6.4.2 · 14 June 2026** - Refreshed Bookmarklet with reliable embedded scrolling, a cleaner flat layout, compact search and controls, consistent tool cards, responsive spacing, and hidden duplicate navigation inside the eDM Helper shell.
- **v6.4.1 · 14 June 2026** - Polished Database Generator UI with compact numeric KRHRED unit input, shorter toolbar labels, aligned compact actions, clearer summary badges, smaller empty states, and collapsible file previews.
- **v6.4.0 · 14 June 2026** - Refactored Database Generator into a compact workspace with inline validation, stable embedded scrolling, aligned controls, duplicate-email support, responsive data tables, clearer file previews, and generator regression tests.
- **v6.3.1 · 14 June 2026** - Moved the primary repository and GitHub Pages base path from `beta-uat` to `beta`.
- **v6.3.0 · 14 June 2026** - Added the shared UI style guide, reusable design tokens, consistent 12px form controls across all tools, regular-weight typography, and responsive Database Checker modal and workspace refinements.
- **v6.2.0 · 14 June 2026** - Added Database-to-Layout Test with automatic HTML loading, random or manual customer selection, KRHRED personalization and highlighting, subject normalization, coverage alerts, full-screen preview, and temporary URL/subject drafts.
- **v6.1.0 · 14 June 2026** - Upgraded Database Checker with four-file package validation, static/dynamic detection, grouped anomaly findings, raw-line inspection, CSV export, and a compact package workspace.
- **v6.0.1 · 13 June 2026** - Introduced the wiki-style layout, refreshed the Home dashboard, improved GitHub Pages deployment, and fixed the embedded Database Generator layout.
- **v5.0.0 · 12 April 2026** - Released version 5.
- **v4.0.0 · 14 March 2026** - Released version 4.
- **v3.0.0 · 20 February 2026** - Released version 3.
- **v2.0.0 · 13 October 2025** - Renamed the application to **eDM Helper** and released version 2.
- **v1.0.0 · 17 August 2025** - Released version 1.
- **29 June 2025** - Added Layout Checker and Database Counter.
- **v0.0.0 Beta Live · 27 May 2025** - The first public beta went live.
- **April 2025** - The application was first created under the name **Alpha Sensei**.

## Useful Links

- [GitHub Repository](https://github.com/budife/beta) - Source code and project history.
- [Report an Issue](https://github.com/budife/beta/issues) - Submit a bug or improvement request.
- [Changelog](https://github.com/budife/beta/blob/main/CHANGELOG.md) - Read full release notes.
- [Maintenance](/maintenance) - Local backup/restore, privacy switches, and release checklist.
- [Tool Sitemap](#tool-sitemap) - Browse every available eDM Helper tool.

## System Info

- **Available tools:** `8`
- **Deployment:** GitHub Pages and local server
- **Status:** All tools available
