# Changelog

All notable user-facing changes to eDM Helper are tracked here.

## Core v6.13.1 - 18 June 2026

- Moved update status out of the sidebar and added automatic Recent Updates badges that show new update for entries from the last three days.

## Core v6.13.0 - 18 June 2026

- Added Maintenance with local backup restore, per-tool smoke tests, privacy controls, and release helper workflow.

## Layout Slicer v0.2.1 beta - 18 June 2026

- Removed the extra Layout Slicer markdown heading so the embedded tool starts directly after the route header.
- Made the duplicate-folder flow derive the generated campaign folder from the folder name, while auto HTML filenames use only campaign number and campaign name.

## v6.12.6 - 17 June 2026

- Moved Layout Slicer HTML filename input to the first field in the Location panel.
- Added filename parsing for names such as `1112 ANA Premium Pertralite 06-17 Bianca`, filling campaign number, blast date, prefix, and manager.
- Scans HTML files as soon as the template folder is selected, while keeping actual HTML renaming manual.
- Shows selected folder status with detected HTML file counts.

## v6.12.5 - 17 June 2026

- Fixed Layout Slicer campaign target selection so the user chooses the campaign parent folder, for example `MKT/2026`.
- Prevented copying into an already-created campaign folder, avoiding repeated paths like `campaign/emailblast/MKT/YYYY/campaign`.
- Updated Layout Slicer documentation to clarify the expected folder target.

## v6.12.4 - 17 June 2026

- Added a Layout Slicer campaign location helper for copying a selected template folder into `emailblast/MKT/YYYY/NNNN-YYYYMMDD-MGR`.
- Added target path preview and copy action for campaign HTML paths such as `emailblast/MKT/2026/0018-20260105-RA/0018-ANA-Premier.html`.
- Added copied-folder HTML detection and a rename helper so ID/INDO HTML files can be prepared from the copied campaign folder.

## v6.12.3 - 17 June 2026

- Marked Layout Slicer as beta in the sidebar, route header, and tool header.
- Added a yellow beta warning on Layout Slicer so generated slices/HTML are reviewed before production use.
- Updated cache-busters and app version for the beta notice release.

## v6.12.2 - 17 June 2026

- Increased Layout Slicer JPG export quality for cleaner sliced assets.
- Clarified that slice images export at the original source pixel width while HTML display width controls rendered email width.
- Added a Use source width in HTML option for layouts that should render at the full uploaded image width.
- Documented the browser Canvas DPI limitation so export expectations stay clear.

## v6.12.1 - 17 June 2026

- Refined Layout Slicer into a Photoshop-like guide workflow with top/left rulers and draggable blue guide lines.
- Kept Layout Slicer markdown content minimal and moved detailed usage notes into Documentation.

## v6.12.0 - 17 June 2026

- Added Layout Slicer as a new local tool for converting JPG/PNG layouts into sliced eDM HTML and image assets.
- Added horizontal slice lines, drag adjustment, optional link mapping per slice, generated preview, individual downloads, and save-to-folder export.
- Added Layout Slicer route, sidebar menu item, markdown content page, and documentation entry.
- Ignored the local reference folder `contoh jangan di deploy/` so sample source files are not deployed.

## v6.11.8 - 16 June 2026

- Expanded the creator modal Built with credits to include GitHub Pages, CSS, Font Awesome, SheetJS/XLSX, CodeMirror, File System Access, IndexedDB, and localStorage.
- Updated Documentation credits to explain the broader app stack and browser APIs.

## v6.11.7 - 16 June 2026

- Added Fork the repo and Send feedback actions to the creator modal.
- Added a local mailto feedback form for bug reports, requests, or complaints.
- Updated Documentation credits with fork and feedback guidance.

## v6.11.6 - 16 June 2026

- Removed the extra "from budd the Lazy" subtitle from the creator modal.
- Added compact Built with credits for OpenAI Codex, GitHub, Vanilla JS, and Markdown.

## v6.11.5 - 16 June 2026

- Kept the `budd` hover interaction but changed the hover label to "meet the maker".
- Added a creator note modal instead of opening the creator website from the `budd` name.
- Added the personal "Hi rakyat" creator message, GitHub repository link, and Credits & Dedication to Documentation.

## v6.11.4 - 16 June 2026

- Changed Documentation navigation from a long table of contents into a compact sticky tab bar.
- Added active tab styling for the selected documentation section.

## v6.11.3 - 16 June 2026

- Fixed Documentation table-of-contents anchors so they scroll inside the eDM Helper content viewport.
- Added support for direct documentation section links such as `/docs#tnc-uploader`.

## v6.11.2 - 16 June 2026

- Expanded Documentation into a complete guide for every eDM Helper web app/tool.
- Added collapsible documentation sections and a table of contents.
- Added browser-local privacy/network toggles for external URL checks, proxy fallback, and holiday auto-sync.
- Connected those toggles to WFH Tracker, Layout Checker, Database Checker Layout Test, and TNC Uploader link checks.
- Aligned Documentation typography with the main app page sizing.

## v6.11.1 - 16 June 2026

