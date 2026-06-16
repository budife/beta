# Changelog

## v6.10.2 - 16 June 2026

- Matched the `budd` creator hover popover styling across Home Recent Updates, the app sidebar footer, and tool footers.
- Kept Recent Updates version/date text visually consistent while preserving the coral creator label.
- Expanded the changelog with the full remembered release timeline from Alpha Sensei through the current eDM Helper releases.

## v6.10.1 - 16 June 2026

- Centralized footer rendering through `js/version-config.js` so every `.footer-text` gets the same creator markup.
- Reduced the `budd` hover popover to the centered label `si pemalas` while keeping the link target unchanged.
- Added `scripts/release.ps1` to update app version, cache-busters, and the latest Home update in one repeatable step.
- Added clearer local-only backup guidance to Campaign Counter before reset, browser cleanup, or device changes.
- Refreshed cache-busters to keep GitHub Pages from serving stale CSS or JavaScript after release.

## v6.10.0 - 16 June 2026

- Moved Campaign Counter and its Monday bookmarklet to separate browser-local XLSX workflows with IndexedDB.
- Added Merge/Replace import modes, JSON backup, Reset, series tabs, reblast details, and compact allocators.
- Changed the Campaign Counter right panel into local campaign-ID series browsing instead of Supabase-only browsing.
- Updated the Monday bookmarklet to work locally with imported XLSX data and compact per-series counters.
- Preserved Database Checker and Config eDM folder sessions across tool navigation.
- Supported both `EmailCustMast` and `CustMast` customer-master filenames.
- Improved folder/save loading states, Database Generator alignment, and cancelable replace-on-focus editing.

## v6.9.0 - 15 June 2026

- Rebuilt Campaign Counter around Regular-to-9000 ID series.
- Added Monday XLSX synchronization and the compact Monday allocator bookmarklet.
- Added a GitHub Pages data bridge for environments that block direct Supabase requests.
- Added used-ID chips, active ID styling, retry/loading/empty states, and gap-aware allocation visibility.

## v6.8.1 - 14 June 2026

- Moved the Database Generator Add action below the email field.
- Streamlined Config eDM with same-file saving and a NOW date shortcut.
- Added the hoverable `budd` creator footer with website and social links.
- Removed slow automatic XML renaming from Config eDM.
- Added the footer creator identity label while keeping the original link.

## v6.8.0 - 14 June 2026

- Corrected the four-file database package standard to use `EmailCustMast`.
- Updated package validation, raw-data inspection, layout testing, and generated database filenames for the corrected naming.
- Later added compatibility for legacy `CustMast` files.

## v6.7.3 - 14 June 2026

- Fixed Layout Checker KRHRED highlighting to match Database Checker previews.
- Enlarged the primary Apply action.
- Improved manual KRHRED entry handling and reset behavior in Layout Checker.

## v6.7.2 - 14 June 2026

- Restored the complete release timeline from Alpha Sensei through every eDM Helper version.

## v6.7.1 - 14 June 2026

- Preserved the complete Recent Updates history while keeping the timeline compact and scrollable.

## v6.7.0 - 14 June 2026

- Refined Layout Checker with faster URL loading and embedded code/preview tabs.
- Added full-height workspace panels, reliable image base paths, and preview rendering.
- Added manual and bulk KRHRED application.
- Added reset-to-source preview and optional KRHRED highlighting.
- Cleaned up duplicate title/header treatment inside the eDM Helper shell.

## v6.6.0 - 14 June 2026

- Redesigned Config eDM into a compact file workflow.
- Added field locking, PROD/UAT campaign toggles, Apply & Save, automatic XML renaming, file filtering and status.
- Added validation summaries and Back/Next XML navigation.
- Added edit protection for applied fields and double-click editing behavior.

## v6.5.0 - 14 June 2026

- Redesigned Database Generator with compact Campaign controls.
- Added always-visible statistics and bulk paste.
- Added removable KRHRED chips.
- Added denser sticky customer tables and responsive two-column desktop workflows.

## v6.4.2 - 14 June 2026

- Refreshed Bookmarklet with reliable embedded scrolling.
- Added a cleaner flat layout, compact search and controls, consistent tool cards, and responsive spacing.
- Hid duplicate navigation inside the eDM Helper shell.

## v6.4.1 - 14 June 2026

- Polished Database Generator UI with compact numeric KRHRED unit input.
- Shortened toolbar labels, aligned compact actions, clarified summary badges, reduced empty states, and added collapsible file previews.

## v6.4.0 - 14 June 2026

- Refactored Database Generator into a compact workspace.
- Added inline validation, stable embedded scrolling, aligned controls, duplicate-email support, responsive data tables, and clearer file previews.
- Added generator regression tests.

## v6.3.1 - 14 June 2026

- Moved the primary repository and GitHub Pages base path from `beta-uat` to `beta`.

## v6.3.0 - 14 June 2026

- Added the shared UI style guide.
- Added reusable design tokens, consistent 12px form controls, regular-weight typography, and responsive Database Checker modal/workspace refinements.

## v6.2.0 - 14 June 2026

- Added Database-to-Layout Test.
- Added automatic HTML loading, random or manual customer selection, KRHRED personalization/highlighting, subject normalization, coverage alerts, full-screen preview, and temporary URL/subject drafts.

## v6.1.0 - 14 June 2026

- Upgraded Database Checker with four-file package validation.
- Added static/dynamic detection, grouped anomaly findings, raw-line inspection, CSV export, and a compact package workspace.
- Added package overview details, detected KRHRED units, invalid finding summaries, and line inspection.

## v6.0.1 - 13 June 2026

- Introduced the wiki-style layout with a persistent left sidebar and dynamic content area.
- Refreshed the Home dashboard with quick access, sitemap, recent updates, useful links, and system info.
- Improved GitHub Pages deployment with base-path-aware routing/content loading and SPA fallback.
- Fixed the embedded Database Generator layout.

## v5.0.0 - 12 April 2026

- Released version 5.

## v4.0.0 - 14 March 2026

- Released version 4.

## v3.0.0 - 20 February 2026

- Released version 3.

## v2.0.0 - 13 October 2025

- Renamed the application from Alpha Sensei to **eDM Helper**.
- Released version 2.

## v1.0.0 - 17 August 2025

- Released version 1.

## 29 June 2025

- Added Layout Checker.
- Added Database Counter.

## v0.0.0 Beta Live - 27 May 2025

- The first public beta went live.

## April 2025

- The application was first created under the name **Alpha Sensei**.
