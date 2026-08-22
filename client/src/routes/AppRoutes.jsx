import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

// Lazy-load every page so the heavy Dashboard/MediaPipe bundle
// is only fetched when the user actually navigates there.
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Courses   = lazy(() => import('../pages/Courses/Courses'));
const Analytics = lazy(() => import('../pages/Analytics/Analytics'));
const Profile   = lazy(() => import('../pages/Profile/Profile'));
const Login     = lazy(() => import('../pages/Auth/Login'));
const Register  = lazy(() => import('../pages/Auth/Register'));

// Shared full-screen spinner shown while a lazy chunk is loading
function PageSpinner() {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '80vh' }}
    >
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status" />
        <p className="text-secondary fw-semibold">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/courses"   element={<ProtectedRoute><Courses /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <div className="text-center py-5">
              <h2>404 — Page Not Found</h2>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;