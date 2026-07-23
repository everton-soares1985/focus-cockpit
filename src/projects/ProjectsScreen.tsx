import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
} from 'lucide-react';
import {
  useArchiveProject,
  useDeleteProject,
  useProjects,
  useRestoreProject,
} from './projectHooks';
import { useSetFocusProject } from '../focus/focusHooks';
import { openSavedTarget } from '../platform/nativeFiles';
import { useSavedTargetStatus } from '../platform/savedTargetHooks';
import type {
  Lane,
  Project,
  ProjectFilters,
  ProjectStatus,
} from './projectSchema';
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
import { isTargetAvailable } from '../shortcuts/ShortcutTargetStatus';
import { ProjectModal } from './ProjectModal';

type ScreenFeedback = { tone: 'error' | 'success'; text: string } | null;

function ProjectTableRow({
  project,
  onArchive,
  onRestore,
  onDelete,
  onEdit,
  onSetFocus,
  onOpenError,
}: {
  project: Project;
  onArchive: (project: Project) => void;
  onRestore: (project: Project) => void;
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
  onSetFocus: (project: Project) => void;
  onOpenError: (error: unknown) => void;
}) {
  const folderStatus = useSavedTargetStatus(project.folderPath, 'folder');
  const folderAvailable = isTargetAvailable(folderStatus.data);

  const handleOpenFolder = async () => {
    if (!project.folderPath) return;
    try {
      await openSavedTarget(project.folderPath, 'folder');
    } catch (error: unknown) {
      onOpenError(error);
    }
  };

  return (
    <tr className="group border-b border-border/50 transition-colors hover:bg-surface-soft/50 focus-within:bg-surface-soft/50">
      <td className="px-4 py-3">
        <p className={`font-medium ${project.archived ? 'text-text-muted line-through' : 'text-text'}`}>
          {project.name}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge variant={project.lane === 'A' ? 'lane-a' : 'lane-b'}>Lane {project.lane}</Badge>
      </td>
      <td className="px-4 py-3 text-text-muted">{project.area || '—'}</td>
      <td className="px-4 py-3">
        <Badge variant={project.status === 'Concluído' ? 'success' : project.status === 'Pausado' ? 'neutral' : 'outline'}>
          {project.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {project.priority ? (
          <span className={`text-xs font-semibold ${
            project.priority === 'Alta'
              ? 'text-danger'
              : project.priority === 'Média'
                ? 'text-lane-b'
                : 'text-success'
          }`}>
            {project.priority}
          </span>
        ) : '—'}
      </td>
      <td className="max-w-56 truncate px-4 py-3 text-text-muted" title={project.nextAction || ''}>
        {project.nextAction || '—'}
      </td>
      <td className="max-w-56 truncate px-4 py-3 text-text-muted" title={project.lastProgress || ''}>
        {project.lastProgress || '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {project.folderPath && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenFolder}
              disabled={!folderAvailable}
              title={folderAvailable ? 'Abrir pasta' : 'Pasta não encontrada'}
              aria-label={folderAvailable ? `Abrir pasta de ${project.name}` : `Pasta de ${project.name} não encontrada`}
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {!project.archived && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSetFocus(project)}
              title="Colocar em foco"
              aria-label={`Colocar ${project.name} em foco`}
            >
              <Target className={`h-4 w-4 ${project.lane === 'A' ? 'text-lane-a' : 'text-lane-b'}`} aria-hidden="true" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(project)} title="Editar" aria-label={`Editar ${project.name}`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          {project.archived ? (
            <Button variant="ghost" size="icon" onClick={() => onRestore(project)} title="Restaurar" aria-label={`Restaurar ${project.name}`}>
              <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => onArchive(project)} title="Arquivar" aria-label={`Arquivar ${project.name}`} className="hover:text-danger">
              <Archive className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(project)}
            title="Remover do app"
            aria-label={`Remover ${project.name} do app`}
            className="hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function ProjectsScreen() {
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    lane: undefined,
    status: 'Ativo',
    includeArchived: false,
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Project | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<ScreenFeedback>(null);

  const { data: projects, isLoading, isError, error } = useProjects(filters);
  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();
  const restoreMutation = useRestoreProject();
  const setFocusProject = useSetFocusProject();

  const handleArchive = async () => {
    if (!archiveCandidate) return;
    try {
      setFeedback(null);
      await archiveMutation.mutateAsync(archiveCandidate.id);
      setArchiveCandidate(null);
    } catch (archiveError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(archiveError, 'Não foi possível arquivar o projeto.') });
    }
  };

  const handleRestore = async (project: Project) => {
    try {
      setFeedback(null);
      await restoreMutation.mutateAsync(project.id);
      setFeedback({ tone: 'success', text: `“${project.name}” foi restaurado.` });
    } catch (restoreError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(restoreError, 'Não foi possível restaurar o projeto.') });
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setFeedback(null);
      await deleteMutation.mutateAsync(deleteCandidate.id);
      setFeedback({ tone: 'success', text: `“${deleteCandidate.name}” foi removido somente do Focus Cockpit.` });
      setDeleteCandidate(null);
    } catch (deleteError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(deleteError, 'Não foi possível remover o projeto do app.') });
    }
  };

  const handleSetFocus = async (project: Project) => {
    try {
      setFeedback(null);
      await setFocusProject.mutateAsync({ lane: project.lane, projectId: project.id });
      setFeedback({ tone: 'success', text: `“${project.name}” agora está em foco na Lane ${project.lane}.` });
    } catch (focusError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(focusError, 'Não foi possível atualizar o foco.') });
    }
  };

  const closeEditor = () => {
    setEditingProject(null);
    setIsCreating(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">Projetos</h2>
          <p className="mt-1 text-xs text-text-muted">Lane A para o principal; Lane B para o que evolui em paralelo.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo projeto
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" aria-hidden="true" />
          <Input
            aria-label="Buscar projetos"
            placeholder="Buscar projetos..."
            className="pl-9"
            value={filters.search ?? ''}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </div>
        <Select
          aria-label="Filtrar por Lane"
          value={filters.lane ?? ''}
          onChange={(event) => setFilters({ ...filters, lane: (event.target.value || undefined) as Lane | undefined })}
          className="w-40"
        >
          <option value="">Todas as Lanes</option>
          <option value="A">Lane A</option>
          <option value="B">Lane B</option>
        </Select>
        <Select
          aria-label="Filtrar por status"
          value={filters.status ?? ''}
          onChange={(event) => setFilters({ ...filters, status: (event.target.value || undefined) as ProjectStatus | undefined })}
          className="w-48"
        >
          <option value="">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Pausado">Pausado</option>
          <option value="Concluído">Concluído</option>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={filters.includeArchived ?? false}
            onChange={(event) => setFilters({ ...filters, includeArchived: event.target.checked })}
            className="rounded border-border bg-surface text-lane-a focus:ring-lane-a"
          />
          Incluir arquivados
        </label>
      </div>

      <FeedbackMessage message={feedback?.text} tone={feedback?.tone} className="mb-4" />
      {isError && (
        <FeedbackMessage message={getErrorMessage(error, 'Não foi possível carregar os projetos.')} className="mb-4" />
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-raised">
            <tr>
              <th className="px-4 py-3 font-medium text-text-muted">Nome</th>
              <th className="w-24 px-4 py-3 font-medium text-text-muted">Lane</th>
              <th className="w-36 px-4 py-3 font-medium text-text-muted">Área</th>
              <th className="w-32 px-4 py-3 font-medium text-text-muted">Status</th>
              <th className="w-28 px-4 py-3 font-medium text-text-muted">Prioridade</th>
              <th className="px-4 py-3 font-medium text-text-muted">Próxima ação</th>
              <th className="px-4 py-3 font-medium text-text-muted">Último avanço</th>
              <th className="w-44 px-4 py-3 text-right font-medium text-text-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted">Carregando projetos...</td></tr>
            ) : projects && projects.length > 0 ? (
              projects.map((project) => (
                <ProjectTableRow
                  key={project.id}
                  project={project}
                  onArchive={setArchiveCandidate}
                  onRestore={handleRestore}
                  onDelete={setDeleteCandidate}
                  onEdit={setEditingProject}
                  onSetFocus={handleSetFocus}
                  onOpenError={(openError) => setFeedback({ tone: 'error', text: getErrorMessage(openError, 'Não foi possível abrir a pasta.') })}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <EmptyState title="Nenhum projeto encontrado" description="Ajuste os filtros ou cadastre o primeiro projeto." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(isCreating || editingProject) && (
        <ProjectModal
          key={editingProject?.id ?? 'new'}
          onClose={closeEditor}
          projectToEdit={editingProject}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(archiveCandidate)}
        title="Arquivar projeto"
        description={`“${archiveCandidate?.name ?? ''}” sairá das listas ativas e deixará o foco, mas poderá ser restaurado depois.`}
        confirmLabel="Arquivar projeto"
        isPending={archiveMutation.isPending}
        onCancel={() => setArchiveCandidate(null)}
        onConfirm={handleArchive}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Remover projeto do app"
        description={`“${deleteCandidate?.name ?? ''}” será apagado do banco do Focus Cockpit. Nenhuma pasta ou arquivo do computador será excluído.`}
        confirmLabel="Remover somente do app"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
