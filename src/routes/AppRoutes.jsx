import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard/Dashboard';
import Courses from '../pages/Courses/Courses';
import Analytics from '../pages/Analytics/Analytics';
import Profile from '../pages/Profile/Profile';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* Optional: A catch-all route for 404 Not Found pages */}
      <Route path="*" element={<div className="text-center py-5"><h2>404 - Page Not Found</h2></div>} />
    </Routes>
  );
}

export default AppRoutes;