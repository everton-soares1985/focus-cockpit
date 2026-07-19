import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Clipboard,
  ExternalLink,
  FileText,
  FolderOpen,
  LocateFixed,
  Pencil,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  inspectSavedTarget,
  openSavedTarget,
} from '../platform/nativeFiles';
import { useSavedTargetStatus } from '../platform/savedTargetHooks';
import {
  useArchiveShortcut,
  useRestoreShortcut,
  useShortcuts,
  useUpdateShortcut,
} from './shortcutHooks';
import type {
  Shortcut,
  ShortcutDraftInput,
  ShortcutFilters,
} from './shortcutSchema';
import { Badge } from '../design-system/components/Badge';
import { Button } from '../design-system/components/Button';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { EmptyState } from '../design-system/components/EmptyState';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import {
  isTargetAvailable,
  ShortcutTargetStatus,
} from './ShortcutTargetStatus';
import { ShortcutModal, shortcutCategories } from './ShortcutModal';

type ScreenFeedback = { tone: 'error' | 'success' | 'info'; text: string } | null;

function shortcutDraft(shortcut: Shortcut, overrides: Partial<ShortcutDraftInput> = {}): ShortcutDraftInput {
  return {
    label: shortcut.label,
    targetType: shortcut.targetType,
    path: shortcut.path,
    category: shortcut.category ?? '',
    notes: shortcut.notes ?? '',
    favorite: shortcut.favorite,
    sortOrder: shortcut.sortOrder,
    ...overrides,
  };
}

