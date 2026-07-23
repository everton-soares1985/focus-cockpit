import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  archiveProject,
  createProject,
  deleteProjectRecord,
  listProjects,
  restoreProject,
  updateProject,
} from './projectRepository';
import type { ProjectDraftInput, ProjectFilters } from './projectSchema';

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.projects, filters],
    queryFn: async () => listProjects(await getDb(), filters),
  });
}

function useRefreshProjects() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.projects }),
      client.invalidateQueries({ queryKey: queryKeys.focus }),
      client.invalidateQueries({ queryKey: queryKeys.weeklyPriorities }),
    ]);
  };
}

export function useCreateProject() {
  const refresh = useRefreshProjects();
  return useMutation({
    mutationFn: async (input: ProjectDraftInput) => createProject(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useUpdateProject() {
  const refresh = useRefreshProjects();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProjectDraftInput }) =>
      updateProject(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useArchiveProject() {
  const refresh = useRefreshProjects();
  return useMutation({
    mutationFn: async (id: string) => archiveProject(await getDb(), id),
    onSuccess: refresh,
  });
}

export function useRestoreProject() {
  const refresh = useRefreshProjects();
  return useMutation({
    mutationFn: async (id: string) => restoreProject(await getDb(), id),
    onSuccess: refresh,
  });
}

export function useDeleteProject() {
  const refresh = useRefreshProjects();
  return useMutation({
    mutationFn: async (id: string) => deleteProjectRecord(await getDb(), id),
    onSuccess: refresh,
  });
}
