import { useState, useEffect } from 'react';
import { readCredentialBytes } from '../platform/credentials';

export function CredentialPreview({
  path,
  mimeType,
  title,
  isThumbnail = false,
}: {
  path: string;
  mimeType: string;
  title: string;
  isThumbnail?: boolean;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let isMounted = true;

    async function load() {
      try {
        const bytes = await readCredentialBytes(path);
        if (!isMounted) return;
        const blob = new Blob([bytes], { type: mimeType });
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch {
        if (isMounted) setHasError(true);
      }
    }

    if (path) {
      load();
    }

    return () => {
      isMounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [path, mimeType]);

  if (hasError) {
    return <div className="flex h-full w-full items-center justify-center bg-surface-raised px-4 text-center text-xs text-text-muted">Prévia indisponível</div>;
  }

  if (!objectUrl) {
    return <div className="w-full h-full bg-surface-raised flex items-center justify-center animate-pulse rounded-t-xl" />;
  }

  return (
    <img 
      src={objectUrl} 
      alt={`Prévia de ${title}`}
      className={`w-full h-full object-cover rounded-t-xl ${isThumbnail ? 'opacity-90 transition-opacity group-hover:opacity-100' : ''}`}
      draggable={false}
    />
  );
}
