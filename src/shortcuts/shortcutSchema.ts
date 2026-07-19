import { z } from 'zod';

export const shortcutTargetTypeSchema = z.enum(['file', 'folder']);

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || null);

export const shortcutDraftSchema = z.object({
  label: z.string().trim().min(1, 'Informe o nome do atalho.').max(120),
  targetType: shortcutTargetTypeSchema,
  path: z.string().trim().min(1, 'Selecione um arquivo ou pasta.').max(2048),
  category: optionalText(80),
  notes: optionalText(1000),
  favorite: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type ShortcutTargetType = z.infer<typeof shortcutTargetTypeSchema>;
export type ShortcutDraft = z.output<typeof shortcutDraftSchema>;
export type ShortcutDraftInput = z.input<typeof shortcutDraftSchema>;

export interface Shortcut extends ShortcutDraft {
  id: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShortcutFilters {
  search?: string;
  category?: string;
  favoritesOnly?: boolean;
  includeArchived?: boolean;
}
