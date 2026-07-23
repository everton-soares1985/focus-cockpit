import { z } from 'zod';

export const bookStatusSchema = z.enum([
  'Quero ler',
  'Lendo',
  'Concluído',
  'Pausado',
  'Abandonado',
]);

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || null);

const optionalDate = z
  .union([z.iso.date(), z.literal(''), z.null()])
  .optional()
  .transform((value) => value || null);

const optionalInteger = (minimum = 0, maximum?: number) =>
  z
    .union([
      z.number().int().min(minimum).max(maximum ?? Number.MAX_SAFE_INTEGER),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value));

const optionalRating = z
  .union([z.number().int().min(1).max(5), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value));

const optionalLink = z
  .union([
    z.url({ protocol: /^https?$/, message: 'Use um link iniciado por http:// ou https://.' }),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((value) => value || null);

export const bookDraftSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o título do livro.').max(180),
    author: optionalText(160),
    status: bookStatusSchema,
    progressPercent: z.number().int().min(0).max(100),
    currentPage: optionalInteger(),
    totalPages: optionalInteger(1),
    startedOn: optionalDate,
    completedOn: optionalDate,
    rating: optionalRating,
    notes: optionalText(5000),
    filePath: optionalText(2048),
    link: optionalLink,
  })
  .refine(
    (book) =>
      book.currentPage === null ||
      book.totalPages === null ||
      book.currentPage <= book.totalPages,
    {
      message: 'A página atual não pode ser maior que o total de páginas.',
      path: ['currentPage'],
    },
  )
  .refine(
    (book) =>
      !book.startedOn || !book.completedOn || book.completedOn >= book.startedOn,
    {
      message: 'A conclusão não pode ser anterior ao início.',
      path: ['completedOn'],
    },
  );

export type BookStatus = z.infer<typeof bookStatusSchema>;
export type BookDraft = z.output<typeof bookDraftSchema>;
export type BookDraftInput = z.input<typeof bookDraftSchema>;

export interface Book extends BookDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookFilters {
  search?: string;
  status?: BookStatus;
}
