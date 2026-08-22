import { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Badge, Button,
  Alert, Spinner, ProgressBar,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AutoControlledVideo from '../../components/AutoControlledVideo/AutoControlledVideo';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';

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

// ── LectureList ───────────────────────────────────────────────────────────────
function LectureList({ lectures, currentLectureId, onSelectLecture }) {
  return (
    <div
      className="d-flex flex-column gap-2"
      style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}
    >
      {lectures.map((lec, idx) => {
        const isFirst = idx === 0;
        const prevDone = idx > 0 && lectures[idx - 1].completed;
        const isAccessible = isFirst || prevDone || lec.completed;
        const isCurrent = lec._id === currentLectureId;

        let statusIcon = '🔒';
        let borderStyle = 'border-secondary';
        let textStyle = 'text-secondary';
        if (lec.completed) { statusIcon = '✅'; borderStyle = 'border-success'; textStyle = 'text-success'; }
        else if (isCurrent) { statusIcon = '▶'; borderStyle = 'border-primary'; textStyle = 'text-white'; }
        else if (isAccessible) { statusIcon = '▷'; borderStyle = 'border-secondary'; textStyle = 'text-white'; }

        return (
          <div
            key={lec._id}
            className={`d-flex align-items-center gap-2 p-2 rounded border ${borderStyle}`}
            style={{
              background: isCurrent ? 'rgba(13,110,253,0.12)' : 'rgba(255,255,255,0.03)',
              cursor: isAccessible ? 'pointer' : 'not-allowed',
              opacity: isAccessible ? 1 : 0.45,
              transition: 'background 0.15s',
            }}
            onClick={() => isAccessible && onSelectLecture(lec)}
            title={!isAccessible ? 'Complete the previous lecture to unlock' : ''}
          >
            <span style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>{statusIcon}</span>
            <span className={`small fw-semibold ${textStyle} text-truncate`} style={{ flex: 1 }}>
              {idx + 1}. {lec.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Enrolled course card (grid view) ─────────────────────────────────────────
function EnrolledCard({ enrollment, onSelect }) {
  const { course, progress } = enrollment;
  if (!course) return null;
  const percent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isDone = percent === 100;

  return (
    <Card
      className="bg-dark border border-secondary h-100"
      style={{
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onClick={() => onSelect(enrollment)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,110,253,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{
        height: 4, borderRadius: '12px 12px 0 0',
        background: isDone
          ? 'linear-gradient(90deg,#198754,#20c997)'
          : 'linear-gradient(90deg,#0d6efd,#6610f2)',
      }} />
      <Card.Body className="p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="fw-bold text-white mb-0" style={{ lineHeight: 1.3 }}>
            {course.title}
          </h5>
          {isDone && <Badge bg="success" pill>✅</Badge>}
        </div>
        <p className="text-secondary small mb-3" style={{ flexGrow: 1 }}>
          {course.description.length > 80
            ? course.description.slice(0, 80) + '…'
            : course.description}
        </p>
        <div className="d-flex justify-content-between mb-1">
          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Progress</span>
          <span className="text-white fw-semibold" style={{ fontSize: '0.75rem' }}>
            {progress.completed}/{progress.total}
          </span>
        </div>
        <ProgressBar
          now={percent}
          variant={isDone ? 'success' : 'primary'}
          style={{ height: 5, borderRadius: 4 }}
          className="mb-3"
        />
        <Button variant="outline-primary" size="sm" className="fw-bold w-100">
          {isDone ? '🔁 Rewatch' : '▶ Continue'}
        </Button>
      </Card.Body>
    </Card>
  );
}

// ── Dashboard (main) ──────────────────────────────────────────────────────────
function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ── Grid state ──────────────────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState('');

  // ── Learning view state ─────────────────────────────────────────────────────
  const [selectedEnrollment, setSelectedEnrollment] = useState(null); // full enrollment
  const [courseDetail, setCourseDetail]             = useState(null);  // GET /api/courses/:id result
  const [lectures, setLectures]                     = useState([]);    // merged lectures+completion
  const [currentLecture, setCurrentLecture]         = useState(null);
  const [detailLoading, setDetailLoading]           = useState(false);
  const [detailError, setDetailError]               = useState('');

  // ── Fetch enrolled courses on mount ────────────────────────────────────────
  const fetchEnrollments = useCallback(async () => {
    setGridLoading(true);
    setGridError('');
    try {
      const res = await authFetch('/api/courses/enrolled');
      if (res.status === 401) { logout(); navigate('/login'); return; }
      if (!res.ok) throw new Error('Failed to load your courses.');
      setEnrollments(await res.json());
    } catch (err) {
      setGridError(err.message);
    } finally {
      setGridLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  // ── Open a course — fetch full detail + completion map ─────────────────────
  const handleSelectCourse = useCallback(async (enrollment) => {
    setSelectedEnrollment(enrollment);
    setDetailLoading(true);
    setDetailError('');
    setCourseDetail(null);
    setLectures([]);
    setCurrentLecture(null);

    try {
      const res = await authFetch(`/api/courses/${enrollment.course._id}`);
      if (res.status === 401) { logout(); navigate('/login'); return; }
      if (!res.ok) throw new Error('Failed to load course details.');
      const data = await res.json();
      setCourseDetail(data);

      // Merge completion into lectures array
      const merged = data.lectures.map((lec) => ({
        ...lec,
        completed: lec.completed ?? false,
      }));
      setLectures(merged);

      // Current lecture = first incomplete, fallback to first
      const firstIncomplete = merged.find((l) => !l.completed) || merged[0];
      setCurrentLecture(firstIncomplete || null);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }, [logout, navigate]);

  // ── Lecture completed callback ──────────────────────────────────────────────
  const handleLectureCompleted = useCallback((completedLectureId) => {
    setLectures((prev) => {
      const updated = prev.map((l) =>
        l._id === completedLectureId ? { ...l, completed: true } : l
      );

      // Auto-advance: find next unlocked lecture
      const completedIdx = updated.findIndex((l) => l._id === completedLectureId);
      const next = updated[completedIdx + 1];
      if (next && !next.completed) {
        setCurrentLecture(next);
      }

      return updated;
    });

    // Update progress badge in the grid
    setEnrollments((prev) =>
      prev.map((enr) => {
        if (enr.course?._id !== selectedEnrollment?.course?._id) return enr;
        const newCompleted = enr.progress.completed + 1;
        return {
          ...enr,
          progress: { ...enr.progress, completed: newCompleted },
        };
      })
    );
  }, [selectedEnrollment]);

  // ── Back to grid ────────────────────────────────────────────────────────────
  const handleBack = () => {
    setSelectedEnrollment(null);
    setCourseDetail(null);
    setLectures([]);
    setCurrentLecture(null);
  };

  // ─── RENDER: Grid view ────────────────────────────────────────────────────
  if (!selectedEnrollment) {
    return (
      <Container fluid className="py-5 px-4" style={{ maxWidth: 1200 }}>
        <div className="mb-5">
          <h1 className="fw-bold text-white mb-1">Dashboard</h1>
          <p className="text-secondary">Pick up where you left off.</p>
        </div>

        {gridLoading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="text-secondary mt-3 fw-semibold">Loading your courses…</p>
          </div>
        )}

        {gridError && !gridLoading && (
          <Alert variant="danger" onClose={() => setGridError('')} dismissible>{gridError}</Alert>
        )}

        {!gridLoading && !gridError && enrollments.length === 0 && (
          <div className="text-center py-5">
            <div style={{ fontSize: '3.5rem' }}>📚</div>
            <h4 className="text-white mt-3">No enrolled courses yet</h4>
            <p className="text-secondary mb-4">Browse courses and enrol to start learning.</p>
            <Button as={Link} to="/courses" variant="primary" className="fw-bold px-4">
              Browse Courses
            </Button>
          </div>
        )}

        {!gridLoading && enrollments.length > 0 && (
          <Row xs={1} sm={2} lg={3} className="g-4">
            {enrollments.map((enr) => (
              <Col key={enr.enrollmentId}>
                <EnrolledCard enrollment={enr} onSelect={handleSelectCourse} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    );
  }

  // ─── RENDER: Learning view ────────────────────────────────────────────────
  const course = courseDetail || selectedEnrollment.course;

  return (
    <Container fluid className="py-3 px-3" style={{ maxWidth: 1400 }}>
      {/* Header bar */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <Button variant="outline-secondary" size="sm" onClick={handleBack}>
          ← Back
        </Button>
        <div>
          <h5 className="fw-bold text-white mb-0">{course?.title}</h5>
          {currentLecture && (
            <small className="text-secondary">{currentLecture.title}</small>
          )}
        </div>
      </div>

      {detailLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-secondary mt-3">Loading course…</p>
        </div>
      )}
      {detailError && (
        <Alert variant="danger">{detailError}</Alert>
      )}

      {!detailLoading && !detailError && currentLecture && (
        <AutoControlledVideo
          videoId={currentLecture.videoUrl}
          courseId={courseDetail?._id}
          lectureId={currentLecture._id}
          onLectureCompleted={handleLectureCompleted}
          lectureListSlot={
            <>
              <div className="px-1 pb-1">
                <span className="fw-bold text-white small">
                  📋 Lectures — {lectures.filter((l) => l.completed).length}/{lectures.length} done
                </span>
              </div>
              <LectureList
                lectures={lectures}
                currentLectureId={currentLecture._id}
                onSelectLecture={setCurrentLecture}
              />
            </>
          }
        />
      )}
    </Container>
  );
}

export default Dashboard;