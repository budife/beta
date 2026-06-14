# eDM Helper UI Style Guide

This document defines the reusable visual rules for eDM Helper and future
web applications. Use it as the default reference before adding page-specific
CSS.

## 1. Design Principles

- Keep interfaces clean, minimal, flat, and content-focused.
- Use a desktop-first layout that remains fluid on smaller monitors.
- Prefer borders, spacing, and typography over decorative effects.
- Keep controls compact without reducing clarity or clickability.
- Preserve stable panel sizes while content changes.
- Do not use gradients, glassmorphism, backdrop blur, or heavy shadows.
- Do not create a separate mobile visual language. Let the desktop layout
  adapt through wrapping, shrinking, stacking, and contained scrolling.

## 2. Design Tokens

Define shared values as CSS custom properties. Page styles should consume
these tokens instead of repeating raw values.

```css
:root {
  /* Brand */
  --ui-accent: #f18c8e;
  --ui-accent-hover: #df777a;
  --ui-accent-dark: #9f3f45;
  --ui-accent-soft: #fff1f1;

  /* Neutral */
  --ui-text: #212121;
  --ui-text-secondary: #52525b;
  --ui-muted: #71717a;
  --ui-border: #e4e4e7;
  --ui-border-strong: #d4d4d8;
  --ui-background: #ffffff;
  --ui-surface: #f8f9fa;
  --ui-surface-muted: #f4f4f5;

  /* Feedback */
  --ui-success: #166534;
  --ui-success-bg: #f0fdf4;
  --ui-success-border: #bbf7d0;
  --ui-error: #b91c1c;
  --ui-error-bg: #fef2f2;
  --ui-error-border: #fecaca;

  /* Typography */
  --ui-font: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue",
    Arial, sans-serif;
  --ui-font-mono: Consolas, Monaco, "Courier New", monospace;
  --ui-weight-light: 300;
  --ui-weight-regular: 400;
  --ui-weight-medium: 500;
  --ui-weight-semibold: 600;
  --ui-control-font-size: 12px;
  --ui-control-line-height: 1.35;
  --ui-control-min-height: 28px;

  /* Spacing */
  --ui-space-1: 4px;
  --ui-space-2: 8px;
  --ui-space-3: 12px;
  --ui-space-4: 16px;
  --ui-space-6: 24px;
  --ui-space-8: 32px;

  /* Shape and depth */
  --ui-radius-control: 2px;
  --ui-radius-panel: 2px;
  --ui-border-default: 1px solid var(--ui-border);
  --ui-shadow-modal: 0 6px 18px rgb(0 0 0 / 14%);

  /* Layout */
  --ui-sidebar-width: clamp(260px, 19vw, 288px);
  --ui-content-gap: clamp(4px, 0.6vw, 12px);
  --ui-page-padding: clamp(12px, 1.7vw, 32px);

  /* Motion */
  --ui-duration-fast: 150ms;
  --ui-duration-normal: 200ms;
}
```

All validation anomalies use the error palette. Do not use yellow warning dots
for invalid database findings.

## 3. Typography

Use regular typography as the visual default.

```css
body {
  color: var(--ui-text);
  font-family: var(--ui-font);
  font-size: 16px;
  font-weight: var(--ui-weight-regular);
  line-height: 1.5;
}
```

| Element | Weight | Typical size |
| --- | ---: | ---: |
| Body text | 400 | 14-16px |
| Page title | 600 | 24-32px |
| Section heading | 500-600 | 16-20px |
| Navigation | 500 | 14-16px |
| Button | 500 | 12-14px |
| Label and badge | 600 | 9-12px |
| Data and campaign ID | 400 | 11-14px |
| Important count | 600 | 16-24px |

- Avoid weight `700` unless a critical number genuinely needs emphasis.
- Use monospace only for IDs, paths, raw values, and database content.
- Use `overflow-wrap: anywhere` for unpredictable identifiers.
- Keep line lengths near 70 characters for documentation and explanatory text.

## 4. Fluid Desktop Layout

The interface must support wide and compact monitors without a separate
mobile-only design.

