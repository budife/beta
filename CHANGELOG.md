# Changelog

All notable user-facing changes to eDM Helper are tracked here.

## TNC Uploader v0.3.9 beta - 13 August 2026

- Removed the duplicate transient status row; the newest real activity now carries the compact `New` badge and timestamp.

## TNC Uploader v0.3.8 beta - 13 August 2026

- Merged the latest success, error, or info status into Recent Activity as a compact non-persistent `New` row.

## TNC Uploader v0.3.7 beta - 13 August 2026

- Expanded Recent Activity with file names, destination paths, filename changes, and link-check results, then added matching success, info, accent, and error colors for faster scanning.

## TNC Uploader v0.3.6 beta - 13 August 2026

- Made Recent Activity denser and easier to scan with compact action rows, inline timestamps, and semantic local action colors.

## TNC Uploader v0.3.5 beta - 13 August 2026

- Fixed saved PDF history not rendering on initial tool load; active queue and saved records now appear immediately.

## TNC Uploader v0.3.4 beta - 13 August 2026

- Reordered the PDF workspace so active dropped files always appear above saved history.
- Simplified destination actions to Pick destination folder, Save PDFs, and Clear queue; the selected root and planned target path are now visible before saving.
- Moved the live status message into Recent Activity and removed the obsolete download fallback.

## TNC Uploader v0.3.3 beta - 13 August 2026

- Added a compact right-side Recent Activity log that persists the latest 30 local actions, including file queueing, folder selection, saving, downloads, link copies, checks, and history cleanup.
- Kept the activity log separate from saved PDF history, with its own Clear action so file records remain available unless explicitly cleared.

## Layout Slicer v0.4.2 beta - 3 August 2026

- Reworked Copy Folder into a compact pre-copy workflow with the original template name, a new campaign-name field, editable Root/Team/Year/Campaign Folder segments, child-folder chips, and a separate multi-file HTML rename area.
- Campaign Folder now derives `XXXX-YYYYMMDD-XX` from the new campaign name's `MM-DD` and the editable Year segment, while remaining manually editable.
- New campaign folder names are now the outer project folder; the copied `emailblast/Team/Year/Campaign Folder` structure is created inside it.
- Copy stays disabled until a new campaign name generates a destination; edited HTML names now convert spaces to hyphens automatically.
- Output Preview now lists only explicitly renamed HTML files as direct `mail.hsbc.com.hk/id/...` URLs, so one supplied rename produces one public link preview.
- Added a live output preview, direct copy into a newly created destination, duplicate-name protection, and post-copy path actions including Copy Path and Duplicate Another.
- Added real file-count copy progress from the initial template scan, including the current stage, file, completed count, and percentage.
- Removed Full Workflow and the duplicate in-tool Layout Slicer header; Copy Folder and Slice Layout remain as the two focused workflows.

## Core v6.14.6 - 3 August 2026

- Removed the unsupported `file-system-access` iframe permission attribute and refreshed the app shell cache-buster.

## Campaign Counter v1.6.1 beta - 3 August 2026

- Reworked Campaign Counter into Phase 1: Supabase connection status, Last Campaign, one guarded Generate action, and the latest 20 activity records.
- Added a first-run local username dialog and a dedicated Campaign Registry service; generated IDs are allocated and recorded through one Supabase RPC.
- Removed Folder Browser, XLSX, local backup, series navigation, and related controls from this module for the focused Phase 1 flow.
- Added a subtle manual counter adjustment dialog with optional note and `manual_set` registry records; any unused ID from `0001` through `9999` can be set.
- Connected the deployed Campaign Counter to the Supabase Campaign Registry using the project's public endpoint and publishable key.
- Removed prior Counter table/query/schema references; the module now uses only `campaign_registry`, `generate_campaign_id`, and `set_next_campaign_id`.
- Improved manual counter error feedback with safe RPC messages and full browser-console diagnostics.
- Added a qualified-column SQL fix for the manual counter RPC PostgreSQL `42702` error.
- Removed an unsupported iframe permission attribute that produced a browser console warning.
- Manual counter adjustment now accepts any four-digit Campaign ID instead of only values above the current ID.
- Last Campaign now reflects the latest registry activity, including a manual set, instead of the numerically highest ID.
- Removed the duplicate page header and legacy Home bar; connection state now lives in the Last Campaign panel for a consistent tool workspace.
- Added a compact Back action beside Generate to manually step the current Last Campaign down by one when that ID is unused.
- Made the latest manual or generated registry activity the active counter pointer, so setting `0314` makes the next generated ID `0315` without discarding prior generated activity.
- Generate now explicitly saves `Last Campaign + 1` through the active pointer, preventing old maximum-value RPC behavior from jumping to an unrelated high ID.

## Core v6.14.5 - 31 July 2026

- Refreshed Layout Slicer cache-busters after its workflow rework.

## Layout Slicer v0.4.0 beta - 31 July 2026

- Reworked the entry flow into three large actions: Copy folder, Slice layout, and Full workflow.
- Simplified template duplication: the copied folder now keeps the original template structure instead of moving nested HTML paths automatically.
- Added a pre-copy subfolder list so the complete template structure is visible before duplicate.
- Added PDF source support by rendering the first page in-browser before slicing; JPG, JPEG, and PNG remain supported.

