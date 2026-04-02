import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard/Dashboard';
import Courses from '../pages/Courses/Courses';
import Analytics from '../pages/Analytics/Analytics';
import Profile from '../pages/Profile/Profile';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes (Anyone can see these) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes (Must be logged in to see these) */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route path="*" element={<div className="text-center py-5"><h2>404 - Page Not Found</h2></div>} />
    </Routes>
  );
}

export default AppRoutes;