| Range | Intended behavior |
| --- | --- |
| `1440px` and wider | Full spacing and multi-panel workspace |
| `1200px-1439px` | Standard desktop layout |
| `900px-1199px` | Compact spacing and wrapped toolbar |
| `768px-899px` | Panels may stack when their minimum width is no longer usable |
| Below `768px` | Preserve usability with stacking and contained scrolling |

Use flexible columns:

```css
.app-shell {
  display: grid;
  grid-template-columns: var(--ui-sidebar-width) minmax(0, 1fr);
  min-width: 0;
}

.workspace {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ui-content-gap);
  min-width: 0;
}

@media (max-width: 899px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- Never give the main workspace a fixed pixel width.
- Every flex or grid child containing data must use `min-width: 0`.
- Use `clamp()` for spacing, titles, and layout dimensions.
- Toolbar controls must wrap before text or buttons become clipped.
- Sidebars may remain fixed-width on desktop but must not squeeze the workspace
  below its usable minimum.

## 5. Overflow Rules

- The document body must never have horizontal overflow.
- Long lists, tables, raw data, and validation findings scroll inside their
  own containers.
- Avoid nested vertical scroll areas unless the outer container is a modal.
- Use ellipsis for compact labels and wrap for explanatory text.
- Do not hide content with `overflow: hidden` unless clipping is intentional.
- Sticky headings belong to the same scroll container as their content.

```css
html,
body {
  max-width: 100%;
  overflow-x: hidden;
}

