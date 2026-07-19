import { useState } from 'react';
import { Plus, LayoutGrid } from 'lucide-react';
import { usePlanItems, useDeletePlanItem } from './planHooks';
import { Button } from '../design-system/components/Button';
import { PlanGrid } from './PlanGrid';
import { PlanNotesBlock } from './PlanNotesBlock';
import { PlanItemModal } from './PlanItemModal';
import type { PlanItem } from './planSchema';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';

export default function PlanScreen() {
  const currentYear = new Date().getFullYear();
  const firstVisibleYear = currentYear - 1; // 1 ano para trás
  const totalYears = 6; // 6 anos visíveis (1 passado, atual, 4 futuros)

  const { data: items, isLoading } = usePlanItems(firstVisibleYear, firstVisibleYear + totalYears - 1);
  const deleteMutation = useDeletePlanItem();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PlanItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (item: PlanItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setError(null);
      await deleteMutation.mutateAsync(deleteCandidate.id);
      setDeleteCandidate(null);
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Não foi possível excluir o item do plano.'));
    }
  };

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-text-muted" /> Plano de Carreira
        </h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Item
        </Button>
      </div>

      <FeedbackMessage message={error} className="mb-4" />

      <div className="flex-1 overflow-auto border border-border bg-surface rounded-xl flex flex-col mb-6 min-h-[300px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-surface-raised rounded-full mb-4"></div>
              <p className="text-text-muted text-sm">Carregando plano...</p>
            </div>
          </div>
        ) : (
          <PlanGrid 
            items={items || []} 
            firstVisibleYear={firstVisibleYear} 
            totalYears={totalYears} 
            onEditItem={handleEdit}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 pb-4">
        <PlanNotesBlock groupName="current_priority" title="Prioridades Atuais" />
        <PlanNotesBlock groupName="future_course" title="Cursos Futuros" />
        <PlanNotesBlock groupName="suggested_project" title="Projetos Sugeridos" />
      </div>

      {isModalOpen && (
        <PlanItemModal
          key={editingItem?.id ?? 'new'}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          itemToEdit={editingItem}
          onDelete={(item) => {
            setIsModalOpen(false);
            setEditingItem(null);
            setDeleteCandidate(item);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Excluir item do plano"
        description={`“${deleteCandidate?.title ?? ''}” será removido definitivamente da linha do tempo.`}
        confirmLabel="Excluir item"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
