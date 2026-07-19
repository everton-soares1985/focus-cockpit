import { z } from 'zod';

export const credentialKindSchema = z.enum(['certificate', 'diploma', 'badge', 'other']);

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

export const credentialMetadataSchema = z.object({
  courseId: z.string().trim().max(128).nullable().optional().default(null),
  kind: credentialKindSchema,
  title: z.string().trim().min(1, 'Informe o título do diploma.').max(180),
  issuer: optionalText(160),
  issuedOn: optionalDate,
});

export const importedCredentialSchema = z.object({
  storedPath: z.string().min(1),
  thumbnailPath: z.string().min(1).nullable(),
  originalName: z.string().min(1).max(255),
  mimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
});

export type CredentialKind = z.infer<typeof credentialKindSchema>;
export type CredentialMetadata = z.output<typeof credentialMetadataSchema>;
export type CredentialMetadataInput = z.input<typeof credentialMetadataSchema>;
export type ImportedCredential = z.infer<typeof importedCredentialSchema>;

export interface Credential extends CredentialMetadata {
  id: string;
  courseTitle: string | null;
  storedPath: string;
  thumbnailPath: string | null;
  originalName: string;
  mimeType: ImportedCredential['mimeType'];
  createdAt: string;
  updatedAt: string;
}

export interface CredentialFilters {
  search?: string;
  kind?: CredentialKind;
  courseId?: string;
}
