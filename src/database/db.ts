import Database, { type QueryResult } from '@tauri-apps/plugin-sql';

let dbPromise: Promise<Database> | null = null;

const busyRetryDelaysMs = [150, 400, 800];

function isDatabaseBusy(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|database is busy|SQLITE_BUSY|code:\s*5/i.test(message);
}

async function executeWithBusyRetry(
  execute: (query: string, bindValues?: unknown[]) => Promise<QueryResult>,
  query: string,
  bindValues?: unknown[],
): Promise<QueryResult> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await execute(query, bindValues);
    } catch (error: unknown) {
      const delay = busyRetryDelaysMs[attempt];
      if (!isDatabaseBusy(error) || delay === undefined) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }
}

export function serializeDatabaseWrites(db: Database): Database {
  const nativeExecute = db.execute.bind(db);
  let pending: Promise<void> = Promise.resolve();

  db.execute = (query: string, bindValues?: unknown[]) => {
    const operation = pending.then(() =>
      executeWithBusyRetry(nativeExecute, query, bindValues),
    );
    pending = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  };

  return db;
}

async function openDatabase(): Promise<Database> {
  const db = await Database.load('sqlite:painel.sqlite3');
  await db.execute('PRAGMA foreign_keys = ON');
  await db.execute('PRAGMA journal_mode = WAL');
  await db.execute('PRAGMA busy_timeout = 10000');
  return serializeDatabaseWrites(db);
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
