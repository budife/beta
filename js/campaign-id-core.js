(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CampaignIdCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MIN_SEQUENCE = 1;
  const MAX_SEQUENCE = 9999;

  function normalizeSequence(value) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) && parsed >= MIN_SEQUENCE && parsed <= MAX_SEQUENCE
      ? parsed
      : null;
  }

  function normalizeUsedSequences(values) {
    return [...new Set((values || [])
      .map(normalizeSequence)
      .filter(value => value !== null))]
      .sort((a, b) => a - b);
  }

  function findNextAvailable(values, requestedFloor) {
    const used = normalizeUsedSequences(values);
    const explicitFloor = normalizeSequence(requestedFloor);
    const floor = explicitFloor || used[0] || MIN_SEQUENCE;
    const usedSet = new Set(used);

    for (let candidate = floor; candidate <= MAX_SEQUENCE; candidate += 1) {
      if (!usedSet.has(candidate)) return candidate;
    }

    return null;
  }

  function getNearbyUsed(values, nextSequence, radius = 5) {
    const used = normalizeUsedSequences(values);
    const next = normalizeSequence(nextSequence);
    if (!next) return used.slice(-12);

    const nearby = used.filter(value => Math.abs(value - next) <= radius);
    return nearby.length ? nearby : used.slice(-12);
  }

  function formatSequence(value) {
    const normalized = normalizeSequence(value);
    return normalized === null ? '----' : String(normalized).padStart(4, '0');
  }

  function getAllocationState(values, requestedFloor) {
    const used = normalizeUsedSequences(values);
    const next = findNextAvailable(used, requestedFloor);
    return {
      used,
      floor: normalizeSequence(requestedFloor) || used[0] || MIN_SEQUENCE,
      next,
      nearbyUsed: getNearbyUsed(used, next)
    };
  }

  return {
    MIN_SEQUENCE,
    MAX_SEQUENCE,
    normalizeSequence,
    normalizeUsedSequences,
    findNextAvailable,
    getNearbyUsed,
    formatSequence,
    getAllocationState
  };
});
