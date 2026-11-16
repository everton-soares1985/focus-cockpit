import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import { ptBR } from 'date-fns/locale';
import {
  Bold,
  CalendarDays,
  Check,
  Eye,
  Heading2,
  Italic,
  List,
  ListChecks,
  PencilLine,
} from 'lucide-react';
import { Button } from '../design-system/components/Button';
import { FeedbackMessage, getErrorMessage } from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Textarea } from '../design-system/components/Textarea';
import { formatJournalHeading, fromJournalDate, toJournalDate } from './journalDate';
import { useJournalEntry, useJournalEntryDates, useSaveJournalEntry } from './journalHooks';
import type { JournalEntry, JournalEntryDraftInput } from './journalSchema';
import { JournalMarkdownPreview } from './JournalMarkdownPreview';

type EditorMode = 'edit' | 'preview';
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 700;

function saveStatusLabel(status: SaveStatus): string {
  if (status === 'pending' || status === 'saving') return 'Salvando...';
  if (status === 'saved') return 'Salvo automaticamente';
  if (status === 'error') return 'Falha ao salvar';
  return 'As alterações são salvas automaticamente';
}

function JournalDayEditor({
  selectedDate,
  initialEntry,
}: {
  selectedDate: Date;
  initialEntry: JournalEntry | null;
}) {
  const selectedDateKey = toJournalDate(selectedDate);
  const [summary, setSummary] = useState(initialEntry?.summary ?? '');
  const [contentMd, setContentMd] = useState(initialEntry?.contentMd ?? '');
  const [mode, setMode] = useState<EditorMode>('edit');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initialEntry ? 'saved' : 'idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pendingDraftRef = useRef<JournalEntryDraftInput | null>(null);
  const saveRevisionRef = useRef(0);
  const mountedRef = useRef(true);
  const { mutateAsync: saveEntry } = useSaveJournalEntry();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistDraft = useCallback(
    async (draft: JournalEntryDraftInput, revision: number) => {
      if (mountedRef.current) {
        setSaveStatus('saving');
        setSaveError(null);
      }
      try {
        await saveEntry(draft);
        if (mountedRef.current && saveRevisionRef.current === revision) {
          setSaveStatus('saved');
          pendingDraftRef.current = null;
        }
      } catch (error: unknown) {
        if (mountedRef.current && saveRevisionRef.current === revision) {
          setSaveStatus('error');
          setSaveError(getErrorMessage(error, 'Não foi possível salvar a anotação deste dia.'));
        }
      }
    },
    [saveEntry],
  );

  const scheduleSave = useCallback(
    (draft: JournalEntryDraftInput) => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      const revision = saveRevisionRef.current + 1;
      saveRevisionRef.current = revision;
      pendingDraftRef.current = draft;
      setSaveStatus('pending');
      setSaveError(null);
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        void persistDraft(draft, revision);
      }, AUTOSAVE_DELAY_MS);
    },
    [persistDraft],
  );

  const flushSave = useCallback(() => {
    if (saveTimerRef.current === null || !pendingDraftRef.current) return;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    void persistDraft(pendingDraftRef.current, saveRevisionRef.current);
  }, [persistDraft]);

  const updateSummary = (value: string) => {
    setSummary(value);
    scheduleSave({ entryDate: selectedDateKey, summary: value, contentMd });
  };

  const updateContent = (value: string) => {
    setContentMd(value);
    scheduleSave({ entryDate: selectedDateKey, summary, contentMd: value });
  };

  const applyMarkdown = (prefix: string, suffix: string, fallback: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? contentMd.length;
    const end = textarea?.selectionEnd ?? contentMd.length;
    const selected = contentMd.slice(start, end) || fallback;
    const next = `${contentMd.slice(0, start)}${prefix}${selected}${suffix}${contentMd.slice(end)}`;
    updateContent(next);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const wordCount = contentMd.trim() ? contentMd.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lane-a">Página do dia</p>
          <h2 className="mt-1 text-lg font-semibold">{formatJournalHeading(selectedDate)}</h2>
        </div>
        <div className="flex rounded-lg border border-border bg-bg p-1">
          <Button size="sm" variant={mode === 'edit' ? 'primary' : 'ghost'} onClick={() => setMode('edit')} aria-pressed={mode === 'edit'}>
            <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
          <Button size="sm" variant={mode === 'preview' ? 'primary' : 'ghost'} onClick={() => { flushSave(); setMode('preview'); }} aria-pressed={mode === 'preview'}>
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
            Visualizar
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <label htmlFor="journal-summary" className="mb-1.5 block text-sm font-medium">Resumo curto</label>
          <Input id="journal-summary" value={summary} maxLength={180} onChange={(event) => updateSummary(event.target.value)} onBlur={flushSave} placeholder="Ex.: Treino para entrevista em inglês" />
        </div>

        {mode === 'edit' ? (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1" aria-label="Formatação Markdown">
                <Button size="icon" variant="ghost" title="Negrito" aria-label="Negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdown('**', '**', 'texto')}><Bold className="h-4 w-4" aria-hidden="true" /></Button>
                <Button size="icon" variant="ghost" title="Itálico" aria-label="Itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdown('_', '_', 'texto')}><Italic className="h-4 w-4" aria-hidden="true" /></Button>
                <Button size="icon" variant="ghost" title="Título" aria-label="Título" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdown('## ', '', 'Título')}><Heading2 className="h-4 w-4" aria-hidden="true" /></Button>
                <Button size="icon" variant="ghost" title="Lista" aria-label="Lista" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdown('- ', '', 'item')}><List className="h-4 w-4" aria-hidden="true" /></Button>
                <Button size="icon" variant="ghost" title="Checklist" aria-label="Checklist" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdown('- [ ] ', '', 'tarefa')}><ListChecks className="h-4 w-4" aria-hidden="true" /></Button>
              </div>
              <span className="text-xs text-text-muted">{wordCount} palavras</span>
            </div>
            <Textarea ref={textareaRef} value={contentMd} maxLength={100000} onChange={(event) => updateContent(event.target.value)} onBlur={flushSave} className="min-h-80 resize-y font-mono leading-6" placeholder={'## O que aconteceu hoje\n\n- Escreva livremente em Markdown...'} aria-label="Anotação Markdown do dia" />
          </div>
        ) : (
          <JournalMarkdownPreview content={contentMd} />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5" role="status">
            {saveStatus === 'saved' ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : null}
            {saveStatusLabel(saveStatus)}
          </span>
          <span>Markdown salvo localmente no SQLite</span>
        </div>
        <FeedbackMessage message={saveError} />
      </div>
    </>
  );
}

