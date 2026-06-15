(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CampaignIdLocalStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DB_NAME = 'edm-helper-campaign-ids';
  const DB_VERSION = 1;
  const RECORDS = 'records';
  const ALLOCATIONS = 'allocations';
  const META = 'meta';

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function open() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDS)) {
        const records = db.createObjectStore(RECORDS, { keyPath: 'fullCampaignId' });
        records.createIndex('sequenceNumber', 'sequenceNumber');
      }
      if (!db.objectStoreNames.contains(ALLOCATIONS)) {
        db.createObjectStore(ALLOCATIONS, { keyPath: 'sequenceNumber' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    return requestResult(request);
  }

  async function load() {
    const db = await open();
    const transaction = db.transaction([RECORDS, ALLOCATIONS, META], 'readonly');
    const recordsRequest = transaction.objectStore(RECORDS).getAll();
    const allocationsRequest = transaction.objectStore(ALLOCATIONS).getAll();
    const importMetaRequest = transaction.objectStore(META).get('lastImport');
    const [records, allocations, importMeta] = await Promise.all([
      requestResult(recordsRequest),
      requestResult(allocationsRequest),
      requestResult(importMetaRequest)
    ]);
    await transactionDone(transaction);
    db.close();
    return {
      records,
      allocations,
      lastImport: importMeta?.value || null
    };
  }

  async function removeImportedAllocations(store) {
    const allocations = await requestResult(store.getAll());
    allocations
      .filter(allocation => allocation.source === 'xlsx')
      .forEach(allocation => store.delete(allocation.sequenceNumber));
  }

  async function importRecords(records, fileName = '', mode = 'merge', summary = null) {
    const db = await open();
    const transaction = db.transaction([RECORDS, ALLOCATIONS, META], 'readwrite');
    const recordStore = transaction.objectStore(RECORDS);
    const allocationStore = transaction.objectStore(ALLOCATIONS);
    const importedAt = new Date().toISOString();

    if (mode === 'replace') {
      recordStore.clear();
      await removeImportedAllocations(allocationStore);
    }

    records.forEach(record => {
      recordStore.put({ ...record, importedAt });
      allocationStore.put({
        sequenceNumber: record.sequenceNumber,
        source: 'xlsx',
        updatedAt: importedAt
      });
    });
    transaction.objectStore(META).put({
      key: 'lastImport',
      value: {
        importedAt,
        fileName,
        mode,
        recordCount: records.length,
        summary
      }
    });
    await transactionDone(transaction);
    db.close();
  }

  async function reserve(sequenceNumber) {
    const db = await open();
    const transaction = db.transaction(ALLOCATIONS, 'readwrite');
    const store = transaction.objectStore(ALLOCATIONS);
    const existing = await requestResult(store.get(sequenceNumber));
    if (existing) {
      await transactionDone(transaction);
      db.close();
      throw new Error('Campaign ID is already used.');
    }
    store.put({
      sequenceNumber,
      source: 'manual',
      updatedAt: new Date().toISOString()
    });
    await transactionDone(transaction);
    db.close();
  }

  async function reset() {
    const db = await open();
    const transaction = db.transaction([RECORDS, ALLOCATIONS, META], 'readwrite');
    transaction.objectStore(RECORDS).clear();
    transaction.objectStore(ALLOCATIONS).clear();
    transaction.objectStore(META).clear();
    await transactionDone(transaction);
    db.close();
  }

  return { load, importRecords, reserve, reset };
});
