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

  function parseCampaignId(campaignId) {
    const match = String(campaignId || '').trim()
      .match(/^(20\d{6})_([A-Za-z0-9._-]+)_(\d{4})$/);
    if (!match) return null;

    const year = Number(match[1].slice(0, 4));
    const month = Number(match[1].slice(4, 6));
    const day = Number(match[1].slice(6, 8));
    const date = new Date(Date.UTC(year, month - 1, day));
    const validDate = date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;

    return {
      campaignId: match[0],
      sequenceNumber: Number(match[3]),
      campaignLabel: match[2],
      blastDate: validDate ? match[1].replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') : null
    };
  }

  function groupCampaignRecords(records) {
    const groups = new Map();
    (records || []).forEach(record => {
      const sequence = normalizeSequence(record.sequenceNumber ?? record.sequence_number);
      if (sequence === null) return;
      if (!groups.has(sequence)) groups.set(sequence, []);
      groups.get(sequence).push(record);
    });
    groups.forEach(items => items.sort((a, b) => {
      const dateA = String(a.blastDate ?? a.blast_date ?? '');
      const dateB = String(b.blastDate ?? b.blast_date ?? '');
      return dateB.localeCompare(dateA);
    }));
    return groups;
  }

  function normalizeHeader(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function findFallbackItemName(row, campaignColumn) {
    for (let index = campaignColumn - 1; index >= 0; index -= 1) {
      const value = String(row[index] || '').trim();
      if (!value || extractCampaignIds(value).length) continue;
      if (/^(campaign id|campaign id \(sub\)|task|item|subitem|sub item)$/i.test(value)) continue;
      return value;
    }
    return '';
  }

  function extractCampaignRecordsFromRows(rows, sheetName = '') {
    const records = new Map();
    let activeItemType = 'item';
    const columns = {
      item: { name: null, campaign: null },
      subitem: { name: null, campaign: null }
    };

    (rows || []).forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const header = normalizeHeader(value);
        if (header === 'task' || header === 'item') columns.item.name = columnIndex;
        if (header === 'campaign id') {
          columns.item.campaign = columnIndex;
          activeItemType = 'item';
        }
        if (header === 'subitem' || header === 'sub item') columns.subitem.name = columnIndex;
        if (header === 'campaign id (sub)' || header === 'campaign id sub') {
          columns.subitem.campaign = columnIndex;
          activeItemType = 'subitem';
        }
      });

      row.forEach((value, columnIndex) => {
        extractCampaignIds(value).forEach(found => {
          const parsed = parseCampaignId(found.campaignId);
          if (!parsed) return;
          const itemName = columns.item.name !== null
            ? String(row[columns.item.name] || '').trim()
            : '';
          const subitemName = columns.subitem.name !== null
            ? String(row[columns.subitem.name] || '').trim()
            : '';
          let itemType = activeItemType;
          if (columnIndex === columns.subitem.campaign && subitemName) itemType = 'subitem';
          else if (columnIndex === columns.item.campaign && itemName) itemType = 'item';
          const nameColumn = columns[itemType].name;
          const resolvedName = nameColumn !== null
            ? String(row[nameColumn] || '').trim()
            : findFallbackItemName(row, columnIndex);
          records.set(parsed.campaignId, {
            fullCampaignId: parsed.campaignId,
            sequenceNumber: parsed.sequenceNumber,
            itemName: resolvedName || parsed.campaignLabel,
            itemType,
            blastDate: parsed.blastDate,
            sheetName,
            sourceRow: rowIndex + 1
          });
        });
      });
    });

    return [...records.values()];
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
    extractCampaignIds,
    parseCampaignId,
    groupCampaignRecords,
    extractCampaignRecordsFromRows
  };
});
