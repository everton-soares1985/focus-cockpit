import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import AppHeader from './AppHeader';

test('renders AppHeader correctly', () => {
  render(<AppHeader />);
  const headerText = screen.getByText('Focus Cockpit');
  expect(headerText).toBeDefined();
});
