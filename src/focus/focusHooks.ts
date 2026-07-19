import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import type { Lane } from '../projects/projectSchema';
import { getFocusSlots, setFocusProject } from './focusRepository';
import type { WeeklyPriorityDraftInput } from './focusSchema';
import { getWeekStart } from './week';
import {
  clearWeeklyPriority,
  getWeeklyPrioritySlots,
  saveWeeklyPriority,
  setWeeklyPriorityDone,
} from './weeklyPriorityRepository';

export function useFocusSlots() {
  return useQuery({
    queryKey: queryKeys.focus,
    queryFn: async () => getFocusSlots(await getDb()),
  });
}

export function useSetFocusProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ lane, projectId }: { lane: Lane; projectId: string | null }) =>
      setFocusProject(await getDb(), lane, projectId),
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.focus }),
  });
}

export function useWeeklyPriorities(weekStart = getWeekStart()) {
  return useQuery({
    queryKey: [...queryKeys.weeklyPriorities, weekStart],
    queryFn: async () => getWeeklyPrioritySlots(await getDb(), weekStart),
  });
}

function useRefreshPriorities() {
  const client = useQueryClient();
  return async () => client.invalidateQueries({ queryKey: queryKeys.weeklyPriorities });
}

export function useSaveWeeklyPriority() {
  const refresh = useRefreshPriorities();
  return useMutation({
    mutationFn: async (input: WeeklyPriorityDraftInput) =>
      saveWeeklyPriority(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useToggleWeeklyPriority() {
  const refresh = useRefreshPriorities();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) =>
      setWeeklyPriorityDone(await getDb(), id, done),
    onSuccess: refresh,
  });
}

export function useClearWeeklyPriority() {
  const refresh = useRefreshPriorities();
  return useMutation({
    mutationFn: async ({
      weekStart,
      position,
    }: {
      weekStart: string;
      position: 1 | 2 | 3;
    }) => clearWeeklyPriority(await getDb(), weekStart, position),
    onSuccess: refresh,
  });
}
