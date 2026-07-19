import { useState } from 'react';
import { Plus, Search, FolderOpen, FileText, Pencil, Archive, ArchiveRestore, Star } from 'lucide-react';
import { useShortcuts, useArchiveShortcut, useRestoreShortcut, useUpdateShortcut } from './shortcutHooks';
import { openSavedTarget } from '../platform/nativeFiles';
import type { ShortcutFilters, Shortcut } from './shortcutSchema';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Badge } from '../design-system/components/Badge';
import { EmptyState } from '../design-system/components/EmptyState';
import { ShortcutModal } from './ShortcutModal';

export default function FilesScreen() {
  const [filters, setFilters] = useState<ShortcutFilters>({
    search: '',
    category: '',
    favoritesOnly: false,
    includeArchived: false,
  });

  const { data: shortcuts, isLoading } = useShortcuts(filters);
  const archiveMutation = useArchiveShortcut();
  const restoreMutation = useRestoreShortcut();
  const updateMutation = useUpdateShortcut();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const handleCreate = () => {
    setEditingShortcut(null);
    setIsModalOpen(true);
  };

  const handleEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Deseja realmente arquivar este atalho?')) {
      await archiveMutation.mutateAsync(id);
    }
  };

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id);
  };

  const toggleFavorite = async (s: Shortcut) => {
    await updateMutation.mutateAsync({
      id: s.id,
      input: { ...s, favorite: !s.favorite } as any
    });
  };

  const handleOpen = async (s: Shortcut) => {
    try {
      await openSavedTarget(s.path, s.targetType);
    } catch (e: any) {
      alert(`Erro ao abrir: ${e.message}`);
    }
  };

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
          Arquivos e Pastas
        </h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Atalho
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Buscar atalhos..." 
            className="pl-9"
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Input 
          placeholder="Categoria..." 
          className="w-48"
          value={filters.category || ''}
          onChange={e => setFilters({ ...filters, category: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer px-2">
          <input 
            type="checkbox" 
            checked={filters.favoritesOnly || false}
            onChange={e => setFilters({ ...filters, favoritesOnly: e.target.checked })}
            className="rounded border-border bg-surface text-lane-a focus:ring-lane-a"
          />
          Apenas favoritos
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer px-2">
          <input 
            type="checkbox" 
            checked={filters.includeArchived || false}
            onChange={e => setFilters({ ...filters, includeArchived: e.target.checked })}
            className="rounded border-border bg-surface text-lane-a focus:ring-lane-a"
          />
          Incluir arquivados
        </label>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-text-muted">Carregando atalhos...</div>
        ) : shortcuts && shortcuts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {shortcuts.map(s => (
              <div key={s.id} className="group flex flex-col bg-surface-raised rounded-lg border border-border shadow-sm hover:border-border-strong hover:shadow-md transition-all">
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-text">
                      {s.targetType === 'folder' ? <FolderOpen className="h-5 w-5 text-lane-a" /> : <FileText className="h-5 w-5 text-lane-b" />}
                      <h3 className={`font-semibold text-sm line-clamp-1 ${s.archived ? 'line-through text-text-muted' : ''}`} title={s.label}>{s.label}</h3>
                    </div>
                    <button onClick={() => toggleFavorite(s)} className="text-text-muted hover:text-lane-a transition-colors outline-none focus:ring-2 focus:ring-lane-a rounded">
                      <Star className={`h-4 w-4 ${s.favorite ? 'fill-lane-a text-lane-a' : ''}`} />
                    </button>
                  </div>
                  
                  {s.category && (
                    <Badge variant="neutral" className="w-max text-[10px] py-0 mb-3">{s.category}</Badge>
                  )}
                  
                  <p className="text-xs text-text-muted font-mono truncate mb-4 bg-surface-soft p-1.5 rounded border border-border" title={s.path}>
                    {s.path}
                  </p>
                  
                  {s.notes && (
                    <p className="text-xs text-text-muted line-clamp-2 mb-4 italic">
                      "{s.notes}"
                    </p>
                  )}
                  
                  <div className="mt-auto flex justify-between items-center pt-3 border-t border-border">
                    <Button variant="secondary" size="sm" className="gap-2 text-xs h-7" onClick={() => handleOpen(s)}>
                      Abrir
                    </Button>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted" onClick={() => handleEdit(s)} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {s.archived ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted" onClick={() => handleRestore(s.id)} title="Restaurar">
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-danger" onClick={() => handleArchive(s.id)} title="Arquivar">
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<FolderOpen className="h-10 w-10 text-lane-a" />}
            title="Nenhum atalho encontrado"
            description="Crie atalhos para suas pastas de projetos ou arquivos importantes."
          />
        )}
      </div>

      <ShortcutModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shortcutToEdit={editingShortcut}
      />
    </div>
  );
}
