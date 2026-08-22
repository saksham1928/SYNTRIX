import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function NavigationBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar bg="black" variant="dark" expand="lg" className="border-bottom border-secondary shadow-sm py-3">
      <Container fluid className="px-4">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold fs-4 text-primary tracking-wide">
          SYNTRIX
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto fw-semibold align-items-center">

            {isAuthenticated ? (
              <>
                {/* ── Admin nav: only the Admin panel link ── */}
                {user?.role === 'admin' ? (
                  <Nav.Link
                    as={Link} to="/admin"
                    className={`px-3 fw-bold ${isActive('/admin') ? 'text-warning' : 'text-warning text-opacity-75'}`}
                  >
                    ⚙ Admin Panel
                  </Nav.Link>
                ) : (
                  /* ── Student nav: full set of pages ── */
                  <>
                    <Nav.Link
                      as={Link} to="/"
                      className={`px-3 ${isActive('/') ? 'text-white' : 'text-secondary'}`}
                    >
                      Dashboard
                    </Nav.Link>
                    <Nav.Link
                      as={Link} to="/courses"
                      className={`px-3 ${isActive('/courses') ? 'text-white' : 'text-secondary'}`}
                    >
                      My Courses
                    </Nav.Link>
                    <Nav.Link
                      as={Link} to="/analytics"
                      className={`px-3 ${isActive('/analytics') ? 'text-white' : 'text-secondary'}`}
                    >
                      Focus Analytics
                    </Nav.Link>
                    <Nav.Link
                      as={Link} to="/profile"
                      className={`px-3 ${isActive('/profile') ? 'text-white' : 'text-secondary'}`}
                    >
                      Profile
                    </Nav.Link>
                  </>
                )}

                {/* User badge — shared for both roles */}
                {user && (
                  <span className="px-3 d-flex align-items-center gap-2">
                    <span className="text-white fw-semibold small">{user.name}</span>
                    {user.role === 'admin' && (
                      <Badge bg="warning" text="dark" pill className="small">Admin</Badge>
                    )}
                  </span>
                )}

                {/* Logout — shared for both roles */}
                <Button
                  id="btn-logout"
                  variant="outline-danger"
                  size="sm"
                  className="ms-2 px-3 fw-semibold"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link
                  as={Link} to="/login"
                  className={`px-3 ${isActive('/login') ? 'text-white' : 'text-secondary'}`}
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={Link} to="/register"
                  className={`px-3 ${isActive('/register') ? 'text-white' : 'text-secondary'}`}
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;