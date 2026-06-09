import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

const Login          = lazy(() => import('@/pages/auth/Login'))
const Register       = lazy(() => import('@/pages/auth/Register'))
const ResetPassword  = lazy(() => import('@/pages/auth/ResetPassword'))
const UpdatePassword = lazy(() => import('@/pages/auth/UpdatePassword'))
const Onboarding     = lazy(() => import('@/pages/Onboarding'))
const Dashboard      = lazy(() => import('@/pages/Dashboard'))
const Focus          = lazy(() => import('@/pages/Focus'))
const Reflections    = lazy(() => import('@/pages/Reflections'))
const Helia          = lazy(() => import('@/pages/Helia'))
const Premium        = lazy(() => import('@/pages/Premium'))
const History        = lazy(() => import('@/pages/History'))
const NotFound       = lazy(() => import('@/pages/NotFound'))

function PageFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="text-5xl animate-bounce">🌻</div>
        <p className="font-body text-sm text-muted-foreground">A carregar…</p>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (profile && !profile.onboarding_complete) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/focus"       element={<Focus />} />
        <Route path="/reflections" element={<Reflections />} />
        <Route path="/history"     element={<History />} />
        <Route path="/helia"       element={<Helia />} />
        <Route path="/premium"     element={<Premium />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Onboarding — protected but no nav bar */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Main app — protected + bottom nav */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppRoutes />
            </ProtectedRoute>
          } />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
