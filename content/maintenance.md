---
title: Maintenance
description: Browser-local data safeguards, privacy switches, and a compact release routine in one place.
icon: fa-solid fa-screwdriver-wrench
category: Reference
---

## Keep Your Local State Safe

Before clearing browser data, changing machines, or changing browser profiles, export a local JSON backup. eDM Helper does not upload this file anywhere.

{{local-backup}}

## Network & Privacy Controls

Use these before working with stricter campaign data. Each setting is saved in this browser only and applies immediately to the related tool.

{{privacy-settings}}

## Release Routine

1. Update the affected tool version in `js/tool-versions.js`.
2. Update Recent Updates on Home and `CHANGELOG.md`.
3. Run targeted syntax checks, smoke tests, and `git diff --check`.
4. Refresh cache-busters for changed shared CSS/JS.
5. Commit and push only after the checks pass.

## What the Backup Covers

- Privacy toggles.
- Config eDM last state.
- Layout Checker drafts.
- Layout Test draft.
- TNC Uploader queue/history.
- Campaign Counter local series.
- Campaign ID IndexedDB data.
- WFH calendar IndexedDB data.
- WFH holiday cache.

## Recovery Notes

- Import replaces the matching eDM Helper local data stored in this browser.
- Refresh any currently open tool after restoring a backup.
- Folder permissions are managed by the browser and are not included in backups. Choose the folder again when a tool requests it.
