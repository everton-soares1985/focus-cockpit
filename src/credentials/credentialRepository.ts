import type Database from '@tauri-apps/plugin-sql';
import {
  credentialMetadataSchema,
  importedCredentialSchema,
  type Credential,
  type CredentialFilters,
  type CredentialMetadataInput,
  type ImportedCredential,
} from './credentialSchema';

interface CredentialRow {
  id: string;
  course_id: string | null;
  course_title: string | null;
  kind: Credential['kind'];
  title: string;
  issuer: string | null;
  issued_on: string | null;
  stored_path: string;
  thumbnail_path: string | null;
  original_name: string;
  mime_type: Credential['mimeType'];
  created_at: string;
  updated_at: string;
}

function mapCredential(row: CredentialRow): Credential {
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.course_title,
    kind: row.kind,
    title: row.title,
    issuer: row.issuer,
    issuedOn: row.issued_on,
    storedPath: row.stored_path,
    thumbnailPath: row.thumbnail_path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCredentials(
  db: Database,
  filters: CredentialFilters = {},
): Promise<Credential[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    clauses.push(
      `(cr.title LIKE $${values.length} COLLATE NOCASE OR cr.issuer LIKE $${values.length} COLLATE NOCASE)`,
    );
  }
  if (filters.kind) {
    values.push(filters.kind);
    clauses.push(`cr.kind = $${values.length}`);
  }
  if (filters.courseId) {
    values.push(filters.courseId);
    clauses.push(`cr.course_id = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<CredentialRow[]>(
    `SELECT cr.*, c.title AS course_title
     FROM credentials cr
     LEFT JOIN courses c ON c.id = cr.course_id
     ${where}
     ORDER BY cr.issued_on DESC, cr.created_at DESC`,
    values,
  );
  return rows.map(mapCredential);
}

export async function createCredential(
  db: Database,
  metadataInput: CredentialMetadataInput,
  importedInput: ImportedCredential,
): Promise<string> {
  const metadata = credentialMetadataSchema.parse(metadataInput);
  const imported = importedCredentialSchema.parse(importedInput);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO credentials (
       id, course_id, kind, title, issuer, issued_on, stored_path,
       thumbnail_path, original_name, mime_type, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
    [
      id,
      metadata.courseId,
      metadata.kind,
      metadata.title,
      metadata.issuer,
      metadata.issuedOn,
      imported.storedPath,
      imported.thumbnailPath,
      imported.originalName,
      imported.mimeType,
      timestamp,
    ],
  );
  return id;
}

export async function updateCredentialMetadata(
  db: Database,
  id: string,
  input: CredentialMetadataInput,
): Promise<void> {
  const metadata = credentialMetadataSchema.parse(input);
  const result = await db.execute(
    `UPDATE credentials SET
       course_id = $1, kind = $2, title = $3, issuer = $4,
       issued_on = $5, updated_at = $6
     WHERE id = $7`,
    [
      metadata.courseId,
      metadata.kind,
      metadata.title,
      metadata.issuer,
      metadata.issuedOn,
      new Date().toISOString(),
      id,
    ],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Diploma não encontrado.');
  }
}

export async function deleteCredentialRecord(db: Database, id: string): Promise<void> {
  const result = await db.execute('DELETE FROM credentials WHERE id = $1', [id]);
  if (result.rowsAffected !== 1) {
    throw new Error('Diploma não encontrado.');
  }
}
