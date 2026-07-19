import { invoke } from '@tauri-apps/api/core';
import type { ShortcutTargetType } from '../shortcuts/shortcutSchema';

export interface SavedTargetStatus {
  exists: boolean;
  targetTypeMatches: boolean;
  blocked: boolean;
}

export interface NativeFileError {
  code: string;
  message: string;
}

export async function inspectSavedTarget(
  path: string,
  targetType: ShortcutTargetType,
): Promise<SavedTargetStatus> {
  return invoke<SavedTargetStatus>('inspect_saved_target', { path, targetType });
}

export async function openSavedTarget(
  path: string,
  targetType: ShortcutTargetType,
): Promise<void> {
  await invoke('open_saved_target', { path, targetType });
}
