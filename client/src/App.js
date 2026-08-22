import { BrowserRouter as Router } from 'react-router-dom';
import NavigationBar from './components/Navbar/Navbar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-vh-100 bg-dark text-light d-flex flex-column">
          {/* Global Navigation */}
          <NavigationBar />

          {/* Dynamic Page Content */}
          <main className="flex-grow-1" style={{ minHeight: '80vh' }}>
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;