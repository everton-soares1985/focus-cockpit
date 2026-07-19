import { useState } from 'react';
import { Plus, Search, Pencil, Archive, ArchiveRestore, GraduationCap } from 'lucide-react';
import { useCourses, useArchiveCourse, useRestoreCourse } from './courseHooks';
import type { CourseFilters, Course, CourseStatus } from './courseSchema';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Badge } from '../design-system/components/Badge';
import { EmptyState } from '../design-system/components/EmptyState';
import { CourseModal } from './CourseModal';

export default function CoursesScreen() {
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    status: undefined,
    category: '',
    includeArchived: false,
  });

  const { data: courses, isLoading } = useCourses(filters);
  const archiveMutation = useArchiveCourse();
  const restoreMutation = useRestoreCourse();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleCreate = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Deseja realmente arquivar este curso? Ele não aparecerá mais nas listas ativas, mas os diplomas não serão apagados.')) {
      await archiveMutation.mutateAsync(id);
    }
  };

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id);
  };

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
          Cursos e Treinamentos
        </h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Curso
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Buscar cursos..." 
            className="pl-9"
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select 
          value={filters.status || ''} 
          onChange={e => setFilters({ ...filters, status: (e.target.value as CourseStatus) || undefined })}
          className="w-48"
        >
          <option value="">Todos os Status</option>
          <option value="Planejado">Planejado</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Concluído">Concluído</option>
        </Select>
        <Input 
          placeholder="Categoria..." 
          className="w-48"
          value={filters.category || ''}
          onChange={e => setFilters({ ...filters, category: e.target.value })}
        />
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
        <table className="w-full text-left text-sm border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-surface-raised border-b border-border z-10">
            <tr>
              <th className="px-4 py-3 font-medium text-text-muted">Curso</th>
              <th className="px-4 py-3 font-medium text-text-muted w-40">Instituição</th>
              <th className="px-4 py-3 font-medium text-text-muted w-32">Categoria</th>
              <th className="px-4 py-3 font-medium text-text-muted w-32">Status</th>
              <th className="px-4 py-3 font-medium text-text-muted w-32">Período</th>
              <th className="px-4 py-3 font-medium text-text-muted w-24 text-center">Diplomas</th>
              <th className="px-4 py-3 font-medium text-text-muted text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">Carregando cursos...</td>
              </tr>
            ) : courses && courses.length > 0 ? (
              courses.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-surface-soft/50 transition-colors group">
                  <td className="px-4 py-3">
                    <p className={`font-medium ${c.archived ? 'text-text-muted line-through' : 'text-text'}`}>{c.title}</p>
                    {c.priority && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                        c.priority === 'Alta' ? 'text-danger' : 
                        c.priority === 'Média' ? 'text-lane-b' : 'text-success'
                      }`}>
                        Prioridade {c.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{c.institution || '-'}</td>
                  <td className="px-4 py-3 text-text-muted">{c.category || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'Concluído' ? 'success' : c.status === 'Planejado' ? 'neutral' : 'lane-a'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {c.startedOn || '?'} {c.completedOn ? `até ${c.completedOn}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.credentialCount > 0 ? (
                      <Badge variant="lane-b" className="gap-1 px-1.5"><GraduationCap className="h-3 w-3" /> {c.credentialCount}</Badge>
                    ) : (
                      <span className="text-text-muted opacity-50">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {c.archived ? (
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(c.id)} title="Restaurar">
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleArchive(c.id)} title="Arquivar" className="hover:text-danger">
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <EmptyState 
                    title="Nenhum curso encontrado"
                    description="Não há cursos que correspondam aos filtros atuais."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CourseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseToEdit={editingCourse}
      />
    </div>
  );
}
