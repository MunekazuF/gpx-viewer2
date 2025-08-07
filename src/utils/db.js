import { openDB } from 'idb';

const DB_NAME = 'GPXViewerDB';
const STORE_NAME = 'gpxFiles';
const DB_VERSION = 1;

// データベース接続を初期化
const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // インデックスを作成しておくと、後で特定のフィールドでの検索が高速になる
        store.createIndex('fileName', 'fileName', { unique: false });
      }
    },
  });
  return db;
};

/**
 * GPXデータをIndexedDBに保存する
 * @param {object} gpxData - 保存するGPXデータ
 */
export const saveGpxData = async (gpxData) => {
  const db = await initDB();
  await db.put(STORE_NAME, gpxData);
};

/**
 * すべてのGPXデータのメタデータ（points以外）を取得する
 * @returns {Promise<Array<object>>} メタデータの配列
 */
export const getAllGpxMetadata = async () => {
  const db = await initDB();
  const allData = await db.getAll(STORE_NAME);
  // pointsプロパティのみを除外し、他のメタデータ（startPoint, endPointを含む）は保持する
  return allData.map(item => {
    const { points, ...metadata } = item;
    return metadata;
  });
};

/**
 * 指定したIDのGPXデータの完全な情報を取得する
 * @param {string} id - 取得するGPXデータのID
 * @returns {Promise<object|undefined>} GPXデータ
 */
export const getGpxDataById = async (id) => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

/**
 * 指定したIDのGPXデータを削除する
 * @param {Array<string>} ids - 削除するGPXデータのIDの配列
 */
export const deleteGpxDataByIds = async (ids) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
};

/**
 * 指定したIDのGPXデータを更新する
 * @param {string} id - 更新するGPXデータのID
 * @param {object} updates - 更新するプロパティと値のオブジェクト (例: { name: "新しい名前", color: "#FF0000" })
 */
export const updateGpxData = async (id, updates) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.store;
  const gpxData = await store.get(id);

  if (gpxData) {
    const updatedGpxData = { ...gpxData, ...updates };
    await store.put(updatedGpxData);
  }
  await tx.done;
};

/**
 * IndexedDBのすべてのGPXデータを削除する
 */
export const clearAllGpxData = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};