# Changelog

## v6.10.1 - 16 June 2026

- Centralized footer rendering through `js/version-config.js` so every `.footer-text` gets the same creator markup.
- Reduced the `budd` hover popover to the centered label `si pemalas` while keeping the link target unchanged.
- Added `scripts/release.ps1` to update app version, cache-busters, and the latest Home update in one repeatable step.
- Added clearer local-only backup guidance to Campaign Counter before reset, browser cleanup, or device changes.
- Refreshed cache-busters to keep GitHub Pages from serving stale CSS or JavaScript after release.

## v6.10.0 - 16 June 2026

- Moved Campaign Counter and its Monday bookmarklet to separate browser-local XLSX workflows with IndexedDB.
- Added Merge/Replace import modes, JSON backup, Reset, series tabs, reblast details, and compact allocators.
- Preserved Database Checker and Config eDM folder sessions across tool navigation.
- Supported both `EmailCustMast` and `CustMast` customer-master filenames.
- Improved folder/save loading states, Database Generator alignment, and cancelable replace-on-focus editing.

## v6.9.0 - 15 June 2026

- Rebuilt Campaign Counter around Regular-to-9000 ID series.
- Added Monday XLSX synchronization and the compact Monday allocator bookmarklet.

