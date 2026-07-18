import { render, screen, waitFor } from '@testing-library/react';
import { test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './AppShell';

vi.mock('../database/db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockResolvedValue([{ count: 0 }]),
    execute: vi.fn(),
  }),
}));

vi.mock('../database/seed', () => ({
  runDemoSeed: vi.fn().mockResolvedValue(true),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

beforeEach(() => {
  localStorage.clear();
  queryClient.clear();
});

test('shows onboarding when db is empty and no localstorage flag', async () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    </QueryClientProvider>
  );

  // Wait for React Query to load
  await waitFor(() => {
    expect(screen.getByText('Bem-vindo ao Focus Cockpit')).toBeDefined();
  });

  const emptyBtn = screen.getByText('Começar Vazio');
  const demoBtn = screen.getByText('Carregar Demonstração');

  expect(emptyBtn).toBeDefined();
  expect(demoBtn).toBeDefined();
});

test('navigates correctly and bypasses onboarding if seen', async () => {
  localStorage.setItem('has_seen_onboarding', 'true');
  
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/focus']}>
        <AppShell />
      </MemoryRouter>
    </QueryClientProvider>
  );

  // Shell should render the header instead of the welcome screen
  await waitFor(() => {
    expect(screen.getByText('Focus Cockpit')).toBeDefined();
  });
});
