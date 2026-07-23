import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useArchiveCourse,
  useCourses,
  useDeleteCourse,
  useRestoreCourse,
} from './courseHooks';
import type { Course, CourseFilters, CourseStatus } from './courseSchema';
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
import { CourseModal } from './CourseModal';

type ScreenFeedback = { tone: 'error' | 'success'; text: string } | null;

export default function CoursesScreen() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    status: undefined,
    category: '',
    includeArchived: false,
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Course | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Course | null>(null);
  const [feedback, setFeedback] = useState<ScreenFeedback>(null);

  const { data: courses, isLoading, isError, error } = useCourses(filters);
  const archiveMutation = useArchiveCourse();
  const deleteMutation = useDeleteCourse();
  const restoreMutation = useRestoreCourse();

  const handleArchive = async () => {
    if (!archiveCandidate) return;
    try {
      setFeedback(null);
      await archiveMutation.mutateAsync(archiveCandidate.id);
      setArchiveCandidate(null);
    } catch (archiveError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(archiveError, 'Não foi possível arquivar o curso.') });
    }
  };

  const handleRestore = async (course: Course) => {
    try {
      setFeedback(null);
      await restoreMutation.mutateAsync(course.id);
      setFeedback({ tone: 'success', text: `“${course.title}” foi restaurado.` });
    } catch (restoreError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(restoreError, 'Não foi possível restaurar o curso.') });
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setFeedback(null);
      await deleteMutation.mutateAsync(deleteCandidate.id);
      setFeedback({ tone: 'success', text: `“${deleteCandidate.title}” foi removido somente do Focus Cockpit.` });
      setDeleteCandidate(null);
    } catch (deleteError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(deleteError, 'Não foi possível remover o curso do app.') });
    }
  };

  const closeEditor = () => {
    setEditingCourse(null);
    setIsCreating(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">Cursos</h2>
          <p className="mt-1 text-xs text-text-muted">Acompanhe o que pretende fazer, está estudando e já concluiu.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo curso
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" aria-hidden="true" />
          <Input
            aria-label="Buscar cursos"
            placeholder="Buscar cursos..."
            className="pl-9"
            value={filters.search ?? ''}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </div>
        <Select
          aria-label="Filtrar cursos por status"
          value={filters.status ?? ''}
          onChange={(event) => setFilters({ ...filters, status: (event.target.value || undefined) as CourseStatus | undefined })}
          className="w-48"
        >
          <option value="">Todos os status</option>
          <option value="Planejado">Planejado</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Concluído">Concluído</option>
        </Select>
        <Input
          aria-label="Filtrar por categoria"
          placeholder="Categoria..."
          className="w-48"
          value={filters.category ?? ''}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        />
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
      {isError && <FeedbackMessage message={getErrorMessage(error, 'Não foi possível carregar os cursos.')} className="mb-4" />}

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-raised">
            <tr>
              <th className="px-4 py-3 font-medium text-text-muted">Instituição</th>
              <th className="px-4 py-3 font-medium text-text-muted">Curso</th>
              <th className="w-32 px-4 py-3 font-medium text-text-muted">Categoria</th>
              <th className="w-32 px-4 py-3 font-medium text-text-muted">Status</th>
              <th className="w-28 px-4 py-3 font-medium text-text-muted">Prioridade</th>
              <th className="w-28 px-4 py-3 font-medium text-text-muted">Início</th>
              <th className="w-28 px-4 py-3 font-medium text-text-muted">Conclusão</th>
              <th className="w-24 px-4 py-3 text-center font-medium text-text-muted">Diploma</th>
              <th className="w-36 px-4 py-3 text-right font-medium text-text-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-text-muted">Carregando cursos...</td></tr>
            ) : courses && courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course.id} className="group border-b border-border/50 transition-colors hover:bg-surface-soft/50 focus-within:bg-surface-soft/50">
                  <td className="px-4 py-3 text-text-muted">{course.institution || '—'}</td>
                  <td className="px-4 py-3">
                    <p className={`font-medium ${course.archived ? 'text-text-muted line-through' : 'text-text'}`}>{course.title}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{course.category || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={course.status === 'Concluído' ? 'success' : course.status === 'Planejado' ? 'neutral' : 'lane-a'}>{course.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={course.priority === 'Alta' ? 'text-danger' : course.priority === 'Média' ? 'text-lane-b' : 'text-text-muted'}>
                      {course.priority || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{course.startedOn || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{course.completedOn || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {course.credentialCount > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/credentials?course=${course.id}`)}
                        className="gap-1 text-lane-b"
                        title="Ver diplomas vinculados"
                      >
                        <GraduationCap className="h-4 w-4" aria-hidden="true" /> {course.credentialCount}
                      </Button>
                    ) : course.status === 'Concluído' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/credentials?course=${course.id}`)}
                        title="Ir para diplomas"
                      >
                        Adicionar
                      </Button>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button variant="ghost" size="icon" onClick={() => setEditingCourse(course)} title="Editar" aria-label={`Editar ${course.title}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {course.archived ? (
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(course)} title="Restaurar" aria-label={`Restaurar ${course.title}`}>
                          <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setArchiveCandidate(course)} title="Arquivar" aria-label={`Arquivar ${course.title}`} className="hover:text-danger">
                          <Archive className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteCandidate(course)} title="Remover do app" aria-label={`Remover ${course.title} do app`} className="hover:text-danger">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9}><EmptyState title="Nenhum curso encontrado" description="Ajuste os filtros ou cadastre o primeiro curso." /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(isCreating || editingCourse) && (
        <CourseModal key={editingCourse?.id ?? 'new'} onClose={closeEditor} courseToEdit={editingCourse} />
      )}

      <ConfirmDialog
        isOpen={Boolean(archiveCandidate)}
        title="Arquivar curso"
        description={`“${archiveCandidate?.title ?? ''}” sairá das listas ativas. Os diplomas vinculados permanecerão no acervo.`}
        confirmLabel="Arquivar curso"
        isPending={archiveMutation.isPending}
        onCancel={() => setArchiveCandidate(null)}
        onConfirm={handleArchive}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Remover curso do app"
        description={`“${deleteCandidate?.title ?? ''}” será apagado do banco do Focus Cockpit. Diplomas vinculados continuarão no acervo e nenhum arquivo do computador será excluído.`}
        confirmLabel="Remover somente do app"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
