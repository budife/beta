const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/pages-database-checker.js'), 'utf8');
const constants = source.slice(
  source.indexOf('const LINES_PER_PAGE'),
  source.indexOf('// Make constants configurable')
) + source.slice(source.indexOf('const unitRegex'), source.indexOf('/* ========= File reader'));
const classStart = source.indexOf('class DatabaseChecker');
const classEnd = source.indexOf('\n/* ========= Utils', classStart);
const sandbox = {
  console,
  window: {},
  document: { addEventListener() {} },
  navigator: {},
  alert() {},
  setTimeout,
  clearTimeout,
  Blob,
  URL,
  TextDecoder,
  DOMException,
  performance
};

vm.createContext(sandbox);
vm.runInContext(`${constants}\n${source.slice(classStart, classEnd)}\nthis.DatabaseChecker = DatabaseChecker;`, sandbox);

function checker() {
  const instance = Object.create(sandbox.DatabaseChecker.prototype);
  instance.updatePercent = () => {};
  return instance;
}

function packageFiles(rows = {}) {
  const defaults = {
    CustMast: ['20260101_TEST-000001|user@example.com||||||||||||||||||'],
    CustPref: ['20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|'],
    CustSubs: ['20260101_TEST-000001|user@example.com|Marketing|Y|'],
    CustAttr: ['20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|']
  };

  return Object.fromEntries(Object.entries({ ...defaults, ...rows }).map(([type, lines]) => [
    type,
    { type, name: `${type}.txt`, size: lines.join('\n').length, lines }
  ]));
}

test('valid static package has no findings', async () => {
  const result = await checker().validateDatabasePackage(packageFiles(), { key: '20260101_TEST' });
  assert.equal(result.databaseType, 'Static');
  assert.equal(result.findingCount, 0);
});

test('dynamic package validates KRHRED values', async () => {
  const files = packageFiles({
    CustAttr: [
      '20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|',
      '20260101_TEST-000001|user@example.com|KRHRED_Unit_30|hello  world|'
    ]
  });
  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });
  assert.equal(result.databaseType, 'Dynamic');
  assert.equal(result.categoryCounts.find(([category]) => category === 'Repeated Spaces')[1], 1);
  assert.equal(result.categoryCounts.some(([category]) => category === 'Invalid KRHRED Data'), false);
});

test('missing file is reported', async () => {
  const files = packageFiles();
  delete files.CustSubs;
  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });
  assert.ok(result.findings.some((finding) => finding.category === 'Missing File' && finding.file === 'CustSubs'));
});

test('email mismatch is reported across files', async () => {
  const files = packageFiles({
    CustPref: ['20260101_TEST-000001|other@example.com|CMPG_ID|20260101_TEST|']
  });
  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });
  assert.ok(result.findings.some((finding) => finding.category === 'Email Mismatch'));
});

test('clean routes do not collide with root HTML tool files', () => {
  const rootHtml = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
  assert.deepEqual(rootHtml, ['404.html', 'index.html']);

  const markdown = fs.readFileSync(path.join(root, 'content/database-checker.md'), 'utf8');
  assert.match(markdown, /tool: \/tools\/database-checker\.html\?embed=1/);
});

test('validation respects an aborted signal', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    checker().validateDatabasePackage(packageFiles(), { key: '20260101_TEST' }, controller.signal),
    (error) => error.name === 'AbortError'
  );
});

test('package date parser rejects implausible dates', () => {
  const instance = checker();
  assert.equal(instance.extractPackageDate('20260115_TEST').getFullYear(), 2026);
  assert.equal(instance.extractPackageDate('30250525_TEST'), null);
  assert.equal(instance.extractPackageDate('20261340_TEST'), null);
});

test('ASP package month and day inherit the dominant explicit year', () => {
  const instance = checker();
  const packages = [
    {
      key: '20250525_ABC_700',
      date: instance.extractPackageDate('20250525_ABC_700'),
      dateTimestamp: 0,
      latestModified: new Date(2026, 0, 1).getTime()
    },
    {
      key: '20250424_UAT',
      date: instance.extractPackageDate('20250424_UAT'),
      dateTimestamp: 0,
      latestModified: new Date(2026, 0, 1).getTime()
    },
    {
      key: 'ASP_IMO_9990525',
      date: null,
      dateTimestamp: 0,
      latestModified: new Date(2026, 0, 1).getTime()
    }
  ];

  instance.resolvePackageDates(packages);
  assert.equal(instance.getDateKey(packages[2].date), '2025-05-25');
  assert.match(packages[2].dateSource, /inferred 2025/);
});

test('ASP month-day parser uses the final four digits', () => {
  const instance = checker();
  assert.deepEqual(
    { ...instance.extractAspMonthDay('ASP_IMO_7000525') },
    { month: 5, day: 25 }
  );
  assert.equal(instance.extractAspMonthDay('ASP_IMO_7001399'), null);
});

test('file modified date never determines package grouping', () => {
  const instance = checker();
  const packages = [{
    key: 'CAMPAIGN_WITHOUT_DATE',
    date: null,
    dateTimestamp: 0,
    dateSource: '',
    latestModified: new Date(2026, 5, 14).getTime()
  }];

  instance.resolvePackageDates(packages);
  assert.equal(packages[0].date, null);
  assert.equal(packages[0].dateTimestamp, 0);
  assert.equal(packages[0].dateSource, '');
});

test('ASP package without a campaign year reference stays unknown', () => {
  const instance = checker();
  const packages = [{
    key: 'ASP_IMO_9990525',
    date: null,
    dateTimestamp: 0,
    dateSource: '',
    latestModified: new Date(2026, 5, 14).getTime()
  }];

  instance.resolvePackageDates(packages);
  assert.equal(packages[0].date, null);
  assert.equal(packages[0].dateSource, '');
});

test('package findings group by warning type and filter by KRHRED unit', () => {
  const instance = checker();
  const findings = [
    instance.createFinding('KRHRED Too Long', 'CustAttr', 2, '', 'KRHRED_Unit_30 contains 70 characters.'),
    instance.createFinding('Empty KRHRED Value', 'CustAttr', 3, '', 'KRHRED_Unit_31: Value is empty.'),
    instance.createFinding('Repeated Spaces', 'CustAttr', 4, '', 'KRHRED_Unit_30: Value contains repeated spaces.')
  ];

  const allGroups = instance.groupPackageFindings(findings);
  assert.equal(allGroups.length, 3);

  const filteredGroups = instance.groupPackageFindings(findings, 'KRHRED_Unit_30');
  assert.deepEqual(
    Array.from(filteredGroups, (group) => [group.category, group.items.length]),
    [['KRHRED Too Long', 1], ['Repeated Spaces', 1]]
  );
});

test('compact finding reason removes repeated KRHRED unit prefix', () => {
  const instance = checker();
  const finding = instance.createFinding(
    'Empty KRHRED Value',
    'CustAttr',
    4,
    '',
    'KRHRED_Unit_30: Value is empty.'
  );

  assert.equal(
    instance.getCompactFindingReason(finding),
    'Value is empty.'
  );
});

test('KRHRED value anomalies use specific categories', () => {
  const instance = checker();

  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue('').anomalies, (item) => item.category),
    ['Empty KRHRED Value']
  );
  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue('.').anomalies, (item) => item.category),
    ['Dot-only KRHRED Value']
  );
  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue(' value ').anomalies, (item) => item.category),
    ['Outer Whitespace']
  );
  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue('hello  world').anomalies, (item) => item.category),
    ['Repeated Spaces']
  );
});
