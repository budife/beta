# Agent Rules

This file contains instructions for AI agents working on the eDM Helper project.

## 1. Commit Policy

- **Only commit when explicitly asked by the user.**
- When the user says "commit", **always** update before committing:
  1. `CHANGELOG.md` with user-facing changes
  2. `content/home.md` Recent Updates section
  3. `js/tool-versions.js` version if a tool version changed
  4. Cache-busters in affected HTML files when CSS or JavaScript changes (see STYLE-GUIDE.md)
- After updating docs, include them in the same commit.
- Never commit without the user's explicit request.
- Do not run `git push --force` or destructive git operations unless explicitly asked.

## 2. Release Hygiene

See `STYLE-GUIDE.md` section "Release Hygiene" for the full checklist. Key items:

- Update `content/home.md` Recent Updates.
- Update `CHANGELOG.md`.
- Update `js/tool-versions.js` for tool-specific user-facing changes.
- Refresh cache-busters in affected HTML files when CSS or JavaScript changes.
- Run `git diff --check` before handing work back.

## 3. General Coding Rules

- Make minimal changes to achieve the goal.
- Follow existing code style in the project.
- Refer to `STYLE-GUIDE.md` for design tokens, UI patterns, and CSS conventions.
- Run `node --check <file>` and `node --test tests/*.test.js` after JavaScript changes.
- Use the dedicated Read/Write/Edit tools for file operations; avoid Shell for file content changes.
- Prefer editing existing files over creating new ones unless explicitly required.
- Keep it stupidly simple; do not overcomplicate.

## 4. Project Context

- eDM Helper is a static web application hosted on GitHub Pages.
- Branch: `dev`.
- Main technologies: vanilla HTML/CSS/JS, no build step.
- Supabase is used only for Campaign Counter.

## 5. Communication

- Respond in the same language as the user (Indonesian for this project).
- Be concise and accurate.
- Ask for clarification when requirements are unclear.
