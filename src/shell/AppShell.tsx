import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppHeader from './AppHeader';
import WorkbookTabs from './WorkbookTabs';
import { getDb } from '../database/db';
import { runDemoSeed } from '../database/seed';
import { Button } from '../design-system/components/Button';
import {
  FeedbackMessage,
  getErrorMessage,
} from '../design-system/components/FeedbackMessage';

export default function AppShell() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const {
    data: isInitialized,
    isLoading,
    isError,
    error: initializationError,
    refetch,
  } = useQuery({
    queryKey: ['db-init'],
    queryFn: async () => {
      const db = await getDb();
      const result = await db.select<{ initialized: number }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM projects
           UNION ALL SELECT 1 FROM weekly_priorities
           UNION ALL SELECT 1 FROM plan_items
           UNION ALL SELECT 1 FROM plan_notes
           UNION ALL SELECT 1 FROM courses
           UNION ALL SELECT 1 FROM books
           UNION ALL SELECT 1 FROM credentials
           UNION ALL SELECT 1 FROM shortcuts
         ) AS initialized`,
      );
      return result[0]?.initialized === 1;
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
    return <div className="flex h-screen items-center justify-center bg-bg text-text">Preparando seu painel...</div>;
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg p-6 text-text">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">O painel não pôde ser iniciado</h2>
          <FeedbackMessage
            message={getErrorMessage(
              initializationError,
              'O banco local não respondeu. Feche e abra o aplicativo novamente.',
            )}
          />
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
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
            <FeedbackMessage
              message={
                seedMutation.error
                  ? getErrorMessage(seedMutation.error, 'Não foi possível carregar a demonstração.')
                  : startEmptyMutation.error
                    ? getErrorMessage(startEmptyMutation.error, 'Não foi possível iniciar o painel vazio.')
                    : null
              }
            />
            <Button
              variant="secondary"
              size="lg"
              onClick={() => startEmptyMutation.mutate()}
              disabled={seedMutation.isPending || startEmptyMutation.isPending}
              className="w-full"
            >
              Começar Vazio
            </Button>
            <Button
              size="lg"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending || startEmptyMutation.isPending}
              className="w-full border-lane-b/50 text-lane-b"
            >
              {seedMutation.isPending ? 'Carregando demonstração...' : 'Carregar Demonstração'}
            </Button>
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
