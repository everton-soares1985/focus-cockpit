import {
  periodIndex,
  planCategorySchema,
  type PlanCategory,
  type PlanItem,
} from './planSchema';

interface PlanGridProps {
  items: PlanItem[];
  firstVisibleYear: number;
  totalYears: number;
  onEditItem: (item: PlanItem) => void;
}

export interface PositionedPlanItem {
  item: PlanItem;
  startIndex: number;
  endIndex: number;
  track: number;
}

export function layoutPlanItems(
  items: PlanItem[],
  firstVisibleYear: number,
  totalSemesters: number,
): PositionedPlanItem[] {
  const visible = items
    .map((item) => ({
      item,
      startIndex: Math.max(0, periodIndex(item.startYear, item.startSemester, firstVisibleYear)),
      endIndex: Math.min(
        totalSemesters - 1,
        periodIndex(item.endYear, item.endSemester, firstVisibleYear),
      ),
    }))
    .filter(({ item }) => {
      const rawStart = periodIndex(item.startYear, item.startSemester, firstVisibleYear);
      const rawEnd = periodIndex(item.endYear, item.endSemester, firstVisibleYear);
      return rawEnd >= 0 && rawStart < totalSemesters;
    })
    .sort((left, right) => left.startIndex - right.startIndex || left.endIndex - right.endIndex || left.item.sortOrder - right.item.sortOrder);

  const trackEnds: number[] = [];
  return visible.map((positioned) => {
    let track = trackEnds.findIndex((endIndex) => positioned.startIndex > endIndex);
    if (track === -1) track = trackEnds.length;
    trackEnds[track] = positioned.endIndex;
    return { ...positioned, track };
  });
}

export function PlanGrid({ items, firstVisibleYear, totalYears, onEditItem }: PlanGridProps) {
  const categories: PlanCategory[] = planCategorySchema.options;
  const years = Array.from({ length: totalYears }, (_, index) => firstVisibleYear + index);
  const totalSemesters = totalYears * 2;
  const cellWidth = 150;
  const categoryWidth = 180;
  const trackHeight = 72;

  return (
    <div className="relative flex-1 overflow-auto">
      <div
        style={{ minWidth: `${categoryWidth + totalSemesters * cellWidth}px` }}
        className="w-full"
      >
        <div className="sticky top-0 z-20 flex border-b border-border bg-surface-raised shadow-sm">
          <div
            className="sticky left-0 z-30 flex items-center border-r border-border bg-surface-raised px-4 text-xs font-semibold uppercase tracking-wider text-text-muted"
            style={{ width: categoryWidth, minWidth: categoryWidth }}
          >
            Categoria
          </div>
          <div className="flex">
            {years.map((year) => (
              <div key={year} className="flex flex-col border-r border-border last:border-r-0" style={{ width: cellWidth * 2 }}>
                <div className="border-b border-border bg-surface-soft/50 py-2 text-center text-sm font-semibold text-text">{year}</div>
                <div className="flex">
                  <div className="flex-1 border-r border-border py-1.5 text-center text-xs text-text-muted">1º sem.</div>
                  <div className="flex-1 py-1.5 text-center text-xs text-text-muted">2º sem.</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          {categories.map((category) => {
            const positionedItems = layoutPlanItems(
              items.filter((item) => item.category === category),
              firstVisibleYear,
              totalSemesters,
            );
            const trackCount = Math.max(1, ...positionedItems.map((item) => item.track + 1));
            const rowHeight = Math.max(82, trackCount * trackHeight + 10);

            return (
              <div key={category} className="flex border-b border-border last:border-b-0" style={{ minHeight: rowHeight }}>
                <div
                  className="sticky left-0 z-10 flex items-center border-r border-border bg-surface px-4 text-sm font-medium text-text-muted"
                  style={{ width: categoryWidth, minWidth: categoryWidth }}
                >
                  {category}
                </div>

                <div className="relative flex" style={{ width: totalSemesters * cellWidth }}>
                  {Array.from({ length: totalSemesters }).map((_, index) => (
                    <div key={index} className="h-full border-r border-border/30 last:border-r-0" style={{ width: cellWidth }} />
                  ))}

                  {positionedItems.map(({ item, startIndex, endIndex, track }) => {
                    const width = (endIndex - startIndex + 1) * cellWidth;
                    const isDone = item.status === 'Concluído';
                    const color = item.color || '#28d7f0';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="group/item absolute overflow-visible rounded-md border p-2.5 text-left shadow-sm transition-transform hover:z-20 hover:-translate-y-0.5 hover:shadow-md focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lane-a"
                        style={{
                          left: startIndex * cellWidth + 4,
                          top: track * trackHeight + 4,
                          width: width - 8,
                          height: trackHeight - 10,
                          backgroundColor: isDone ? 'var(--color-surface-soft)' : `${color}20`,
                          borderColor: isDone ? 'var(--color-border)' : `${color}60`,
                        }}
                        title={`${item.title}\nStatus: ${item.status}`}
                      >
                        <span className={`block line-clamp-2 break-words text-xs font-semibold leading-tight ${isDone ? 'text-text-muted' : ''}`} style={{ color: isDone ? undefined : color }}>
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] opacity-70" style={{ color: isDone ? 'var(--color-text-muted)' : color }}>
                          {item.status}
                        </span>
                        <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-max max-w-80 whitespace-normal rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-xs leading-5 text-text shadow-xl group-hover/item:block group-focus-visible/item:block">
                          {item.title} · {item.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
