const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/campaign-id-core.js');

test('normalizes and sorts used campaign sequences', () => {
  assert.deepEqual(core.normalizeUsedSequences(['0231', 228, '0229', 228, 'x']), [228, 229, 231]);
});

test('allocates the smallest available gap from the smallest used sequence', () => {
  assert.equal(core.findNextAvailable([228, 229, 231, 235]), 230);
});

test('skips numbers already used ahead of the current gap', () => {
  const used = [228, 229, 230, 231, 235];
  assert.equal(core.findNextAvailable(used), 232);
  assert.equal(core.findNextAvailable([...used, 232, 233, 234]), 236);
});

test('respects an explicit sequence floor', () => {
  assert.equal(core.findNextAvailable([1, 2, 228, 229], 228), 230);
});

test('higher subitem ranges do not move the active regular floor', () => {
  const used = [244, 245, 246, 1111, 1112, 1113, 9999];
  assert.equal(core.findNextAvailable(used, 245), 247);
});

test('formats campaign sequence as four digits', () => {
  assert.equal(core.formatSequence(29), '0029');
  assert.equal(core.formatSequence('0228'), '0228');
});

test('groups IDs into regular and thousand series', () => {
  assert.equal(core.getSeries(246).key, 'regular');
  assert.equal(core.getSeries(1116).key, 'series-1000');
  assert.equal(core.getSeries(9999).key, 'series-9000');
});

test('series state uses the number after the latest used ID', () => {
  const values = [244, 245, 246, 1111, 1116, 9999];
  assert.deepEqual(
    core.getSeriesState(values, 'regular'),
    {
      key: 'regular',
      label: 'Regular',
      start: 1,
      end: 999,
      used: [244, 245, 246],
      latest: 246,
      next: 247
    }
  );
  assert.equal(core.getSeriesState(values, 'series-1000').next, 1117);
  assert.equal(core.getSeriesState(values, 'series-9000').next, null);
});

test('extracts Campaign IDs from Monday worksheet cell text', () => {
  assert.deepEqual(
    core.extractCampaignIds('20260614_edm4_0247 and 20260614_sub1_1117'),
    [
      { campaignId: '20260614_edm4_0247', sequenceNumber: 247 },
      { campaignId: '20260614_sub1_1117', sequenceNumber: 1117 }
    ]
  );
});
