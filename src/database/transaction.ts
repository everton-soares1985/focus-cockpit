import type Database from '@tauri-apps/plugin-sql';

export async function withTransaction<T>(
  db: Database,
  operation: () => Promise<T>,
): Promise<T> {
  await db.execute('BEGIN IMMEDIATE');

  try {
    const result = await operation();
    await db.execute('COMMIT');
    return result;
  } catch (error) {
    try {
      await db.execute('ROLLBACK');
    } catch {
      // Preserve the original domain/database error.
    }
    throw error;
  }
}
