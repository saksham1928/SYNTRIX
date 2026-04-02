import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // New state for errors
  const [loading, setLoading] = useState(false); // New state for loading button
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send the data to your Node.js backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Redirect the user to the login page
        navigate('/login');
      } else {
        // The server rejected it (e.g., "User already exists")
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card className="shadow-lg border-0 bg-dark text-white p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <h2 className="text-center fw-bold mb-4 text-primary">Create Account</h2>
          
          {/* Show error messages if they exist */}
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Form onSubmit={handleRegister}>
            {/* ... Keep your existing Form.Group inputs for Name, Email, and Password exactly the same ... */}
            <Form.Group className="mb-3" controlId="name">
              <Form.Label className="text-secondary">Full Name</Form.Label>
              <Form.Control type="text" placeholder="Enter your name" className="bg-secondary text-white border-0" value={name} onChange={(e) => setName(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="text-secondary">Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter email" className="bg-secondary text-white border-0" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <Form.Label className="text-secondary">Password</Form.Label>
              <Form.Control type="password" placeholder="Create password" className="bg-secondary text-white border-0" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 fw-bold mb-3" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </Form>
          
          <div className="text-center text-secondary small">
            Already have an account? <Link to="/login" className="text-primary text-decoration-none">Log in</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;