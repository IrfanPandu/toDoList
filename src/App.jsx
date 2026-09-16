import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="spinner" aria-label="Memuat aplikasi" />
        <p>Memuat...</p>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
