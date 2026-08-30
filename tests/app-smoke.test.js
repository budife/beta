const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function getRoutes() {
  const app = read('js/app.js');
  const routeBlock = app.match(/const ROUTES = \{([\s\S]*?)\n\};/);
  assert.ok(routeBlock, 'ROUTES block exists');
  return Array.from(routeBlock[1].matchAll(/'([^']+)':\s*\{([\s\S]*?)\n\s*\}/g))
    .map((match) => {
      const routeBody = match[2];
      const content = routeBody.match(/content:\s*'([^']+)'/)?.[1];
      const source = routeBody.match(/source:\s*'([^']+)'/)?.[1] || 'content';
      return { path: match[1], content, source };
    })
    .filter((route) => route.content);
}

test('all SPA routes have matching markdown content', () => {
  for (const route of getRoutes()) {
    const base = route.source === 'docs' ? 'docs' : 'content';
    assert.ok(fs.existsSync(path.join(root, base, route.content)), `${route.path} content exists`);
  }
});

test('all tool routes have a tool version entry', () => {
  const versions = read('js/tool-versions.js');
  const routes = getRoutes().filter((route) => route.path !== '/');
  for (const route of routes) {
    const key = route.path.slice(1);
    assert.match(versions, new RegExp(`(?:['"]${key}['"]|${key})\\s*:`), `${key} has a version entry`);
  }
});

test('tool markdown files point to existing HTML tools', () => {
  for (const fileName of fs.readdirSync(path.join(root, 'content')).filter((name) => name.endsWith('.md'))) {
    const markdown = read(`content/${fileName}`);
    const toolMatch = markdown.match(/^tool:\s*(.+)$/m);
    if (!toolMatch) continue;
    const toolPath = toolMatch[1].trim().replace(/^\/+/, '').split('?')[0];
    assert.ok(fs.existsSync(path.join(root, toolPath)), `${fileName} tool exists at ${toolPath}`);
  }
});

test('shell loads required maintenance scripts', () => {
  const app = read('js/app.js');
  for (const file of ['index.html', '404.html']) {
    const html = read(file);
    assert.match(html, /js\/tool-versions\.js/, `${file} loads tool versions`);
  }
  assert.match(app, /local-backup\.js/, 'app.js lazy-loads local backup helper');
  assert.match(app, /privacy-settings\.js/, 'app.js lazy-loads privacy settings');
});
