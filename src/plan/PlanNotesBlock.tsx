import { useState } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import {
  useArchivePlanNote,
  useCreatePlanNote,
  usePlanNotes,
  useUpdatePlanNote,
} from './planHooks';
import type { PlanNote, PlanNoteGroup } from './planSchema';
import { Button } from '../design-system/components/Button';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';

export function PlanNotesBlock({ groupName, title }: { groupName: PlanNoteGroup; title: string }) {
  const { data: allNotes, isLoading } = usePlanNotes();
  const createMutation = useCreatePlanNote();
  const updateMutation = useUpdatePlanNote();
  const archiveMutation = useArchivePlanNote();
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [archiveCandidate, setArchiveCandidate] = useState<PlanNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notes = allNotes?.filter((note) => note.groupName === groupName) ?? [];

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newValue.trim()) return;
    try {
      setError(null);
      await createMutation.mutateAsync({
        groupName,
        title: newValue.trim(),
        sortOrder: notes.length,
      });
      setNewValue('');
      setIsAdding(false);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível adicionar a anotação.'));
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const note = notes.find((candidate) => candidate.id === editingId);
    if (!note || !editValue.trim()) return;
    try {
      setError(null);
      await updateMutation.mutateAsync({
        id: note.id,
        input: {
          groupName,
          title: editValue.trim(),
          sortOrder: note.sortOrder,
        },
      });
      setEditingId(null);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível editar a anotação.'));
    }
  };

  const handleArchive = async () => {
    if (!archiveCandidate) return;
    try {
      setError(null);
      await archiveMutation.mutateAsync(archiveCandidate.id);
      setArchiveCandidate(null);
    } catch (archiveError: unknown) {
      setError(getErrorMessage(archiveError, 'Não foi possível remover a anotação.'));
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">{title}</h3>

      <div className="mb-3 max-h-[180px] flex-1 space-y-2 overflow-y-auto">
        {isLoading && <p className="py-2 text-xs text-text-muted">Carregando...</p>}
        {!isLoading && notes.length === 0 && !isAdding && (
          <p className="py-2 text-xs italic text-text-muted">Nenhuma anotação.</p>
        )}

        {notes.map((note) => (
          <div key={note.id} className="group">
            {editingId === note.id ? (
              <form onSubmit={handleUpdate} className="flex gap-1">
                <input
                  autoFocus
                  className="min-w-0 flex-1 rounded border border-border-strong bg-surface-raised px-2 py-1 text-sm text-text outline-none focus:border-lane-a"
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  maxLength={240}
                  aria-label={`Editar ${note.title}`}
                />
                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" aria-label="Salvar anotação">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)} aria-label="Cancelar edição">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </form>
            ) : (
              <div className="flex items-start justify-between rounded-md p-2 text-sm text-text transition-colors hover:bg-surface-soft focus-within:bg-surface-soft">
                <span className="flex-1 break-words">• {note.title}</span>
                <div className="flex opacity-60 group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    setEditingId(note.id);
                    setEditValue(note.title);
                  }} aria-label={`Editar ${note.title}`}>
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-danger" onClick={() => setArchiveCandidate(note)} aria-label={`Remover ${note.title}`}>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <form onSubmit={handleAdd} className="flex gap-1">
            <input
              autoFocus
              className="min-w-0 flex-1 rounded border border-border-strong bg-surface-raised px-2 py-1 text-sm text-text outline-none focus:border-lane-a"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              maxLength={240}
              aria-label={`Nova anotação em ${title}`}
            />
            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" aria-label="Adicionar anotação">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              setIsAdding(false);
              setNewValue('');
            }} aria-label="Cancelar nova anotação">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </form>
        )}
      </div>

      <FeedbackMessage message={error} className="mb-2" />
      {!isAdding && (
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="mt-auto self-start gap-1 text-xs">
          <Plus className="h-3 w-3" aria-hidden="true" /> Adicionar
        </Button>
      )}

      <ConfirmDialog
        isOpen={Boolean(archiveCandidate)}
        title="Remover anotação"
        description={`“${archiveCandidate?.title ?? ''}” sairá deste bloco.`}
        confirmLabel="Remover"
        isPending={archiveMutation.isPending}
        onCancel={() => setArchiveCandidate(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}
