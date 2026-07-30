# eDM Helper

Clean reference hub and productivity toolkit for everyday email marketing work.

eDM Helper is a static web app built for validating campaign files, preparing database outputs, checking HTML layouts, managing campaign IDs, uploading TNC PDFs, slicing visual layouts, and tracking WFH/office days. It is intentionally lightweight: mostly vanilla HTML, CSS, and JavaScript, with browser-local storage where possible.

[Live site](https://budife.github.io/beta/)

## Highlights

- Wiki-style app shell with a persistent sidebar and clean routes.
- Markdown-driven tool pages for easier documentation updates.
- Local-first workflows for sensitive campaign work.
- File System Access support for folder-based tools in Chromium browsers.
- GitHub Pages friendly routing with `404.html` SPA fallback.
- No build step required for normal usage.

## Tools

| Tool | Status | Purpose |
| --- | --- | --- |
| Database Checker | Stable | Validate static/dynamic four-file database packages, inspect issues, export findings, and test data against layouts. |
| Database Generator | Stable | Generate campaign database text files from email and KRHRED inputs. |
| Bookmarklet | Stable | Browser shortcuts for repetitive page cleanup and helper actions. |
| Campaign Counter | Beta | Track campaign ID usage locally from Monday-style folder/XLSX workflows. |
| Config eDM | Stable | Open and update eDM XML configuration files with safer field editing. |
| Layout Checker | Stable | Load HTML layouts, apply KRHRED values, preview, open in a new tab, and capture screenshots when browser security allows. |
| Layout Slicer | Beta | Slice flat JPG/PNG layouts into ordered image assets. |
| TNC Uploader | Beta | Rename, queue, save, and generate public links for PDF terms and conditions. |
| WFH Tracker | Stable | Track WFH/WFO/cuti/libur days with optional holiday sync. |

## Privacy Notes

This project is designed for internal-style daily work and avoids sending sensitive data out by default.

- Database files, generated campaign IDs, WFH marks, and most tool data stay in the browser or selected local folders.
- External network access is optional for features such as layout URL fetching, link checking, proxy fallback, or holiday sync.
- Campaign Counter and bookmarklet workflows are browser-local and do not require Supabase/cloud sync in the current flow.
- Review the source before using it with confidential work. The code is plain static web code and can be inspected directly in this repository.

## Run Locally

Use a local server. Do not open `index.html` directly with `file://`, because Markdown/content fetches and some browser APIs require HTTP.

```powershell
python server.py
```

Then open:

```text
http://localhost:8000/
```

Clean routes are supported locally, for example:

```text
http://localhost:8000/layout-checker
http://localhost:8000/tnc-uploader
```

## GitHub Pages

The app is configured for a project site under:

```text
https://budife.github.io/beta/
```

Important deployment details:

- `.nojekyll` is included so GitHub Pages serves underscored and static files normally.
- `404.html` acts as the SPA fallback so refresh on clean routes works.
- Runtime code uses a base path helper for GitHub Pages project paths.
- Asset and content fetch paths must stay relative or base-path aware.

## Browser Support

Best supported browser: Chromium-based browsers such as Microsoft Edge or Chrome.

Some APIs depend on browser support:

- Folder saving uses the File System Access API.
- Screenshot export can be limited by browser canvas security when remote images do not allow cross-origin capture.
- Direct folder pickers may work more reliably when a tool is opened directly instead of inside an iframe.

## Project Structure

```text
content/                 Markdown content rendered in the app shell
css/                     Shared and per-tool styles
docs/                    Documentation content
js/                      App shell, tool scripts, version registry
scripts/                 Maintenance and release helper scripts
tests/                   Node test suite
tools/                   Standalone tool HTML files embedded by routes
404.html                 GitHub Pages SPA fallback
index.html               Main app shell
server.py                Local development server
STYLE-GUIDE.md           UI/style guide for future changes
CHANGELOG.md             Release history
```

## Testing

Run the regression suite with:

```powershell
node --test tests/*.test.js
```

Useful quick checks:

```powershell
git diff --check
node --check js/pages-layout-checker.js
node --check js/pages-tnc-uploader.js
```

## Development Notes

- Keep tools lightweight and dependency-free unless there is a strong reason.
- Prefer local/browser storage over cloud storage for work data.
- Update `CHANGELOG.md` and `content/home.md` Recent Updates for every user-facing change.
- Update `js/tool-versions.js` when a specific tool changes.
- Update cache-busters in affected HTML files when CSS/JS changes need to refresh on GitHub Pages.
- Follow `STYLE-GUIDE.md` for spacing, colors, typography, and UI patterns.

## Credits

Created and maintained by [budife](https://github.com/budife).

Built with vanilla HTML, CSS, JavaScript, Markdown, Font Awesome, CodeMirror, SheetJS/XLSX, File System Access API, IndexedDB, localStorage, and GitHub Pages.

Not an official HSBC product. Use responsibly and verify outputs before production work.
