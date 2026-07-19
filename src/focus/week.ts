export function getWeekStart(date = new Date()): string {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = localDate.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  localDate.setDate(localDate.getDate() - daysSinceMonday);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const calendarDay = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${calendarDay}`;
}
