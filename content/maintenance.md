---
title: Maintenance
description: Local backup, privacy switches, release notes, and project health checks in one place.
icon: fa-solid fa-screwdriver-wrench
category: Reference
---

## Local Backup

Export or restore browser-local data used by eDM Helper. This backup stays on your machine unless you choose to share the downloaded JSON file.

{{local-backup}}

## Privacy Switches

Use these before working with stricter campaign data. Changes are saved in this browser only.

{{privacy-settings}}

## Maintenance Checklist

- Update the affected tool version in `js/tool-versions.js`.
- Update Recent Updates on Home.
- Update `CHANGELOG.md`.
- Run smoke tests and JS syntax checks.
- Commit and push only after checks pass.

## Local Data Covered

- Privacy toggles.
- Config eDM last state.
- Layout Checker drafts.
- Layout Test draft.
- TNC Uploader queue/history.
- Campaign Counter local series.
- Campaign ID IndexedDB data.
- WFH calendar IndexedDB data.
- WFH holiday cache.
