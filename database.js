const DB_CONFIG = {
  name: 'lakota_db',
  version: 1,
  store: 'keyvalue'
};

let dbPromise = null;

function deleteAppDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      resolve();
      return;
    }

    const deleteRequest = indexedDB.deleteDatabase(DB_CONFIG.name);
    deleteRequest.onsuccess = () => {
      dbPromise = null;
      resolve();
    };
    deleteRequest.onerror = () => {
      dbPromise = null;
      reject(deleteRequest.error);
    };
    deleteRequest.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB-Löschung blockiert. Bitte schließen Sie andere Tabs mit dieser Anwendung.'));
    };
  });
}

function createDatabaseRequest() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB wird in diesem Browser nicht unterstützt.'));
      return;
    }

    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_CONFIG.store)) {
        db.createObjectStore(DB_CONFIG.store);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      reject(new Error('IndexedDB-Verbindung blockiert. Bitte schließen Sie andere Tabs mit dieser Anwendung.'));
    };
  });
}

async function openAppDatabase() {
  if (dbPromise) return dbPromise;

  try {
    dbPromise = createDatabaseRequest();
    return await dbPromise;
  } catch (error) {
    dbPromise = null;
    console.warn('[db] IndexedDB-Fehler beim Öffnen, versuche Reset:', error);
    try {
      await deleteAppDatabase();
      dbPromise = createDatabaseRequest();
      return await dbPromise;
    } catch (resetError) {
      dbPromise = null;
      console.error('[db] IndexedDB-Reset fehlgeschlagen:', resetError);
      throw resetError;
    }
  }
}

async function dbTransaction(mode = 'readonly') {
  try {
    const db = await openAppDatabase();
    return db.transaction(DB_CONFIG.store, mode).objectStore(DB_CONFIG.store);
  } catch (error) {
    console.warn('[db] Transaktion fehlgeschlagen, versuche DB-Reset:', error);
    await deleteAppDatabase();
    const db = await openAppDatabase();
    return db.transaction(DB_CONFIG.store, mode).objectStore(DB_CONFIG.store);
  }
}

async function dbGet(key) {
  const store = await dbTransaction('readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = async () => {
      await deleteAppDatabase();
      reject(request.error);
    };
  });
}

async function dbSet(key, value) {
  const store = await dbTransaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = async () => {
      await deleteAppDatabase();
      reject(request.error);
    };
  });
}

async function dbClear() {
  const store = await dbTransaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = async () => {
      await deleteAppDatabase();
      reject(request.error);
    };
  });
}