## Core v6.14.4 - 31 July 2026

- Removed the duplicate privacy-settings surface from Documentation and kept Maintenance as the single settings location.

## Documentation v1.0.2 - 31 July 2026

- Replaced the duplicate editable privacy panel with a clear link to Maintenance.

## Maintenance v1.0.2 - 31 July 2026

- Kept Maintenance as the canonical place for browser-local privacy and network controls.

## Core v6.14.3 - 31 July 2026

- Optimized Documentation with in-page search plus compact Expand all and Collapse all controls.
- Hardened shared Docs and Maintenance layouts for long content, narrow screens, and visible keyboard focus.
- Refreshed shared shell cache-busters for the Docs and Maintenance update.

## Documentation v1.0.1 - 31 July 2026

- Added quick search across documentation sections and automatic expansion of matching guidance.
- Added simple all-open and all-closed controls to keep the long reference easy to scan.

## Maintenance v1.0.1 - 31 July 2026

- Reorganized backup, privacy, release, and recovery guidance into a more direct operating flow.
- Added clear error handling for backup export, restore, and local-data clearing.
- Added backup-file compatibility validation before restoring browser-local state.

## Core v6.14.2 - 31 July 2026

- Refreshed Layout Checker cache-busters after the screenshot capture fix.

## Layout Checker v1.4.2 - 31 July 2026

- Improved Screenshot export so remote email images are prepared through direct/proxy image fetching before capture.
- Added image-load waiting and data-URL embedding for preview screenshots so captured layouts include more than just text.
- Kept a clearer screenshot failure message when a browser or remote host still blocks image capture.

## Core v6.14.1 - 30 July 2026

- Refreshed cache-busters after restoring Database Checker to the previous compact workspace.

## Layout Checker v1.4.1 - 30 July 2026

- Added an Open Preview action to launch the applied layout and KRHRED values in a new browser tab.
- Added a Screenshot action beside the Highlight KRHRED control.
- Switched screenshot capture to the visible preview for a faster export, with a clear fallback message when browser security blocks remote images.

## Database Checker v1.8.1 - 30 July 2026

- Reverted the automatic dashboard redesign.
- Restored the previous Database Checker package workspace, validation panels, package overview, and layout-test workflow.
- Kept the existing validation rules and tests intact.

## TNC Uploader v0.3.2 beta - 28 July 2026

- Added optional filename rename for new uploads through a compact double-click editor inside the PDF queue.
- Preserved replace-link mode so replacement PDFs keep the existing public filename.
- Blocked empty or invalid Windows filename characters before save/download.
- Prevented normal uploads from overwriting an existing destination file without choosing another name.
- Hardened long filenames, generated links, status messages, queue cards, and action rows so they wrap without breaking the layout.

## Core v6.13.6 - 19 June 2026

- Fixed sidebar beta badge spacing so longer tool labels like Campaign Counter keep their status badge visible.

## Core v6.13.5 - 19 June 2026

- Refreshed cache-busters for the Campaign Counter unparsed-folder note cleanup.

## Campaign Counter v1.4.2 beta - 19 June 2026

- Removed the long unparsed folder list from the workspace so it no longer blocks the Campaign ID grid.
- Kept failed-folder counts visible in the scan summary and folder header, with folder details available as a compact hover note.

## Core v6.13.4 - 19 June 2026

- Refreshed cache-busters for the latest Campaign Counter folder-scan and range UI changes.

## Campaign Counter v1.4.1 beta - 19 June 2026

- Added reusable folder refresh so the last scanned campaign folder can be checked again without opening the folder picker every time.
- Saved the last manually generated campaign ID separately from imported/scanned IDs.
- Improved campaign folder parsing for spaced ranges like `0007 - 0010`, copied-folder suffixes, and folder names with extra text before the campaign ID.
- Rendered each campaign ID only once while keeping multiple campaign details available in the hover/click popup.
- Added visual range brackets for multi-ID folders and aligned all campaign ID chips so bracketed and non-bracketed items share the same row height.

## Core v6.13.3 - 19 June 2026

- Refreshed cache-busters after the Campaign Counter beta UI updates so iframe CSS and JS changes load reliably.

## Core v6.13.2 - 18 June 2026

- Refreshed cache-busters for the latest Layout Slicer and TNC Uploader changes.

## Layout Slicer v0.3.0 beta - 18 June 2026

- Reworked Layout Slicer into a pure image slicing workflow by removing HTML generation, link mapping, and HTML preview/export controls.
- Added accordion sections so Campaign Folder and Image Slicer stay focused one at a time.
- Clarified image export controls, adaptive rulers, source/export metadata, and image-only save/download output.
- Grouped slicing actions into Guides, Process, and Export so the workflow is easier to scan.

## TNC Uploader v0.3.1 beta - 18 June 2026

- Cleared saved PDFs from the active drop queue while preserving saved history.
- Limited replace-link mode to one PDF at a time and improved the drop-zone copy for replacement uploads.
- Simplified queue actions and labels for clearer save/download folder behavior.

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
- Added Monday XLSX synchronization and the compact Monday counter bookmarklet.
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
