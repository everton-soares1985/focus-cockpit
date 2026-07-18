import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppHeader from './AppHeader';
import WorkbookTabs from './WorkbookTabs';
import { getDb } from '../database/db';
import { runDemoSeed } from '../database/seed';

export default function AppShell() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: isInitialized, isLoading } = useQuery({
    queryKey: ['db-init'],
    queryFn: async () => {
      const db = await getDb();
      const result = await db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM projects');
      return result[0].count > 0;
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const db = await getDb();
      await runDemoSeed(db);
      localStorage.setItem('has_seen_onboarding', 'true');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-init'] });
    }
  });

  const startEmptyMutation = useMutation({
    mutationFn: async () => {
       localStorage.setItem('has_seen_onboarding', 'true');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-init'] });
    }
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-bg text-text">Carregando Banco de Dados...</div>;
  }

  const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding') === 'true';
  const showOnboarding = !isInitialized && !hasSeenOnboarding;

  if (showOnboarding) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg text-text">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-lg text-center">
          <h2 className="mb-2 text-xl font-semibold text-text">Bem-vindo ao Focus Cockpit</h2>
          <p className="mb-8 text-sm text-text-muted">Como você deseja iniciar seu painel?</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => startEmptyMutation.mutate()}
              className="rounded bg-surface-raised px-4 py-3 font-medium text-text transition-colors hover:bg-surface-soft border border-border-strong cursor-pointer"
            >
              Começar Vazio
            </button>
            <button
              onClick={() => seedMutation.mutate()}
              className="rounded bg-lane-b px-4 py-3 font-medium text-bg transition-colors hover:opacity-90 cursor-pointer"
            >
              Carregar Demonstração
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (location.pathname === '/') {
    return <Navigate to="/focus" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <WorkbookTabs />
    </div>
  );
}
