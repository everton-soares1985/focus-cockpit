import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import { serializeDatabaseWrites } from './db';

describe('serializeDatabaseWrites', () => {
  test('mantém somente uma escrita em andamento por vez', async () => {
    let releaseFirst: (() => void) | undefined;
    let concurrentWrites = 0;
    let maximumConcurrentWrites = 0;
    const executionOrder: string[] = [];

    const execute = vi.fn(async (query: string) => {
      concurrentWrites += 1;
      maximumConcurrentWrites = Math.max(maximumConcurrentWrites, concurrentWrites);
      executionOrder.push(`start:${query}`);

      if (query === 'first') {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      }

      executionOrder.push(`end:${query}`);
      concurrentWrites -= 1;
      return { rowsAffected: 1, lastInsertId: 0 };
    });
    const db = { execute } as unknown as Database;
    serializeDatabaseWrites(db);

    const first = db.execute('first');
    const second = db.execute('second');
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    releaseFirst?.();
    await Promise.all([first, second]);

    expect(maximumConcurrentWrites).toBe(1);
    expect(executionOrder).toEqual([
      'start:first',
      'end:first',
      'start:second',
      'end:second',
    ]);
  });
});
