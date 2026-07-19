import { z } from 'zod';
import { prioritySchema } from '../projects/projectSchema';

export const courseStatusSchema = z.enum(['Planejado', 'Em andamento', 'Concluído']);

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

export const courseDraftSchema = z
  .object({
    institution: optionalText(120),
    title: z.string().trim().min(1, 'Informe o nome do curso.').max(180),
    category: optionalText(80),
    status: courseStatusSchema,
    priority: prioritySchema.nullable().optional().default(null),
    startedOn: optionalDate,
    completedOn: optionalDate,
    notes: optionalText(3000),
  })
  .refine(
    (course) =>
      !course.startedOn || !course.completedOn || course.completedOn >= course.startedOn,
    { message: 'A conclusão não pode ser anterior ao início.', path: ['completedOn'] },
  );

export type CourseStatus = z.infer<typeof courseStatusSchema>;
export type CourseDraft = z.output<typeof courseDraftSchema>;
export type CourseDraftInput = z.input<typeof courseDraftSchema>;

export interface Course extends CourseDraft {
  id: string;
  archived: boolean;
  credentialCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  search?: string;
  status?: CourseStatus;
  category?: string;
  includeArchived?: boolean;
}
