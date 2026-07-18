import { NavLink } from 'react-router-dom';

const tabs = [
  { path: '/focus', label: 'Foco' },
  { path: '/plan', label: 'Plano' },
  { path: '/projects', label: 'Projetos' },
  { path: '/courses', label: 'Cursos' },
  { path: '/credentials', label: 'Diplomas' },
  { path: '/files', label: 'Arquivos' },
];

export default function WorkbookTabs() {
  return (
    <nav className="flex h-14 border-t border-border bg-surface">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-1 items-center justify-center border-t-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-lane-a text-text bg-surface-raised'
                : 'border-transparent text-text-muted hover:bg-surface-soft hover:text-text'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
