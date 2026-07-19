import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  archivePlanNote,
  createPlanItem,
  createPlanNote,
  deletePlanItem,
  listPlanItems,
  listPlanNotes,
  updatePlanItem,
  updatePlanNote,
} from './planRepository';
import type { PlanItemDraftInput, PlanNoteDraftInput } from './planSchema';

export function usePlanItems(firstYear?: number, lastYear?: number) {
  return useQuery({
    queryKey: [...queryKeys.planItems, firstYear, lastYear],
    queryFn: async () => listPlanItems(await getDb(), firstYear, lastYear),
  });
}

export function usePlanNotes(includeArchived = false) {
  return useQuery({
    queryKey: [...queryKeys.planNotes, includeArchived],
    queryFn: async () => listPlanNotes(await getDb(), includeArchived),
  });
}

function useRefreshPlan(queryKey: readonly string[]) {
  const client = useQueryClient();
  return async () => client.invalidateQueries({ queryKey });
}

export function useCreatePlanItem() {
  const refresh = useRefreshPlan(queryKeys.planItems);
  return useMutation({
    mutationFn: async (input: PlanItemDraftInput) => createPlanItem(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useUpdatePlanItem() {
  const refresh = useRefreshPlan(queryKeys.planItems);
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PlanItemDraftInput }) =>
      updatePlanItem(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useDeletePlanItem() {
  const refresh = useRefreshPlan(queryKeys.planItems);
  return useMutation({
    mutationFn: async (id: string) => deletePlanItem(await getDb(), id),
    onSuccess: refresh,
  });
}

export function useCreatePlanNote() {
  const refresh = useRefreshPlan(queryKeys.planNotes);
  return useMutation({
    mutationFn: async (input: PlanNoteDraftInput) => createPlanNote(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useUpdatePlanNote() {
  const refresh = useRefreshPlan(queryKeys.planNotes);
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PlanNoteDraftInput }) =>
      updatePlanNote(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useArchivePlanNote() {
  const refresh = useRefreshPlan(queryKeys.planNotes);
  return useMutation({
    mutationFn: async (id: string) => archivePlanNote(await getDb(), id),
    onSuccess: refresh,
  });
}
