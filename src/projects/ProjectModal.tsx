import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderSearch } from 'lucide-react';
import { useCreateProject, useUpdateProject } from './projectHooks';
import {
  laneSchema,
  prioritySchema,
  projectStatusSchema,
  type Project,
  type ProjectDraftInput,
} from './projectSchema';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

function initialProjectDraft(project: Project | null): ProjectDraftInput {
  if (!project) {
    return {
      name: '',
      lane: 'A',
      area: '',
      status: 'Ativo',
      priority: null,
      nextAction: '',
      lastProgress: '',
      folderPath: '',
      notes: '',
    };
  }
  return {
    name: project.name,
    lane: project.lane,
    area: project.area ?? '',
    status: project.status,
    priority: project.priority,
    nextAction: project.nextAction ?? '',
    lastProgress: project.lastProgress ?? '',
    folderPath: project.folderPath ?? '',
    notes: project.notes ?? '',
  };
}

export function ProjectModal({
  onClose,
  projectToEdit,
}: {
  onClose: () => void;
  projectToEdit: Project | null;
}) {
  const isEditing = Boolean(projectToEdit);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const [formData, setFormData] = useState<ProjectDraftInput>(() =>
    initialProjectDraft(projectToEdit),
  );
  const [error, setError] = useState<string | null>(null);

  const handleBrowseFolder = async () => {
    try {
      setError(null);
      const selected = await open({ directory: true, multiple: false });
      if (selected && !Array.isArray(selected)) {
        setFormData((current) => ({ ...current, folderPath: selected }));
      }
    } catch (browseError: unknown) {
      setError(getErrorMessage(browseError, 'Não foi possível selecionar a pasta.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (projectToEdit) {
        await updateMutation.mutateAsync({ id: projectToEdit.id, input: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar o projeto.'));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Editar projeto' : 'Novo projeto'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-text-muted">
              Nome do projeto
            </label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
              autoFocus
              maxLength={120}
            />
          </div>

          <div>
            <label htmlFor="project-lane" className="mb-1.5 block text-sm font-medium text-text-muted">Lane</label>
            <Select
              id="project-lane"
              value={formData.lane}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  lane: event.target.value as ProjectDraftInput['lane'],
                })
              }
            >
              {laneSchema.options.map((option) => (
                <option key={option} value={option}>Lane {option}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="project-area" className="mb-1.5 block text-sm font-medium text-text-muted">Área</label>
            <Input
              id="project-area"
              value={formData.area ?? ''}
              onChange={(event) => setFormData({ ...formData, area: event.target.value })}
              placeholder="Ex.: Portfólio, carreira, estudos"
              maxLength={80}
            />
          </div>

          <div>
            <label htmlFor="project-status" className="mb-1.5 block text-sm font-medium text-text-muted">Status</label>
            <Select
              id="project-status"
              value={formData.status}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  status: event.target.value as ProjectDraftInput['status'],
                })
              }
            >
              {projectStatusSchema.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="project-priority" className="mb-1.5 block text-sm font-medium text-text-muted">Prioridade</label>
            <Select
              id="project-priority"
              value={formData.priority ?? ''}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  priority: (event.target.value || null) as ProjectDraftInput['priority'],
                })
              }
            >
              <option value="">Sem prioridade</option>
              {prioritySchema.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="project-folder" className="mb-1.5 block text-sm font-medium text-text-muted">Pasta local</label>
            <div className="flex gap-2">
              <Input
                id="project-folder"
                value={formData.folderPath ?? ''}
                onChange={(event) => setFormData({ ...formData, folderPath: event.target.value })}
                placeholder="C:\\Caminho\\Projeto"
                maxLength={1024}
              />
              <Button type="button" variant="secondary" onClick={handleBrowseFolder} className="gap-2">
                <FolderSearch className="h-4 w-4" aria-hidden="true" /> Selecionar
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="project-next-action" className="mb-1.5 block text-sm font-medium text-text-muted">Próxima ação</label>
            <Textarea
              id="project-next-action"
              value={formData.nextAction ?? ''}
              onChange={(event) => setFormData({ ...formData, nextAction: event.target.value })}
              rows={3}
              maxLength={240}
            />
          </div>

          <div>
            <label htmlFor="project-last-progress" className="mb-1.5 block text-sm font-medium text-text-muted">Último avanço</label>
            <Textarea
              id="project-last-progress"
              value={formData.lastProgress ?? ''}
              onChange={(event) => setFormData({ ...formData, lastProgress: event.target.value })}
              rows={3}
              maxLength={240}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="project-notes" className="mb-1.5 block text-sm font-medium text-text-muted">Observações</label>
            <Textarea
              id="project-notes"
              value={formData.notes ?? ''}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              maxLength={4000}
            />
          </div>
        </div>

        <FeedbackMessage message={error} />

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : 'Criar projeto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
