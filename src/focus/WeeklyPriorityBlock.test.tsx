import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { WeeklyPriorityBlock } from './WeeklyPriorityBlock';
import { getWeekStart } from './week';

const { movePriority } = vi.hoisted(() => ({
  movePriority: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./focusHooks', () => ({
  useWeeklyPriorities: () => ({
    data: [
      {
        position: 1,
        priority: {
          id: 'priority-1',
          weekStart: '2026-08-03',
          position: 1,
          title: 'Primeira tarefa',
          projectId: null,
          projectName: null,
          done: false,
          createdAt: '2026-08-03T00:00:00.000Z',
          updatedAt: '2026-08-03T00:00:00.000Z',
        },
      },
      {
        position: 2,
        priority: {
          id: 'priority-2',
          weekStart: '2026-08-03',
          position: 2,
          title: 'Segunda tarefa mais importante',
          projectId: null,
          projectName: null,
          done: false,
          createdAt: '2026-08-03T00:00:00.000Z',
          updatedAt: '2026-08-03T00:00:00.000Z',
        },
      },
      { position: 3, priority: null },
    ],
    isLoading: false,
  }),
  useMoveWeeklyPriority: () => ({
    mutateAsync: movePriority,
    isPending: false,
  }),
  useToggleWeeklyPriority: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useClearWeeklyPriority: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSaveWeeklyPriority: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../projects/projectHooks', () => ({
  useProjects: () => ({ data: [] }),
}));

beforeEach(() => {
  movePriority.mockClear();
});

test('troca prioridades quando uma tarefa é arrastada sobre outra', async () => {
  render(<WeeklyPriorityBlock />);
  const storedData = new Map<string, string>();
  const dataTransfer = {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: (type: string, value: string) => storedData.set(type, value),
    getData: (type: string) => storedData.get(type) ?? '',
  };

  fireEvent.dragStart(screen.getByRole('button', { name: 'Mover prioridade 2' }), {
    dataTransfer,
  });
  fireEvent.dragOver(screen.getByTestId('weekly-priority-slot-1'), { dataTransfer });
  fireEvent.drop(screen.getByTestId('weekly-priority-slot-1'), { dataTransfer });

  await waitFor(() => {
    expect(movePriority).toHaveBeenCalledWith({
      weekStart: getWeekStart(),
      fromPosition: 2,
      toPosition: 1,
    });
  });
});
