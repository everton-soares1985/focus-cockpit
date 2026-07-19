import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { inspectSavedTarget } from '../platform/nativeFiles';
import { useCreateShortcut, useUpdateShortcut } from './shortcutHooks';
import {
  shortcutTargetTypeSchema,
  type Shortcut,
  type ShortcutDraftInput,
} from './shortcutSchema';
import { Button } from '../design-system/components/Button';
import { Checkbox } from '../design-system/components/Checkbox';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';
import { Input } from '../design-system/components/Input';
import { Modal } from '../design-system/components/Modal';
import { Select } from '../design-system/components/Select';
import { Textarea } from '../design-system/components/Textarea';

export const shortcutCategories = [
  'Favoritos',
  'Carreira e portfólio',
  'Estudos',
  'Projetos',
  'Documentos',
  'Pessoal',
] as const;

function initialShortcutDraft(shortcut: Shortcut | null): ShortcutDraftInput {
  if (!shortcut) {
    return {
      label: '',
      targetType: 'folder',
      path: '',
      category: '',
      notes: '',
      favorite: false,
      sortOrder: 0,
    };
  }
  return {
    label: shortcut.label,
    targetType: shortcut.targetType,
    path: shortcut.path,
    category: shortcut.category ?? '',
    notes: shortcut.notes ?? '',
    favorite: shortcut.favorite,
    sortOrder: shortcut.sortOrder,
  };
}

export function ShortcutModal({
  onClose,
  shortcutToEdit,
}: {
  onClose: () => void;
  shortcutToEdit: Shortcut | null;
}) {
  const isEditing = Boolean(shortcutToEdit);
  const createMutation = useCreateShortcut();
  const updateMutation = useUpdateShortcut();
  const [formData, setFormData] = useState<ShortcutDraftInput>(() =>
    initialShortcutDraft(shortcutToEdit),
  );
  const [error, setError] = useState<string | null>(null);

  const handleBrowse = async () => {
    try {
      setError(null);
      const selected = await open({
        directory: formData.targetType === 'folder',
        multiple: false,
      });
      if (selected && !Array.isArray(selected)) {
        setFormData((current) => ({ ...current, path: selected }));
      }
    } catch (selectionError: unknown) {
      setError(getErrorMessage(selectionError, 'Não foi possível selecionar o destino.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      const status = await inspectSavedTarget(formData.path, formData.targetType);
      if (status.blocked) {
        setError('Esse tipo de arquivo é bloqueado por segurança.');
        return;
      }
      if (status.exists && !status.targetTypeMatches) {
        setError(`O caminho selecionado não aponta para ${formData.targetType === 'folder' ? 'uma pasta' : 'um arquivo'}.`);
        return;
      }
      if (shortcutToEdit) {
        await updateMutation.mutateAsync({ id: shortcutToEdit.id, input: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Não foi possível salvar o atalho.'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Editar atalho' : 'Novo atalho'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shortcut-type" className="mb-1.5 block text-sm font-medium text-text-muted">Tipo</label>
            <Select
              id="shortcut-type"
              value={formData.targetType}
              onChange={(event) => setFormData({
                ...formData,
                targetType: event.target.value as ShortcutDraftInput['targetType'],
                path: '',
              })}
            >
              {shortcutTargetTypeSchema.options.map((option) => (
                <option key={option} value={option}>{option === 'folder' ? 'Pasta' : 'Arquivo'}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="shortcut-label" className="mb-1.5 block text-sm font-medium text-text-muted">Nome</label>
            <Input
              id="shortcut-label"
              value={formData.label}
              onChange={(event) => setFormData({ ...formData, label: event.target.value })}
              required
              autoFocus
              maxLength={120}
            />
          </div>
        </div>

        <div>
          <label htmlFor="shortcut-path" className="mb-1.5 block text-sm font-medium text-text-muted">Caminho</label>
          <div className="flex gap-2">
            <Input
              id="shortcut-path"
              value={formData.path}
              onChange={(event) => setFormData({ ...formData, path: event.target.value })}
              required
              maxLength={2048}
              className="flex-1"
              placeholder={formData.targetType === 'folder' ? 'C:\\Pastas\\...' : 'C:\\Arquivo.pdf'}
            />
            <Button type="button" variant="secondary" onClick={handleBrowse}>Selecionar</Button>
          </div>
          <p className="mt-1 text-xs text-text-muted">O app apenas guarda o caminho; não move nem copia o item original.</p>
        </div>

        <div>
          <label htmlFor="shortcut-category" className="mb-1.5 block text-sm font-medium text-text-muted">Categoria</label>
          <Input
            id="shortcut-category"
            list="shortcut-category-options"
            value={formData.category ?? ''}
            onChange={(event) => setFormData({ ...formData, category: event.target.value })}
            placeholder="Escolha ou escreva uma categoria"
            maxLength={80}
          />
          <datalist id="shortcut-category-options">
            {shortcutCategories.map((category) => <option key={category} value={category} />)}
          </datalist>
        </div>

        <div>
          <label htmlFor="shortcut-notes" className="mb-1.5 block text-sm font-medium text-text-muted">Observação</label>
          <Textarea
            id="shortcut-notes"
            value={formData.notes ?? ''}
            onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
            rows={2}
            maxLength={1000}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <Checkbox
            checked={formData.favorite ?? false}
            onChange={(event) => setFormData({ ...formData, favorite: event.target.checked })}
          />
          Mostrar nos atalhos rápidos da aba Foco
        </label>

        <FeedbackMessage message={error} />
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : 'Criar atalho'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
