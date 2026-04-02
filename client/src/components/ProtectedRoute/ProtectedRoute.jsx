import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // Check if the user has a token in their browser storage
  const token = localStorage.getItem('stryx_token');

  // If it's literally the string "null" or "undefined", we need to catch it
  if (!token || token === 'null' || token === 'undefined') {
    return <Navigate to="/login" replace />;
  }

  // If they have a token, render the page they were trying to access
  return children;
}

export default ProtectedRoute;