function ShortcutTableRow({
  shortcut,
  onArchive,
  onRestore,
  onEdit,
  onFavorite,
  onOpen,
  onCopy,
  onRelocate,
}: {
  shortcut: Shortcut;
  onArchive: (shortcut: Shortcut) => void;
  onRestore: (shortcut: Shortcut) => void;
  onEdit: (shortcut: Shortcut) => void;
  onFavorite: (shortcut: Shortcut) => void;
  onOpen: (shortcut: Shortcut) => void;
  onCopy: (shortcut: Shortcut) => void;
  onRelocate: (shortcut: Shortcut) => void;
}) {
  const targetStatus = useSavedTargetStatus(shortcut.path, shortcut.targetType);
  const available = isTargetAvailable(targetStatus.data);

  return (
    <tr className="group border-b border-border/50 transition-colors hover:bg-surface-soft/50 focus-within:bg-surface-soft/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {shortcut.targetType === 'folder' ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-lane-a" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-lane-b" aria-hidden="true" />
          )}
          <span className={`font-medium ${shortcut.archived ? 'text-text-muted line-through' : 'text-text'}`}>{shortcut.label}</span>
          {shortcut.favorite && <Star className="h-3.5 w-3.5 fill-lane-b text-lane-b" aria-label="Favorito" />}
        </div>
      </td>
      <td className="px-4 py-3 text-text-muted">{shortcut.targetType === 'folder' ? 'Pasta' : 'Arquivo'}</td>
      <td className="px-4 py-3">{shortcut.category ? <Badge variant="neutral">{shortcut.category}</Badge> : '—'}</td>
      <td className="max-w-80 truncate px-4 py-3 font-mono text-xs text-text-muted" title={shortcut.path}>{shortcut.path}</td>
      <td className="max-w-64 truncate px-4 py-3 text-text-muted" title={shortcut.notes ?? ''}>{shortcut.notes || '—'}</td>
      <td className="px-4 py-3">
        <ShortcutTargetStatus status={targetStatus.data} isLoading={targetStatus.isLoading} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button variant="ghost" size="icon" onClick={() => onOpen(shortcut)} disabled={!available} title={available ? 'Abrir' : 'Destino indisponível'} aria-label={`Abrir ${shortcut.label}`}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onCopy(shortcut)} title="Copiar caminho" aria-label={`Copiar caminho de ${shortcut.label}`}>
            <Clipboard className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onRelocate(shortcut)} title="Relocalizar" aria-label={`Relocalizar ${shortcut.label}`}>
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onFavorite(shortcut)} title={shortcut.favorite ? 'Remover dos favoritos' : 'Favoritar'} aria-label={shortcut.favorite ? `Remover ${shortcut.label} dos favoritos` : `Favoritar ${shortcut.label}`}>
            <Star className={`h-4 w-4 ${shortcut.favorite ? 'fill-lane-b text-lane-b' : ''}`} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(shortcut)} title="Editar" aria-label={`Editar ${shortcut.label}`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          {shortcut.archived ? (
            <Button variant="ghost" size="icon" onClick={() => onRestore(shortcut)} title="Restaurar" aria-label={`Restaurar ${shortcut.label}`}>
              <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => onArchive(shortcut)} title="Arquivar" aria-label={`Arquivar ${shortcut.label}`} className="hover:text-danger">
              <Archive className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function FilesScreen() {
  const [filters, setFilters] = useState<ShortcutFilters>({
    search: '',
    category: '',
    favoritesOnly: false,
    includeArchived: false,
  });
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Shortcut | null>(null);
  const [feedback, setFeedback] = useState<ScreenFeedback>(null);

  const { data: shortcuts, isLoading, isError, error } = useShortcuts(filters);
  const archiveMutation = useArchiveShortcut();
  const restoreMutation = useRestoreShortcut();
  const updateMutation = useUpdateShortcut();

  const handleArchive = async () => {
    if (!archiveCandidate) return;
    try {
      setFeedback(null);
      await archiveMutation.mutateAsync(archiveCandidate.id);
      setArchiveCandidate(null);
    } catch (archiveError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(archiveError, 'Não foi possível arquivar o atalho.') });
    }
  };

  const handleRestore = async (shortcut: Shortcut) => {
    try {
      setFeedback(null);
      await restoreMutation.mutateAsync(shortcut.id);
      setFeedback({ tone: 'success', text: `“${shortcut.label}” foi restaurado.` });
    } catch (restoreError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(restoreError, 'Não foi possível restaurar o atalho.') });
    }
  };

  const handleFavorite = async (shortcut: Shortcut) => {
    try {
      setFeedback(null);
      await updateMutation.mutateAsync({
        id: shortcut.id,
        input: shortcutDraft(shortcut, { favorite: !shortcut.favorite }),
      });
    } catch (favoriteError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(favoriteError, 'Não foi possível atualizar o favorito.') });
    }
  };

  const handleOpen = async (shortcut: Shortcut) => {
    try {
      setFeedback(null);
      await openSavedTarget(shortcut.path, shortcut.targetType);
    } catch (openError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(openError, 'Não foi possível abrir o destino.') });
    }
  };

  const handleCopy = async (shortcut: Shortcut) => {
    try {
      await navigator.clipboard.writeText(shortcut.path);
      setFeedback({ tone: 'success', text: `Caminho de “${shortcut.label}” copiado.` });
    } catch (copyError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(copyError, 'Não foi possível copiar o caminho.') });
    }
  };

  const handleRelocate = async (shortcut: Shortcut) => {
    try {
      setFeedback(null);
      const selected = await open({
        directory: shortcut.targetType === 'folder',
        multiple: false,
      });
      if (!selected || Array.isArray(selected)) return;
      const status = await inspectSavedTarget(selected, shortcut.targetType);
      if (status.blocked) throw new Error('Esse tipo de arquivo é bloqueado por segurança.');
      if (!status.targetTypeMatches) throw new Error('O item escolhido não corresponde ao tipo do atalho.');
      await updateMutation.mutateAsync({
        id: shortcut.id,
        input: shortcutDraft(shortcut, { path: selected }),
      });
      setFeedback({ tone: 'success', text: `“${shortcut.label}” foi relocalizado.` });
    } catch (relocateError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(relocateError, 'Não foi possível relocalizar o atalho.') });
    }
  };

  const closeEditor = () => {
    setEditingShortcut(null);
    setIsCreating(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">Arquivos</h2>
          <p className="mt-1 text-xs text-text-muted">Um localizador manual: o app não escaneia, move ou exclui seus arquivos.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo atalho
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2" aria-label="Categorias rápidas">
        {shortcutCategories.map((category) => (
          <Button
            key={category}
            variant={filters.category === category ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilters({ ...filters, category: filters.category === category ? '' : category })}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" aria-hidden="true" />
          <Input
            aria-label="Buscar atalhos"
            placeholder="Buscar atalhos..."
            className="pl-9"
            value={filters.search ?? ''}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </div>
        <Select
          aria-label="Filtrar atalhos por categoria"
          value={filters.category ?? ''}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
          className="w-56"
        >
          <option value="">Todas as categorias</option>
          {shortcutCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-text-muted">
          <input type="checkbox" checked={filters.favoritesOnly ?? false} onChange={(event) => setFilters({ ...filters, favoritesOnly: event.target.checked })} className="rounded border-border bg-surface text-lane-a focus:ring-lane-a" />
          Apenas favoritos
        </label>
        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-text-muted">
          <input type="checkbox" checked={filters.includeArchived ?? false} onChange={(event) => setFilters({ ...filters, includeArchived: event.target.checked })} className="rounded border-border bg-surface text-lane-a focus:ring-lane-a" />
          Incluir arquivados
        </label>
      </div>

      <FeedbackMessage message={feedback?.text} tone={feedback?.tone} className="mb-4" />
      {isError && <FeedbackMessage message={getErrorMessage(error, 'Não foi possível carregar os atalhos.')} className="mb-4" />}

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-raised">
            <tr>
              <th className="px-4 py-3 font-medium text-text-muted">Nome</th>
              <th className="w-24 px-4 py-3 font-medium text-text-muted">Tipo</th>
              <th className="w-44 px-4 py-3 font-medium text-text-muted">Categoria</th>
              <th className="px-4 py-3 font-medium text-text-muted">Caminho</th>
              <th className="px-4 py-3 font-medium text-text-muted">Observação</th>
              <th className="w-36 px-4 py-3 font-medium text-text-muted">Estado</th>
              <th className="w-72 px-4 py-3 text-right font-medium text-text-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-text-muted">Carregando atalhos...</td></tr>
            ) : shortcuts && shortcuts.length > 0 ? (
              shortcuts.map((shortcut) => (
                <ShortcutTableRow
                  key={shortcut.id}
                  shortcut={shortcut}
                  onArchive={setArchiveCandidate}
                  onRestore={handleRestore}
                  onEdit={setEditingShortcut}
                  onFavorite={handleFavorite}
                  onOpen={handleOpen}
                  onCopy={handleCopy}
                  onRelocate={handleRelocate}
                />
              ))
            ) : (
              <tr><td colSpan={7}><EmptyState icon={<FolderOpen className="h-10 w-10 text-lane-a" />} title="Nenhum atalho encontrado" description="Cadastre manualmente as pastas e os arquivos que quer encontrar rápido." /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(isCreating || editingShortcut) && (
        <ShortcutModal key={editingShortcut?.id ?? 'new'} onClose={closeEditor} shortcutToEdit={editingShortcut} />
      )}

      <ConfirmDialog
        isOpen={Boolean(archiveCandidate)}
        title="Arquivar atalho"
        description={`“${archiveCandidate?.label ?? ''}” sairá das listas ativas, mas o arquivo ou a pasta original não será alterado.`}
        confirmLabel="Arquivar atalho"
        isPending={archiveMutation.isPending}
        onCancel={() => setArchiveCandidate(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}
