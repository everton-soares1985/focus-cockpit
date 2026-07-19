import type { SavedTargetStatus } from '../platform/nativeFiles';
import { Badge } from '../design-system/components/Badge';

export function isTargetAvailable(status?: SavedTargetStatus): boolean {
  return Boolean(status?.exists && status.targetTypeMatches && !status.blocked);
}

export function ShortcutTargetStatus({
  status,
  isLoading,
}: {
  status?: SavedTargetStatus;
  isLoading?: boolean;
}) {
  if (isLoading) return <Badge variant="neutral">Verificando</Badge>;
  if (!status?.exists) return <Badge variant="danger">Não encontrado</Badge>;
  if (status.blocked) return <Badge variant="danger">Bloqueado</Badge>;
  if (!status.targetTypeMatches) return <Badge variant="danger">Tipo divergente</Badge>;
  return <Badge variant="success">Disponível</Badge>;
}
