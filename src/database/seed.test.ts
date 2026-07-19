import { test, expect, vi } from 'vitest';
import { clearDemoSeed, runDemoSeed } from './seed';

vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn().mockResolvedValue({
        execute: vi.fn(),
        select: vi.fn(),
      }),
    },
  };
});

test('runDemoSeed executes all inserts and commits successfully', async () => {
  const mockExecute = vi.fn().mockResolvedValue([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDb = { execute: mockExecute, select: vi.fn() } as any;

  await runDemoSeed(mockDb);

  expect(mockExecute).toHaveBeenCalledWith('BEGIN TRANSACTION');
  expect(mockExecute).toHaveBeenCalledWith('COMMIT');
  // 2 projects, 2 slots, 3 priorities, 4 timeline items, 3 notes,
  // 2 courses, 2 credentials and 3 shortcuts = 21 writes.
  expect(mockExecute).toHaveBeenCalledTimes(23); // BEGIN + 21 writes + COMMIT
});

test('runDemoSeed rolls back on error and rethrows', async () => {
  const mockExecute = vi.fn().mockImplementation((query: string) => {
    if (query.includes('projects')) {
      throw new Error('DB Error');
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDb = { execute: mockExecute, select: vi.fn() } as any;

  await expect(runDemoSeed(mockDb)).rejects.toThrow('DB Error');
  expect(mockExecute).toHaveBeenCalledWith('ROLLBACK');
});

test('clearDemoSeed removes only known demonstration records', async () => {
  const mockExecute = vi.fn().mockImplementation((query: string) => {
    if (query === 'BEGIN IMMEDIATE' || query === 'COMMIT') {
      return Promise.resolve({ rowsAffected: 0 });
    }
    if (query.includes('focus_slots')) {
      return Promise.resolve({ rowsAffected: 2 });
    }
    return Promise.resolve({ rowsAffected: 3 });
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDb = { execute: mockExecute } as any;

  const result = await clearDemoSeed(mockDb);

  expect(result).toEqual({
    removedProjects: 3,
    removedCourses: 3,
    removedCredentials: 3,
    removedShortcuts: 3,
    removedPriorities: 3,
    removedPlanItems: 3,
    removedPlanNotes: 3,
  });
  expect(mockExecute).toHaveBeenCalledWith('BEGIN IMMEDIATE');
  expect(mockExecute).toHaveBeenLastCalledWith('COMMIT');
  expect(
    mockExecute.mock.calls.some((call) => String(call[0]).includes('DELETE FROM credentials')),
  ).toBe(true);
});
