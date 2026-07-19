import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useCreateShortcut, useUpdateShortcut } from './shortcutHooks';
import { shortcutTargetTypeSchema, type Shortcut, type ShortcutDraftInput } from './shortcutSchema';
import { Button } from '../design-system/components/Button';
import { Modal } from '../design-system/components/Modal';
import { Input } from '../design-system/components/Input';
import { Select } from '../design-system/components/Select';
import { Checkbox } from '../design-system/components/Checkbox';
import { Textarea } from '../design-system/components/Textarea';

export function ShortcutModal({
  isOpen,
  onClose,
  shortcutToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  shortcutToEdit: Shortcut | null;
}) {
  const isEditing = !!shortcutToEdit;

  const createMutation = useCreateShortcut();
  const updateMutation = useUpdateShortcut();

  const [formData, setFormData] = useState<ShortcutDraftInput>({
    label: '',
    targetType: 'folder',
    path: '',
    category: '',
    notes: '',
    favorite: false,
    sortOrder: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (shortcutToEdit) {
        setFormData({
          label: shortcutToEdit.label,
          targetType: shortcutToEdit.targetType,
          path: shortcutToEdit.path,
          category: shortcutToEdit.category || '',
          notes: shortcutToEdit.notes || '',
          favorite: shortcutToEdit.favorite,
          sortOrder: shortcutToEdit.sortOrder,
        });
      } else {
        setFormData({
          label: '',
          targetType: 'folder',
          path: '',
          category: '',
          notes: '',
          favorite: false,
          sortOrder: 0,
        });
      }
    }
  }, [isOpen, shortcutToEdit]);

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: formData.targetType === 'folder',
        multiple: false,
      });
      if (selected && !Array.isArray(selected)) {
        setFormData({ ...formData, path: selected as string });
      }
    } catch (e: any) {
      alert(`Erro ao selecionar: ${e.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category: formData.category?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: shortcutToEdit.id, input: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      onClose();
    } catch (error: any) {
      alert(`Erro ao salvar atalho: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Atalho' : 'Novo Atalho'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Tipo do Atalho</label>
            <Select 
              value={formData.targetType} 
              onChange={e => setFormData({ ...formData, targetType: e.target.value as any, path: '' })} // clear path when type changes
            >
              {shortcutTargetTypeSchema.options.map(opt => <option key={opt} value={opt}>{opt === 'folder' ? 'Pasta' : 'Arquivo'}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Nome do Atalho</label>
            <Input 
              value={formData.label} 
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              required
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Caminho / Path</label>
          <div className="flex gap-2">
            <Input 
              value={formData.path} 
              onChange={e => setFormData({ ...formData, path: e.target.value })}
              required
              className="flex-1"
              placeholder={formData.targetType === 'folder' ? 'C:\\Pastas...' : 'C:\\Arquivo.pdf'}
            />
            <Button type="button" variant="secondary" onClick={handleBrowse}>Buscar</Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Categoria (Opcional)</label>
          <Input 
            value={formData.category || ''} 
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            placeholder="Ex: Projetos de Clientes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Anotações</label>
          <Textarea 
            value={formData.notes || ''} 
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox 
            checked={formData.favorite}
            onChange={e => setFormData({ ...formData, favorite: e.target.checked })}
            id="fav-checkbox"
          />
          <label htmlFor="fav-checkbox" className="text-sm text-text cursor-pointer">
            Marcar como Favorito (aparece no Focus Cockpit)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Salvar Alterações' : 'Criar Atalho'}
          </Button>
        </div>
        
      </form>
    </Modal>
  );
}
