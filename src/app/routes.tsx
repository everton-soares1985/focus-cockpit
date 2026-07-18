import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../shell/AppShell';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex h-full items-center justify-center text-text-muted">
    {title}
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'focus',
        element: <Placeholder title="Focus Cockpit Screen" />,
      },
      {
        path: 'plan',
        element: <Placeholder title="Plan Screen" />,
      },
      {
        path: 'projects',
        element: <Placeholder title="Projects Screen" />,
      },
      {
        path: 'courses',
        element: <Placeholder title="Courses Screen" />,
      },
      {
        path: 'credentials',
        element: <Placeholder title="Credentials Screen" />,
      },
      {
        path: 'files',
        element: <Placeholder title="Files Screen" />,
      },
    ],
  },
]);
