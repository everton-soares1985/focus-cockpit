import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import { createBook } from './bookRepository';

describe('createBook', () => {
  test('cria o livro com uma única escrita SQLite', async () => {
    const execute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
    const db = { execute } as unknown as Database;

    const id = await createBook(db, {
      title: 'Livro de teste',
      author: 'Autor',
      status: 'Lendo',
      progressPercent: 25,
    });

    expect(id).toEqual(expect.any(String));
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO books'),
      expect.arrayContaining([id, 'Livro de teste', 'Autor', 'Lendo', 25]),
    );
  });
});
