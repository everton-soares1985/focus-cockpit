import { useState } from 'react';
import { Plus, Search, Eye, Download, Pencil, FileText } from 'lucide-react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useCredentials } from './credentialHooks';
import { openCredential, exportCredential } from '../platform/credentials';
import type { CredentialFilters, Credential, CredentialKind } from './credentialSchema';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Badge } from '../design-system/components/Badge';
import { EmptyState } from '../design-system/components/EmptyState';
import { CredentialPreview } from './CredentialPreview';
import { CredentialModal } from './CredentialModal';

export default function CredentialsScreen() {
  const [filters, setFilters] = useState<CredentialFilters>({
    search: '',
    kind: undefined,
  });

  const { data: credentials, isLoading } = useCredentials(filters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [importSourcePath, setImportSourcePath] = useState<string | null>(null);

  const handleImportClick = async () => {
    try {
      const selected = await open({
        filters: [{ name: 'Imagens e PDFs', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] }],
        multiple: false,
      });
      if (selected && !Array.isArray(selected)) {
        setImportSourcePath(selected as string);
        setEditingCredential(null);
        setIsModalOpen(true);
      }
    } catch (e: any) {
      alert(`Erro ao selecionar arquivo: ${e.message}`);
    }
  };

  const handleEditClick = (c: Credential) => {
    setImportSourcePath(null);
    setEditingCredential(c);
    setIsModalOpen(true);
  };

  const handleExport = async (c: Credential) => {
    try {
      const extension = c.mimeType === 'application/pdf' ? 'pdf' : c.mimeType.split('/')[1] || 'bin';
      const defaultName = `${c.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      const dest = await save({ defaultPath: defaultName });
      if (dest) {
        await exportCredential(c.storedPath, dest);
        alert('Exportado com sucesso!');
      }
    } catch (e: any) {
      alert(`Erro ao exportar: ${e.message}`);
    }
  };

  const handleView = async (c: Credential) => {
    try {
      await openCredential(c.storedPath);
    } catch (e: any) {
      alert(`Erro ao abrir: ${e.message}`);
    }
  };

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
          Diplomas e Certificados
        </h2>
        <Button onClick={handleImportClick} className="gap-2">
          <Plus className="h-4 w-4" /> Importar Arquivo
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Buscar diplomas..." 
            className="pl-9"
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select 
          value={filters.kind || ''} 
          onChange={e => setFilters({ ...filters, kind: (e.target.value as CredentialKind) || undefined })}
          className="w-48"
        >
          <option value="">Todos os Tipos</option>
          <option value="certificate">Certificado</option>
          <option value="diploma">Diploma</option>
          <option value="badge">Badge</option>
          <option value="other">Outro</option>
        </Select>
      </div>

      <div className="flex-1 overflow-auto bg-bg rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-text-muted">Carregando galeria...</div>
        ) : credentials && credentials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-6">
            {credentials.map(c => (
              <div key={c.id} className="group flex flex-col bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden">
                <div className="aspect-[4/3] bg-surface-raised relative border-b border-border cursor-pointer" onClick={() => handleView(c)}>
                  {c.mimeType === 'application/pdf' && !c.thumbnailPath ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted opacity-70 group-hover:opacity-100 transition-opacity">
                      <FileText className="h-12 w-12 mb-2 text-lane-b" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Documento PDF</span>
                    </div>
                  ) : (
                    <CredentialPreview path={c.thumbnailPath || c.storedPath} mimeType={c.mimeType} isThumbnail={true} />
                  )}
                  <div className="absolute inset-0 bg-bg/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="gap-2 rounded-full px-4"><Eye className="h-4 w-4" /> Visualizar</Button>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <Badge className="w-max mb-2 text-[10px] uppercase tracking-wider py-0" variant="neutral">
                    {c.kind}
                  </Badge>
                  <h3 className="font-semibold text-text text-sm line-clamp-2 leading-snug mb-1" title={c.title}>{c.title}</h3>
                  <p className="text-xs text-text-muted truncate mb-3" title={c.issuer || ''}>{c.issuer || '-'}</p>
                  
                  {c.courseTitle && (
                    <p className="text-[10px] text-text-muted bg-surface-raised px-2 py-1 rounded truncate mb-3 mt-auto">
                      Ref: {c.courseTitle}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <span className="text-xs font-mono text-text-muted">{c.issuedOn?.slice(0, 4) || 'Sem data'}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted" onClick={() => handleExport(c)} title="Exportar">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted" onClick={() => handleEditClick(c)} title="Editar Metadados">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<FileText className="h-10 w-10 text-lane-b" />}
            title="Nenhum diploma encontrado"
            description="Importe um arquivo PDF ou imagem para criar seu acervo de certificados."
          />
        )}
      </div>

      <CredentialModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        credentialToEdit={editingCredential}
        importSourcePath={importSourcePath}
      />
    </div>
  );
}
