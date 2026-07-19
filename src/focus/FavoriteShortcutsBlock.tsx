import { Bookmark, ExternalLink } from 'lucide-react';
import { useFavoriteShortcuts } from '../shortcuts/shortcutHooks';
import { openSavedTarget } from '../platform/nativeFiles';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { EmptyState } from '../design-system/components/EmptyState';
import type { Shortcut } from '../shortcuts/shortcutSchema';
import { useSavedTargetStatus } from '../platform/savedTargetHooks';
import {
  isTargetAvailable,
  ShortcutTargetStatus,
} from '../shortcuts/ShortcutTargetStatus';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { useState } from 'react';

function FavoriteShortcutCard({ shortcut }: { shortcut: Shortcut }) {
  const targetStatus = useSavedTargetStatus(shortcut.path, shortcut.targetType);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    try {
      setError(null);
      await openSavedTarget(shortcut.path, shortcut.targetType);
    } catch (openError: unknown) {
      setError(getErrorMessage(openError, 'Não foi possível abrir o atalho.'));
    }
  };

  return (
    <div className="group rounded-lg border border-border bg-surface-raised p-3 transition-colors hover:border-border-strong focus-within:border-border-strong">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate text-sm font-medium text-text">{shortcut.label}</p>
            {shortcut.category && (
              <Badge className="py-0 text-[10px]">{shortcut.category}</Badge>
            )}
          </div>
          <p className="truncate font-mono text-xs text-text-muted" title={shortcut.path}>
            {shortcut.path}
          </p>
        </div>
        <ShortcutTargetStatus
          status={targetStatus.data}
          isLoading={targetStatus.isLoading}
        />
        <Button
          variant="secondary"
          size="icon"
          onClick={handleOpen}
          disabled={!isTargetAvailable(targetStatus.data)}
          className="h-8 w-8 shrink-0"
          aria-label={`Abrir ${shortcut.label}`}
          title={`Abrir ${shortcut.label}`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <FeedbackMessage message={error} className="mt-2" />
    </div>
  );
}

export function FavoriteShortcutsBlock() {
  const { data: favorites, isLoading } = useFavoriteShortcuts();

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 h-full">
      <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-lane-a" /> Atalhos Rápidos
      </h3>
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-14 bg-surface-raised rounded w-full"></div>
          <div className="h-14 bg-surface-raised rounded w-full"></div>
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 content-start">
          {favorites.slice(0, 3).map((shortcut) => (
            <FavoriteShortcutCard key={shortcut.id} shortcut={shortcut} />
          ))}
          {favorites.length > 3 && (
            <p className="text-xs text-text-muted text-center mt-2">
              Mostrando 3 de {favorites.length} favoritos. Acesse a aba Arquivos para ver todos.
            </p>
          )}
        </div>
      ) : (
        <EmptyState 
          icon={<Bookmark className="h-8 w-8" />}
          title="Nenhum atalho favorito"
          description="Você pode adicionar atalhos para pastas e arquivos importantes na aba Arquivos e marcá-los como favoritos."
          className="p-4"
        />
      )}
    </div>
  );
}
