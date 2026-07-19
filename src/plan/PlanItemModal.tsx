import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCreatePlanItem, useUpdatePlanItem } from './planHooks';
import {
  planCategorySchema,
  planStatusSchema,
  type PlanItem,
  type PlanItemDraftInput,
} from './planSchema';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

function initialPlanDraft(item: PlanItem | null): PlanItemDraftInput {
  const currentYear = new Date().getFullYear();
  if (!item) {
    return {
      title: '',
      category: 'Cursos',
      startYear: currentYear,
      startSemester: 1,
      endYear: currentYear,
      endSemester: 2,
      status: 'Planejado',
      color: '#28d7f0',
      notes: '',
      sortOrder: 0,
    };
  }
  return {
    title: item.title,
    category: item.category,
    startYear: item.startYear,
    startSemester: item.startSemester,
    endYear: item.endYear,
    endSemester: item.endSemester,
    status: item.status,
    color: item.color ?? '#28d7f0',
    notes: item.notes ?? '',
    sortOrder: item.sortOrder,
  };
}

export function PlanItemModal({
  onClose,
  itemToEdit,
  onDelete,
}: {
  onClose: () => void;
  itemToEdit: PlanItem | null;
  onDelete: (item: PlanItem) => void;
}) {
  const isEditing = Boolean(itemToEdit);
  const createMutation = useCreatePlanItem();
  const updateMutation = useUpdatePlanItem();
  const [formData, setFormData] = useState<PlanItemDraftInput>(() => initialPlanDraft(itemToEdit));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (itemToEdit) {
        await updateMutation.mutateAsync({ id: itemToEdit.id, input: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar o item do plano.'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Editar item do plano' : 'Novo item do plano'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="plan-title" className="mb-1.5 block text-sm font-medium text-text-muted">Título</label>
            <Input
              id="plan-title"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              required
              autoFocus
              maxLength={160}
              placeholder="Ex.: Especialização em IA"
            />
          </div>

          <div>
            <label htmlFor="plan-category" className="mb-1.5 block text-sm font-medium text-text-muted">Categoria</label>
            <Select
              id="plan-category"
              value={formData.category}
              onChange={(event) => setFormData({ ...formData, category: event.target.value as PlanItemDraftInput['category'] })}
            >
              {planCategorySchema.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
          </div>

          <div>
            <label htmlFor="plan-status" className="mb-1.5 block text-sm font-medium text-text-muted">Status</label>
            <Select
              id="plan-status"
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value as PlanItemDraftInput['status'] })}
            >
              {planStatusSchema.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">Início</label>
            <div className="flex gap-2">
              <Input
                aria-label="Ano inicial"
                type="number"
                min={2000}
                max={2200}
                value={formData.startYear}
                onChange={(event) => setFormData({ ...formData, startYear: Number(event.target.value) })}
              />
              <Select
                aria-label="Semestre inicial"
                value={formData.startSemester}
                onChange={(event) => setFormData({ ...formData, startSemester: Number(event.target.value) as 1 | 2 })}
                className="w-28"
              >
                <option value={1}>1º sem.</option>
                <option value={2}>2º sem.</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">Fim</label>
            <div className="flex gap-2">
              <Input
                aria-label="Ano final"
                type="number"
                min={2000}
                max={2200}
                value={formData.endYear}
                onChange={(event) => setFormData({ ...formData, endYear: Number(event.target.value) })}
              />
              <Select
                aria-label="Semestre final"
                value={formData.endSemester}
                onChange={(event) => setFormData({ ...formData, endSemester: Number(event.target.value) as 1 | 2 })}
                className="w-28"
              >
                <option value={1}>1º sem.</option>
                <option value={2}>2º sem.</option>
              </Select>
            </div>
          </div>

          <fieldset className="md:col-span-2">
            <legend className="mb-1.5 block text-sm font-medium text-text-muted">Cor</legend>
            <div className="flex gap-3">
              {[
                { label: 'Ciano', value: '#28d7f0' },
                { label: 'Âmbar', value: '#f5a716' },
                { label: 'Cinza', value: '#91a0b5' },
                { label: 'Verde', value: '#42c789' },
                { label: 'Roxo', value: '#a855f7' },
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-8 w-16 rounded-md border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lane-a ${formData.color === color.value ? 'scale-105 border-text' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Cor ${color.label}`}
                  aria-pressed={formData.color === color.value}
                />
              ))}
            </div>
          </fieldset>

          <div className="md:col-span-2">
            <label htmlFor="plan-notes" className="mb-1.5 block text-sm font-medium text-text-muted">Anotações</label>
            <Textarea
              id="plan-notes"
              value={formData.notes ?? ''}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>

        <FeedbackMessage message={error} />
        <div className="flex justify-between border-t border-border pt-4">
          {itemToEdit ? (
            <Button type="button" variant="danger" onClick={() => onDelete(itemToEdit)} className="gap-2">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
            </Button>
          ) : <span />}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar item'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
