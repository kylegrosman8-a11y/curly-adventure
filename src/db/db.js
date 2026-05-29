// IndexedDB persistence via the `idb` wrapper.
// One object store per entity type. Everything survives reloads with no backend.
import { openDB } from 'idb';
import { buildSeed } from './seed.js';

const DB_NAME = 'account-war-room';
const DB_VERSION = 1;

export const STORES = [
  'accounts',
  'team',
  'workstreams',
  'notes',
  'actionItems',
  'checkins',
  'meta',
];

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            // `meta` uses an explicit key; the rest are keyed by their `id`.
            db.createObjectStore(name, name === 'meta' ? {} : { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

/** Load the whole dataset into memory. Seeds on first run. */
export async function loadAll() {
  const db = await getDB();
  const seeded = await db.get('meta', 'seeded');

  if (!seeded) {
    await seedDatabase();
  }

  const [accounts, team, workstreams, notes, actionItems, checkins] = await Promise.all([
    db.getAll('accounts'),
    db.getAll('team'),
    db.getAll('workstreams'),
    db.getAll('notes'),
    db.getAll('actionItems'),
    db.getAll('checkins'),
  ]);

  return { accounts, team, workstreams, notes, actionItems, checkins };
}

async function seedDatabase() {
  const db = await getDB();
  const seed = buildSeed();
  const tx = db.transaction(
    ['accounts', 'team', 'workstreams', 'notes', 'actionItems', 'checkins', 'meta'],
    'readwrite'
  );
  for (const a of seed.accounts) tx.objectStore('accounts').put(a);
  for (const t of seed.team) tx.objectStore('team').put(t);
  for (const w of seed.workstreams) tx.objectStore('workstreams').put(w);
  for (const n of seed.notes) tx.objectStore('notes').put(n);
  for (const ai of seed.actionItems) tx.objectStore('actionItems').put(ai);
  for (const c of seed.checkins) tx.objectStore('checkins').put(c);
  tx.objectStore('meta').put(new Date().toISOString(), 'seeded');
  await tx.done;
}

/** Upsert a record into a store. */
export async function put(store, record) {
  const db = await getDB();
  await db.put(store, record);
  return record;
}

/** Upsert many records of one store inside a single transaction. */
export async function putMany(store, records) {
  if (!records.length) return;
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  for (const r of records) tx.store.put(r);
  await tx.done;
}

export async function remove(store, id) {
  const db = await getDB();
  await db.delete(store, id);
}

/** Wipe everything and re-seed. Used by the "reset demo data" control. */
export async function resetDatabase() {
  const db = await getDB();
  const tx = db.transaction(STORES, 'readwrite');
  for (const name of STORES) tx.objectStore(name).clear();
  await tx.done;
  await seedDatabase();
}
