import { useState } from 'react';
import {
  Container, Card, Form, Button, Alert, Spinner,
  Row, Col, Badge,
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';

// ── Factory functions ────────────────────────────────────────────────────────
const EMPTY_QUESTION = () => ({
  questionText: '',
  options: ['', ''],       // starts with 2 empty options
  correctOptionIndex: 0,
});

const EMPTY_LECTURE = () => ({
  title: '',
  videoUrl: '',
  questions: [EMPTY_QUESTION()], // every lecture starts with 1 question
});

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
  const addLecture = () => setLectures((prev) => [...prev, EMPTY_LECTURE()]);

  const removeLecture = (idx) =>
    setLectures((prev) => prev.filter((_, i) => i !== idx));

  const updateLecture = (idx, field, value) => {
    setLectures((prev) =>
      prev.map((lec, i) => (i === idx ? { ...lec, [field]: value } : lec))
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`lec_${idx}_${field}`];
      return next;
    });
  };

  // ── Question helpers ───────────────────────────────────────────────────────
  const addQuestion = (lectureIdx) =>
    setLectures((prev) =>
      prev.map((lec, i) =>
        i === lectureIdx
          ? { ...lec, questions: [...lec.questions, EMPTY_QUESTION()] }
          : lec
      )
    );

  const removeQuestion = (lectureIdx, questionIdx) =>
    setLectures((prev) =>
      prev.map((lec, i) =>
        i === lectureIdx
          ? { ...lec, questions: lec.questions.filter((_, qi) => qi !== questionIdx) }
          : lec
      )
    );

  const updateQuestionText = (lectureIdx, questionIdx, text) => {
    setLectures((prev) =>
      prev.map((lec, i) =>
        i === lectureIdx
          ? {
              ...lec,
              questions: lec.questions.map((q, qi) =>
                qi === questionIdx ? { ...q, questionText: text } : q
              ),
            }
          : lec
      )
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`lec_${lectureIdx}_q_${questionIdx}_text`];
      return next;
    });
  };

  // ── Option helpers ─────────────────────────────────────────────────────────
  const addOption = (lectureIdx, questionIdx) =>
    setLectures((prev) =>
      prev.map((lec, i) =>
        i === lectureIdx
          ? {
              ...lec,
              questions: lec.questions.map((q, qi) =>
                qi === questionIdx && q.options.length < 4
                  ? { ...q, options: [...q.options, ''] }
                  : q
              ),
            }
          : lec
      )
    );

  const removeOption = (lectureIdx, questionIdx, optionIdx) =>
    setLectures((prev) =>
      prev.map((lec, i) => {
        if (i !== lectureIdx) return lec;
        return {
          ...lec,
          questions: lec.questions.map((q, qi) => {
            if (qi !== questionIdx || q.options.length <= 2) return q;
            const newOptions = q.options.filter((_, oi) => oi !== optionIdx);
            let newCorrect = q.correctOptionIndex;
            if (optionIdx === q.correctOptionIndex) newCorrect = 0;
            else if (optionIdx < q.correctOptionIndex) newCorrect = q.correctOptionIndex - 1;
            return { ...q, options: newOptions, correctOptionIndex: newCorrect };
          }),
        };
      })
    );

  const updateOptionText = (lectureIdx, questionIdx, optionIdx, text) => {
    setLectures((prev) =>
      prev.map((lec, i) =>
        i === lectureIdx
          ? {
              ...lec,
              questions: lec.questions.map((q, qi) =>
                qi === questionIdx
                  ? {
                      ...q,
                      options: q.options.map((opt, oi) => (oi === optionIdx ? text : opt)),
                    }
                  : q
              ),
            }
          : lec
      )
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`lec_${lectureIdx}_q_${questionIdx}_opt_${optionIdx}`];
      return next;
    });
  };

  const setCorrectOption = (lectureIdx, questionIdx, optionIdx) =>
    setLectures((prev) =>
      prev.map((lec, i) =>
        i === lectureIdx
          ? {
              ...lec,
              questions: lec.questions.map((q, qi) =>
                qi === questionIdx ? { ...q, correctOptionIndex: optionIdx } : q
              ),
            }
          : lec
      )
    );

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Course title is required.';
    if (!description.trim()) errs.description = 'Course description is required.';
    if (lectures.length === 0) errs.lectures = 'Add at least one lecture.';

    lectures.forEach((lec, idx) => {
      if (!lec.title.trim()) errs[`lec_${idx}_title`] = 'Lecture title required.';
      if (!lec.videoUrl.trim()) errs[`lec_${idx}_videoUrl`] = 'YouTube link/ID required.';

      if (!lec.questions || lec.questions.length < 1) {
        errs[`lec_${idx}_questions`] = 'At least one question is required.';
      }

      (lec.questions || []).forEach((q, qIdx) => {
        if (!q.questionText.trim())
          errs[`lec_${idx}_q_${qIdx}_text`] = 'Question text is required.';
        if (q.options.length < 2 || q.options.length > 4)
          errs[`lec_${idx}_q_${qIdx}_options`] = 'Must have 2–4 options.';
        q.options.forEach((opt, optIdx) => {
          if (!opt.trim())
            errs[`lec_${idx}_q_${qIdx}_opt_${optIdx}`] = 'Option text cannot be empty.';
        });
        if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length)
          errs[`lec_${idx}_q_${qIdx}_correct`] = 'Select a valid correct option.';
      });
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
            questions: lec.questions.map((q) => ({
              questionText: q.questionText.trim(),
              options: q.options.map((opt) => opt.trim()),
              correctOptionIndex: q.correctOptionIndex,
            })),
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container className="py-5" style={{ maxWidth: '860px' }}>
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

            <div className="d-flex flex-column gap-4 mb-4">
              {lectures.map((lec, idx) => (
                <Card
                  key={idx}
                  className="bg-black border border-secondary"
                  style={{ borderRadius: 8 }}
                >
                  <Card.Body className="p-3">
                    {/* Lecture header */}
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

                    {/* Lecture title + URL */}
                    <Row className="g-2 mb-3">
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

                    {/* ── Quiz Questions ── */}
                    <div
                      className="border border-secondary rounded p-3"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="fw-semibold text-warning" style={{ fontSize: '0.8rem', letterSpacing: '0.06em' }}>
                          LECTURE QUIZ QUESTIONS
                        </span>
                        <Badge bg="secondary" pill>{lec.questions.length} question{lec.questions.length !== 1 ? 's' : ''}</Badge>
                      </div>

                      {fieldErrors[`lec_${idx}_questions`] && (
                        <div className="text-danger small mb-2">{fieldErrors[`lec_${idx}_questions`]}</div>
                      )}

                      <div className="d-flex flex-column gap-3">
                        {lec.questions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="border border-secondary rounded p-3"
                            style={{ background: 'rgba(0,0,0,0.3)' }}
                          >
                            {/* Question header */}
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <Badge bg="primary" pill style={{ fontSize: '0.7rem' }}>
                                Question {qIdx + 1}
                              </Badge>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeQuestion(idx, qIdx)}
                                disabled={lec.questions.length <= 1}
                                className="py-0 px-2"
                                style={{ fontSize: '0.7rem' }}
                              >
                                🗑 Remove Question
                              </Button>
                            </div>

                            {/* Question text */}
                            <Form.Group className="mb-3" controlId={`lec-${idx}-q-${qIdx}-text`}>
                              <Form.Control
                                type="text"
                                placeholder="e.g. What does the useState hook return?"
                                className="bg-dark text-white border-secondary"
                                value={q.questionText}
                                onChange={(e) => updateQuestionText(idx, qIdx, e.target.value)}
                                isInvalid={!!fieldErrors[`lec_${idx}_q_${qIdx}_text`]}
                              />
                              <Form.Control.Feedback type="invalid">
                                {fieldErrors[`lec_${idx}_q_${qIdx}_text`]}
                              </Form.Control.Feedback>
                            </Form.Group>

                            {/* Options */}
                            <div className="d-flex flex-column gap-2 mb-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="d-flex align-items-center gap-2">
                                  {/* Correct-answer radio */}
                                  <Form.Check
                                    type="radio"
                                    name={`correct_${idx}_${qIdx}`}
                                    id={`correct_${idx}_${qIdx}_${optIdx}`}
                                    checked={q.correctOptionIndex === optIdx}
                                    onChange={() => setCorrectOption(idx, qIdx, optIdx)}
                                    title="Mark as correct answer"
                                  />
                                  {/* Option label */}
                                  <span className="text-secondary fw-bold" style={{ minWidth: 20 }}>
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  {/* Option text */}
                                  <div className="flex-grow-1">
                                    <Form.Control
                                      type="text"
                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                      className="bg-dark text-white border-secondary"
                                      value={opt}
                                      onChange={(e) => updateOptionText(idx, qIdx, optIdx, e.target.value)}
                                      isInvalid={!!fieldErrors[`lec_${idx}_q_${qIdx}_opt_${optIdx}`]}
                                      style={{ fontSize: '0.88rem' }}
                                    />
                                    {fieldErrors[`lec_${idx}_q_${qIdx}_opt_${optIdx}`] && (
                                      <div className="text-danger" style={{ fontSize: '0.75rem' }}>
                                        {fieldErrors[`lec_${idx}_q_${qIdx}_opt_${optIdx}`]}
                                      </div>
                                    )}
                                  </div>
                                  {/* Delete option */}
                                  <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    style={{ fontSize: '0.85rem', lineHeight: 1 }}
                                    onClick={() => removeOption(idx, qIdx, optIdx)}
                                    disabled={q.options.length <= 2}
                                    title="Remove option"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ))}
                            </div>

                            {/* Option-level errors */}
                            {fieldErrors[`lec_${idx}_q_${qIdx}_options`] && (
                              <div className="text-danger small mb-1">
                                {fieldErrors[`lec_${idx}_q_${qIdx}_options`]}
                              </div>
                            )}
                            {fieldErrors[`lec_${idx}_q_${qIdx}_correct`] && (
                              <div className="text-danger small mb-1">
                                {fieldErrors[`lec_${idx}_q_${qIdx}_correct`]}
                              </div>
                            )}

                            {/* Add option */}
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => addOption(idx, qIdx)}
                              disabled={q.options.length >= 4}
                              className="mt-1"
                              style={{ fontSize: '0.75rem' }}
                            >
                              + Add Option
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Add question */}
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => addQuestion(idx)}
                        className="mt-3 fw-semibold"
                        style={{ fontSize: '0.78rem' }}
                      >
                        + Add Question
                      </Button>
                    </div>
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
