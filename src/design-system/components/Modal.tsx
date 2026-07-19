import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        e.preventDefault();
        modalRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (isOpen) {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      const focusFrame = requestAnimationFrame(() => {
        const firstInput = modalRef.current?.querySelector<HTMLElement>(
          '[autofocus], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])',
        );
        (firstInput ?? modalRef.current)?.focus();
      });

      return () => {
        cancelAnimationFrame(focusFrame);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previouslyFocused?.focus();
      };
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className={cn(
          "w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 id={titleId} className="text-lg font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-soft hover:text-text transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
