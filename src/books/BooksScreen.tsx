import { useMemo, useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import {
  BookMarked,
  BookOpen,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useBooks, useDeleteBook } from './bookHooks';
import {
  bookStatusSchema,
  type Book,
  type BookFilters,
  type BookStatus,
} from './bookSchema';
import { openSavedTarget } from '../platform/nativeFiles';
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
import { BookModal } from './BookModal';

type ScreenFeedback = { tone: 'error' | 'success'; text: string } | null;

const statusVariants: Record<
  BookStatus,
  'lane-a' | 'lane-b' | 'success' | 'danger' | 'neutral'
> = {
  'Quero ler': 'neutral',
  Lendo: 'lane-a',
  Concluído: 'success',
  Pausado: 'lane-b',
  Abandonado: 'danger',
};

function ratingLabel(rating: number | null): string {
  return rating ? `${rating} de 5 estrelas` : 'Sem avaliação';
}

function ProgressBar({ book }: { book: Book }) {
  const pageLabel =
    book.currentPage !== null
      ? book.totalPages !== null
        ? `Página ${book.currentPage} de ${book.totalPages}`
        : `Página ${book.currentPage}`
      : null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-text-muted">{pageLabel ?? 'Progresso'}</span>
        <span className="font-semibold text-lane-a">{book.progressPercent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
        aria-label={`Progresso de ${book.title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={book.progressPercent}
      >
        <div
          className="h-full rounded-full bg-lane-a transition-all"
          style={{ width: `${book.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function BookActions({
  book,
  onEdit,
  onDelete,
  onOpenFile,
  onOpenLink,
}: {
  book: Book;
  onEdit: () => void;
  onDelete: () => void;
  onOpenFile: () => void;
  onOpenLink: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {book.filePath ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenFile}
          title="Abrir arquivo"
          aria-label={`Abrir arquivo de ${book.title}`}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
      {book.link ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenLink}
          title="Abrir link"
          aria-label={`Abrir link de ${book.title}`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        title="Editar"
        aria-label={`Editar ${book.title}`}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        title="Remover do app"
        aria-label={`Remover ${book.title} do app`}
        className="hover:text-danger"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

export default function BooksScreen() {
  const [filters, setFilters] = useState<BookFilters>({ search: '', status: undefined });
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Book | null>(null);
  const [feedback, setFeedback] = useState<ScreenFeedback>(null);

  const { data: allBooks = [], isLoading, isError, error } = useBooks();
  const { data: filteredBooks = [] } = useBooks(filters);
  const deleteMutation = useDeleteBook();

  const readingNow = useMemo(
    () => allBooks.filter((book) => book.status === 'Lendo'),
    [allBooks],
  );
  const summary = useMemo(
    () => ({
      planned: allBooks.filter((book) => book.status === 'Quero ler').length,
      reading: readingNow.length,
      completed: allBooks.filter((book) => book.status === 'Concluído').length,
    }),
    [allBooks, readingNow.length],
  );

  const closeEditor = () => {
    setEditingBook(null);
    setIsCreating(false);
  };

  const handleOpenFile = async (book: Book) => {
    if (!book.filePath) return;
    try {
      setFeedback(null);
      await openSavedTarget(book.filePath, 'file');
    } catch (openError: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(openError, 'Não foi possível abrir o arquivo do livro.'),
      });
    }
  };

  const handleOpenLink = async (book: Book) => {
    if (!book.link) return;
    try {
      setFeedback(null);
      await openUrl(book.link);
    } catch (openError: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(openError, 'Não foi possível abrir o link do livro.'),
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setFeedback(null);
      await deleteMutation.mutateAsync(deleteCandidate.id);
      setFeedback({
        tone: 'success',
        text: `“${deleteCandidate.title}” foi removido somente do Focus Cockpit.`,
      });
      setDeleteCandidate(null);
    } catch (deleteError: unknown) {
      setFeedback({
        tone: 'error',
        text: getErrorMessage(deleteError, 'Não foi possível remover o livro do app.'),
      });
    }
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-[1600px] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">Livros</h2>
          <p className="mt-1 text-xs text-text-muted">
            Sua biblioteca pessoal: o que pretende ler, está lendo e já concluiu.
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo livro
        </Button>
      </div>

      <FeedbackMessage message={feedback?.text} tone={feedback?.tone} className="mb-4" />
      {isError ? (
        <FeedbackMessage
          message={getErrorMessage(error, 'Não foi possível carregar os livros.')}
          className="mb-4"
        />
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-xl border border-lane-a/30 bg-surface p-5 shadow-[0_0_28px_rgba(40,215,240,0.08)]">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-lane-a" aria-hidden="true" />
            <h3 className="font-semibold text-text">Lendo agora</h3>
            <Badge variant="lane-a">{readingNow.length}</Badge>
          </div>
          {readingNow.length ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {readingNow.map((book) => (
                <article
                  key={book.id}
                  className="rounded-lg border border-border bg-surface-soft/60 p-4"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">{book.title}</p>
                      <p className="mt-1 truncate text-sm text-text-muted">
                        {book.author || 'Autor não informado'}
                      </p>
                    </div>
                    <BookActions
                      book={book}
                      onEdit={() => setEditingBook(book)}
                      onDelete={() => setDeleteCandidate(book)}
                      onOpenFile={() => handleOpenFile(book)}
                      onOpenLink={() => handleOpenLink(book)}
                    />
                  </div>
                  <ProgressBar book={book} />
                  {book.notes ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-text-muted">
                      {book.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-10 w-10" />}
              title="Nenhuma leitura em andamento"
              description="Adicione um livro ou altere o status de um item para Lendo."
              action={
                <Button size="sm" onClick={() => setIsCreating(true)}>
                  Adicionar leitura
                </Button>
              }
              className="py-5"
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 xl:grid-cols-1">
          {[
            { label: 'Quero ler', value: summary.planned, tone: 'text-text-muted' },
            { label: 'Lendo', value: summary.reading, tone: 'text-lane-a' },
            { label: 'Concluídos', value: summary.completed, tone: 'text-success' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span className="truncate text-sm text-text-muted">{item.label}</span>
              <strong className={`ml-2 text-2xl ${item.tone}`}>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-text">
            <BookMarked className="h-5 w-5 text-lane-b" aria-hidden="true" />
            Minha biblioteca
          </h3>
          <div className="flex flex-1 flex-wrap justify-end gap-3">
            <div className="relative min-w-64 max-w-sm flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" aria-hidden="true" />
              <Input
                aria-label="Buscar livros"
                placeholder="Buscar por título ou autor..."
                className="pl-9"
                value={filters.search ?? ''}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
            </div>
            <Select
              aria-label="Filtrar livros por status"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status: (event.target.value || undefined) as BookStatus | undefined,
                })
              }
              className="w-44"
            >
              <option value="">Todos os status</option>
              {bookStatusSchema.options.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
            Carregando livros...
          </div>
        ) : filteredBooks.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className="group flex min-h-64 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-soft/30"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant={statusVariants[book.status]}>{book.status}</Badge>
                    <h4 className="mt-3 line-clamp-2 text-base font-semibold text-text">
                      {book.title}
                    </h4>
                    <p className="mt-1 truncate text-sm text-text-muted">
                      {book.author || 'Autor não informado'}
                    </p>
                  </div>
                  <BookActions
                    book={book}
                    onEdit={() => setEditingBook(book)}
                    onDelete={() => setDeleteCandidate(book)}
                    onOpenFile={() => handleOpenFile(book)}
                    onOpenLink={() => handleOpenLink(book)}
                  />
                </div>

                <ProgressBar book={book} />

                {book.notes ? (
                  <p className="mt-4 line-clamp-3 text-xs leading-5 text-text-muted">
                    {book.notes}
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-text-muted/60">Sem anotações.</p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1" title={ratingLabel(book.rating)}>
                    <Star
                      className={`h-4 w-4 ${book.rating ? 'fill-lane-b text-lane-b' : ''}`}
                      aria-hidden="true"
                    />
                    {book.rating ? `${book.rating}/5` : '—'}
                  </span>
                  <span>
                    {book.completedOn
                      ? `Concluído em ${book.completedOn}`
                      : book.startedOn
                        ? `Iniciado em ${book.startedOn}`
                        : 'Sem data'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface">
            <EmptyState
              icon={<BookMarked className="h-12 w-12" />}
              title="Nenhum livro encontrado"
              description="Ajuste os filtros ou adicione o primeiro livro à biblioteca."
              action={
                <Button size="sm" onClick={() => setIsCreating(true)}>
                  Novo livro
                </Button>
              }
            />
          </div>
        )}
      </section>

      {(isCreating || editingBook) ? (
        <BookModal
          key={editingBook?.id ?? 'new'}
          onClose={closeEditor}
          bookToEdit={editingBook}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Remover livro do app"
        description={`“${deleteCandidate?.title ?? ''}” será apagado somente do banco do Focus Cockpit. O arquivo do livro, a pasta original e qualquer conteúdo do computador permanecerão intactos.`}
        confirmLabel="Remover somente do app"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
