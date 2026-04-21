import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { LoginPage } from '../pages/login/index.tsx'
import { DashboardPage } from '../pages/dashboard/index.tsx'
import { ProfilesPage } from '../pages/profiles/index.tsx'
import { ProfileDetailPage } from '../pages/profiles/detail'
import { DocumentsPage } from '../pages/documents/index.tsx'
import { DocumentDetailPage } from '../pages/documents/detail'
import { CardsPage } from '../pages/cards/index.tsx'
import { CardDetailPage } from '../pages/cards/detail'
import { PasswordsPage } from '../pages/passwords/index.tsx'
import { PasswordDetailPage } from '../pages/passwords/detail'
import { KeyDetailPage } from '../pages/passwords/key-detail'
import { SettingsPage } from '../pages/settings/index.tsx'
import { VisibilityPage } from '../pages/settings/visibility'
import { SessionsPage } from '../pages/settings/sessions'
import { ChangePasswordPage } from '../pages/settings/password'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'profiles', element: <ProfilesPage /> },
      { path: 'profiles/:id', element: <ProfileDetailPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'documents/:id', element: <DocumentDetailPage /> },
      { path: 'cards', element: <CardsPage /> },
      { path: 'cards/:id', element: <CardDetailPage /> },
      { path: 'passwords', element: <PasswordsPage /> },
      { path: 'passwords/:id', element: <PasswordDetailPage /> },
      { path: 'keys/:id', element: <KeyDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/visibility', element: <VisibilityPage /> },
      { path: 'settings/password', element: <ChangePasswordPage /> },
      { path: 'settings/sessions', element: <SessionsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
