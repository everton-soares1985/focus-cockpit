import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { usePlanNotes, useCreatePlanNote, useUpdatePlanNote, useArchivePlanNote } from './planHooks';
import type { PlanNoteGroup, PlanNote } from './planSchema';
import { Button } from '../design-system/components/Button';

export function PlanNotesBlock({ groupName, title }: { groupName: PlanNoteGroup; title: string }) {
  const { data: allNotes } = usePlanNotes();
  const createMutation = useCreatePlanNote();
  const updateMutation = useUpdatePlanNote();
  const archiveMutation = useArchivePlanNote();

  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const notes = allNotes?.filter(n => n.groupName === groupName) || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    await createMutation.mutateAsync({ groupName, title: newValue.trim(), sortOrder: notes.length });
    setNewValue('');
    setIsAdding(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editValue.trim()) return;
    await updateMutation.mutateAsync({ id: editingId, input: { groupName, title: editValue.trim(), sortOrder: 0 } });
    setEditingId(null);
  };

  const startEdit = (note: PlanNote) => {
    setEditingId(note.id);
    setEditValue(note.title);
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveMutation.mutateAsync(id);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">{title}</h3>
      
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px] mb-3">
        {notes.length === 0 && !isAdding && (
          <p className="text-xs text-text-muted italic py-2">Nenhuma anotação.</p>
        )}
        
        {notes.map(note => (
          <div key={note.id} className="group relative">
            {editingId === note.id ? (
              <form onSubmit={handleUpdate} className="flex gap-2">
                <input 
                  autoFocus
                  className="flex-1 bg-surface-raised border border-border-strong rounded px-2 py-1 text-sm text-text outline-none focus:border-lane-a"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={handleUpdate}
                />
              </form>
            ) : (
              <div 
                className="flex items-start justify-between text-sm text-text p-2 rounded-md hover:bg-surface-soft cursor-pointer transition-colors"
                onClick={() => startEdit(note)}
              >
                <span className="flex-1 break-words">• {note.title}</span>
                <button 
                  onClick={(e) => handleArchive(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isAdding && (
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              autoFocus
              className="flex-1 bg-surface-raised border border-border-strong rounded px-2 py-1 text-sm text-text outline-none focus:border-lane-a"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onBlur={() => { if (!newValue.trim()) setIsAdding(false); else handleAdd(new Event('submit') as any); }}
            />
          </form>
        )}
      </div>

      {!isAdding && (
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="self-start text-xs gap-1 mt-auto">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      )}
    </div>
  );
}
