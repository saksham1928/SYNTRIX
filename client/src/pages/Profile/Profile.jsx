import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';

function Profile() {
  const { user: ctxUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load profile data.');
        }

        const data = await res.json();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unexpected error.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [logout, navigate]);

  const displayData = profile || ctxUser;

  return (
    <Container className="py-5" style={{ maxWidth: '680px' }}>
      <h1 className="fw-bold text-primary mb-4">My Profile</h1>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-secondary mt-3">Loading profile…</p>
        </div>
      )}

      {error && !loading && (
        <Alert variant="danger">{error}</Alert>
      )}

      {!loading && !error && displayData && (
        <Card className="bg-dark border border-secondary shadow-lg">
          {/* Header band */}
          <div
            className="rounded-top d-flex align-items-center justify-content-center"
            style={{
              background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)',
              height: '120px',
            }}
          >
            <div
              className="rounded-circle bg-dark d-flex align-items-center justify-content-center fw-bold text-primary"
              style={{ width: 80, height: 80, fontSize: '2rem', border: '3px solid #0d6efd' }}
            >
              {displayData.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <Card.Body className="px-4 pb-4 pt-3">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-white mb-1">{displayData.name}</h3>
              <Badge
                bg={displayData.role === 'admin' ? 'warning' : 'primary'}
                text={displayData.role === 'admin' ? 'dark' : 'white'}
                pill
                className="px-3 py-2"
              >
                {displayData.role === 'admin' ? '⭐ Admin' : '🎓 Student'}
              </Badge>
            </div>

            <Row className="g-3">
              <Col xs={12}>
                <Card className="bg-secondary bg-opacity-25 border-0">
                  <Card.Body className="d-flex align-items-center gap-3 py-3">
                    <span style={{ fontSize: '1.4rem' }}>📧</span>
                    <div>
                      <div className="text-secondary small fw-semibold text-uppercase tracking-wide">Email</div>
                      <div className="text-white fw-semibold">{displayData.email}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12}>
                <Card className="bg-secondary bg-opacity-25 border-0">
                  <Card.Body className="d-flex align-items-center gap-3 py-3">
                    <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                    <div>
                      <div className="text-secondary small fw-semibold text-uppercase tracking-wide">Role</div>
                      <div className="text-white fw-semibold text-capitalize">{displayData.role}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12}>
                <Card className="bg-secondary bg-opacity-25 border-0">
                  <Card.Body className="d-flex align-items-center gap-3 py-3">
                    <span style={{ fontSize: '1.4rem' }}>🆔</span>
                    <div>
                      <div className="text-secondary small fw-semibold text-uppercase tracking-wide">User ID</div>
                      <div className="text-secondary small font-monospace">{displayData.id}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default Profile;