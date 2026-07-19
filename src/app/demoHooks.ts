import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '../database/db';
import { clearDemoSeed } from '../database/seed';

export function useClearDemoData() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => clearDemoSeed(await getDb()),
    onSuccess: async () => client.invalidateQueries(),
  });
}
