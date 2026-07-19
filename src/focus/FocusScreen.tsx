import { FocusCard } from './FocusCard';
import { WeeklyPriorityBlock } from './WeeklyPriorityBlock';
import { FavoriteShortcutsBlock } from './FavoriteShortcutsBlock';

export default function FocusScreen() {
  return (
    <div className="flex h-full flex-col p-6 overflow-y-auto">
      <h2 className="mb-6 text-xl font-semibold text-text tracking-tight">Seu foco agora</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <FocusCard lane="A" />
        <FocusCard lane="B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeeklyPriorityBlock />
        <FavoriteShortcutsBlock />
      </div>
    </div>
  );
}
