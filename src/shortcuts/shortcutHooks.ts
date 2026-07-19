import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  archiveShortcut,
  createShortcut,
  getFavoriteShortcuts,
  listShortcuts,
  restoreShortcut,
  updateShortcut,
} from './shortcutRepository';
import type { ShortcutDraftInput, ShortcutFilters } from './shortcutSchema';

export function useShortcuts(filters: ShortcutFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.shortcuts, 'list', filters],
    queryFn: async () => listShortcuts(await getDb(), filters),
  });
}

export function useFavoriteShortcuts() {
  return useQuery({
    queryKey: [...queryKeys.shortcuts, 'favorites'],
    queryFn: async () => getFavoriteShortcuts(await getDb()),
  });
}

function useRefreshShortcuts() {
  const client = useQueryClient();
  return async () => client.invalidateQueries({ queryKey: queryKeys.shortcuts });
}

export function useCreateShortcut() {
  const refresh = useRefreshShortcuts();
  return useMutation({
    mutationFn: async (input: ShortcutDraftInput) => createShortcut(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useUpdateShortcut() {
  const refresh = useRefreshShortcuts();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ShortcutDraftInput }) =>
      updateShortcut(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useArchiveShortcut() {
  const refresh = useRefreshShortcuts();
  return useMutation({
    mutationFn: async (id: string) => archiveShortcut(await getDb(), id),
    onSuccess: refresh,
  });
}

export function useRestoreShortcut() {
  const refresh = useRefreshShortcuts();
  return useMutation({
    mutationFn: async (id: string) => restoreShortcut(await getDb(), id),
    onSuccess: refresh,
  });
}
