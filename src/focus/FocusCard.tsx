import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Settings2,
} from 'lucide-react';
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

export function FocusCard({
  lane,
  mode,
}: {
  lane: Lane;
  mode: 'now' | 'parallel';
}) {
  const { data: slots, isLoading } = useFocusSlots();
  const { data: allProjects } = useProjects({ lane, includeArchived: false });
  const setFocusProject = useSetFocusProject();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const slot = slots?.find((candidate) => candidate.lane === lane);
  const project = slot?.project;
  const folderStatus = useSavedTargetStatus(project?.folderPath, 'folder');
  const isLaneA = lane === 'A';
  const title = mode === 'now' ? 'Agora' : 'Em paralelo';
  const subtitle = mode === 'now' ? 'Seu foco principal' : 'O que evolui junto';

  const openEditor = () => {
    setError(null);
    setSelectedProjectId(project?.id ?? '');
    setIsEditing(true);
  };

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
    if (!project?.folderPath) return;
    try {
      setError(null);
      await openSavedTarget(project.folderPath, 'folder');
    } catch (openError: unknown) {
      setError(getErrorMessage(openError, 'Não foi possível abrir a pasta.'));
    }
  };

  return (
    <>
      <section
        className={`flex min-h-80 flex-col rounded-xl border bg-surface p-5 shadow-sm ${
          isLaneA ? 'border-lane-a/65' : 'border-lane-b/65'
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Badge
              variant={isLaneA ? 'lane-a' : 'lane-b'}
              className="mb-4 text-[10px] uppercase tracking-widest"
            >
              Lane {lane}
            </Badge>
            <h2 className="text-2xl font-semibold uppercase tracking-tight text-text">
              {title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={openEditor}
            className={isLaneA ? 'border border-lane-a/40 text-lane-a' : 'border border-lane-b/40 text-lane-b'}
            aria-label={`Alterar foco da Lane ${lane}`}
            title={`Alterar foco da Lane ${lane}`}
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 animate-pulse space-y-4">
            <div className="h-12 rounded-lg bg-surface-raised" />
            <div className="h-12 rounded-lg bg-surface-raised" />
          </div>
        ) : project ? (
          <div className="flex flex-1 flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-text">{project.name}</span>
              {project.area && <Badge variant="neutral">{project.area}</Badge>}
            </div>

            <div className="space-y-4">
              <div>
                <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wider ${isLaneA ? 'text-lane-a' : 'text-lane-b'}`}>
                  Próxima ação
                </p>
                <div className="flex min-h-14 items-center gap-3 rounded-lg border border-border-strong bg-surface-soft px-4 py-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isLaneA ? 'bg-lane-a text-bg' : 'bg-lane-b text-bg'}`}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium leading-5 text-text">
                    {project.nextAction || 'Ainda não definida'}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Último avanço
                </p>
                <div className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${isLaneA ? 'text-lane-a' : 'text-lane-b'}`} aria-hidden="true" />
                  <p className="text-sm leading-5 text-text-muted">
                    {project.lastProgress || 'Ainda não registrado'}
                  </p>
                </div>
              </div>
            </div>

            {project.folderPath && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openFolder}
                  disabled={!isTargetAvailable(folderStatus.data)}
                  className="gap-2"
                >
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" /> Abrir pasta
                </Button>
                <ShortcutTargetStatus
                  status={folderStatus.data}
                  isLoading={folderStatus.isLoading}
                />
              </div>
            )}
            <FeedbackMessage message={error} className="mt-3" />
          </div>
        ) : (
          <div className={`flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 ${isLaneA ? 'border-lane-a/40' : 'border-lane-b/40'}`}>
            <FolderOpen className={`mb-3 h-8 w-8 ${isLaneA ? 'text-lane-a/60' : 'text-lane-b/60'}`} aria-hidden="true" />
            <p className="text-sm text-text-muted">Nenhum projeto selecionado</p>
            <Button variant="ghost" size="sm" className={`mt-2 ${isLaneA ? 'text-lane-a' : 'text-lane-b'}`} onClick={openEditor}>
              Definir foco
            </Button>
          </div>
        )}
      </section>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={`Alterar foco — Lane ${lane}`}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">
              Projeto desta Lane
            </label>
            <Select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              autoFocus
            >
              <option value="">(Nenhum)</option>
              {allProjects?.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
              ))}
            </Select>
          </div>
          <FeedbackMessage message={error} />
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={setFocusProject.isPending}>
              {setFocusProject.isPending ? 'Salvando...' : 'Salvar foco'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
