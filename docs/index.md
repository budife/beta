---
title: Documentation
description: Internal notes, operating guides, and maintenance references for eDM Helper.
icon: fa-solid fa-book-open
category: Reference
---

## Start Here

Documentation is loaded only when this page is opened, so the main workspace stays light.

- [Release checklist](#release-checklist)
- [Tool notes](#tool-notes)
- [Maintenance notes](#maintenance-notes)

## Release Checklist

- Update the app version when shipping visible changes.
- Add a recent update entry for user-facing changes.
- Run syntax checks for edited JavaScript files.
- Run the test suite before commit and push.
- Verify GitHub Pages paths if routing or assets changed.

## Tool Notes

- Database Checker validates static or dynamic database packages.
- Database Generator creates static and dynamic customer database files.
- Config eDM updates campaign config XML values.
- Layout Checker previews and validates eDM HTML layouts.
- Campaign Counter tracks local Monday campaign IDs by series.
- Bookmarklet contains helper actions for Monday and browser workflows.
- TNC Uploader prepares PDF links and saves files into emailblast folders.
- WFH Tracker tracks work-from-home entries.

## Maintenance Notes

- Keep app-facing content in `content/`.
- Keep longer internal documentation in `docs/`.
- Keep styling decisions in `STYLE-GUIDE.md`.
- Avoid loading all docs on the home page.
