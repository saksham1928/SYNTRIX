import { useState } from 'react';
import {
  Container, Card, Form, Button, Alert, Spinner,
  Row, Col, Badge,
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';

const EMPTY_LECTURE = () => ({ title: '', videoUrl: '' });

function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lectures, setLectures] = useState([EMPTY_LECTURE()]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Lecture list helpers ───────────────────────────────────────────────────
  const addLecture = () => {
    setLectures((prev) => [...prev, EMPTY_LECTURE()]);
  };

  const removeLecture = (idx) => {
    setLectures((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLecture = (idx, field, value) => {
    setLectures((prev) =>
      prev.map((lec, i) => (i === idx ? { ...lec, [field]: value } : lec))
    );
    // Clear field-level error on edit
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`lec_${idx}_${field}`];
      return next;
    });
  };

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Course title is required.';
    if (!description.trim()) errs.description = 'Course description is required.';
    if (lectures.length === 0) errs.lectures = 'Add at least one lecture.';

    lectures.forEach((lec, idx) => {
      if (!lec.title.trim()) errs[`lec_${idx}_title`] = 'Lecture title required.';
      if (!lec.videoUrl.trim()) errs[`lec_${idx}_videoUrl`] = 'YouTube link/ID required.';
    });

    return errs;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          lectures: lectures.map((lec, idx) => ({
            title: lec.title.trim(),
            videoUrl: lec.videoUrl.trim(),
            order: idx,
          })),
        }),
      });

      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setSuccess(`✅ Course "${data.title}" created with ${data.lectures.length} lecture(s)!`);
        // Reset form
        setTitle('');
        setDescription('');
        setLectures([EMPTY_LECTURE()]);
      } else {
        setError(data.message || 'Failed to create course.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      {/* ── Page header ── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <h1 className="fw-bold text-warning mb-0">Admin Panel</h1>
        <Badge bg="warning" text="dark" pill className="px-3 py-2">Create Course</Badge>
      </div>
      <p className="text-secondary mb-4">
        Fill in the details below to publish a new course to SYNTRIX. Paste a full YouTube URL
        or just the 11-character video ID in the lecture fields.
      </p>

      {success && (
        <Alert variant="success" className="fw-semibold" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Card className="bg-dark border border-secondary shadow-lg">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit} noValidate>

            {/* ── Course title ── */}
            <Form.Group className="mb-4" controlId="admin-course-title">
              <Form.Label className="fw-semibold text-light">
                Course Title <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Machine Learning Fundamentals"
                className="bg-black text-white border-secondary"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFieldErrors((p) => { const n = { ...p }; delete n.title; return n; });
                }}
                isInvalid={!!fieldErrors.title}
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.title}</Form.Control.Feedback>
            </Form.Group>

            {/* ── Description ── */}
            <Form.Group className="mb-4" controlId="admin-course-description">
              <Form.Label className="fw-semibold text-light">
                Description <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="What will students learn in this course?"
                className="bg-black text-white border-secondary"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFieldErrors((p) => { const n = { ...p }; delete n.description; return n; });
                }}
                isInvalid={!!fieldErrors.description}
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.description}</Form.Control.Feedback>
            </Form.Group>

            {/* ── Lectures ── */}
            <div className="mb-3 d-flex align-items-center justify-content-between">
              <Form.Label className="fw-semibold text-light mb-0">
                Lectures <span className="text-danger">*</span>
                <span className="text-secondary ms-2 small">({lectures.length} added)</span>
              </Form.Label>
              <Button
                id="btn-add-lecture"
                variant="outline-primary"
                size="sm"
                onClick={addLecture}
                className="fw-semibold"
              >
                + Add Lecture
              </Button>
            </div>

            {fieldErrors.lectures && (
              <div className="text-danger small mb-2">{fieldErrors.lectures}</div>
            )}

            <div className="d-flex flex-column gap-3 mb-4">
              {lectures.map((lec, idx) => (
                <Card
                  key={idx}
                  className="bg-black border border-secondary"
                  style={{ borderRadius: 8 }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span
                        className="fw-semibold text-primary"
                        style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}
                      >
                        LECTURE {idx + 1}
                      </span>
                      {lectures.length > 1 && (
                        <Button
                          id={`btn-remove-lecture-${idx}`}
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeLecture(idx)}
                          className="py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <Row className="g-2">
                      <Col md={5}>
                        <Form.Group controlId={`admin-lec-${idx}-title`}>
                          <Form.Label className="text-secondary small mb-1">Title</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Introduction to Neural Networks"
                            className="bg-dark text-white border-secondary"
                            value={lec.title}
                            onChange={(e) => updateLecture(idx, 'title', e.target.value)}
                            isInvalid={!!fieldErrors[`lec_${idx}_title`]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors[`lec_${idx}_title`]}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={7}>
                        <Form.Group controlId={`admin-lec-${idx}-url`}>
                          <Form.Label className="text-secondary small mb-1">
                            YouTube URL or Video ID
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="https://youtu.be/dQw4w9WgXcQ  or  dQw4w9WgXcQ"
                            className="bg-dark text-white border-secondary"
                            value={lec.videoUrl}
                            onChange={(e) => updateLecture(idx, 'videoUrl', e.target.value)}
                            isInvalid={!!fieldErrors[`lec_${idx}_videoUrl`]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors[`lec_${idx}_videoUrl`]}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* ── Submit ── */}
            <div className="d-flex justify-content-end">
              <Button
                id="btn-create-course"
                variant="warning"
                type="submit"
                className="fw-bold px-5"
                disabled={loading}
                style={{ color: '#000' }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating…
                  </>
                ) : (
                  'Create Course'
                )}
              </Button>
            </div>

          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Admin;
