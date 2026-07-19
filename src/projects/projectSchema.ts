import { z } from 'zod';

export const laneSchema = z.enum(['A', 'B']);
export const projectStatusSchema = z.enum(['Ativo', 'Pausado', 'Concluído']);
export const prioritySchema = z.enum(['Alta', 'Média', 'Baixa']);

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || null);

export const projectDraftSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do projeto.').max(120),
  lane: laneSchema,
  area: optionalText(80),
  status: projectStatusSchema,
  priority: prioritySchema.nullable().optional().default(null),
  nextAction: optionalText(240),
  lastProgress: optionalText(240),
  folderPath: optionalText(1024),
  notes: optionalText(4000),
});

export type Lane = z.infer<typeof laneSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type ProjectDraft = z.output<typeof projectDraftSchema>;
export type ProjectDraftInput = z.input<typeof projectDraftSchema>;

export interface Project extends ProjectDraft {
  id: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilters {
  search?: string;
  lane?: Lane;
  status?: ProjectStatus;
  includeArchived?: boolean;
}