- Added the missing repository changelog file linked from Home.
- Matched Documentation typography with the main eDM Helper markdown style.

## v6.11.0 - 16 June 2026

- Added TNC Uploader for local PDF queueing, folder saving, generated public links, and replace-link workflows.
- Added live PDF link checks with browser-safe fallbacks.
- Added lazy-loaded `/docs` documentation route.
- Upgraded WFH Tracker with browser-local marks, clearer clear-month controls, and auto-updating Indonesian holiday/cuti bersama data with fallback caching.

## v6.10.2 - 16 June 2026

- Matched creator hover popovers across Home and footer areas.
- Normalized Recent Updates version colors.
- Expanded the full changelog history.

## v6.10.1 - 16 June 2026

- Added maintainer polish for centralized footer rendering.
- Added a release helper script and clearer local backup guidance.
- Refreshed cache-busters and simplified the `budd` hover label.

## v6.10.0 - 16 June 2026

- Moved Campaign Counter and the Monday bookmarklet to browser-local XLSX workflows.
- Added campaign ID series and reblast tooling.
- Preserved folder sessions for supported tools.
- Improved database/layout editing polish.

## v6.9.0 - 15 June 2026

- Rebuilt Campaign Counter around Regular-to-9000 ID series.
- Added Monday XLSX synchronization and the compact Monday allocator bookmarklet.
- Added a GitHub Pages data bridge for environments that block direct Supabase requests.

## v6.8.1 - 14 June 2026

- Moved the Database Generator Add action below the email field.
- Streamlined Config eDM with same-file saving and a NOW date shortcut.
- Added the hoverable `budd` creator footer with website and social links.

## v6.8.0 - 14 June 2026

- Corrected the four-file database package standard to use `EmailCustMast`.
- Updated package validation, raw-data inspection, layout testing, and generated database filenames.

## v6.7.3 - 14 June 2026

- Fixed Layout Checker KRHRED highlighting to match Database Checker previews.
- Enlarged the primary Apply action.

## v6.7.2 - 14 June 2026

- Restored the complete release timeline from Alpha Sensei through every eDM Helper version.

## v6.7.1 - 14 June 2026

- Preserved the complete Recent Updates history while keeping the timeline compact and scrollable.

## v6.7.0 - 14 June 2026

- Refined Layout Checker with faster URL loading, embedded code/preview tabs, full-height workspace panels, reliable image base paths, manual and bulk KRHRED application, reset-to-source preview, and optional KRHRED highlighting.

## v6.6.0 - 14 June 2026

- Redesigned Config eDM into a compact file workflow.
- Added field locking, PROD/UAT campaign toggles, Apply & Save, automatic XML renaming, file filtering/status, validation summaries, and Back/Next XML navigation.

## v6.5.0 - 14 June 2026

- Redesigned Database Generator with compact campaign controls.
- Added always-visible statistics and bulk paste, removable KRHRED chips, denser sticky customer tables, and responsive two-column desktop workflows.

## v6.4.2 - 14 June 2026

- Refreshed Bookmarklet with reliable embedded scrolling, a cleaner flat layout, compact search and controls, consistent tool cards, responsive spacing, and hidden duplicate navigation inside the eDM Helper shell.

## v6.4.1 - 14 June 2026

- Polished Database Generator UI with compact numeric KRHRED unit input, shorter toolbar labels, aligned compact actions, clearer summary badges, smaller empty states, and collapsible file previews.

## v6.4.0 - 14 June 2026

- Refactored Database Generator into a compact workspace with inline validation, stable embedded scrolling, aligned controls, duplicate-email support, responsive data tables, clearer file previews, and generator regression tests.

## v6.3.1 - 14 June 2026

- Moved the primary repository and GitHub Pages base path from `beta-uat` to `beta`.

## v6.3.0 - 14 June 2026

- Added the shared UI style guide, reusable design tokens, consistent 12px form controls across all tools, regular-weight typography, and responsive Database Checker modal/workspace refinements.

## v6.2.0 - 14 June 2026

- Added Database-to-Layout Test with automatic HTML loading, random or manual customer selection, KRHRED personalization and highlighting, subject normalization, coverage alerts, full-screen preview, and temporary URL/subject drafts.

## v6.1.0 - 14 June 2026

- Upgraded Database Checker with four-file package validation, static/dynamic detection, grouped anomaly findings, raw-line inspection, CSV export, and a compact package workspace.

## v6.0.1 - 13 June 2026

- Introduced the wiki-style layout.
- Refreshed the Home dashboard.
- Improved GitHub Pages deployment.
- Fixed the embedded Database Generator layout.

## v5.0.0 - 12 April 2026

- Released version 5.

## v4.0.0 - 14 March 2026

- Released version 4.

## v3.0.0 - 20 February 2026

- Released version 3.

## v2.0.0 - 13 October 2025

- Renamed the application to eDM Helper.
- Released version 2.

## v1.0.0 - 17 August 2025

- Released version 1.

## v0.0.0 - April 2025

- Created the first app prototype as Alpha Sensei.
