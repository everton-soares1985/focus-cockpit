import Database from '@tauri-apps/plugin-sql';

let dbPromise: Promise<Database> | null = null;

async function openDatabase(): Promise<Database> {
  const db = await Database.load('sqlite:painel.sqlite3');
  await db.execute('PRAGMA foreign_keys = ON');
  await db.execute('PRAGMA journal_mode = WAL');
  return db;
}

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (!dbPromise) {
    return;
  }
  const current = dbPromise;
  dbPromise = null;
  const db = await current;
  await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
  await db.close();
}
