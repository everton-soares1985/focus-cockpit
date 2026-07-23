import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  createBook,
  deleteBookRecord,
  listBooks,
  updateBook,
} from './bookRepository';
import type { BookDraftInput, BookFilters } from './bookSchema';

export function useBooks(filters: BookFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.books, filters],
    queryFn: async () => listBooks(await getDb(), filters),
  });
}

function useRefreshBooks() {
  const client = useQueryClient();
  return async () => client.invalidateQueries({ queryKey: queryKeys.books });
}

export function useCreateBook() {
  const refresh = useRefreshBooks();
  return useMutation({
    mutationFn: async (input: BookDraftInput) => createBook(await getDb(), input),
    onSuccess: refresh,
  });
}

export function useUpdateBook() {
  const refresh = useRefreshBooks();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BookDraftInput }) =>
      updateBook(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useDeleteBook() {
  const refresh = useRefreshBooks();
  return useMutation({
    mutationFn: async (id: string) => deleteBookRecord(await getDb(), id),
    onSuccess: refresh,
  });
}