.data-scroll {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.compact-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

## 6. Spacing and Alignment

Use only the shared spacing scale: `4, 8, 12, 16, 24, 32px`.

- Compact controls: `4-8px` gaps.
- Panel content: `12-16px` padding.
- Page intro: `24-32px` padding.
- Separate major sections with `24-32px`.
- Align panel bottoms when panels share a row.
- Keep left and right workspace gutters visually equal.
- Avoid empty spacer elements and arbitrary margin adjustments.

## 7. Components

### Buttons

- Height: `32-40px`.
- Weight: `500`.
- Radius: `2px`.
- Primary buttons use coral; secondary buttons use a neutral surface.
- Hover changes color only. Do not lift, rotate, or add large shadows.
- Disabled controls must remain readable but clearly inactive.
- Focus must always be visible.

```css
.button {
  min-height: 36px;
  padding: 8px 12px;
  border: var(--ui-border-default);
  border-radius: var(--ui-radius-control);
  font: inherit;
  font-weight: var(--ui-weight-medium);
  transition:
    background-color var(--ui-duration-fast) ease,
    border-color var(--ui-duration-fast) ease,
    color var(--ui-duration-fast) ease;
}

.button:focus-visible {
  outline: 2px solid var(--ui-accent-dark);
  outline-offset: 2px;
}
```

### Inputs

- Use a visible border and white background.
- Use `12px / 1.35 / 400` as the default field typography.
- Use a minimum field height of `28px` for compact tool interfaces.
- Apply the shared field tokens to text, URL, email, search, number, date,
  select, and textarea controls.
- Checkbox, radio, range, color, file picker, raw-data editor, and source-code
  controls may define their own appropriate dimensions.
- Match adjacent button height to its field.
- Placeholder text must remain readable.
- Validation text appears below the field, not inside a tooltip.
- Focus uses the accent border and visible outline.

```css
.field {
  min-height: var(--ui-control-min-height);
  font-family: var(--ui-font);
  font-size: var(--ui-control-font-size);
  font-weight: var(--ui-weight-regular);
  line-height: var(--ui-control-line-height);
}
```

### Panels

- White background with a single neutral border.
- Header uses a slightly muted surface.
- Radius stays between `0-2px`.
- Shared panels in one workspace use matching outer spacing and height rules.
- Panel bodies own their scroll behavior.

### Badges and Status

- Keep labels short.
- Use a light background, visible border, and semibold text.
- Success is green; errors and validation anomalies are red.
- Do not rely on color alone: include an icon or text label.

### Loading, Empty, and Error States

Every data surface must define all three states.

- **Loading:** spinner plus a specific action, such as `Scanning packages...`.
- **Empty:** explain what is missing and the next action.
- **Error:** explain what failed and how to retry.
- Keep state content centered only when the whole panel is empty.
- Use an inline status bar when existing content must remain visible.
- Reserve enough space to prevent layout jumps.

### Tooltips

- Use tooltips only for short supporting information.
- Keep width at `min(340px, 70vw)`.
- Allow normal wrapping.
- Position within the viewport and reverse alignment near an edge.
- Use `:hover` and `:focus`.
- Never place essential error instructions only in a tooltip.

### Modals

```css
.modal-dialog {
  width: min(1360px, 96vw);
  max-height: 96vh;
  overflow: hidden;
  background: var(--ui-background);
  border: var(--ui-border-default);
  border-radius: var(--ui-radius-panel);
  box-shadow: var(--ui-shadow-modal);
}
```

- Modal content scrolls internally.
- Keep the header and close button visible.
- Close button is `28x28px`, square, and does not rotate.
- Modal loading overlays must be positioned relative to the content area.
- Avoid blur on the backdrop.
- Full-screen tool previews may use the viewport but must retain an exit control.

## 8. Interaction and Motion

- Keep transitions between `150-200ms`.
- Animate opacity, color, and small scale changes only.
- Do not animate layout dimensions for data-heavy interfaces.
- Avoid decorative rotation and bouncing.
- Disable nonessential animation when reduced motion is requested.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

## 9. Accessibility

- Maintain at least WCAG AA contrast.
- All interactive controls require a visible focus state.
- Icon-only buttons require an accessible name.
- Use semantic headings in order.
- Status updates use `role="status"` and `aria-live="polite"`.
- Errors that require immediate attention may use `role="alert"`.
- Do not use hover as the only interaction.
- Keep interactive targets at least `32x32px`.
- Associate input labels and error messages programmatically.

## 10. CSS Conventions

- Keep tokens in one shared file.
- Keep reusable components separate from page styles.
- Prefer classes over element IDs for styling.
- Name classes by component and state, such as `.panel`, `.panel-header`, and
  `.is-loading`.
- Group responsive overrides near the related component or in one documented
  breakpoint section.
- Avoid `!important` except when overriding third-party or embedded styles.
- Avoid page-specific copies of shared button, modal, tooltip, or status CSS.
- Remove obsolete rules instead of layering additional overrides indefinitely.
- Use logical properties when they improve direction-independent layouts.

Recommended reusable structure:

```text
css/
  tokens.css
  base.css
  layout.css
  components.css
  utilities.css
  pages/
    page-name.css
```

## 11. Browser Support

- Primary browsers: current Chrome and Edge.
- Provide reasonable fallbacks for `dvh`, `clamp()`, and fullscreen.
- Do not depend on experimental visual effects.
- Test keyboard navigation and browser zoom.

```css
.viewport-panel {
  min-height: 100vh;
  min-height: 100dvh;
}
```

## 12. Visual QA Checklist

Test each application at:

- `1920x1080`
- `1440x900`
- `1366x768`
- `1024x768`
- Browser zoom at `125%`

Verify:

- [ ] No body-level horizontal scrollbar.
- [ ] Sidebar and workspace remain proportionate.
- [ ] Toolbar buttons wrap without clipping.
- [ ] Long campaign IDs do not widen panels.
- [ ] Panels have matching gutters and bottom alignment.
- [ ] Data lists scroll inside their intended container.
- [ ] Empty, loading, success, and error states are readable.
- [ ] Tooltips remain inside the viewport.
- [ ] Modal header and close button remain visible.
- [ ] Modal content is reachable by scrolling.
- [ ] Focus states are visible with keyboard navigation.
- [ ] Disabled controls are identifiable.
- [ ] No gradients, backdrop blur, glass effects, or heavy shadows.
- [ ] No essential information depends only on color.
- [ ] The interface remains usable with unusually long text and empty data.

## 13. Change Policy

Before adding page-specific CSS:

1. Check whether the value belongs in a design token.
2. Check whether the behavior belongs in a reusable component.
3. Update the shared rule when the change should affect all pages.
4. Add a page override only for genuinely page-specific behavior.
5. Re-run the visual QA checklist after changing shared layout or components.

The goal is one predictable system, not a growing collection of local fixes.
