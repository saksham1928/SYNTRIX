import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Badge, Button, ProgressBar, Spinner,
} from 'react-bootstrap';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';
const QUESTION_TIME = 30; // seconds per question

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/**
 * LectureQuiz
 *
 * Props:
 *   courseId           — MongoDB ObjectId of the course
 *   lectureId          — MongoDB ObjectId of the current lecture
 *   questions          — Array of sanitised questions (no correctOptionIndex)
 *   isLastLecture      — Boolean: true when this is the final lecture
 *   onQuizPassed       — Callback({ courseCompleted }) when student passes & clicks Next/Finish
 *   onRewatchRequested — Callback() when student fails & clicks Rewatch
 */
function LectureQuiz({
  courseId,
  lectureId,
  questions = [],
  isLastLecture = false,
  onQuizPassed,
  onRewatchRequested,
}) {
  // Shuffle questions once on mount (options order preserved)
  const [shuffledQuestions] = useState(() =>
    [...questions].sort(() => Math.random() - 0.5)
  );

  // ── Core quiz state ─────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [phase, setPhase] = useState('answering'); // 'answering' | 'review' | 'results'

  // ── Review / result data ────────────────────────────────────────────────────
  const [reviewData, setReviewData] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // ── Stable refs — let timer callbacks read current values without stale closures
  const selectedOptionRef = useRef(null);
  const submittingRef     = useRef(false);
  const phaseRef          = useRef('answering');
  const currentIndexRef   = useRef(0);

  // Keep refs in sync
  useEffect(() => { selectedOptionRef.current = selectedOption; }, [selectedOption]);
  useEffect(() => { submittingRef.current = submitting; },       [submitting]);
  useEffect(() => { phaseRef.current = phase; },                 [phase]);
  useEffect(() => { currentIndexRef.current = currentIndex; },   [currentIndex]);

  // ── Submit answer — stable callback, reads state via refs ──────────────────
  const submitAnswer = useCallback(async (chosenIndex) => {
    // Guard: don't double-submit
    if (submittingRef.current) return;
    if (phaseRef.current !== 'answering') return;

    submittingRef.current = true;
    setSubmitting(true);

    const question = shuffledQuestions[currentIndexRef.current];
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/api/courses/${courseId}/lectures/${lectureId}/quiz/answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: question._id,
            selectedOptionIndex: chosenIndex ?? null,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setReviewData({
          isCorrect: data.isCorrect,
          correctOptionIndex: data.correctOptionIndex,
        });
      } else {
        console.error('Failed to submit answer:', await res.text());
        // Still show review so student isn't stuck
        setReviewData(null);
      }
    } catch (err) {
      console.error('Network error submitting answer:', err);
      setReviewData(null);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      phaseRef.current = 'review';
      setPhase('review');
    }
  // shuffledQuestions, courseId, lectureId are stable for the lifetime of this component
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lectureId, shuffledQuestions]);

  // ── 30-second countdown ────────────────────────────────────────────────────
  // Only runs when phase === 'answering'. Uses a simple setInterval so it is
  // not restarted on every render — the submitAnswer ref pattern prevents
  // stale-closure issues.
  useEffect(() => {
    if (phase !== 'answering') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit on timeout
          submitAnswer(selectedOptionRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // Re-run only when the phase changes to 'answering' (i.e., new question)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Reset per-question state when advancing to a new question ─────────────
  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setSelectedOption(null);
    setReviewData(null);
    phaseRef.current = 'answering';
    setPhase('answering');
  }, [currentIndex]);

  // ── Manual submit ──────────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    if (phase !== 'answering' || submitting) return;
    submitAnswer(selectedOptionRef.current);
  };

  // ── Advance to next question OR finalize ───────────────────────────────────
  const handleNext = async () => {
    const isLastQuestion = currentIndex === shuffledQuestions.length - 1;

    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    // Last question — call finalize endpoint
    setFinalizing(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/api/courses/${courseId}/lectures/${lectureId}/quiz/finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setFinalResult(data);
        phaseRef.current = 'results';
        setPhase('results');
      } else {
        console.error('Failed to finalize quiz:', await res.text());
      }
    } catch (err) {
      console.error('Network error finalizing quiz:', err);
    } finally {
      setFinalizing(false);
    }
  };

  // ── Timer colour ───────────────────────────────────────────────────────────
  const timerVariant  = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : 'success';
  const timerPercent  = Math.round((timeLeft / QUESTION_TIME) * 100);

  // ── RESULTS SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'results' && finalResult) {
    const { passed, quizScore, totalScore, percentage, courseCompleted } = finalResult;

    return (
      <Card className="bg-dark border border-secondary shadow-lg h-100">
        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4 text-center">
          <div style={{ fontSize: '3rem' }}>{passed ? '🎉' : '❌'}</div>

          <h4 className="fw-bold text-white mt-3 mb-1">Quiz Completed!</h4>

          <Badge
            bg={passed ? 'success' : 'danger'}
            pill
            className="px-3 py-2 mb-3"
            style={{ fontSize: '0.85rem' }}
          >
            {passed ? '🎉 Passed (≥ 50%)' : '❌ Score Below 50%'}
          </Badge>

          <div className="mb-2 text-white fw-semibold" style={{ fontSize: '1.1rem' }}>
            Score: {quizScore}/{totalScore} ({percentage}%)
          </div>
          <ProgressBar
            now={percentage}
            variant={passed ? 'success' : 'danger'}
            className="w-100 mb-3"
            style={{ height: 10, borderRadius: 6 }}
          />

          {passed ? (
            <p className="text-success small mb-4">
              Congratulations! You have passed the quiz and unlocked the next lecture.
            </p>
          ) : (
            <p className="text-secondary small mb-4">
              You scored below the 50% passing threshold. Please rewatch the lecture and retake the quiz.
            </p>
          )}

          {passed ? (
            <Button
              variant="success"
              className="fw-bold px-4"
              onClick={() => onQuizPassed?.({ courseCompleted })}
            >
              {isLastLecture ? 'Finish Course 🎓' : 'Continue to Next Lecture ➔'}
            </Button>
          ) : (
            <Button
              variant="warning"
              className="fw-bold px-4"
              style={{ color: '#000' }}
              onClick={() => onRewatchRequested?.()}
            >
              🔁 Rewatch Lecture
            </Button>
          )}
        </Card.Body>
      </Card>
    );
  }

  // ── QUESTION SCREEN ────────────────────────────────────────────────────────
  const currentQuestion = shuffledQuestions[currentIndex];
  const isLastQuestion  = currentIndex === shuffledQuestions.length - 1;

  if (!currentQuestion) return null;

  return (
    <Card className="bg-dark border border-secondary shadow-lg h-100">
      <Card.Body className="p-4">

        {/* Progress header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="text-secondary small fw-semibold">
            Question {currentIndex + 1} of {shuffledQuestions.length}
          </span>
          <Badge bg="primary" pill className="px-3">Quiz</Badge>
        </div>
        <ProgressBar
          now={Math.round((currentIndex / shuffledQuestions.length) * 100)}
          variant="primary"
          className="mb-4"
          style={{ height: 4, borderRadius: 4 }}
        />

        {/* Timer */}
        {phase === 'answering' && (
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Time remaining</span>
              <Badge bg={timerVariant} pill className="px-2">{timeLeft}s</Badge>
            </div>
            <ProgressBar
              now={timerPercent}
              variant={timerVariant}
              style={{ height: 6, borderRadius: 4 }}
            />
          </div>
        )}

        {phase === 'review' && (
          <div className="mb-3">
            <Badge bg="secondary" pill className="px-3">⏸ Timer Frozen</Badge>
          </div>
        )}

        {/* Question text */}
        <h5 className="text-white fw-semibold mb-4" style={{ lineHeight: 1.5 }}>
          {currentQuestion.questionText}
        </h5>

        {/* Options */}
        <div className="d-flex flex-column gap-2 mb-4">
          {currentQuestion.options.map((opt, optIdx) => {
            let borderColor = 'rgba(108,117,125,0.4)';
            let bgColor     = 'rgba(0,0,0,0.25)';
            let textColor   = '#dee2e6';
            let icon        = null;

            if (phase === 'review' && reviewData) {
              if (optIdx === reviewData.correctOptionIndex) {
                borderColor = '#198754';
                bgColor     = 'rgba(25,135,84,0.18)';
                textColor   = '#75b798';
                icon        = '✓';
              } else if (optIdx === selectedOption && !reviewData.isCorrect) {
                borderColor = '#dc3545';
                bgColor     = 'rgba(220,53,69,0.15)';
                textColor   = '#ea868f';
                icon        = '✗';
              }
            } else if (phase === 'answering' && optIdx === selectedOption) {
              borderColor = '#0d6efd';
              bgColor     = 'rgba(13,110,253,0.15)';
              textColor   = '#6ea8fe';
            }

            const isDisabled = phase === 'review' || submitting;

            return (
              <div
                key={optIdx}
                onClick={() => { if (!isDisabled) setSelectedOption(optIdx); }}
                className="d-flex align-items-center gap-3 rounded px-3 py-2"
                style={{
                  border: `1.5px solid ${borderColor}`,
                  background: bgColor,
                  cursor: isDisabled ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  color: textColor,
                }}
              >
                {/* Radio dot */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${borderColor}`,
                    background: optIdx === selectedOption && phase === 'answering' ? '#0d6efd' : 'transparent',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                  }}
                />
                <span className="fw-bold" style={{ minWidth: 22, fontSize: '0.88rem' }}>
                  {OPTION_LABELS[optIdx]}.
                </span>
                <span style={{ fontSize: '0.92rem', flex: 1 }}>{opt}</span>
                {icon && (
                  <span className="fw-bold" style={{ fontSize: '1rem' }}>{icon}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Review feedback */}
        {phase === 'review' && (
          <div
            className={`rounded px-3 py-2 mb-3 small fw-semibold ${reviewData?.isCorrect ? 'text-success' : 'text-danger'}`}
            style={{
              background: reviewData?.isCorrect ? 'rgba(25,135,84,0.1)' : 'rgba(220,53,69,0.1)',
              border: `1px solid ${reviewData?.isCorrect ? 'rgba(25,135,84,0.3)' : 'rgba(220,53,69,0.3)'}`,
            }}
          >
            {reviewData?.isCorrect ? (
              <>✓ Correct! <span className="fw-normal text-success-emphasis">+1 pt</span></>
            ) : (
              <>
                ✗{' '}
                {selectedOption === null
                  ? 'Time ran out — no answer submitted.'
                  : 'Incorrect.'}{' '}
                {reviewData && (
                  <span className="fw-normal">
                    The correct answer was{' '}
                    <strong>
                      {OPTION_LABELS[reviewData.correctOptionIndex]}.{' '}
                      {currentQuestion.options[reviewData.correctOptionIndex]}
                    </strong>
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="d-flex justify-content-end">
          {phase === 'answering' ? (
            <Button
              variant="primary"
              className="fw-bold px-4"
              onClick={handleManualSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><Spinner animation="border" size="sm" className="me-2" />Submitting…</>
                : 'Submit Answer'}
            </Button>
          ) : (
            <Button
              variant={isLastQuestion ? 'warning' : 'primary'}
              className="fw-bold px-4"
              style={isLastQuestion ? { color: '#000' } : {}}
              onClick={handleNext}
              disabled={finalizing}
            >
              {finalizing
                ? <><Spinner animation="border" size="sm" className="me-2" />Finalizing…</>
                : isLastQuestion
                  ? 'View Final Results'
                  : 'Next Question ➔'}
            </Button>
          )}
        </div>

      </Card.Body>
    </Card>
  );
}

export default LectureQuiz;
