const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/pages-database-generator.js'), 'utf8');
const functionStart = source.indexOf('function recordId');
const functionEnd = source.indexOf('function downloadText', functionStart);
const generatorFunctions = source.slice(functionStart, functionEnd);
const sandbox = {};

vm.createContext(sandbox);
vm.runInContext(`
  let krKeys = [];
  const krValues = new Map();
  ${generatorFunctions}
  this.setDynamicData = (keys, values) => {
    krKeys = keys;
    krValues.clear();
    for (const [email, entries] of Object.entries(values)) {
      krValues.set(email, new Map(Object.entries(entries)));
    }
  };
  this.setRowData = (keys, rows) => {
    krKeys = keys;
    krValues.clear();
    for (const row of rows) {
      krValues.set(row.id, new Map(Object.entries(row.values)));
    }
  };
  this.buildAllFiles = buildAllFiles;
`, sandbox);

test('static generator creates the expected four files', () => {
  const campaignId = '20260614_TEST_1400';
  const files = sandbox.buildAllFiles(campaignId, ['tester@example.com'], false);

  assert.deepEqual(Object.keys(files), [
    `${campaignId}-CustMast.txt`,
    `${campaignId}-CustPref.txt`,
    `${campaignId}-CustSubs.txt`,
    `${campaignId}-CustAttr.txt`
  ]);
  assert.equal(
    files[`${campaignId}-CustPref.txt`],
    `${campaignId}-000001|tester@example.com|CMPG_ID|${campaignId}|\n`
  );
  assert.equal(
    files[`${campaignId}-CustAttr.txt`],
    `${campaignId}-000001|tester@example.com|CMPG_ID|${campaignId}|\n`
  );
});

test('dynamic CustAttr groups values by KRHRED key', () => {
  const campaignId = '20260614_TEST_1400';
  const emails = ['first@example.com', 'second@example.com'];
  sandbox.setDynamicData(
    ['KRHRED_Unit_30', 'KRHRED_Unit_31'],
    {
      'first@example.com': {
        KRHRED_Unit_30: 'First 30',
        KRHRED_Unit_31: 'First 31'
      },
      'second@example.com': {
        KRHRED_Unit_30: 'Second 30',
        KRHRED_Unit_31: 'Second 31'
      }
    }
  );

  const files = sandbox.buildAllFiles(campaignId, emails, true);
  const attrLines = files[`${campaignId}-CustAttr.txt`].trim().split('\n');

  assert.deepEqual(Array.from(attrLines), [
    `${campaignId}-000001|first@example.com|CMPG_ID|${campaignId}|`,
    `${campaignId}-000002|second@example.com|CMPG_ID|${campaignId}|`,
    `${campaignId}-000001|first@example.com|KRHRED_Unit_30|First 30|`,
    `${campaignId}-000002|second@example.com|KRHRED_Unit_30|Second 30|`,
    `${campaignId}-000001|first@example.com|KRHRED_Unit_31|First 31|`,
    `${campaignId}-000002|second@example.com|KRHRED_Unit_31|Second 31|`
  ]);
});

test('record IDs remain sequential and zero padded', () => {
  const campaignId = '20260614_TEST_1400';
  const files = sandbox.buildAllFiles(
    campaignId,
    ['first@example.com', 'second@example.com'],
    false
  );
  const mastLines = files[`${campaignId}-CustMast.txt`].trim().split('\n');

  assert.match(mastLines[0], new RegExp(`^${campaignId}-000001\\|`));
  assert.match(mastLines[1], new RegExp(`^${campaignId}-000002\\|`));
});

test('duplicate emails remain separate records with separate KRHRED values', () => {
  const campaignId = '20260614_DUPLICATE_1400';
  const rows = [
    { id: 1, email: 'same@example.com', values: { KRHRED_Unit_30: 'First row' } },
    { id: 2, email: 'same@example.com', values: { KRHRED_Unit_30: 'Second row' } }
  ];
  sandbox.setRowData(['KRHRED_Unit_30'], rows);

  const files = sandbox.buildAllFiles(campaignId, rows, true);
  const attrLines = files[`${campaignId}-CustAttr.txt`].trim().split('\n');

  assert.deepEqual(Array.from(attrLines), [
    `${campaignId}-000001|same@example.com|CMPG_ID|${campaignId}|`,
    `${campaignId}-000002|same@example.com|CMPG_ID|${campaignId}|`,
    `${campaignId}-000001|same@example.com|KRHRED_Unit_30|First row|`,
    `${campaignId}-000002|same@example.com|KRHRED_Unit_30|Second row|`
  ]);
});
