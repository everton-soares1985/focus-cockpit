import { useState, useEffect } from 'react';
import { useImportCredential, useUpdateCredentialMetadata } from './credentialHooks';
import { useCourses } from '../courses/courseHooks';
import { credentialKindSchema, type Credential, type CredentialMetadataInput } from './credentialSchema';
import { Button } from '../design-system/components/Button';
import { Modal } from '../design-system/components/Modal';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';

export function CredentialModal({
  isOpen,
  onClose,
  credentialToEdit,
  importSourcePath,
}: {
  isOpen: boolean;
  onClose: () => void;
  credentialToEdit: Credential | null;
  importSourcePath: string | null;
}) {
  const isEditing = !!credentialToEdit;

  const importMutation = useImportCredential();
  const updateMutation = useUpdateCredentialMetadata();
  const { data: courses } = useCourses({ includeArchived: true });

  const [formData, setFormData] = useState<CredentialMetadataInput>({
    title: '',
    kind: 'certificate',
    issuer: '',
    courseId: null,
    issuedOn: null,
  });

  useEffect(() => {
    if (isOpen) {
      if (credentialToEdit) {
        setFormData({
          title: credentialToEdit.title,
          kind: credentialToEdit.kind,
          issuer: credentialToEdit.issuer || '',
          courseId: credentialToEdit.courseId,
          issuedOn: credentialToEdit.issuedOn,
        });
      } else {
        setFormData({
          title: '',
          kind: 'certificate',
          issuer: '',
          courseId: null,
          issuedOn: null,
        });
      }
    }
  }, [isOpen, credentialToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        issuer: formData.issuer?.trim() || null,
        courseId: formData.courseId || null,
        issuedOn: formData.issuedOn || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: credentialToEdit.id, input: payload as any });
      } else if (importSourcePath) {
        await importMutation.mutateAsync({ sourcePath: importSourcePath, metadata: payload as any });
      }
      onClose();
    } catch (error: any) {
      alert(`Erro ao salvar diploma: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Metadados' : 'Importar Novo Diploma'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {importSourcePath && (
          <div className="bg-surface-soft p-3 rounded-md border border-border-strong text-xs font-mono text-text-muted break-all mb-2">
            Origem: {importSourcePath}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Título do Certificado/Diploma</label>
          <Input 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Emissor / Instituição</label>
          <Input 
            value={formData.issuer || ''} 
            onChange={e => setFormData({ ...formData, issuer: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Tipo</label>
            <Select 
              value={formData.kind} 
              onChange={e => setFormData({ ...formData, kind: e.target.value as any })}
            >
              {credentialKindSchema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Data de Emissão</label>
            <Input 
              type="date"
              value={formData.issuedOn || ''} 
              onChange={e => setFormData({ ...formData, issuedOn: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Vincular a um Curso (Opcional)</label>
          <Select 
            value={formData.courseId || ''} 
            onChange={e => setFormData({ ...formData, courseId: e.target.value || null })}
          >
            <option value="">(Nenhum)</option>
            {courses?.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={importMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Salvar Alterações' : 'Importar Arquivo'}
          </Button>
        </div>
        
      </form>
    </Modal>
  );
}
