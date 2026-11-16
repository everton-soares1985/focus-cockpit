import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  getJournalEntry,
  listJournalEntryDates,
  saveJournalEntry,
} from './journalRepository';
import type { JournalEntryDraftInput } from './journalSchema';

export function useJournalEntry(entryDate: string) {
  return useQuery({
    queryKey: [...queryKeys.journalEntries, entryDate],
    queryFn: async () => getJournalEntry(await getDb(), entryDate),
  });
}
export function useJournalEntryDates() {
  return useQuery({
    queryKey: queryKeys.journalEntryDates,
    queryFn: async () => listJournalEntryDates(await getDb()),
  });
}

export function useSaveJournalEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: JournalEntryDraftInput) =>
      saveJournalEntry(await getDb(), input),
    onSuccess: async (entry) => {
      client.setQueryData(
        [...queryKeys.journalEntries, entry.entryDate],
        entry,
      );
      await client.invalidateQueries({ queryKey: queryKeys.journalEntryDates });
    },
  });
}
