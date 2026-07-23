import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { FilePlus2, X } from 'lucide-react';
import { useCreateBook, useUpdateBook } from './bookHooks';
import {
  bookStatusSchema,
  type Book,
  type BookDraftInput,
} from './bookSchema';
import { inspectSavedTarget } from '../platform/nativeFiles';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

function initialBookDraft(book: Book | null): BookDraftInput {
  if (!book) {
    return {
      title: '',
      author: '',
      status: 'Quero ler',
      progressPercent: 0,
      currentPage: null,
      totalPages: null,
      startedOn: null,
      completedOn: null,
      rating: null,
      notes: '',
      filePath: '',
      link: '',
    };
  }
  return {
    title: book.title,
    author: book.author ?? '',
    status: book.status,
    progressPercent: book.progressPercent,
    currentPage: book.currentPage,
    totalPages: book.totalPages,
    startedOn: book.startedOn,
    completedOn: book.completedOn,
    rating: book.rating,
    notes: book.notes ?? '',
    filePath: book.filePath ?? '',
    link: book.link ?? '',
  };
}

function optionalNumber(value: string): number | '' {
  return value === '' ? '' : Number(value);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookModal({
  onClose,
  bookToEdit,
}: {
  onClose: () => void;
  bookToEdit: Book | null;
}) {
  const isEditing = Boolean(bookToEdit);
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const [formData, setFormData] = useState<BookDraftInput>(() =>
    initialBookDraft(bookToEdit),
  );
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (status: BookDraftInput['status']) => {
    setFormData((current) => {
      if (status === 'Concluído') {
        return {
          ...current,
          status,
          progressPercent: 100,
          completedOn: current.completedOn || today(),
        };
      }
      if (status === 'Lendo') {
        return {
          ...current,
          status,
          startedOn: current.startedOn || today(),
          completedOn: null,
        };
      }
      return { ...current, status, completedOn: null };
    });
  };

  const handleBrowse = async () => {
    try {
      setError(null);
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [
          {
            name: 'Livros e documentos',
            extensions: ['pdf', 'epub', 'mobi', 'azw', 'azw3', 'txt', 'doc', 'docx'],
          },
        ],
      });
      if (selected && !Array.isArray(selected)) {
        const status = await inspectSavedTarget(selected, 'file');
        if (status.blocked) {
          setError('Esse tipo de arquivo é bloqueado por segurança.');
          return;
        }
        setFormData((current) => ({ ...current, filePath: selected }));
      }
    } catch (selectionError: unknown) {
      setError(getErrorMessage(selectionError, 'Não foi possível selecionar o arquivo.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (formData.filePath) {
        const status = await inspectSavedTarget(formData.filePath, 'file');
        if (status.blocked) {
          setError('Esse tipo de arquivo é bloqueado por segurança.');
          return;
        }
        if (status.exists && !status.targetTypeMatches) {
          setError('O caminho selecionado não aponta para um arquivo.');
          return;
        }
      }
      if (bookToEdit) {
        await updateMutation.mutateAsync({ id: bookToEdit.id, input: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar o livro.'));
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Editar livro' : 'Novo livro'}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="book-title" className="mb-1.5 block text-sm font-medium text-text-muted">
              Título
            </label>
            <Input
              id="book-title"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              required
              autoFocus
              maxLength={180}
            />
          </div>

          <div>
            <label htmlFor="book-author" className="mb-1.5 block text-sm font-medium text-text-muted">
              Autor
            </label>
            <Input
              id="book-author"
              value={formData.author ?? ''}
              onChange={(event) => setFormData({ ...formData, author: event.target.value })}
              maxLength={160}
            />
          </div>

          <div>
            <label htmlFor="book-status" className="mb-1.5 block text-sm font-medium text-text-muted">
              Status
            </label>
            <Select
              id="book-status"
              value={formData.status}
              onChange={(event) =>
                handleStatusChange(event.target.value as BookDraftInput['status'])
              }
            >
              {bookStatusSchema.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="book-progress" className="mb-1.5 block text-sm font-medium text-text-muted">
              Progresso
            </label>
            <div className="relative">
              <Input
                id="book-progress"
                type="number"
                min={0}
                max={100}
                value={formData.progressPercent}
                onChange={(event) =>
                  setFormData({ ...formData, progressPercent: Number(event.target.value) })
                }
                className="pr-9"
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-text-muted">%</span>
            </div>
          </div>

          <div>
            <label htmlFor="book-current-page" className="mb-1.5 block text-sm font-medium text-text-muted">
              Página atual
            </label>
            <Input
              id="book-current-page"
              type="number"
              min={0}
              value={formData.currentPage ?? ''}
              onChange={(event) =>
                setFormData({ ...formData, currentPage: optionalNumber(event.target.value) })
              }
            />
          </div>

          <div>
            <label htmlFor="book-total-pages" className="mb-1.5 block text-sm font-medium text-text-muted">
              Total de páginas
            </label>
            <Input
              id="book-total-pages"
              type="number"
              min={1}
              value={formData.totalPages ?? ''}
              onChange={(event) => {
                const totalPages = optionalNumber(event.target.value);
                const currentPage =
                  typeof formData.currentPage === 'number' ? formData.currentPage : null;
                const progressPercent =
                  typeof totalPages === 'number' && totalPages > 0 && currentPage !== null
                    ? Math.min(100, Math.round((currentPage / totalPages) * 100))
                    : formData.progressPercent;
                setFormData({ ...formData, totalPages, progressPercent });
              }}
            />
          </div>

          <div>
            <label htmlFor="book-start" className="mb-1.5 block text-sm font-medium text-text-muted">
              Início
            </label>
            <Input
              id="book-start"
              type="date"
              value={formData.startedOn ?? ''}
              onChange={(event) => setFormData({ ...formData, startedOn: event.target.value })}
            />
          </div>

          <div>
            <label htmlFor="book-end" className="mb-1.5 block text-sm font-medium text-text-muted">
              Conclusão
            </label>
            <Input
              id="book-end"
              type="date"
              value={formData.completedOn ?? ''}
              onChange={(event) => setFormData({ ...formData, completedOn: event.target.value })}
            />
          </div>

          <div>
            <label htmlFor="book-rating" className="mb-1.5 block text-sm font-medium text-text-muted">
              Avaliação
            </label>
            <Select
              id="book-rating"
              value={formData.rating ?? ''}
              onChange={(event) =>
                setFormData({ ...formData, rating: optionalNumber(event.target.value) })
              }
            >
              <option value="">Sem avaliação</option>
              <option value="1">1 estrela</option>
              <option value="2">2 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="5">5 estrelas</option>
            </Select>
          </div>

          <div>
            <label htmlFor="book-link" className="mb-1.5 block text-sm font-medium text-text-muted">
              Link
            </label>
            <Input
              id="book-link"
              type="url"
              value={formData.link ?? ''}
              onChange={(event) => setFormData({ ...formData, link: event.target.value })}
              placeholder="https://..."
              maxLength={2048}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="book-file" className="mb-1.5 block text-sm font-medium text-text-muted">
              Arquivo do livro ou documento
            </label>
            <div className="flex gap-2">
              <Input
                id="book-file"
                value={formData.filePath ?? ''}
                readOnly
                placeholder="Nenhum arquivo vinculado"
                className="flex-1"
              />
              {formData.filePath ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFormData({ ...formData, filePath: '' })}
                  title="Desvincular arquivo"
                  aria-label="Desvincular arquivo"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
              <Button type="button" variant="secondary" onClick={handleBrowse} className="gap-2">
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                Selecionar
              </Button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              O Focus Cockpit guarda somente o caminho e nunca move ou exclui o arquivo original.
            </p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="book-notes" className="mb-1.5 block text-sm font-medium text-text-muted">
              Notas e principais ideias
            </label>
            <Textarea
              id="book-notes"
              value={formData.notes ?? ''}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={4}
              maxLength={5000}
              placeholder="Anotações, aprendizados, citações ou o motivo para ler..."
            />
          </div>
        </div>

        <FeedbackMessage message={error} />
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar livro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