export default function JournalScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateKey = toJournalDate(selectedDate);
  const entryQuery = useJournalEntry(selectedDateKey);
  const datesQuery = useJournalEntryDates();
  const datesWithEntries = useMemo(() => (datesQuery.data ?? []).map(fromJournalDate), [datesQuery.data]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-6 pb-8">
      <header>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-lane-a" aria-hidden="true" />
          <h1 className="text-xl font-semibold">Diário</h1>
        </div>
        <p className="mt-1 text-sm text-text-muted">Um registro por dia para anotações, aprendizados e preparações.</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Calendário</h2>
              <p className="text-xs text-text-muted">Ponto azul = dia com anotação</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
          </div>

          <DayPicker animate className="journal-calendar mx-auto" locale={ptBR} mode="single" selected={selectedDate} onSelect={(date) => { if (date) setSelectedDate(date); }} modifiers={{ hasEntry: datesWithEntries }} modifiersClassNames={{ hasEntry: 'journal-calendar-has-entry' }} showOutsideDays />

          {datesQuery.isError ? (
            <FeedbackMessage className="mt-3" message={getErrorMessage(datesQuery.error, 'Não foi possível marcar os dias com anotações.')} />
          ) : null}
        </aside>

        <section className="min-w-0 rounded-xl border border-border bg-surface">
          {entryQuery.isLoading ? (
            <div className="flex min-h-96 items-center justify-center text-sm text-text-muted">Abrindo a página do dia...</div>
          ) : entryQuery.isError ? (
            <div className="p-5"><FeedbackMessage message={getErrorMessage(entryQuery.error, 'Não foi possível abrir a anotação deste dia.')} /></div>
          ) : (
            <JournalDayEditor key={selectedDateKey} selectedDate={selectedDate} initialEntry={entryQuery.data ?? null} />
          )}
        </section>
      </div>
    </div>
  );
}
