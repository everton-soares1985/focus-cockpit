import { useState, useEffect } from 'react';
import { useCreateProject, useUpdateProject } from './projectHooks';
import { laneSchema, projectStatusSchema, prioritySchema, type Project, type ProjectDraftInput } from './projectSchema';
import { Button } from '../design-system/components/Button';
import { Modal } from '../design-system/components/Modal';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

export function ProjectModal({
  isOpen,
  onClose,
  projectToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit: Project | null;
}) {
  const isEditing = !!projectToEdit;

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const [formData, setFormData] = useState<ProjectDraftInput>({
    name: '',
    lane: 'A',
    area: '',
    status: 'Ativo',
    priority: null,
    nextAction: '',
    lastProgress: '',
    folderPath: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setFormData({
          name: projectToEdit.name,
          lane: projectToEdit.lane,
          area: projectToEdit.area || '',
          status: projectToEdit.status,
          priority: projectToEdit.priority,
          nextAction: projectToEdit.nextAction || '',
          lastProgress: projectToEdit.lastProgress || '',
          folderPath: projectToEdit.folderPath || '',
          notes: projectToEdit.notes || '',
        });
      } else {
        setFormData({
          name: '',
          lane: 'A',
          area: '',
          status: 'Ativo',
          priority: null,
          nextAction: '',
          lastProgress: '',
          folderPath: '',
          notes: '',
        });
      }
    }
  }, [isOpen, projectToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        area: formData.area?.trim() || null,
        nextAction: formData.nextAction?.trim() || null,
        lastProgress: formData.lastProgress?.trim() || null,
        folderPath: formData.folderPath?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: projectToEdit.id, input: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      onClose();
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Projeto' : 'Novo Projeto'} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Nome do Projeto</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Lane</label>
            <Select 
              value={formData.lane} 
              onChange={e => setFormData({ ...formData, lane: e.target.value as any })}
            >
              {laneSchema.options.map(opt => <option key={opt} value={opt}>LANE {opt}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Área (Opcional)</label>
            <Input 
              value={formData.area || ''} 
              onChange={e => setFormData({ ...formData, area: e.target.value })}
              placeholder="Ex: Operacional, Marketing..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
            <Select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              {projectStatusSchema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Prioridade</label>
            <Select 
              value={formData.priority || ''} 
              onChange={e => setFormData({ ...formData, priority: (e.target.value as any) || null })}
            >
              <option value="">(Nenhuma)</option>
              {prioritySchema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Caminho da Pasta Local (Opcional)</label>
            <Input 
              value={formData.folderPath || ''} 
              onChange={e => setFormData({ ...formData, folderPath: e.target.value })}
              placeholder="C:\Caminho\Para\O\Projeto"
            />
            <p className="text-xs text-text-muted mt-1">Este caminho será usado para abrir a pasta diretamente pelo aplicativo.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Próxima Ação</label>
            <Textarea 
              value={formData.nextAction || ''} 
              onChange={e => setFormData({ ...formData, nextAction: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
          </Button>
        </div>
        
      </form>
    </Modal>
  );
}
