import { planCategorySchema, periodIndex, type PlanItem, type PlanCategory } from './planSchema';

interface PlanGridProps {
  items: PlanItem[];
  firstVisibleYear: number;
  totalYears: number;
  onEditItem: (item: PlanItem) => void;
}

export function PlanGrid({ items, firstVisibleYear, totalYears, onEditItem }: PlanGridProps) {
  const categories: PlanCategory[] = planCategorySchema.options;
  
  const years = Array.from({ length: totalYears }, (_, i) => firstVisibleYear + i);
  const totalSemesters = totalYears * 2;

  // Render variables
  const cellWidth = 120;
  const categoryWidth = 180;
  
  return (
    <div className="flex-1 overflow-auto relative">
      <div 
        style={{ 
          minWidth: `${categoryWidth + (totalSemesters * cellWidth)}px` 
        }}
        className="w-full"
      >
        {/* Header - Sticky Top */}
        <div className="sticky top-0 z-20 flex bg-surface-raised border-b border-border shadow-sm">
          {/* Top-Left Corner - Sticky Both */}
          <div 
            className="sticky left-0 z-30 bg-surface-raised border-r border-border flex items-center px-4 font-semibold text-text-muted text-xs uppercase tracking-wider"
            style={{ width: `${categoryWidth}px`, minWidth: `${categoryWidth}px` }}
          >
            Categoria
          </div>
          
          {/* Years Header */}
          <div className="flex">
            {years.map(year => (
              <div 
                key={year} 
                className="flex flex-col border-r border-border last:border-r-0"
                style={{ width: `${cellWidth * 2}px` }}
              >
                <div className="text-center py-2 text-sm font-semibold text-text border-b border-border bg-surface-soft/50">
                  {year}
                </div>
                <div className="flex">
                  <div className="flex-1 text-center py-1.5 text-xs text-text-muted border-r border-border">1º Sem</div>
                  <div className="flex-1 text-center py-1.5 text-xs text-text-muted">2º Sem</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col">
          {categories.map((category) => {
            const categoryItems = items.filter(i => i.category === category);
            
            return (
              <div key={category} className="flex border-b border-border last:border-b-0 min-h-[60px]">
                {/* Row Header - Sticky Left */}
                <div 
                  className="sticky left-0 z-10 bg-surface flex items-center px-4 text-sm font-medium text-text-muted border-r border-border"
                  style={{ width: `${categoryWidth}px`, minWidth: `${categoryWidth}px` }}
                >
                  {category}
                </div>
                
                {/* Row Cells Background Grid */}
                <div className="flex relative" style={{ width: `${totalSemesters * cellWidth}px` }}>
                  {Array.from({ length: totalSemesters }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border-r border-border/30 last:border-r-0 h-full"
                      style={{ width: `${cellWidth}px` }}
                    />
                  ))}
                  
                  {/* Items absolute positioned */}
                  {categoryItems.map(item => {
                    const startIdx = periodIndex(item.startYear, item.startSemester, firstVisibleYear);
                    const endIdx = periodIndex(item.endYear, item.endSemester, firstVisibleYear);
                    
                    // Filter out items that are completely outside the visible window
                    if (endIdx < 0 || startIdx >= totalSemesters) return null;
                    
                    const safeStart = Math.max(0, startIdx);
                    const safeEnd = Math.min(totalSemesters - 1, endIdx);
                    const colSpan = safeEnd - safeStart + 1;
                    
                    const leftPos = safeStart * cellWidth;
                    const width = colSpan * cellWidth;

                    const isDone = item.status === 'Concluído';
                    
                    const defaultColor = item.color || '#28d7f0'; // fallback lane A color

                    return (
                      <div 
                        key={item.id}
                        onClick={() => onEditItem(item)}
                        className={`absolute top-2 bottom-2 rounded-md border border-border/20 shadow-sm cursor-pointer p-2 overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md group`}
                        style={{ 
                          left: `${leftPos + 4}px`, 
                          width: `${width - 8}px`,
                          backgroundColor: isDone ? 'var(--color-surface-soft)' : `${defaultColor}20`,
                          borderColor: isDone ? 'var(--color-border)' : `${defaultColor}60`,
                        }}
                        title={`${item.title}\nStatus: ${item.status}`}
                      >
                        <div 
                          className={`text-xs font-semibold truncate ${isDone ? 'text-text-muted' : ''}`}
                          style={{ color: isDone ? undefined : defaultColor }}
                        >
                          {item.title}
                        </div>
                        {item.status && (
                          <div className="text-[10px] opacity-70 truncate mt-0.5" style={{ color: isDone ? 'var(--color-text-muted)' : defaultColor }}>
                            {item.status}
                          </div>
                        )}
                      </div>
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
