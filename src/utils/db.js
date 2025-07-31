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
  // pointsプロパティを除外して返す
  return allData.map(({ points, ...metadata }) => metadata);
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

// ToDo: GPXデータを削除する関数を後で追加