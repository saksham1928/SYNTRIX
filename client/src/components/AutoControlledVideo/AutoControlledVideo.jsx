import { useRef, useState, useEffect, useCallback } from "react";
import CustomVideoPlayer from "../CustomVideoPlayer/CustomVideoPlayer";
import LectureQuiz from "../LectureQuiz/LectureQuiz";
import { useFaceMeshDetection } from "../../hooks/useFaceMeshDetection";
import WebcamMonitor from "../WebcamMonitor/WebcamMonitor";
import { Row, Col, Card, Badge, Alert } from "react-bootstrap";
const API_BASE = "http://localhost:5000";
const TOKEN_KEY = "stryx_token";

/**
 * AutoControlledVideo
 *
 * Left col  -> Custom video player OR LectureQuiz (after video ends)
 * Right col -> Webcam (paused during quiz) + lectureListSlot
 *
 * Props:
 *   videoId            - YouTube 11-char ID
 *   courseId           - MongoDB ObjectId of the course
 *   lectureId          - MongoDB ObjectId of the current lecture
 *   lecture            - Full lecture object (questions, completed, videoWatched)
 *   isLastLecture      - Boolean
 *   onLectureCompleted - callback(lectureId, { courseCompleted })
 *   lectureListSlot    - React node below the webcam
 */
function AutoControlledVideo({
  videoId,
  courseId,
  lectureId,
  lecture,
  isLastLecture = false,
  onLectureCompleted,
  lectureListSlot,
}) {
  const playerRef = useRef(null);
  const webcamRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [submittingWatched, setSubmittingWatched] = useState(false);

  // If the student already has videoWatched:true but completed:false
  // (e.g. they reloaded mid-quiz) start straight on the quiz view.
  const [viewMode, setViewMode] = useState(() =>
    lecture?.videoWatched && !lecture?.completed ? "quiz" : "video"
  );

  // Re-evaluate when navigating to a different lecture
  useEffect(() => {
    if (lecture?.videoWatched && !lecture?.completed) {
      setViewMode("quiz");
    } else {
      setViewMode("video");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  // Focus callbacks
  const handleFocusLost = useCallback(() => {
    playerRef.current?.pauseVideo();
    setIsVideoPlaying(false);
  }, []);

  const handleFocusRegained = useCallback(() => {
    playerRef.current?.playVideo();
    setIsVideoPlaying(true);
  }, []);

  // Face detection - disabled while quiz is active
  const { isInitialized, isFocused, error: faceError, debugInfo } = useFaceMeshDetection(
    webcamRef,
    {
      onFocusLost: handleFocusLost,
      onFocusRegained: handleFocusRegained,
      enabled: viewMode === "video",
    }
  );

  // Once face detection finishes initializing, start the video for the first time.
  // This ensures the player never plays before the AI focus monitor is ready.
  useEffect(() => {
    if (isInitialized && viewMode === "video" && !faceError) {
      playerRef.current?.playVideo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Video ENDED
  const handleVideoEnded = useCallback(async () => {
    if (!courseId || !lectureId) return;

    // Rewatch scenario: lecture already completed - advance without quiz
    if (lecture?.completed) {
      onLectureCompleted?.(lectureId);
      return;
    }

    if (submittingWatched) return;
    setSubmittingWatched(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await fetch(
        `${API_BASE}/api/courses/${courseId}/lectures/${lectureId}/video-watched`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Network error marking video watched:", err);
    } finally {
      setSubmittingWatched(false);
    }

    setViewMode("quiz");
  }, [courseId, lectureId, lecture, submittingWatched, onLectureCompleted]);

  // Quiz callbacks
  const handleQuizPassed = useCallback(({ courseCompleted } = {}) => {
    onLectureCompleted?.(lectureId, { courseCompleted });
    setViewMode("video");
  }, [lectureId, onLectureCompleted]);

  const handleRewatchRequested = useCallback(() => {
    playerRef.current?.resetPlayer();
    setViewMode("video");
  }, []);

  const isQuizActive = viewMode === "quiz";

  return (
    <Row className="g-3">
      {/* Left col: video OR quiz */}
      <Col lg={8}>
        {viewMode === "video" && (
          <>
            {!isInitialized && !faceError && (
              <Alert variant="info" className="py-2 d-flex align-items-center mb-2">
                <div className="spinner-border spinner-border-sm me-2" role="status" />
                <small>Initialising AI focus monitor... please allow camera access if prompted.</small>
              </Alert>
            )}

            {faceError && (
              <div
                className="d-flex flex-column align-items-center justify-content-center text-center p-5"
                style={{
                  minHeight: 320,
                  background: "rgba(220,53,69,0.08)",
                  borderRadius: 12,
                  border: "1px solid rgba(220,53,69,0.35)",
                }}
              >
                <div style={{ fontSize: "3rem" }}>🎥</div>
                <h5 className="text-danger fw-bold mt-3 mb-2">Camera Required</h5>
                <p className="text-secondary mb-3" style={{ maxWidth: 360 }}>
                  SYNTRIX uses AI focus monitoring to ensure you stay engaged while learning.
                  The video cannot play until the camera is active and the model is loaded.
                </p>
                <p className="text-danger small font-monospace">{faceError}</p>
                <small className="text-secondary mt-2">
                  Allow camera access in your browser and reload the page.
                </small>
              </div>
            )}

            {!faceError && (
              <div style={{ borderRadius: 8, overflow: "hidden", opacity: isInitialized ? 1 : 0.4, pointerEvents: isInitialized ? "auto" : "none" }}>
                <CustomVideoPlayer
                  ref={playerRef}
                  videoId={videoId}
                  onPlayStateChange={setIsVideoPlaying}
                  onVideoEnded={handleVideoEnded}
                />
              </div>
            )}

            {isInitialized && !faceError && (
              <div className="d-flex align-items-center gap-2 mt-2 px-1">
                <Badge bg={isVideoPlaying ? "success" : "secondary"} pill>
                  {isVideoPlaying ? "Playing" : "Paused"}
                </Badge>
                <Badge bg={isFocused ? "success" : "danger"} pill>
                  {isFocused ? "Focused" : "Distracted - video paused"}
                </Badge>
                {submittingWatched && (
                  <Badge bg="warning" text="dark" pill>Saving progress...</Badge>
                )}
              </div>
            )}
          </>
        )}

        {viewMode === "quiz" && (
          <LectureQuiz
            courseId={courseId}
            lectureId={lectureId}
            questions={lecture?.questions || []}
            isLastLecture={isLastLecture}
            onQuizPassed={handleQuizPassed}
            onRewatchRequested={handleRewatchRequested}
          />
        )}
      </Col>

      {/* Right col: webcam + lecture list */}
      <Col lg={4} className="d-flex flex-column gap-3">
        <WebcamMonitor
          ref={webcamRef}
          isFocused={isFocused}
          debugInfo={debugInfo}
          showPreview={true}
          isPaused={isQuizActive}
        />

        {lectureListSlot && (
          <Card className="bg-dark border border-secondary">
            <Card.Body
              className="p-2"
              style={isQuizActive ? { pointerEvents: "none", opacity: 0.6 } : {}}
            >
              {lectureListSlot}
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}

export default AutoControlledVideo;
