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
  test('salva projeto da mesma lane com uma única escrita atômica', async () => {
    const db = databaseMock({ lane: 'A' });

    await setFocusProject(db, 'A', 'project-a');

    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO focus_slots'),
      expect.arrayContaining(['A', 'project-a']),
    );
  });

  test('rejeita projeto da lane errada antes de escrever', async () => {
    const db = databaseMock({ lane: 'B' });

    await expect(setFocusProject(db, 'A', 'project-b')).rejects.toThrow(
      'Selecione um projeto da Lane A.',
    );
    expect(db.execute).not.toHaveBeenCalled();
  });

  test('permite limpar o slot sem consultar projeto', async () => {
    const db = databaseMock();

    await setFocusProject(db, 'B', null);

    expect(db.select).not.toHaveBeenCalled();
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO focus_slots'),
      expect.arrayContaining(['B', null]),
    );
  });
});
