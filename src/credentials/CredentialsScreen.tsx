import { useState } from 'react';
import { Download, Eye, FileText, Pencil, Plus, Search } from 'lucide-react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useSearchParams } from 'react-router-dom';
import { useCredentials } from './credentialHooks';
import { exportCredential, openCredential } from '../platform/credentials';
import type {
  Credential,
  CredentialFilters,
  CredentialKind,
} from './credentialSchema';
import { Badge } from '../design-system/components/Badge';
import { Button } from '../design-system/components/Button';
import { EmptyState } from '../design-system/components/EmptyState';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { CredentialModal } from './CredentialModal';
import { CredentialPreview } from './CredentialPreview';

const kindLabels: Record<CredentialKind, string> = {
  certificate: 'Certificado',
  diploma: 'Diploma',
  badge: 'Badge',
  other: 'Outro',
};

type ScreenFeedback = { tone: 'error' | 'success' | 'info'; text: string } | null;

export default function CredentialsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preferredCourseId = searchParams.get('course');
  const [filters, setFilters] = useState<CredentialFilters>({
    search: '',
    kind: undefined,
    courseId: preferredCourseId ?? undefined,
  });
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [importSourcePath, setImportSourcePath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<ScreenFeedback>(null);

  const { data: credentials, isLoading, isError, error } = useCredentials(filters);

  const handleImportClick = async () => {
    try {
      setFeedback(null);
      const selected = await open({
        filters: [{ name: 'PDF ou imagem', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] }],
        multiple: false,
      });
      if (selected && !Array.isArray(selected)) {
        setImportSourcePath(selected);
        setEditingCredential(null);
        setIsModalOpen(true);
      }
    } catch (selectionError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(selectionError, 'Não foi possível selecionar o arquivo.') });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCredential(null);
    setImportSourcePath(null);
  };

  const handleExport = async (credential: Credential) => {
    try {
      setFeedback(null);
      const extension = credential.mimeType === 'application/pdf'
        ? 'pdf'
        : credential.mimeType === 'image/jpeg'
          ? 'jpg'
          : credential.mimeType.split('/')[1];
      const defaultName = `${credential.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase() || 'diploma'}.${extension}`;
      const destination = await save({
        defaultPath: defaultName,
        filters: [{ name: 'Cópia do diploma', extensions: [extension] }],
      });
      if (!destination) return;
      await exportCredential(credential.storedPath, destination);
      setFeedback({ tone: 'success', text: `“${credential.title}” foi exportado.` });
    } catch (exportError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(exportError, 'Não foi possível exportar o diploma.') });
    }
  };

  const handleView = async (credential: Credential) => {
    try {
      setFeedback(null);
      await openCredential(credential.storedPath);
    } catch (openError: unknown) {
      setFeedback({ tone: 'error', text: getErrorMessage(openError, 'Não foi possível abrir o diploma.') });
    }
  };

  const clearCourseFilter = () => {
    setFilters({ ...filters, courseId: undefined });
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">Diplomas e certificados</h2>
          <p className="mt-1 text-xs text-text-muted">Seu acervo local de PDFs e imagens, sem upload para a nuvem.</p>
        </div>
        <Button onClick={handleImportClick} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Importar arquivo
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" aria-hidden="true" />
          <Input
            aria-label="Buscar diplomas"
            placeholder="Buscar diplomas..."
            className="pl-9"
            value={filters.search ?? ''}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </div>
        <Select
          aria-label="Filtrar diplomas por tipo"
          value={filters.kind ?? ''}
          onChange={(event) => setFilters({ ...filters, kind: (event.target.value || undefined) as CredentialKind | undefined })}
          className="w-48"
        >
          <option value="">Todos os tipos</option>
          <option value="certificate">Certificado</option>
          <option value="diploma">Diploma</option>
          <option value="badge">Badge</option>
          <option value="other">Outro</option>
        </Select>
        {filters.courseId && (
          <Button variant="secondary" onClick={clearCourseFilter}>Remover filtro do curso</Button>
        )}
      </div>

      {filters.courseId && (
        <FeedbackMessage
          tone="info"
          message="Mostrando diplomas do curso selecionado. Ao importar, esse curso já virá pré-selecionado."
          className="mb-4"
        />
      )}
      <FeedbackMessage message={feedback?.text} tone={feedback?.tone} className="mb-4" />
      {isError && <FeedbackMessage message={getErrorMessage(error, 'Não foi possível carregar os diplomas.')} className="mb-4" />}

      <div className="flex-1 overflow-auto rounded-xl bg-bg">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-text-muted">Carregando galeria...</div>
        ) : credentials && credentials.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {credentials.map((credential) => (
              <article key={credential.id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong focus-within:border-border-strong">
                <button
                  type="button"
                  className="relative aspect-[4/3] border-b border-border bg-surface-raised text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lane-a"
                  onClick={() => handleView(credential)}
                  aria-label={`Visualizar ${credential.title}`}
                >
                  {credential.mimeType === 'application/pdf' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center text-text-muted">
                      <FileText className="mb-2 h-12 w-12 text-lane-b" aria-hidden="true" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Documento PDF</span>
                    </div>
                  ) : (
                    <CredentialPreview
                      key={credential.storedPath}
                      path={credential.thumbnailPath ?? credential.storedPath}
                      mimeType={credential.mimeType}
                      title={credential.title}
                      isThumbnail
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-bg/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-raised px-4 py-2 text-xs font-medium text-text">
                      <Eye className="h-4 w-4" aria-hidden="true" /> Visualizar
                    </span>
                  </span>
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <Badge className="mb-2 w-max py-0 text-[10px] uppercase tracking-wider" variant="neutral">
                    {kindLabels[credential.kind]}
                  </Badge>
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-text" title={credential.title}>{credential.title}</h3>
                  <p className="mb-3 truncate text-xs text-text-muted" title={credential.issuer ?? ''}>{credential.issuer || 'Emissor não informado'}</p>
                  {credential.courseTitle && (
                    <p className="mb-3 mt-auto truncate rounded bg-surface-raised px-2 py-1 text-[10px] text-text-muted">Curso: {credential.courseTitle}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="font-mono text-xs text-text-muted">{credential.issuedOn?.slice(0, 4) || 'Sem data'}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(credential)} title="Visualizar" aria-label={`Visualizar ${credential.title}`}>
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExport(credential)} title="Baixar cópia" aria-label={`Baixar ${credential.title}`}>
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        setEditingCredential(credential);
                        setImportSourcePath(null);
                        setIsModalOpen(true);
                      }} title="Editar dados" aria-label={`Editar dados de ${credential.title}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-lane-b" />}
            title="Nenhum diploma encontrado"
            description={filters.courseId ? 'Este curso ainda não tem diploma vinculado. Use “Importar arquivo” para adicionar.' : 'Importe um PDF ou uma imagem para começar seu acervo.'}
            action={<Button onClick={handleImportClick}>Importar arquivo</Button>}
          />
        )}
      </div>

      {isModalOpen && (
        <CredentialModal
          key={editingCredential?.id ?? importSourcePath ?? 'new'}
          onClose={closeModal}
          credentialToEdit={editingCredential}
          importSourcePath={importSourcePath}
          preferredCourseId={filters.courseId}
        />
      )}
    </div>
  );
}
