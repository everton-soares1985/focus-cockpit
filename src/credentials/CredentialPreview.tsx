import { useState, useEffect } from 'react';
import { readCredentialBytes } from '../platform/credentials';

export function CredentialPreview({ path, mimeType, isThumbnail = false }: { path: string; mimeType: string; isThumbnail?: boolean }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

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
      } catch (e) {
        console.error('Failed to load credential preview', e);
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

  if (!objectUrl) {
    return <div className="w-full h-full bg-surface-raised flex items-center justify-center animate-pulse rounded-t-xl" />;
  }

  return (
    <img 
      src={objectUrl} 
      alt="Preview" 
      className={`w-full h-full object-cover rounded-t-xl ${isThumbnail ? 'opacity-90 transition-opacity group-hover:opacity-100' : ''}`}
      draggable={false}
    />
  );
}
