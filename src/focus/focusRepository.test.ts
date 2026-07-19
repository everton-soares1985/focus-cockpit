import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import { setFocusProject } from './focusRepository';

function databaseMock(options: { lane?: 'A' | 'B'; archived?: number } = {}) {
  return {
    execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
    select: vi.fn().mockResolvedValue(
      options.lane ? [{ lane: options.lane, archived: options.archived ?? 0 }] : [],
    ),
  } as unknown as Database;
}

describe('setFocusProject', () => {
  test('salva projeto da mesma lane em uma transação', async () => {
    const db = databaseMock({ lane: 'A' });

    await setFocusProject(db, 'A', 'project-a');

    expect(db.execute).toHaveBeenNthCalledWith(1, 'BEGIN IMMEDIATE');
    expect(db.execute).toHaveBeenLastCalledWith('COMMIT');
  });

  test('rejeita projeto da lane errada e faz rollback', async () => {
    const db = databaseMock({ lane: 'B' });

    await expect(setFocusProject(db, 'A', 'project-b')).rejects.toThrow(
      'Selecione um projeto da Lane A.',
    );
    expect(db.execute).toHaveBeenLastCalledWith('ROLLBACK');
  });

  test('permite limpar o slot sem consultar projeto', async () => {
    const db = databaseMock();

    await setFocusProject(db, 'B', null);

    expect(db.select).not.toHaveBeenCalled();
    expect(db.execute).toHaveBeenLastCalledWith('COMMIT');
  });
});
