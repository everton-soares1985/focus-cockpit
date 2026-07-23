import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import { deleteCourseRecord } from '../courses/courseRepository';
import { deleteBookRecord } from '../books/bookRepository';
import { deleteCredentialRecord } from '../credentials/credentialRepository';
import { deleteProjectRecord } from '../projects/projectRepository';
import { deleteShortcutRecord } from '../shortcuts/shortcutRepository';

describe('remoção segura de registros', () => {
  test.each([
    ['projeto', deleteProjectRecord, 'DELETE FROM projects WHERE id = $1'],
    ['curso', deleteCourseRecord, 'DELETE FROM courses WHERE id = $1'],
    ['livro', deleteBookRecord, 'DELETE FROM books WHERE id = $1'],
    ['diploma', deleteCredentialRecord, 'DELETE FROM credentials WHERE id = $1'],
    ['atalho', deleteShortcutRecord, 'DELETE FROM shortcuts WHERE id = $1'],
  ])('remove somente o registro de %s no SQLite', async (_label, remove, expectedSql) => {
    const execute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
    const db = { execute } as unknown as Database;

    await remove(db, 'record-id');

    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(expectedSql, ['record-id']);
  });
});
