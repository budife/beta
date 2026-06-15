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
  const SERIES = Array.from({ length: 10 }, (_, index) => ({
    key: index === 0 ? 'regular' : `series-${index}000`,
    label: index === 0 ? 'Regular' : `${index}000 Series`,
    start: index === 0 ? 1 : index * 1000,
    end: index === 0 ? 999 : (index * 1000) + 999
  }));

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

  function getSeries(sequence) {
    const normalized = normalizeSequence(sequence);
    if (normalized === null) return null;
    return SERIES.find(series => normalized >= series.start && normalized <= series.end) || null;
  }

  function getSeriesState(values, seriesKey) {
    const series = SERIES.find(item => item.key === seriesKey);
    if (!series) return null;
    const used = normalizeUsedSequences(values)
      .filter(value => value >= series.start && value <= series.end);
    const latest = used.length ? used[used.length - 1] : null;
    const usedSet = new Set(used);
    let next = latest === null ? series.start : latest + 1;
    while (next <= series.end && usedSet.has(next)) next += 1;
    return {
      ...series,
      used,
      latest,
      next: next <= series.end ? next : null
    };
  }

  function extractCampaignIds(text) {
    const pattern = /\b(20\d{6}_[A-Za-z0-9._-]+?_(\d{4}))\b/g;
    const records = [];
    let match;
    while ((match = pattern.exec(String(text || ''))) !== null) {
      records.push({
        campaignId: match[1],
        sequenceNumber: Number(match[2])
      });
    }
    return records;
  }

  return {
    MIN_SEQUENCE,
    MAX_SEQUENCE,
    SERIES,
    normalizeSequence,
    normalizeUsedSequences,
    findNextAvailable,
    getNearbyUsed,
    formatSequence,
    getAllocationState,
    getSeries,
    getSeriesState,
    extractCampaignIds
  };
});
