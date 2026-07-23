import { FocusCard } from './FocusCard';
import { WeeklyPriorityBlock } from './WeeklyPriorityBlock';
import { FavoriteShortcutsBlock } from './FavoriteShortcutsBlock';

export default function FocusScreen() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-text">Agenda de foco</h2>
        <p className="mt-1 text-xs text-text-muted">O que importa agora e o que continua evoluindo em paralelo.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <FocusCard lane="A" mode="now" />
        <FocusCard lane="B" mode="parallel" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <WeeklyPriorityBlock />
        <FavoriteShortcutsBlock />
      </div>
    </div>
  );
}
