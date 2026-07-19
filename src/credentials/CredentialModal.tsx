import { useState } from 'react';
import { useCourses } from '../courses/courseHooks';
import { useImportCredential, useUpdateCredentialMetadata } from './credentialHooks';
import {
  credentialKindSchema,
  type Credential,
  type CredentialMetadataInput,
} from './credentialSchema';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';

const kindLabels = {
  certificate: 'Certificado',
  diploma: 'Diploma',
  badge: 'Badge',
  other: 'Outro',
} as const;

function initialCredentialMetadata(
  credential: Credential | null,
  preferredCourseId?: string | null,
): CredentialMetadataInput {
  if (!credential) {
    return {
      title: '',
      kind: 'certificate',
      issuer: '',
      courseId: preferredCourseId ?? null,
      issuedOn: null,
    };
  }
  return {
    title: credential.title,
    kind: credential.kind,
    issuer: credential.issuer ?? '',
    courseId: credential.courseId,
    issuedOn: credential.issuedOn,
  };
}

export function CredentialModal({
  onClose,
  credentialToEdit,
  importSourcePath,
  preferredCourseId,
}: {
  onClose: () => void;
  credentialToEdit: Credential | null;
  importSourcePath: string | null;
  preferredCourseId?: string | null;
}) {
  const isEditing = Boolean(credentialToEdit);
  const importMutation = useImportCredential();
  const updateMutation = useUpdateCredentialMetadata();
  const { data: courses } = useCourses({ includeArchived: true });
  const [formData, setFormData] = useState<CredentialMetadataInput>(() =>
    initialCredentialMetadata(credentialToEdit, preferredCourseId),
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (credentialToEdit) {
        await updateMutation.mutateAsync({ id: credentialToEdit.id, input: formData });
      } else if (importSourcePath) {
        await importMutation.mutateAsync({ sourcePath: importSourcePath, metadata: formData });
      } else {
        setError('Selecione um arquivo PDF ou uma imagem antes de continuar.');
        return;
      }
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar o diploma.'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Editar dados' : 'Importar diploma'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {importSourcePath && (
          <div className="break-all rounded-md border border-border-strong bg-surface-soft p-3 font-mono text-xs text-text-muted">
            Arquivo selecionado: {importSourcePath.split(/[\\/]/).pop()}
          </div>
        )}

        <div>
          <label htmlFor="credential-title" className="mb-1.5 block text-sm font-medium text-text-muted">Título</label>
          <Input
            id="credential-title"
            value={formData.title}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            required
            autoFocus
            maxLength={180}
          />
        </div>

        <div>
          <label htmlFor="credential-issuer" className="mb-1.5 block text-sm font-medium text-text-muted">Emissor ou instituição</label>
          <Input
            id="credential-issuer"
            value={formData.issuer ?? ''}
            onChange={(event) => setFormData({ ...formData, issuer: event.target.value })}
            maxLength={160}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="credential-kind" className="mb-1.5 block text-sm font-medium text-text-muted">Tipo</label>
            <Select
              id="credential-kind"
              value={formData.kind}
              onChange={(event) => setFormData({ ...formData, kind: event.target.value as CredentialMetadataInput['kind'] })}
            >
              {credentialKindSchema.options.map((option) => (
                <option key={option} value={option}>{kindLabels[option]}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="credential-date" className="mb-1.5 block text-sm font-medium text-text-muted">Data de emissão</label>
            <Input
              id="credential-date"
              type="date"
              value={formData.issuedOn ?? ''}
              onChange={(event) => setFormData({ ...formData, issuedOn: event.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="credential-course" className="mb-1.5 block text-sm font-medium text-text-muted">Curso vinculado</label>
          <Select
            id="credential-course"
            value={formData.courseId ?? ''}
            onChange={(event) => setFormData({ ...formData, courseId: event.target.value || null })}
          >
            <option value="">Nenhum curso</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </Select>
        </div>

        <FeedbackMessage message={error} />
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={importMutation.isPending || updateMutation.isPending}>
            {importMutation.isPending || updateMutation.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : 'Importar arquivo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
