import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import { createCourse } from './courseRepository';

describe('createCourse', () => {
  test('cria o curso com uma única escrita SQLite e sem transação manual', async () => {
    const execute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
    const db = { execute } as unknown as Database;

    const id = await createCourse(db, {
      title: 'Curso de teste',
      status: 'Planejado',
      priority: null,
    });

    expect(id).toEqual(expect.any(String));
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO courses'),
      expect.arrayContaining([id, 'Curso de teste', 'Planejado']),
    );
    expect(execute).not.toHaveBeenCalledWith('BEGIN IMMEDIATE');
  });
});
