import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  busyLabel = 'Processando...',
  tone = 'danger',
  isPending = false,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busyLabel?: string;
  tone?: 'primary' | 'danger';
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} className="max-w-md">
      <p className="text-sm leading-6 text-text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant={tone} onClick={onConfirm} disabled={isPending} autoFocus>
          {isPending ? busyLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
