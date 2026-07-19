import { z } from 'zod';
import { laneSchema, type Lane, type Project } from '../projects/projectSchema';

export const focusSelectionSchema = z.object({
  lane: laneSchema,
  projectId: z.string().trim().min(1).max(128).nullable(),
});

export const weeklyPriorityDraftSchema = z.object({
  weekStart: z.iso.date(),
  position: z.number().int().min(1).max(3),
  title: z.string().trim().min(1, 'Informe a prioridade.').max(180),
  projectId: z.string().trim().min(1).max(128).nullable().optional().default(null),
  done: z.boolean().optional().default(false),
});

export interface FocusSlot {
  lane: Lane;
  project: Project | null;
  updatedAt: string | null;
}

export type WeeklyPriorityDraft = z.output<typeof weeklyPriorityDraftSchema>;
export type WeeklyPriorityDraftInput = z.input<typeof weeklyPriorityDraftSchema>;

export interface WeeklyPriority {
  id: string;
  weekStart: string;
  position: 1 | 2 | 3;
  title: string;
  projectId: string | null;
  projectName: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPrioritySlot {
  position: 1 | 2 | 3;
  priority: WeeklyPriority | null;
}
