import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminRoute — wraps children and requires:
 *   1. User is authenticated (ProtectedRoute handles the unauthenticated case)
 *   2. User's role is 'admin'
 *
 * Any non-admin authenticated user is silently redirected to the Dashboard.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Still resolving session — don't redirect yet
  if (isLoading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '80vh' }}
      >
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
