import { useState } from 'react';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { 
  useWeeklyPriorities, 
  useSaveWeeklyPriority, 
  useToggleWeeklyPriority, 
  useClearWeeklyPriority 
} from './focusHooks';
import { useProjects } from '../projects/projectHooks';
import { getWeekStart } from './week';
import { Button } from '../design-system/components/Button';
import { Checkbox } from '../design-system/components/Checkbox';
import { Modal } from '../design-system/components/Modal';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import type { WeeklyPriority, WeeklyPrioritySlot } from './focusSchema';

export function WeeklyPriorityBlock() {
  const weekStart = getWeekStart();
  const { data: slots, isLoading } = useWeeklyPriorities(weekStart);
  
  const [editingPosition, setEditingPosition] = useState<1 | 2 | 3 | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-lane-a" /> Hoje e esta semana
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-surface-raised rounded w-full"></div>
          <div className="h-10 bg-surface-raised rounded w-full"></div>
          <div className="h-10 bg-surface-raised rounded w-full"></div>
        </div>
      </div>
    );
  }

  const safeSlots = slots || [
    { position: 1, priority: null },
    { position: 2, priority: null },
    { position: 3, priority: null },
  ] as WeeklyPrioritySlot[];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 h-full">
      <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-lane-a" /> Hoje e esta semana
      </h3>
      <div className="space-y-3 flex-1">
        {safeSlots.map((slot) => (
          <PriorityItem 
            key={slot.position} 
            slot={slot} 
            weekStart={weekStart}
            onEdit={() => setEditingPosition(slot.position as 1 | 2 | 3)} 
          />
        ))}
      </div>

      {editingPosition !== null && (
        <EditPriorityModal
          key={`${editingPosition}-${safeSlots.find((slot) => slot.position === editingPosition)?.priority?.id ?? 'empty'}`}
          position={editingPosition}
          weekStart={weekStart}
          currentPriority={safeSlots.find((slot) => slot.position === editingPosition)?.priority ?? null}
          onClose={() => setEditingPosition(null)}
        />
      )}
    </div>
  );
}

function PriorityItem({ 
  slot, 
  weekStart,
  onEdit 
}: { 
  slot: WeeklyPrioritySlot; 
  weekStart: string;
  onEdit: () => void;
}) {
  const toggleMutation = useToggleWeeklyPriority();
  const clearMutation = useClearWeeklyPriority();
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (checked: boolean) => {
    if (slot.priority) {
      try {
        setError(null);
        await toggleMutation.mutateAsync({ id: slot.priority.id, done: checked });
      } catch (toggleError: unknown) {
        setError(getErrorMessage(toggleError, 'Não foi possível atualizar a prioridade.'));
      }
    }
  };

  const handleClear = async () => {
    try {
      setError(null);
      await clearMutation.mutateAsync({ weekStart, position: slot.position });
      setIsClearConfirming(false);
    } catch (clearError: unknown) {
      setError(getErrorMessage(clearError, 'Não foi possível limpar a prioridade.'));
    }
  };

  if (!slot.priority) {
    return (
      <div className="group flex items-center justify-between rounded-lg border border-dashed border-border bg-surface-soft/50 p-3 focus-within:border-border-strong">
        <span className="text-sm text-text-muted italic">Slot {slot.position} vazio</span>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs opacity-70 group-hover:opacity-100 group-focus-within:opacity-100">
          Definir
        </Button>
      </div>
    );
  }

  const p = slot.priority;

  return (
    <div className={`group rounded-lg border p-3 transition-colors focus-within:border-border-strong ${p.done ? 'border-success/30 bg-success/5' : 'border-border bg-surface-raised'}`}>
      <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lane-a/40 bg-lane-a/10 text-xs font-semibold text-lane-a">
        {slot.position}
      </span>
      <div className="pt-0.5">
        <Checkbox 
          checked={p.done} 
          onChange={(e) => handleToggle(e.target.checked)} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${p.done ? 'text-text-muted line-through' : 'text-text'} line-clamp-2`}>
          {p.title}
        </p>
        {p.projectName && (
          <p className="text-xs text-text-muted mt-1 truncate">
            {p.projectName}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5 text-text-muted" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsClearConfirming(true)} className="h-7 w-7 hover:text-danger" aria-label="Limpar prioridade" title="Limpar prioridade">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      </div>
      <FeedbackMessage message={error} className="mt-2" />
      <ConfirmDialog
        isOpen={isClearConfirming}
        title="Limpar prioridade"
        description={`A prioridade “${p.title}” será removida desta semana.`}
        confirmLabel="Limpar prioridade"
        isPending={clearMutation.isPending}
        onCancel={() => setIsClearConfirming(false)}
        onConfirm={handleClear}
      />
    </div>
  );
}

function EditPriorityModal({ 
  position, 
  weekStart,
  currentPriority,
  onClose 
}: { 
  position: 1 | 2 | 3;
  weekStart: string;
  currentPriority: WeeklyPriority | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(currentPriority?.title || '');
  const [projectId, setProjectId] = useState(currentPriority?.projectId || '');
  const { data: projects } = useProjects({ status: 'Ativo', includeArchived: false });
  const saveMutation = useSaveWeeklyPriority();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position || !title.trim()) return;
    
    try {
      setError(null);
      await saveMutation.mutateAsync({
        weekStart,
        position,
        title: title.trim(),
        projectId: projectId || null,
        done: currentPriority?.done || false,
      });
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar a prioridade.'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Prioridade ${position} da semana`}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">O que precisa ser feito?</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Ex: Finalizar módulo X"
            autoFocus
            required
            maxLength={180}
          />
        </div>
        <FeedbackMessage message={error} />
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Vincular a projeto (opcional)</label>
          <Select 
            value={projectId} 
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">(Nenhum)</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>[{p.lane}] {p.name}</option>
            ))}
          </Select>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saveMutation.isPending || !title.trim()}>Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
