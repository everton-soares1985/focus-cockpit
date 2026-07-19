import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../app/queryKeys';
import type { ShortcutTargetType } from '../shortcuts/shortcutSchema';
import { inspectSavedTarget } from './nativeFiles';

export function useSavedTargetStatus(
  path: string | null | undefined,
  targetType: ShortcutTargetType,
) {
  return useQuery({
    queryKey: [...queryKeys.savedTargets, path, targetType],
    queryFn: () => inspectSavedTarget(path ?? '', targetType),
    enabled: Boolean(path),
    staleTime: 30_000,
    retry: false,
  });
}
