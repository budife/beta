/**
 * Local backup/restore helper for eDM Helper browser state.
 * This does not upload data anywhere; it only reads/writes browser-local storage.
 */
(function () {
  const BACKUP_VERSION = 1;
  const LOCAL_STORAGE_PREFIXES = [
    'edm-helper:',
    'layoutChecker',
    'config_state'
  ];
  const INDEXED_DB_NAMES = [
    'edm-helper-campaign-ids',
    'CalendarDB'
  ];

  function shouldIncludeLocalStorageKey(key) {
    return LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  function downloadJson(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(String(reader.result || '{}')));
        } catch (error) {
          reject(new Error('Backup file is not valid JSON.'));
        }
      };
      reader.onerror = () => reject(new Error('Unable to read backup file.'));
      reader.readAsText(file);
    });
  }

  function openDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error(`Unable to open ${name}.`));
      request.onblocked = () => reject(new Error(`${name} is blocked by another tab.`));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction was aborted.'));
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
    });
  }

  async function exportIndexedDb(name) {
    const db = await openDatabase(name);
    try {
      const storeNames = Array.from(db.objectStoreNames);
      const stores = {};
      if (!storeNames.length) return { name, stores };

      const transaction = db.transaction(storeNames, 'readonly');
      const done = transactionDone(transaction);
      await Promise.all(storeNames.map(async (storeName) => {
        stores[storeName] = await requestResult(transaction.objectStore(storeName).getAll());
      }));
      await done;
      return { name, stores };
    } finally {
      db.close();
    }
  }

  async function exportLocalState() {
    const localStorageData = {};
    Object.keys(localStorage)
      .filter(shouldIncludeLocalStorageKey)
      .sort()
      .forEach((key) => {
        localStorageData[key] = localStorage.getItem(key);
      });

    const indexedDbData = {};
    for (const name of INDEXED_DB_NAMES) {
      try {
        indexedDbData[name] = await exportIndexedDb(name);
      } catch (error) {
        indexedDbData[name] = { name, error: error.message };
      }
    }

    return {
      app: 'eDM Helper',
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      origin: window.location.origin,
      localStorage: localStorageData,
      indexedDB: indexedDbData
    };
  }

  function restoreLocalStorage(data) {
    Object.entries(data || {}).forEach(([key, value]) => {
      if (!shouldIncludeLocalStorageKey(key)) return;
      localStorage.setItem(key, value == null ? '' : String(value));
    });
  }

  async function clearIndexedDb(name) {
    const db = await openDatabase(name);
    try {
      const storeNames = Array.from(db.objectStoreNames);
      if (!storeNames.length) return;
      const transaction = db.transaction(storeNames, 'readwrite');
      const done = transactionDone(transaction);
      storeNames.forEach((storeName) => transaction.objectStore(storeName).clear());
      await done;
    } finally {
      db.close();
    }
  }

  async function restoreIndexedDb(data) {
    const databases = data || {};
    for (const [dbName, dbBackup] of Object.entries(databases)) {
      if (!INDEXED_DB_NAMES.includes(dbName) || !dbBackup?.stores) continue;
      const db = await openDatabase(dbName);
      try {
        const storeNames = Object.keys(dbBackup.stores).filter((storeName) => db.objectStoreNames.contains(storeName));
        if (!storeNames.length) continue;
        const transaction = db.transaction(storeNames, 'readwrite');
        const done = transactionDone(transaction);
        storeNames.forEach((storeName) => {
          const store = transaction.objectStore(storeName);
          store.clear();
          (dbBackup.stores[storeName] || []).forEach((record) => store.put(record));
        });
        await done;
      } finally {
        db.close();
      }
    }
  }

  async function clearLocalState() {
    Object.keys(localStorage)
      .filter(shouldIncludeLocalStorageKey)
      .forEach((key) => localStorage.removeItem(key));

    for (const dbName of INDEXED_DB_NAMES) {
      await clearIndexedDb(dbName).catch(() => {});
    }
  }

  function render(panel) {
    panel.innerHTML = `
      <div class="local-backup-panel">
        <div class="local-backup-summary">
          <strong>Browser-local data only</strong>
          <span>No upload. No server sync. JSON backup is downloaded locally.</span>
        </div>
        <div class="local-backup-actions">
          <button type="button" data-backup-export>Export backup</button>
          <label class="local-backup-import">
            <input type="file" accept="application/json,.json" data-backup-import hidden>
            <span>Import backup</span>
          </label>
          <button type="button" class="is-danger" data-backup-clear>Clear local data</button>
        </div>
        <p class="local-backup-status" data-backup-status>Ready.</p>
      </div>
    `;

    const status = panel.querySelector('[data-backup-status]');
    const setStatus = (message, type = '') => {
      status.textContent = message;
      status.className = `local-backup-status${type ? ` is-${type}` : ''}`;
    };

    panel.querySelector('[data-backup-export]').addEventListener('click', async () => {
      setStatus('Preparing backup...', 'loading');
      const data = await exportLocalState();
      downloadJson(data, `edm-helper-backup-${new Date().toISOString().slice(0, 10)}.json`);
      setStatus('Backup downloaded locally.', 'success');
    });

    panel.querySelector('[data-backup-import]').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setStatus('Restoring backup...', 'loading');
      const data = await readFileAsJson(file);
      restoreLocalStorage(data.localStorage);
      await restoreIndexedDb(data.indexedDB);
      setStatus('Backup restored. Refresh open tools to reload restored state.', 'success');
      event.target.value = '';
    });

    panel.querySelector('[data-backup-clear]').addEventListener('click', async () => {
      const confirmed = window.confirm('Clear eDM Helper local browser data on this browser?');
      if (!confirmed) return;
      setStatus('Clearing local data...', 'loading');
      await clearLocalState();
      setStatus('Local data cleared for this browser.', 'success');
    });
  }

  window.EDM_LOCAL_BACKUP = {
    exportLocalState,
    restoreLocalStorage,
    restoreIndexedDb,
    clearLocalState,
    render
  };
})();
