import { describe, expect, test } from 'vitest';
import { bookDraftSchema } from './bookSchema';

describe('bookDraftSchema', () => {
  test('normaliza os campos opcionais vazios', () => {
    const book = bookDraftSchema.parse({
      title: 'Livro demonstrativo',
      status: 'Quero ler',
      progressPercent: 0,
      author: '',
      currentPage: '',
      totalPages: null,
      link: '',
    });

    expect(book.author).toBeNull();
    expect(book.currentPage).toBeNull();
    expect(book.totalPages).toBeNull();
    expect(book.link).toBeNull();
  });

  test('rejeita página atual maior que o total', () => {
    const result = bookDraftSchema.safeParse({
      title: 'Livro',
      status: 'Lendo',
      progressPercent: 50,
      currentPage: 300,
      totalPages: 200,
    });

    expect(result.success).toBe(false);
  });

  test('rejeita links fora de http e https', () => {
    const result = bookDraftSchema.safeParse({
      title: 'Livro',
      status: 'Quero ler',
      progressPercent: 0,
      link: 'file:///C:/private.txt',
    });

    expect(result.success).toBe(false);
  });
});
