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

test('formats campaign sequence as four digits', () => {
  assert.equal(core.formatSequence(29), '0029');
  assert.equal(core.formatSequence('0228'), '0228');
});
