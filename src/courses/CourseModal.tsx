import { useState } from 'react';
import { useCreateCourse, useUpdateCourse } from './courseHooks';
import {
  courseStatusSchema,
  type Course,
  type CourseDraftInput,
} from './courseSchema';
import { prioritySchema } from '../projects/projectSchema';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

function initialCourseDraft(course: Course | null): CourseDraftInput {
  if (!course) {
    return {
      title: '',
      institution: '',
      category: '',
      status: 'Planejado',
      priority: null,
      startedOn: null,
      completedOn: null,
      notes: '',
    };
  }
  return {
    title: course.title,
    institution: course.institution ?? '',
    category: course.category ?? '',
    status: course.status,
    priority: course.priority,
    startedOn: course.startedOn,
    completedOn: course.completedOn,
    notes: course.notes ?? '',
  };
}

export function CourseModal({
  onClose,
  courseToEdit,
}: {
  onClose: () => void;
  courseToEdit: Course | null;
}) {
  const isEditing = Boolean(courseToEdit);
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const [formData, setFormData] = useState<CourseDraftInput>(() =>
    initialCourseDraft(courseToEdit),
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (courseToEdit) {
        await updateMutation.mutateAsync({ id: courseToEdit.id, input: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar o curso.'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Editar curso' : 'Novo curso'} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="course-title" className="mb-1.5 block text-sm font-medium text-text-muted">Nome do curso</label>
            <Input
              id="course-title"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              required
              autoFocus
              maxLength={180}
            />
          </div>

          <div>
            <label htmlFor="course-institution" className="mb-1.5 block text-sm font-medium text-text-muted">Instituição ou plataforma</label>
            <Input
              id="course-institution"
              value={formData.institution ?? ''}
              onChange={(event) => setFormData({ ...formData, institution: event.target.value })}
              maxLength={120}
            />
          </div>

          <div>
            <label htmlFor="course-category" className="mb-1.5 block text-sm font-medium text-text-muted">Categoria</label>
            <Input
              id="course-category"
              value={formData.category ?? ''}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              placeholder="Ex.: IA, idiomas, dados"
              maxLength={80}
            />
          </div>

          <div>
            <label htmlFor="course-status" className="mb-1.5 block text-sm font-medium text-text-muted">Status</label>
            <Select
              id="course-status"
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value as CourseDraftInput['status'] })}
            >
              {courseStatusSchema.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="course-priority" className="mb-1.5 block text-sm font-medium text-text-muted">Prioridade</label>
            <Select
              id="course-priority"
              value={formData.priority ?? ''}
              onChange={(event) => setFormData({ ...formData, priority: (event.target.value || null) as CourseDraftInput['priority'] })}
            >
              <option value="">Sem prioridade</option>
              {prioritySchema.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="course-start" className="mb-1.5 block text-sm font-medium text-text-muted">Início</label>
            <Input
              id="course-start"
              type="date"
              value={formData.startedOn ?? ''}
              onChange={(event) => setFormData({ ...formData, startedOn: event.target.value })}
            />
          </div>

          <div>
            <label htmlFor="course-end" className="mb-1.5 block text-sm font-medium text-text-muted">Conclusão</label>
            <Input
              id="course-end"
              type="date"
              value={formData.completedOn ?? ''}
              onChange={(event) => setFormData({ ...formData, completedOn: event.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="course-notes" className="mb-1.5 block text-sm font-medium text-text-muted">Anotações ou link</label>
            <Textarea
              id="course-notes"
              value={formData.notes ?? ''}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              maxLength={3000}
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
                : 'Criar curso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
