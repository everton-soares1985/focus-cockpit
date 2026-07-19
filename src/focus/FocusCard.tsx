import { useState } from 'react';
import { FolderOpen, Settings2 } from 'lucide-react';
import { useFocusSlots, useSetFocusProject } from './focusHooks';
import { useProjects } from '../projects/projectHooks';
import type { Lane } from '../projects/projectSchema';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';
import { openSavedTarget } from '../platform/nativeFiles';
import { useSavedTargetStatus } from '../platform/savedTargetHooks';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import {
  isTargetAvailable,
  ShortcutTargetStatus,
} from '../shortcuts/ShortcutTargetStatus';

export function FocusCard({ lane }: { lane: Lane }) {
  const { data: slots, isLoading } = useFocusSlots();
  const { data: allProjects } = useProjects({ lane, includeArchived: false });
  const setFocusProject = useSetFocusProject();
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const slot = slots?.find((s) => s.lane === lane);
  const project = slot?.project;
  const folderStatus = useSavedTargetStatus(project?.folderPath, 'folder');

  const isLaneA = lane === 'A';

  const handleSave = async () => {
    try {
      setError(null);
      await setFocusProject.mutateAsync({ lane, projectId: selectedProjectId || null });
      setIsEditing(false);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível atualizar o foco.'));
    }
  };

  const openFolder = async () => {
    if (project?.folderPath) {
      try {
        setError(null);
        await openSavedTarget(project.folderPath, 'folder');
      } catch (openError: unknown) {
        setError(getErrorMessage(openError, 'Não foi possível abrir a pasta.'));
      }
    }
  };

  return (
    <>
      <div className="flex flex-col rounded-xl border border-border bg-surface shadow-sm overflow-hidden relative">
        <div className={`h-1 w-full ${isLaneA ? 'bg-lane-a' : 'bg-lane-b'}`} />
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <Badge variant={isLaneA ? 'lane-a' : 'lane-b'} className="uppercase tracking-widest text-[10px]">
              LANE {lane}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => {
              setError(null);
              setSelectedProjectId(project?.id || '');
              setIsEditing(true);
            }} aria-label={`Editar foco da Lane ${lane}`} title={`Editar foco da Lane ${lane}`}>
              <Settings2 className="h-4 w-4 text-text-muted" aria-hidden="true" />
            </Button>
          </div>

          {isLoading ? (
            <div className="animate-pulse flex-1 space-y-3">
              <div className="h-4 bg-surface-raised rounded w-3/4"></div>
              <div className="h-3 bg-surface-raised rounded w-1/2"></div>
            </div>
          ) : project ? (
            <div className="flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-text mb-1 line-clamp-1" title={project.name}>{project.name}</h3>
              {project.area && <p className="text-sm text-text-muted mb-4">{project.area}</p>}
              
              <div className="mt-auto space-y-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Próxima ação</p>
                  <p className="min-h-10 rounded-lg border border-border-strong bg-surface-soft p-2.5 text-sm leading-relaxed text-text line-clamp-2">
                    {project.nextAction || 'Ainda não definida'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Último avanço</p>
                  <p className="min-h-10 rounded-lg border border-border bg-surface-soft/60 p-2.5 text-sm leading-relaxed text-text-muted line-clamp-2">
                    {project.lastProgress || 'Ainda não registrado'}
                  </p>
                </div>
                
                {project.folderPath && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openFolder}
                      disabled={!isTargetAvailable(folderStatus.data)}
                      className="flex-1 gap-2 text-xs"
                    >
                      <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" /> Abrir pasta
                    </Button>
                    <ShortcutTargetStatus
                      status={folderStatus.data}
                      isLoading={folderStatus.isLoading}
                    />
                  </div>
                )}
                <FeedbackMessage message={error} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted py-6 border-2 border-dashed border-border rounded-lg mt-2">
              <p className="text-sm">Nenhum projeto selecionado</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => {
                setSelectedProjectId('');
                setError(null);
                setIsEditing(true);
              }}>
                Definir Foco
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={`Editar Foco - Lane ${lane}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Projeto ativo</label>
            <Select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">(Nenhum)</option>
              {allProjects?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <p className="text-xs text-text-muted mt-2">Todos os projetos não arquivados desta Lane estão disponíveis.</p>
          </div>
          <FeedbackMessage message={error} />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={setFocusProject.isPending}>
              Salvar Foco
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
