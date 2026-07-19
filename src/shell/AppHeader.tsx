import { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, Trash2, Settings } from 'lucide-react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useClearDemoData } from '../app/demoHooks';
import { createBackup, inspectBackup, restoreBackupConfirmed, type BackupSummary } from '../platform/backups';
import { Button } from '../design-system/components/Button';
import { Modal } from '../design-system/components/Modal';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(epochSeconds: number) {
  return new Date(epochSeconds * 1000).toLocaleString('pt-BR');
}

export default function AppHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backupSummary, setBackupSummary] = useState<{ path: string; summary: BackupSummary } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearDemoMutation = useClearDemoData();

  const handleCreateBackup = async () => {
    try {
      setError(null);
      const path = await save({
        filters: [{ name: 'Focus Cockpit Backup', extensions: ['zip'] }],
        defaultPath: 'focus-cockpit-backup.zip',
      });
      if (!path) return;
      await createBackup(path);
      alert('Backup criado com sucesso em: ' + path);
    } catch (e: any) {
      setError(e.message || 'Erro ao criar backup.');
    }
  };

  const handleInspectRestore = async () => {
    try {
      setError(null);
      const selected = await open({
        filters: [{ name: 'Focus Cockpit Backup', extensions: ['zip'] }],
        multiple: false,
      });
      if (!selected || Array.isArray(selected)) return;
      const path = selected as string;
      const summary = await inspectBackup(path);
      setBackupSummary({ path, summary });
    } catch (e: any) {
      setError(e.message || 'Erro ao ler arquivo de backup.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!backupSummary) return;
    try {
      setIsRestoring(true);
      setError(null);
      await restoreBackupConfirmed(backupSummary.path);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || 'Erro ao restaurar backup.');
      setIsRestoring(false);
    }
  };

  const handleClearDemo = async () => {
    if (confirm('Tem certeza que deseja apagar todos os dados de demonstração (Projetos, Cursos, etc que começam com "demo")?')) {
      await clearDemoMutation.mutateAsync();
      alert('Dados de demonstração removidos com sucesso.');
      setIsSettingsOpen(false);
    }
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
        <h1 className="text-sm font-semibold tracking-wide text-text-muted">PAINEL PESSOAL <span className="mx-2 text-border-strong">|</span> <span className="text-text">FOCUS COCKPIT</span></h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} title="Configurações e Dados">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <Modal isOpen={isSettingsOpen} onClose={() => { setIsSettingsOpen(false); setBackupSummary(null); setError(null); }} title="Gerenciar Dados">
        <div className="space-y-6">
          {error && (
            <div className="rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!backupSummary ? (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <Database className="h-4 w-4" /> Backup Local
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={handleCreateBackup} className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" /> Criar Backup
                  </Button>
                  <Button variant="secondary" onClick={handleInspectRestore} className="w-full justify-start gap-2">
                    <Upload className="h-4 w-4" /> Restaurar Backup
                  </Button>
                </div>
                <p className="text-xs text-text-muted">
                  O backup contém todo o seu banco de dados e arquivos de diplomas em um arquivo ZIP seguro.
                </p>
              </div>
              
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Manutenção
                </h3>
                <Button 
                  variant="danger" 
                  onClick={handleClearDemo} 
                  disabled={clearDemoMutation.isPending}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Limpar dados de demonstração
                </Button>
                <p className="text-xs text-text-muted">
                  Isto apagará projetos, atalhos, cursos e diplomas que vieram como demonstração.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-surface-raised border border-border p-4 space-y-2">
                <h3 className="text-sm font-medium text-text mb-3">Resumo do Backup</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-text-muted">Data:</span>
                  <span className="text-text font-medium">{formatDate(backupSummary.summary.createdAtEpochSeconds)}</span>
                  
                  <span className="text-text-muted">Diplomas (arquivos):</span>
                  <span className="text-text font-medium">{backupSummary.summary.credentialCount}</span>
                  
                  <span className="text-text-muted">Miniaturas:</span>
                  <span className="text-text font-medium">{backupSummary.summary.thumbnailCount}</span>
                  
                  <span className="text-text-muted">Tamanho total:</span>
                  <span className="text-text font-medium">{formatBytes(backupSummary.summary.totalBytes)}</span>
                </div>
              </div>
              
              <div className="rounded-md bg-danger/10 border border-danger/30 p-3 text-sm text-danger flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Atenção!</p>
                  <p>Restaurar este backup substituirá <b>todo</b> o banco de dados atual e todas as imagens de diplomas locais. O aplicativo será reiniciado após a conclusão. Esta ação não pode ser desfeita.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setBackupSummary(null)} disabled={isRestoring}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={handleConfirmRestore} disabled={isRestoring}>
                  {isRestoring ? 'Restaurando...' : 'Confirmar Restauração'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
