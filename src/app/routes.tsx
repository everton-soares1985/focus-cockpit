import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../shell/AppShell';

import FocusScreen from '../focus/FocusScreen';
import PlanScreen from '../plan/PlanScreen';
import ProjectsScreen from '../projects/ProjectsScreen';
import CoursesScreen from '../courses/CoursesScreen';
import BooksScreen from '../books/BooksScreen';
import CredentialsScreen from '../credentials/CredentialsScreen';
import FilesScreen from '../shortcuts/FilesScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'focus',
        element: <FocusScreen />,
      },
      {
        path: 'plan',
        element: <PlanScreen />,
      },
      {
        path: 'projects',
        element: <ProjectsScreen />,
      },
      {
        path: 'courses',
        element: <CoursesScreen />,
      },
      {
        path: 'books',
        element: <BooksScreen />,
      },
      {
        path: 'credentials',
        element: <CredentialsScreen />,
      },
      {
        path: 'files',
        element: <FilesScreen />,
      },
    ],
  },
]);
