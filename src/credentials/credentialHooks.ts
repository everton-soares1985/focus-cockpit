import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import { getDb } from '../database/db';
import {
  discardCredentialImport,
  importCredential,
} from '../platform/credentials';
import {
  createCredential,
  deleteCredentialRecord,
  listCredentials,
  updateCredentialMetadata,
} from './credentialRepository';
import type {
  CredentialFilters,
  CredentialMetadataInput,
} from './credentialSchema';

export function useCredentials(filters: CredentialFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.credentials, filters],
    queryFn: async () => listCredentials(await getDb(), filters),
  });
}

function useRefreshCredentials() {
  const client = useQueryClient();
  return async () =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.credentials }),
      client.invalidateQueries({ queryKey: queryKeys.courses }),
    ]);
}

export function useImportCredential() {
  const refresh = useRefreshCredentials();
  return useMutation({
    mutationFn: async ({
      sourcePath,
      metadata,
    }: {
      sourcePath: string;
      metadata: CredentialMetadataInput;
    }) => {
      const imported = await importCredential(sourcePath);
      try {
        return await createCredential(await getDb(), metadata, imported);
      } catch (error) {
        await discardCredentialImport(imported.storedPath).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: refresh,
  });
}

export function useUpdateCredentialMetadata() {
  const refresh = useRefreshCredentials();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CredentialMetadataInput }) =>
      updateCredentialMetadata(await getDb(), id, input),
    onSuccess: refresh,
  });
}

export function useDeleteCredential() {
  const refresh = useRefreshCredentials();
  return useMutation({
    mutationFn: async (id: string) => deleteCredentialRecord(await getDb(), id),
    onSuccess: refresh,
  });
}
