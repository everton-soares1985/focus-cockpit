import { z } from 'zod';

export const planCategorySchema = z.enum([
  'Idiomas',
  'Cursos',
  'Especializações',
  'Certificados',
  'Projetos',
  'Habilidades',
]);
export const planStatusSchema = z.enum(['Planejado', 'Em andamento', 'Concluído']);
export const semesterSchema = z.union([z.literal(1), z.literal(2)]);
export const planNoteGroupSchema = z.enum([
  'current_priority',
  'future_course',
  'suggested_project',
]);

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || null);

export function periodValue(year: number, semester: 1 | 2): number {
  return year * 2 + semester;
}

export function periodIndex(
  year: number,
  semester: 1 | 2,
  firstVisibleYear: number,
): number {
  return (year - firstVisibleYear) * 2 + (semester - 1);
}

export const planItemDraftSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o título do item.').max(160),
    category: planCategorySchema,
    startYear: z.number().int().min(2000).max(2200),
    startSemester: semesterSchema,
    endYear: z.number().int().min(2000).max(2200),
    endSemester: semesterSchema,
    status: planStatusSchema,
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional()
      .default(null),
    notes: optionalText(2000),
    sortOrder: z.number().int().min(0).optional().default(0),
  })
  .refine(
    (item) =>
      periodValue(item.endYear, item.endSemester) >=
      periodValue(item.startYear, item.startSemester),
    { message: 'O fim do período não pode ser anterior ao início.', path: ['endYear'] },
  );

export const planNoteDraftSchema = z.object({
  groupName: planNoteGroupSchema,
  title: z.string().trim().min(1, 'Informe o texto.').max(240),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type PlanCategory = z.infer<typeof planCategorySchema>;
export type PlanStatus = z.infer<typeof planStatusSchema>;
export type Semester = z.infer<typeof semesterSchema>;
export type PlanNoteGroup = z.infer<typeof planNoteGroupSchema>;
export type PlanItemDraft = z.output<typeof planItemDraftSchema>;
export type PlanItemDraftInput = z.input<typeof planItemDraftSchema>;
export type PlanNoteDraft = z.output<typeof planNoteDraftSchema>;
export type PlanNoteDraftInput = z.input<typeof planNoteDraftSchema>;

export interface PlanItem extends PlanItemDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanNote extends PlanNoteDraft {
  id: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
