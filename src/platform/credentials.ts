import { invoke } from '@tauri-apps/api/core';
import {
  importedCredentialSchema,
  type ImportedCredential,
} from '../credentials/credentialSchema';

export interface CredentialStorageError {
  code: string;
  message: string;
}

export async function importCredential(sourcePath: string): Promise<ImportedCredential> {
  const imported = await invoke<unknown>('import_credential', { sourcePath });
  return importedCredentialSchema.parse(imported);
}

export async function openCredential(storedPath: string): Promise<void> {
  await invoke('open_credential', { storedPath });
}

export async function readCredentialBytes(storedPath: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>('read_credential_bytes', { storedPath });
  return Uint8Array.from(bytes);
}

export async function exportCredential(
  storedPath: string,
  destinationPath: string,
): Promise<void> {
  await invoke('export_credential', { storedPath, destinationPath });
}

export async function discardCredentialImport(storedPath: string): Promise<void> {
  await invoke('discard_credential_import', { storedPath });
}
