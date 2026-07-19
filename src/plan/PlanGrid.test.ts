import { describe, expect, test } from 'vitest';
import { layoutPlanItems } from './PlanGrid';
import type { PlanItem } from './planSchema';

function planItem(
  id: string,
  startSemester: 1 | 2,
  endSemester: 1 | 2,
): PlanItem {
  return {
    id,
    title: id,
    category: 'Cursos',
    startYear: 2026,
    startSemester,
    endYear: 2026,
    endSemester,
    status: 'Planejado',
    color: null,
    notes: null,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('layoutPlanItems', () => {
  test('places overlapping items on separate tracks', () => {
    const layout = layoutPlanItems(
      [planItem('long', 1, 2), planItem('overlap', 2, 2)],
      2026,
      4,
    );

    expect(layout.map((entry) => entry.track)).toEqual([0, 1]);
  });

  test('reuses a track when periods no longer overlap', () => {
    const layout = layoutPlanItems(
      [planItem('first', 1, 1), planItem('second', 2, 2)],
      2026,
      4,
    );

    expect(layout.map((entry) => entry.track)).toEqual([0, 0]);
  });
});
