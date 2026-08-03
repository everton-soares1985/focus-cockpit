import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import {
  getWeeklyPrioritySlots,
  moveWeeklyPriority,
  saveWeeklyPriority,
} from './weeklyPriorityRepository';

describe('weekly priorities', () => {
  test('sempre devolve as três posições da semana', async () => {
    const db = {
      select: vi.fn().mockResolvedValue([
        {
          id: 'priority-2',
          week_start: '2026-07-13',
          position: 2,
          title: 'Segunda prioridade',
          project_id: null,
          project_name: null,
          done: 0,
          created_at: '2026-07-13T00:00:00.000Z',
          updated_at: '2026-07-13T00:00:00.000Z',
        },
      ]),
    } as unknown as Database;

    const slots = await getWeeklyPrioritySlots(db, '2026-07-13');

    expect(slots).toHaveLength(3);
    expect(slots[0].priority).toBeNull();
    expect(slots[1].priority?.title).toBe('Segunda prioridade');
    expect(slots[2].priority).toBeNull();
  });

  test('não vincula prioridade a projeto arquivado', async () => {
    const db = {
      execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
      select: vi.fn().mockResolvedValue([{ archived: 1 }]),
    } as unknown as Database;

    await expect(
      saveWeeklyPriority(db, {
        weekStart: '2026-07-13',
        position: 1,
        title: 'Prioridade',
        projectId: 'archived-project',
      }),
    ).rejects.toThrow('Uma prioridade não pode usar um projeto arquivado.');
    expect(db.execute).not.toHaveBeenCalled();
  });

  test('troca duas prioridades da mesma semana em uma transação', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce({ rowsAffected: 0 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 0 });
    const db = { execute } as unknown as Database;

    await moveWeeklyPriority(db, {
      weekStart: '2026-07-27',
      fromPosition: 2,
      toPosition: 1,
    });

    expect(execute).toHaveBeenCalledTimes(5);
    expect(execute.mock.calls[0][0]).toBe('BEGIN IMMEDIATE');
    expect(execute.mock.calls[1][1]).toEqual([
      expect.any(String),
      '2026-07-27',
      2,
    ]);
    expect(execute.mock.calls[2][1]).toEqual([
      2,
      expect.any(String),
      '2026-07-27',
      1,
    ]);
    expect(execute.mock.calls[3][1]).toEqual([
      1,
      expect.any(String),
      '2026-07-27',
    ]);
    expect(execute.mock.calls[4][0]).toBe('COMMIT');
  });

  test('move uma prioridade para um espaço vazio', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce({ rowsAffected: 0 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 0 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 0 });
    const db = { execute } as unknown as Database;

    await expect(
      moveWeeklyPriority(db, {
        weekStart: '2026-07-27',
        fromPosition: 1,
        toPosition: 3,
      }),
    ).resolves.toBeUndefined();
    expect(execute.mock.calls[execute.mock.calls.length - 1]?.[0]).toBe('COMMIT');
  });

  test('desfaz a transação quando a prioridade de origem não existe', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce({ rowsAffected: 0 })
      .mockResolvedValueOnce({ rowsAffected: 0 })
      .mockResolvedValueOnce({ rowsAffected: 0 });
    const db = { execute } as unknown as Database;

    await expect(
      moveWeeklyPriority(db, {
        weekStart: '2026-07-27',
        fromPosition: 1,
        toPosition: 2,
      }),
    ).rejects.toThrow('Prioridade de origem não encontrada.');
    expect(execute.mock.calls[execute.mock.calls.length - 1]?.[0]).toBe('ROLLBACK');
  });
});
