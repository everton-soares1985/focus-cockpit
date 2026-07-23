import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import {
  getWeeklyPrioritySlots,
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
});
