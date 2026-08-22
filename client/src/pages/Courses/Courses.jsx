import { useState, useEffect, useCallback } from 'react';
import {
  Container, Tabs, Tab, Row, Col, Card,
  Button, Badge, Alert, Spinner, ProgressBar,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';

// ─── Reusable API helper ──────────────────────────────────────────────────────
function authFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

// ─── CourseCard — Available tab ───────────────────────────────────────────────
function AvailableCourseCard({ course, onEnroll, enrollingId }) {
  const isEnrolling = enrollingId === course._id;

  return (
    <Card
      className="h-100 bg-dark border border-secondary shadow-sm"
      style={{
        borderRadius: 12,
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,110,253,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Accent stripe */}
      <div
        style={{
          height: 4,
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(90deg,#0d6efd,#6610f2)',
        }}
      />
      <Card.Body className="d-flex flex-column p-4">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <h5 className="fw-bold text-white mb-0" style={{ lineHeight: 1.3 }}>
            {course.title}
          </h5>
          <Badge bg="primary" pill className="px-2 py-1 text-nowrap" style={{ fontSize: '0.7rem' }}>
            {course.lectureCount} lecture{course.lectureCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        <p className="text-secondary small mb-4" style={{ flexGrow: 1 }}>
          {course.description.length > 120
            ? course.description.slice(0, 120) + '…'
            : course.description}
        </p>

        {course.createdBy?.name && (
          <p className="text-secondary mb-3" style={{ fontSize: '0.75rem' }}>
            👤 {course.createdBy.name}
          </p>
        )}

        <Button
          id={`btn-enroll-${course._id}`}
          variant="primary"
          className="w-100 fw-bold mt-auto"
          onClick={() => onEnroll(course._id)}
          disabled={isEnrolling}
          style={{ borderRadius: 8 }}
        >
          {isEnrolling ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Enrolling…
            </>
          ) : (
            '🚀 Enroll Now'
          )}
        </Button>
      </Card.Body>
    </Card>
  );
}

// ─── CourseCard — Enrolled tab ────────────────────────────────────────────────
function EnrolledCourseCard({ enrollment, onOpen }) {
  const { course, progress } = enrollment;
  if (!course) return null;

  const percent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const isDone = percent === 100;

  return (
    <Card
      className="h-100 bg-dark border shadow-sm"
      style={{
        borderRadius: 12,
        borderColor: isDone ? '#198754' : '#495057',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isDone
          ? '0 8px 32px rgba(25,135,84,0.2)'
          : '0 8px 32px rgba(13,110,253,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Accent stripe */}
      <div
        style={{
          height: 4,
          borderRadius: '12px 12px 0 0',
          background: isDone
            ? 'linear-gradient(90deg,#198754,#20c997)'
            : 'linear-gradient(90deg,#6610f2,#0d6efd)',
        }}
      />
      <Card.Body className="d-flex flex-column p-4">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <h5 className="fw-bold text-white mb-0" style={{ lineHeight: 1.3 }}>
            {course.title}
          </h5>
          {isDone && (
            <Badge bg="success" pill className="px-2 py-1 text-nowrap" style={{ fontSize: '0.7rem' }}>
              ✅ Complete
            </Badge>
          )}
        </div>

        <p className="text-secondary small mb-3" style={{ flexGrow: 1 }}>
          {course.description.length > 100
            ? course.description.slice(0, 100) + '…'
            : course.description}
        </p>

        {/* Progress bar */}
        <div className="mb-1 d-flex justify-content-between">
          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Progress</span>
          <span className="text-white fw-semibold" style={{ fontSize: '0.75rem' }}>
            {progress.completed}/{progress.total} lectures
          </span>
        </div>
        <ProgressBar
          now={percent}
          variant={isDone ? 'success' : 'primary'}
          className="mb-4"
          style={{ height: 6, borderRadius: 4 }}
        />

        <Button
          id={`btn-open-${course._id}`}
          variant={isDone ? 'outline-success' : 'outline-light'}
          className="w-100 fw-bold"
          onClick={() => onOpen(course._id)}
          style={{ borderRadius: 8 }}
        >
          {isDone ? '🔁 Rewatch' : '▶ Continue Learning'}
        </Button>
      </Card.Body>
    </Card>
  );
}

// ─── Main Courses page ────────────────────────────────────────────────────────
function Courses() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [allCourses, setAllCourses]           = useState([]);
  const [enrollments, setEnrollments]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [enrollingId, setEnrollingId]         = useState(null);
  const [enrollError, setEnrollError]         = useState('');
  const [activeTab, setActiveTab]             = useState('available');

  // ── Fetch all courses + user's enrollments in parallel ──────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [coursesRes, enrolledRes] = await Promise.all([
        authFetch('/api/courses'),
        authFetch('/api/courses/enrolled'),
      ]);

      if (coursesRes.status === 401 || enrolledRes.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!coursesRes.ok || !enrolledRes.ok) {
        throw new Error('Failed to load course data.');
      }

      const [coursesData, enrolledData] = await Promise.all([
        coursesRes.json(),
        enrolledRes.json(),
      ]);

      setAllCourses(coursesData);
      setEnrollments(enrolledData);
    } catch (err) {
      setError(err.message || 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Enroll ──────────────────────────────────────────────────────────────────
  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    setEnrollError('');

    try {
      const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });

      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        // Refetch enrollments to get the full course+progress shape
        const enrolledRes = await authFetch('/api/courses/enrolled');
        const enrolledData = await enrolledRes.json();
        setEnrollments(enrolledData);
        // Switch to Enrolled tab so the user sees their new card
        setActiveTab('enrolled');
      } else {
        setEnrollError(data.message || 'Could not enroll. Please try again.');
      }
    } catch {
      setEnrollError('Network error — please try again.');
    } finally {
      setEnrollingId(null);
    }
  };

  // ── Open course on Dashboard ────────────────────────────────────────────────
  const handleOpen = (courseId) => {
    navigate(`/?course=${courseId}`);
  };

  // ── Derived sets ────────────────────────────────────────────────────────────
  const enrolledCourseIds = new Set(
    enrollments.map((e) => e.course?._id).filter(Boolean)
  );
  const availableCourses = allCourses.filter(
    (c) => !enrolledCourseIds.has(c._id)
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-secondary mt-3 fw-semibold">Loading courses…</p>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="py-5 px-4" style={{ maxWidth: 1200 }}>
      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="fw-bold text-white mb-1">My Courses</h1>
        <p className="text-secondary">
          Browse all available courses or continue where you left off.
        </p>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      {enrollError && (
        <Alert variant="warning" onClose={() => setEnrollError('')} dismissible className="mb-4">
          {enrollError}
        </Alert>
      )}

      {/* ── Tabs ── */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 border-bottom border-secondary"
        variant="underline"
        id="courses-tabs"
      >
        {/* ── Available Courses tab ── */}
        <Tab
          eventKey="available"
          title={
            <span className="fw-semibold px-1">
              Available
              {availableCourses.length > 0 && (
                <Badge bg="primary" pill className="ms-2" style={{ fontSize: '0.65rem' }}>
                  {availableCourses.length}
                </Badge>
              )}
            </span>
          }
        >
          {availableCourses.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem' }}>🎉</div>
              <h5 className="text-white mt-3">You're enrolled in everything!</h5>
              <p className="text-secondary">Check the Enrolled tab to continue learning.</p>
            </div>
          ) : (
            <Row xs={1} sm={2} lg={3} className="g-4">
              {availableCourses.map((course) => (
                <Col key={course._id}>
                  <AvailableCourseCard
                    course={course}
                    onEnroll={handleEnroll}
                    enrollingId={enrollingId}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Tab>

        {/* ── Enrolled Courses tab ── */}
        <Tab
          eventKey="enrolled"
          title={
            <span className="fw-semibold px-1">
              Enrolled
              {enrollments.length > 0 && (
                <Badge bg="success" pill className="ms-2" style={{ fontSize: '0.65rem' }}>
                  {enrollments.length}
                </Badge>
              )}
            </span>
          }
        >
          {enrollments.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem' }}>📚</div>
              <h5 className="text-white mt-3">No enrollments yet</h5>
              <p className="text-secondary mb-4">
                Head over to the Available tab and enroll in your first course!
              </p>
              <Button
                variant="primary"
                className="fw-bold px-4"
                onClick={() => setActiveTab('available')}
              >
                Browse Courses
              </Button>
            </div>
          ) : (
            <Row xs={1} sm={2} lg={3} className="g-4">
              {enrollments.map((enr) => (
                <Col key={enr.enrollmentId}>
                  <EnrolledCourseCard enrollment={enr} onOpen={handleOpen} />
                </Col>
              ))}
            </Row>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Courses;