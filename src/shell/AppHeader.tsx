import { useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useClearDemoData } from '../app/demoHooks';
import {
  createBackup,
  inspectBackup,
  restoreBackupConfirmed,
  type BackupSummary,
} from '../platform/backups';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Modal } from '../design-system/components/Modal';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const unit = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(unit)), units.length - 1);
  return `${(bytes / unit ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatDate(epochSeconds: number) {
  return new Date(epochSeconds * 1000).toLocaleString('pt-BR');
}

type Feedback = { tone: 'error' | 'success' | 'info'; text: string } | null;

export default function AppHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backupSummary, setBackupSummary] = useState<{
    path: string;
    summary: BackupSummary;
  } | null>(null);
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isInspectingBackup, setIsInspectingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const clearDemoMutation = useClearDemoData();

  const closeSettings = () => {
    if (isRestoring || clearDemoMutation.isPending) return;
    setIsSettingsOpen(false);
    setBackupSummary(null);
    setIsClearConfirming(false);
    setFeedback(null);
  };

  const handleCreateBackup = async () => {
    try {
      setFeedback(null);
      const destinationPath = await save({
        filters: [{ name: 'Backup do Focus Cockpit', extensions: ['focusbackup'] }],
        defaultPath: `focus-cockpit-${new Date().toISOString().slice(0, 10)}.focusbackup`,
      });
      if (!destinationPath) return;
      setIsCreatingBackup(true);
      const summary = await createBackup(destinationPath);
      setFeedback({
        tone: 'success',
        text: `Backup criado com segurança (${formatBytes(summary.totalBytes)}).`,
      });
    } catch (error: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(error, 'Não foi possível criar o backup.'),
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleInspectRestore = async () => {
    try {
      setFeedback(null);
      const selected = await open({
        filters: [{ name: 'Backup do Focus Cockpit', extensions: ['focusbackup', 'zip'] }],
        multiple: false,
      });
      if (!selected || Array.isArray(selected)) return;
      setIsInspectingBackup(true);
      const summary = await inspectBackup(selected);
      setBackupSummary({ path: selected, summary });
    } catch (error: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(error, 'Não foi possível validar esse backup.'),
      });
    } finally {
      setIsInspectingBackup(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!backupSummary) return;
    try {
      setIsRestoring(true);
      setFeedback(null);
      await restoreBackupConfirmed(backupSummary.path);
      window.location.reload();
    } catch (error: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(error, 'Não foi possível restaurar o backup.'),
      });
      setIsRestoring(false);
    }
  };

  const handleClearDemo = async () => {
    try {
      setFeedback(null);
      const result = await clearDemoMutation.mutateAsync();
      setIsClearConfirming(false);
      setFeedback({
        tone: 'success',
        text: `Demonstração removida: ${result.removedProjects} projetos, ${result.removedCourses} cursos e ${result.removedShortcuts} atalhos.`,
      });
    } catch (error: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(error, 'Não foi possível limpar os dados de demonstração.'),
      });
    }
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
        <h1 className="text-sm font-semibold tracking-wide text-text-muted">
          PAINEL PESSOAL <span className="mx-2 text-border-strong">|</span>{' '}
          <span className="text-text">FOCUS COCKPIT</span>
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Abrir backup e dados"
          title="Backup e dados"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Button>
      </header>

      <Modal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        title="Backup e dados"
      >
        <div className="space-y-6">
          <FeedbackMessage
            message={feedback?.text}
            tone={feedback?.tone}
          />

          {backupSummary ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded-md border border-border bg-surface-raised p-4">
                <h3 className="mb-3 text-sm font-medium text-text">Resumo do backup</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-text-muted">Criado em</dt>
                  <dd className="font-medium text-text">
                    {formatDate(backupSummary.summary.createdAtEpochSeconds)}
                  </dd>
                  <dt className="text-text-muted">Diplomas</dt>
                  <dd className="font-medium text-text">
                    {backupSummary.summary.credentialCount}
                  </dd>
                  <dt className="text-text-muted">Miniaturas</dt>
                  <dd className="font-medium text-text">
                    {backupSummary.summary.thumbnailCount}
                  </dd>
                  <dt className="text-text-muted">Tamanho total</dt>
                  <dd className="font-medium text-text">
                    {formatBytes(backupSummary.summary.totalBytes)}
                  </dd>
                </dl>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="mb-1 font-semibold">Confirmação necessária</p>
                  <p>
                    A restauração substituirá o banco e os diplomas locais. Antes disso,
                    o aplicativo criará automaticamente uma cópia de segurança do estado atual.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setBackupSummary(null)}
                  disabled={isRestoring}
                >
                  Voltar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                >
                  {isRestoring ? 'Restaurando...' : 'Restaurar este backup'}
                </Button>
              </div>
            </div>
          ) : isClearConfirming ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>
                  Somente os registros fictícios identificados como demonstração serão removidos.
                  Seus registros pessoais permanecem intactos.
                </p>
              </div>
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsClearConfirming(false)}
                  disabled={clearDemoMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClearDemo}
                  disabled={clearDemoMutation.isPending}
                  autoFocus
                >
                  {clearDemoMutation.isPending ? 'Limpando...' : 'Remover demonstração'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-text-muted">
                  <Database className="h-4 w-4" aria-hidden="true" /> Backup local
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleCreateBackup}
                    className="w-full justify-start gap-2"
                    disabled={isCreatingBackup || isInspectingBackup}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {isCreatingBackup ? 'Criando...' : 'Criar backup'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleInspectRestore}
                    className="w-full justify-start gap-2"
                    disabled={isCreatingBackup || isInspectingBackup}
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {isInspectingBackup ? 'Validando...' : 'Restaurar backup'}
                  </Button>
                </div>
                <p className="text-xs leading-5 text-text-muted">
                  O arquivo <code>.focusbackup</code> reúne o banco, os diplomas e um manifesto
                  verificado, sem usar nuvem.
                </p>
              </section>

              <section className="space-y-3 border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-text-muted">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Manutenção
                </h3>
                <Button
                  variant="danger"
                  onClick={() => {
                    setFeedback(null);
                    setIsClearConfirming(true);
                  }}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Limpar dados de demonstração
                </Button>
              </section>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
