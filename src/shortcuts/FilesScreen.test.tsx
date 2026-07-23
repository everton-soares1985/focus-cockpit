import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import FilesScreen from './FilesScreen';

vi.mock('./shortcutHooks', () => ({
  useShortcuts: () => ({
    data: [
      {
        id: 'shortcut-test',
        label: 'Pasta QA',
        targetType: 'folder',
        path: 'C:\\Demo\\Ausente',
        category: 'Projetos',
        notes: 'Exemplo fictício',
        favorite: true,
        sortOrder: 0,
        archived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useArchiveShortcut: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteShortcut: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRestoreShortcut: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateShortcut: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateShortcut: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../platform/savedTargetHooks', () => ({
  useSavedTargetStatus: () => ({
    data: { exists: false, targetTypeMatches: false, blocked: false },
    isLoading: false,
  }),
}));

test('renders the manual locator table and disables an unavailable destination', () => {
  render(<FilesScreen />);

  expect(screen.getByRole('columnheader', { name: 'Caminho' })).toBeDefined();
  expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeDefined();
  expect(screen.getByText('Não encontrado')).toBeDefined();
  expect((screen.getByRole('button', { name: 'Abrir Pasta QA' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Relocalizar Pasta QA' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Copiar caminho de Pasta QA' })).toBeDefined();
});
