import { useState } from 'react';
import { Plus, Search, FolderOpen, Target, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { useProjects, useArchiveProject, useRestoreProject } from './projectHooks';
import { useSetFocusProject } from '../focus/focusHooks';
import { openSavedTarget } from '../platform/nativeFiles';
import type { ProjectFilters, Project, Lane, ProjectStatus } from './projectSchema';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Badge } from '../design-system/components/Badge';
import { EmptyState } from '../design-system/components/EmptyState';
import { ProjectModal } from './ProjectModal';

export default function ProjectsScreen() {
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    lane: undefined,
    status: 'Ativo',
    includeArchived: false,
  });

  const { data: projects, isLoading } = useProjects(filters);
  const archiveMutation = useArchiveProject();
  const restoreMutation = useRestoreProject();
  const setFocusProject = useSetFocusProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Deseja realmente arquivar este projeto? Ele não aparecerá mais nas listas ativas.')) {
      await archiveMutation.mutateAsync(id);
    }
  };

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id);
  };

  const handleSetFocus = async (lane: Lane, projectId: string) => {
    await setFocusProject.mutateAsync({ lane, projectId });
    alert('Projeto colocado em foco com sucesso!');
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
      await openSavedTarget(folderPath, 'folder');
    } catch (e: any) {
      alert(`Erro ao abrir pasta: ${e.message}`);
    }
  };

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
          Projetos Ativos
        </h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Projeto
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Buscar projetos..." 
            className="pl-9"
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select 
          value={filters.lane || ''} 
          onChange={e => setFilters({ ...filters, lane: (e.target.value as Lane) || undefined })}
          className="w-40"
        >
          <option value="">Todas Lanes</option>
          <option value="A">Lane A</option>
          <option value="B">Lane B</option>
        </Select>
        <Select 
          value={filters.status || ''} 
          onChange={e => setFilters({ ...filters, status: (e.target.value as ProjectStatus) || undefined })}
          className="w-48"
        >
          <option value="">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Pausado">Pausado</option>
          <option value="Concluído">Concluído</option>
        </Select>
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

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-surface-raised border-b border-border z-10">
            <tr>
              <th className="px-4 py-3 font-medium text-text-muted">Projeto</th>
              <th className="px-4 py-3 font-medium text-text-muted w-24">Lane</th>
              <th className="px-4 py-3 font-medium text-text-muted w-32">Status</th>
              <th className="px-4 py-3 font-medium text-text-muted w-32">Prioridade</th>
              <th className="px-4 py-3 font-medium text-text-muted">Próxima Ação</th>
              <th className="px-4 py-3 font-medium text-text-muted text-right w-48">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">Carregando projetos...</td>
              </tr>
            ) : projects && projects.length > 0 ? (
              projects.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-surface-soft/50 transition-colors group">
                  <td className="px-4 py-3">
                    <p className={`font-medium ${p.archived ? 'text-text-muted line-through' : 'text-text'}`}>{p.name}</p>
                    {p.area && <p className="text-xs text-text-muted mt-0.5">{p.area}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.lane === 'A' ? 'lane-a' : 'lane-b'}>LANE {p.lane}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === 'Concluído' ? 'success' : p.status === 'Pausado' ? 'neutral' : 'outline'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.priority && (
                      <span className={`text-xs font-semibold ${
                        p.priority === 'Alta' ? 'text-danger' : 
                        p.priority === 'Média' ? 'text-lane-b' : 'text-success'
                      }`}>
                        {p.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted truncate max-w-[200px]" title={p.nextAction || ''}>
                    {p.nextAction || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.folderPath && (
                        <Button variant="ghost" size="icon" onClick={() => handleOpenFolder(p.folderPath!)} title="Abrir Pasta">
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                      )}
                      {!p.archived && p.status === 'Ativo' && (
                        <Button variant="ghost" size="icon" onClick={() => handleSetFocus(p.lane, p.id)} title="Colocar em Foco">
                          <Target className="h-4 w-4 text-lane-a" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {p.archived ? (
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(p.id)} title="Restaurar">
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleArchive(p.id)} title="Arquivar" className="hover:text-danger">
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState 
                    title="Nenhum projeto encontrado"
                    description="Não há projetos que correspondam aos filtros atuais."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectToEdit={editingProject}
      />
    </div>
  );
}
