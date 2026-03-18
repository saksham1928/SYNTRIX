import { Navbar, Container, Nav} from 'react-bootstrap';

function NavigationBar() {
  return (
    <Navbar bg="black" variant="dark" expand="lg">
      <Container fluid className="px-4">
        <Navbar.Brand href="#home" className="fw-bold fs-4 text-primary">
          SYNTRIX 
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto fw-semibold">
            <Nav.Link href="#dashboard" className="active px-3 text-white">Dashboard</Nav.Link>
            <Nav.Link href="#courses" className="px-3 text-secondary">My Courses</Nav.Link>
            <Nav.Link href="#analytics" className="px-3 text-secondary">Focus Analytics</Nav.Link>
            <Nav.Link href="#profile" className="px-3 text-secondary">Profile</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;