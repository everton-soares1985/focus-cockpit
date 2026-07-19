import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Modal } from './Modal';

test('closes with Escape and exposes an accessible Portuguese close button', () => {
  const onClose = vi.fn();
  render(
    <Modal isOpen onClose={onClose} title="Editar registro">
      <input aria-label="Nome" autoFocus />
    </Modal>,
  );

  expect(screen.getByRole('dialog', { name: 'Editar registro' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Fechar' })).toBeDefined();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});
