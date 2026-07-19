import { useState, useEffect } from 'react';
import { useCreateCourse, useUpdateCourse } from './courseHooks';
import { courseStatusSchema, type Course, type CourseDraftInput } from './courseSchema';
import { prioritySchema } from '../projects/projectSchema';
import { Button } from '../design-system/components/Button';
import { Modal } from '../design-system/components/Modal';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

export function CourseModal({
  isOpen,
  onClose,
  courseToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit: Course | null;
}) {
  const isEditing = !!courseToEdit;

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const [formData, setFormData] = useState<CourseDraftInput>({
    title: '',
    institution: '',
    category: '',
    status: 'Planejado',
    priority: null,
    startedOn: null,
    completedOn: null,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (courseToEdit) {
        setFormData({
          title: courseToEdit.title,
          institution: courseToEdit.institution || '',
          category: courseToEdit.category || '',
          status: courseToEdit.status,
          priority: courseToEdit.priority,
          startedOn: courseToEdit.startedOn,
          completedOn: courseToEdit.completedOn,
          notes: courseToEdit.notes || '',
        });
      } else {
        setFormData({
          title: '',
          institution: '',
          category: '',
          status: 'Planejado',
          priority: null,
          startedOn: null,
          completedOn: null,
          notes: '',
        });
      }
    }
  }, [isOpen, courseToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        institution: formData.institution?.trim() || null,
        category: formData.category?.trim() || null,
        startedOn: formData.startedOn || null,
        completedOn: formData.completedOn || null,
        notes: formData.notes?.trim() || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: courseToEdit.id, input: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      onClose();
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Curso' : 'Novo Curso'} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Título do Curso</label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Instituição / Plataforma</label>
            <Input 
              value={formData.institution || ''} 
              onChange={e => setFormData({ ...formData, institution: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Categoria</label>
            <Input 
              value={formData.category || ''} 
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Desenvolvimento, Idiomas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
            <Select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              {courseStatusSchema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Data de Início</label>
            <Input 
              type="date"
              value={formData.startedOn || ''} 
              onChange={e => setFormData({ ...formData, startedOn: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Data de Conclusão</label>
            <Input 
              type="date"
              value={formData.completedOn || ''} 
              onChange={e => setFormData({ ...formData, completedOn: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Anotações / Link</label>
            <Textarea 
              value={formData.notes || ''} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Salvar Alterações' : 'Criar Curso'}
          </Button>
        </div>
        
      </form>
    </Modal>
  );
}
