import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function toJournalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
export function fromJournalDate(value: string): Date {
  return parseISO(value);
}

export function formatJournalHeading(date: Date): string {
  const heading = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  return heading.charAt(0).toUpperCase() + heading.slice(1);
}
