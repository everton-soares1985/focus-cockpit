import { Bookmark, ExternalLink } from 'lucide-react';
import { useFavoriteShortcuts } from '../shortcuts/shortcutHooks';
import { openSavedTarget } from '../platform/nativeFiles';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { EmptyState } from '../design-system/components/EmptyState';
import type { Shortcut } from '../shortcuts/shortcutSchema';

export function FavoriteShortcutsBlock() {
  const { data: favorites, isLoading } = useFavoriteShortcuts();

  const handleOpen = async (shortcut: Shortcut) => {
    try {
      await openSavedTarget(shortcut.path, shortcut.targetType);
    } catch (e: any) {
      alert(`Erro ao abrir: ${e.message}`);
    }
  };

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
            <div 
              key={shortcut.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-raised hover:border-border-strong transition-colors group"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-text truncate">{shortcut.label}</p>
                  {shortcut.category && (
                    <Badge className="text-[10px] py-0">{shortcut.category}</Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted truncate font-mono">{shortcut.path}</p>
              </div>
              <Button variant="secondary" size="icon" onClick={() => handleOpen(shortcut)} className="shrink-0 h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
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
