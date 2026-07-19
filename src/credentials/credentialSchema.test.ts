import { describe, expect, it } from 'vitest';
import { credentialMetadataSchema, importedCredentialSchema } from './credentialSchema';

describe('credential schemas', () => {
  it('normalizes optional metadata', () => {
    expect(
      credentialMetadataSchema.parse({
        courseId: null,
        kind: 'diploma',
        title: '  MBA fictício  ',
        issuer: '',
        issuedOn: '',
      }),
    ).toEqual({
      courseId: null,
      kind: 'diploma',
      title: 'MBA fictício',
      issuer: null,
      issuedOn: null,
    });
  });

  it('rejects unsupported MIME types and oversized files', () => {
    expect(() =>
      importedCredentialSchema.parse({
        storedPath: 'C:\\Demo\\credential.exe',
        thumbnailPath: null,
        originalName: 'credential.exe',
        mimeType: 'application/octet-stream',
        sizeBytes: 26 * 1024 * 1024,
      }),
    ).toThrow();
  });
});
