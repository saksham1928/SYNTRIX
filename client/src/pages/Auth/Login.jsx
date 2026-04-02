import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Save the digital token to the browser
        localStorage.setItem('stryx_token', data.token);
        
        // Redirect to the Dashboard
        navigate('/');
      } else {
        // Invalid email or password
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card className="shadow-lg border-0 bg-dark text-white p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <h2 className="text-center fw-bold mb-4 text-primary">STRYX Login</h2>
          
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Form onSubmit={handleLogin}>
             {/* ... Keep your existing Form.Group inputs for Email and Password exactly the same ... */}
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="text-secondary">Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter email" className="bg-secondary text-white border-0" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <Form.Label className="text-secondary">Password</Form.Label>
              <Form.Control type="password" placeholder="Password" className="bg-secondary text-white border-0" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 fw-bold mb-3" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <div className="text-center text-secondary small">
            Don't have an account? <Link to="/register" className="text-primary text-decoration-none">Register here</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;