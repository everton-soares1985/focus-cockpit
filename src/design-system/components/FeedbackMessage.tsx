import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type FeedbackTone = 'error' | 'success' | 'info';

function friendlyErrorMessage(message: string): string {
  if (/database is locked|database is busy|SQLITE_BUSY|code:\s*5/i.test(message)) {
    return 'O banco local estava ocupado. O Focus Cockpit tentou novamente, mas não conseguiu concluir. Feche uma eventual segunda janela do app e tente de novo.';
  }
  return message;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      message?: unknown;
      issues?: Array<{ message?: unknown }>;
    };
    const issueMessage = candidate.issues?.find(
      (issue) => typeof issue.message === 'string',
    )?.message;
    if (typeof issueMessage === 'string' && issueMessage.trim()) {
      return friendlyErrorMessage(issueMessage);
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return friendlyErrorMessage(candidate.message);
    }
  }
  if (typeof error === 'string' && error.trim()) {
    return friendlyErrorMessage(error);
  }
  return fallback;
}

const toneClasses: Record<FeedbackTone, string> = {
  error: 'border-danger/30 bg-danger/10 text-danger',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-border-strong bg-surface-soft text-text-muted',
};

export function FeedbackMessage({
  message,
  tone = 'error',
  className = '',
}: {
  message?: string | null;
  tone?: FeedbackTone;
  className?: string;
}) {
  if (!message) return null;

  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${toneClasses[tone]} ${className}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
