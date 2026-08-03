import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { CalendarDays, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { 
  useWeeklyPriorities, 
  useSaveWeeklyPriority, 
  useToggleWeeklyPriority, 
  useClearWeeklyPriority,
  useMoveWeeklyPriority,
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
  const moveMutation = useMoveWeeklyPriority();
  const [editingPosition, setEditingPosition] = useState<1 | 2 | 3 | null>(null);
  const [draggedPosition, setDraggedPosition] = useState<1 | 2 | 3 | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<1 | 2 | 3 | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

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

  const movePriority = async (
    fromPosition: 1 | 2 | 3,
    toPosition: 1 | 2 | 3,
  ) => {
    if (fromPosition === toPosition || moveMutation.isPending) return;

    try {
      setMoveError(null);
      await moveMutation.mutateAsync({ weekStart, fromPosition, toPosition });
    } catch (moveFailure: unknown) {
      setMoveError(getErrorMessage(moveFailure, 'Não foi possível reordenar as prioridades.'));
    } finally {
      setDraggedPosition(null);
      setDragOverPosition(null);
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    position: 1 | 2 | 3,
  ) => {
    setMoveError(null);
    setDraggedPosition(position);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(position));
  };

  const handleDragOver = (
    event: DragEvent<HTMLElement>,
    position: 1 | 2 | 3,
  ) => {
    if (draggedPosition === null || draggedPosition === position) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverPosition(position);
  };

  const handleDrop = async (
    event: DragEvent<HTMLElement>,
    position: 1 | 2 | 3,
  ) => {
    event.preventDefault();
    const encodedPosition = Number(event.dataTransfer.getData('text/plain'));
    const sourcePosition = draggedPosition ?? encodedPosition;
    if (sourcePosition >= 1 && sourcePosition <= 3) {
      await movePriority(sourcePosition as 1 | 2 | 3, position);
    }
  };

  const handleKeyboardMove = async (
    event: KeyboardEvent<HTMLElement>,
    position: 1 | 2 | 3,
  ) => {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (direction === 0) return;

    const targetPosition = position + direction;
    if (targetPosition < 1 || targetPosition > 3) return;
    event.preventDefault();
    await movePriority(position, targetPosition as 1 | 2 | 3);
  };

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
            isDragging={draggedPosition === slot.position}
            isDropTarget={dragOverPosition === slot.position}
            isMovePending={moveMutation.isPending}
            onEdit={() => setEditingPosition(slot.position as 1 | 2 | 3)} 
            onDragStart={(event) => handleDragStart(event, slot.position)}
            onDragOver={(event) => handleDragOver(event, slot.position)}
            onDragLeave={() => {
              if (dragOverPosition === slot.position) setDragOverPosition(null);
            }}
            onDrop={(event) => handleDrop(event, slot.position)}
            onDragEnd={() => {
              setDraggedPosition(null);
              setDragOverPosition(null);
            }}
            onKeyboardMove={(event) => handleKeyboardMove(event, slot.position)}
          />
        ))}
      </div>
      <FeedbackMessage message={moveError} className="mt-3" />

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
  isDragging,
  isDropTarget,
  isMovePending,
  onEdit,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onKeyboardMove,
}: { 
  slot: WeeklyPrioritySlot; 
  weekStart: string;
  isDragging: boolean;
  isDropTarget: boolean;
  isMovePending: boolean;
  onEdit: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onKeyboardMove: (event: KeyboardEvent<HTMLElement>) => void;
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
      <div
        data-testid={`weekly-priority-slot-${slot.position}`}
        className={`group flex items-center justify-between rounded-lg border border-dashed p-3 transition-colors focus-within:border-border-strong ${
          isDropTarget ? 'border-lane-a bg-lane-a/10' : 'border-border bg-surface-soft/50'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="text-sm text-text-muted italic">Slot {slot.position} vazio</span>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs opacity-70 group-hover:opacity-100 group-focus-within:opacity-100">
          Definir
        </Button>
      </div>
    );
  }

  const p = slot.priority;

  return (
    <div
      data-testid={`weekly-priority-slot-${slot.position}`}
      className={`group rounded-lg border p-3 transition-all focus-within:border-border-strong ${
        isDropTarget
          ? 'border-lane-a bg-lane-a/10'
          : p.done
            ? 'border-success/30 bg-success/5'
            : 'border-border bg-surface-raised'
      } ${isDragging ? 'opacity-45' : 'opacity-100'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-start gap-3">
      <span
        role="button"
        tabIndex={0}
        draggable={!isMovePending}
        aria-label={`Mover prioridade ${slot.position}`}
        title="Arraste para trocar a ordem; use as setas para mover pelo teclado"
        className="mt-0.5 flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-text-muted hover:bg-surface-soft hover:text-text active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-lane-a/60"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onKeyDown={onKeyboardMove}
      >
        <GripVertical className="h-4 w-4" />
      </span>
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
