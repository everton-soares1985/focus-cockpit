import { invoke } from '@tauri-apps/api/core';
import { closeDb, getDb } from '../database/db';

export interface BackupSummary {
  schemaVersion: number;
  createdAtEpochSeconds: number;
  credentialCount: number;
  thumbnailCount: number;
  totalBytes: number;
}

export interface BackupError {
  code: string;
  message: string;
}

export async function createBackup(destinationPath: string): Promise<BackupSummary> {
  const snapshotPath = await invoke<string>('prepare_backup_snapshot');
  try {
    const db = await getDb();
    await db.execute('VACUUM INTO $1', [snapshotPath]);
    return await invoke<BackupSummary>('export_backup', { snapshotPath, destinationPath });
  } catch (error) {
    await invoke('discard_backup_snapshot', { snapshotPath }).catch(() => undefined);
    throw error;
  }
}

export async function inspectBackup(backupPath: string): Promise<BackupSummary> {
  return invoke<BackupSummary>('inspect_backup', { backupPath });
}

export async function restoreBackupConfirmed(backupPath: string): Promise<BackupSummary> {
  await closeDb();
  try {
    return await invoke<BackupSummary>('restore_backup', {
      backupPath,
      confirmed: true,
    });
  } catch (error) {
    await getDb().catch(() => undefined);
    throw error;
  }
}
