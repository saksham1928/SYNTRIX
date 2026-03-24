import { Navbar, Container, Nav} from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

function NavigationBar() {
  const location = useLocation(); // Gets the current URL to highlight the active link

  return (
    <Navbar bg="black" variant="dark" expand="lg" className="border-bottom border-secondary shadow-sm py-3">
      <Container fluid className="px-4">
        {/* Use 'as={Link} to="/"' instead of href */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold fs-4 text-primary tracking-wide">
          SYNTRIX 
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto fw-semibold">
            <Nav.Link as={Link} to="/" className={`px-3 ${location.pathname === '/' ? 'text-white' : 'text-secondary'}`}>
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/courses" className={`px-3 ${location.pathname === '/courses' ? 'text-white' : 'text-secondary'}`}>
              My Courses
            </Nav.Link>
            <Nav.Link as={Link} to="/analytics" className={`px-3 ${location.pathname === '/analytics' ? 'text-white' : 'text-secondary'}`}>
              Focus Analytics
            </Nav.Link>
            <Nav.Link as={Link} to="/profile" className={`px-3 ${location.pathname === '/profile' ? 'text-white' : 'text-secondary'}`}>
              Profile
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;