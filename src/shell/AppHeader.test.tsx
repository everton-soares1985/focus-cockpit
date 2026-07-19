import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppHeader from './AppHeader';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

test('renders AppHeader correctly', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <AppHeader />
    </QueryClientProvider>
  );
  const headerText = screen.getByText(/Focus Cockpit/i);
  expect(headerText).toBeDefined();
});
