import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  archiveCourse,
  createCourse,
  listCourses,
  restoreCourse,
  updateCourse,
} from './courseRepository';
import type { CourseDraftInput, CourseFilters } from './courseSchema';

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.courses, filters],
    queryFn: async () => listCourses(await getDb(), filters),
  });
}

function useRefreshCourses() {
  const client = useQueryClient();
  return async () => client.invalidateQueries({ queryKey: queryKeys.courses });
}

export function useCreateCourse() {
  const refresh = useRefreshCourses();
  return useMutation({
    mutationFn: async (input: CourseDraftInput) => createCourse(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useUpdateCourse() {
  const refresh = useRefreshCourses();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CourseDraftInput }) =>
      updateCourse(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useArchiveCourse() {
  const refresh = useRefreshCourses();
  return useMutation({
    mutationFn: async (id: string) => archiveCourse(await getDb(), id),
    onSuccess: refresh,
  });
}

export function useRestoreCourse() {
  const refresh = useRefreshCourses();
  return useMutation({
    mutationFn: async (id: string) => restoreCourse(await getDb(), id),
    onSuccess: refresh,
  });
}
