import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useCreatePlanItem, useUpdatePlanItem } from './planHooks';
import { planCategorySchema, planStatusSchema, type PlanItem, type PlanItemDraftInput } from './planSchema';
import { Button } from '../design-system/components/Button';
import { Modal } from '../design-system/components/Modal';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

export function PlanItemModal({
  isOpen,
  onClose,
  itemToEdit,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: PlanItem | null;
  onDelete: (id: string) => void;
}) {
  const isEditing = !!itemToEdit;
  const currentYear = new Date().getFullYear();

  const createMutation = useCreatePlanItem();
  const updateMutation = useUpdatePlanItem();

  const [formData, setFormData] = useState<PlanItemDraftInput>({
    title: '',
    category: 'Cursos',
    startYear: currentYear,
    startSemester: 1,
    endYear: currentYear,
    endSemester: 2,
    status: 'Planejado',
    color: '#28d7f0',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({
          title: itemToEdit.title,
          category: itemToEdit.category,
          startYear: itemToEdit.startYear,
          startSemester: itemToEdit.startSemester,
          endYear: itemToEdit.endYear,
          endSemester: itemToEdit.endSemester,
          status: itemToEdit.status,
          color: itemToEdit.color || '#28d7f0',
          notes: itemToEdit.notes || '',
        });
      } else {
        setFormData({
          title: '',
          category: 'Cursos',
          startYear: currentYear,
          startSemester: 1,
          endYear: currentYear,
          endSemester: 2,
          status: 'Planejado',
          color: '#28d7f0',
          notes: '',
        });
      }
    }
  }, [isOpen, itemToEdit, currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: itemToEdit.id, input: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Item do Plano' : 'Novo Item do Plano'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Título</label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Pós Graduação em IA"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Categoria</label>
            <Select 
              value={formData.category} 
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
            >
              {planCategorySchema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
            <Select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              {planStatusSchema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Início</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={formData.startYear} 
                onChange={e => setFormData({ ...formData, startYear: parseInt(e.target.value) || currentYear })}
                className="w-2/3"
              />
              <Select 
                value={formData.startSemester} 
                onChange={e => setFormData({ ...formData, startSemester: parseInt(e.target.value) as 1|2 })}
                className="w-1/3"
              >
                <option value={1}>1º</option>
                <option value={2}>2º</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Fim</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={formData.endYear} 
                onChange={e => setFormData({ ...formData, endYear: parseInt(e.target.value) || currentYear })}
                className="w-2/3"
              />
              <Select 
                value={formData.endSemester} 
                onChange={e => setFormData({ ...formData, endSemester: parseInt(e.target.value) as 1|2 })}
                className="w-1/3"
              >
                <option value={1}>1º</option>
                <option value={2}>2º</option>
              </Select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Cor / Tema</label>
            <div className="flex gap-3">
              {[
                { label: 'Lane A', value: '#28d7f0' },
                { label: 'Lane B', value: '#f5a716' },
                { label: 'Geral', value: '#91a0b5' },
                { label: 'Verde', value: '#42c789' },
                { label: 'Roxo', value: '#a855f7' }
              ].map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c.value })}
                  className={`h-8 w-16 rounded-md border-2 transition-transform ${formData.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1.5">Anotações (opcional)</label>
            <Textarea 
              value={formData.notes || ''} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-border mt-6">
          {isEditing ? (
            <Button type="button" variant="danger" onClick={() => onDelete(itemToEdit.id)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          ) : <div />}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Salvar Alterações' : 'Criar Item'}
            </Button>
          </div>
        </div>
        
      </form>
    </Modal>
  );
}
