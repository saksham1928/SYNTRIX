import { BrowserRouter as Router } from 'react-router-dom';
import NavigationBar from './components/Navbar/Navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <Router>
      <div className="min-vh-100 bg-dark text-light d-flex flex-column">
        {/* Global Navigation */}
        <NavigationBar />

        {/* Dynamic Page Content */}
        <main className="flex-grow-1">
          <AppRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;