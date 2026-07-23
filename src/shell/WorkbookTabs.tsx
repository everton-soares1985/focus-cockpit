import {
  Award,
  BookOpen,
  FileText,
  FolderOpen,
  GraduationCap,
  ListChecks,
  Target,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { path: '/focus', label: 'Foco', icon: Target },
  { path: '/plan', label: 'Plano', icon: ListChecks },
  { path: '/projects', label: 'Projetos', icon: FolderOpen },
  { path: '/courses', label: 'Cursos', icon: GraduationCap },
  { path: '/books', label: 'Livros', icon: BookOpen },
  { path: '/credentials', label: 'Diplomas', icon: Award },
  { path: '/files', label: 'Arquivos', icon: FileText },
];

export default function WorkbookTabs() {
  return (
    <div className="shrink-0 bg-bg px-5 pb-4 pt-2">
      <nav
        className="mx-auto flex h-14 max-w-6xl gap-1 rounded-full border border-border bg-surface p-1.5 shadow-xl"
        aria-label="Navegação principal"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lane-a ${
                  isActive
                    ? 'bg-lane-a text-bg shadow-[0_0_20px_rgba(40,215,240,0.22)]'
                    : 'text-text-muted hover:bg-surface-soft hover:text-text'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
