import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * StudentRoute — wraps pages that are for students only.
 * If an admin visits a student page they are redirected to /admin.
 * Unauthenticated users are handled upstream by ProtectedRoute.
 */
function StudentRoute({ children }) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '80vh' }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default StudentRoute;
