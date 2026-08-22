import { useRef, useState, useCallback } from "react";
import CustomVideoPlayer from "../CustomVideoPlayer/CustomVideoPlayer";
import { useFaceMeshDetection } from "../../hooks/useFaceMeshDetection";
import WebcamMonitor from "../WebcamMonitor/WebcamMonitor";
import { Row, Col, Card, Badge, Alert } from "react-bootstrap";

const API_BASE = "http://localhost:5000";
const TOKEN_KEY = "stryx_token";

/**
 * AutoControlledVideo
 *
 * Renders the full learning-view layout:
 *   Left col  → Custom video player
 *   Right col → Webcam (AI focus monitor) + lectureListSlot below it
 *
 * Props:
 *   videoId            — YouTube 11-char ID of the current lecture
 *   courseId           — MongoDB ObjectId of the course
 *   lectureId          — MongoDB ObjectId of the current lecture
 *   onLectureCompleted — callback(completedLectureId) after backend confirms
 *   lectureListSlot    — React node rendered below the webcam feed (lecture list)
 */
function AutoControlledVideo({
  videoId,
  courseId,
  lectureId,
  onLectureCompleted,
  lectureListSlot,
}) {
  const playerRef = useRef(null);
  const webcamRef = useRef(null);           // ← this ref IS wired to face detection
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [completing, setCompleting] = useState(false);

  // ── Focus callbacks — pause/play the video on distraction ──────────────────
  const handleFocusLost = useCallback(() => {
    playerRef.current?.pauseVideo();
    setIsVideoPlaying(false);
  }, []);

  const handleFocusRegained = useCallback(() => {
    playerRef.current?.playVideo();
    setIsVideoPlaying(true);
  }, []);

  // ── Face detection — mounted here so webcamRef is in scope ─────────────────
  const { isInitialized, isFocused, error: faceError, debugInfo } = useFaceMeshDetection(
    webcamRef,   // same ref that WebcamMonitor renders into
    {
      onFocusLost: handleFocusLost,
      onFocusRegained: handleFocusRegained,
      enabled: true,
    }
  );

  // ── Auto-complete on video ENDED (YouTube state 0) ─────────────────────────
  const handleVideoEnded = useCallback(async () => {
    if (!courseId || !lectureId || completing) return;
    setCompleting(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/api/courses/${courseId}/lectures/${lectureId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        onLectureCompleted?.(lectureId);
      } else {
        console.error("Failed to mark lecture complete:", await res.text());
      }
    } catch (err) {
      console.error("Network error marking complete:", err);
    } finally {
      setCompleting(false);
    }
  }, [courseId, lectureId, completing, onLectureCompleted]);

  return (
    <Row className="g-3">
      {/* ── Left: Video player ── */}
      <Col lg={8}>
        {/* Model init banner */}
        {!isInitialized && !faceError && (
          <Alert variant="info" className="py-2 d-flex align-items-center mb-2">
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            <small>Initialising AI focus monitor…</small>
          </Alert>
        )}
        {faceError && (
          <Alert variant="danger" className="py-2 mb-2">
            <small><strong>Camera error:</strong> {faceError}</small>
          </Alert>
        )}

        {/* Player */}
        <div style={{ borderRadius: 8, overflow: "hidden" }}>
          <CustomVideoPlayer
            ref={playerRef}
            videoId={videoId}
            onPlayStateChange={setIsVideoPlaying}
            onVideoEnded={handleVideoEnded}
          />
        </div>

        {/* Status pills */}
        <div className="d-flex align-items-center gap-2 mt-2 px-1">
          <Badge bg={isVideoPlaying ? "success" : "secondary"} pill>
            {isVideoPlaying ? "▶ Playing" : "⏸ Paused"}
          </Badge>
          <Badge bg={isFocused ? "success" : "danger"} pill>
            {isFocused ? "👁 Focused" : "⚠ Distracted"}
          </Badge>
          {completing && (
            <Badge bg="warning" text="dark" pill>Saving progress…</Badge>
          )}
        </div>
      </Col>

      {/* ── Right: Camera feed + lecture list ── */}
      <Col lg={4} className="d-flex flex-column gap-3">
        {/* WebcamMonitor — ref IS webcamRef used by face detection above */}
        <WebcamMonitor
          ref={webcamRef}
          isFocused={isFocused}
          debugInfo={debugInfo}
          showPreview={true}
        />

        {/* Lecture list injected by Dashboard */}
        {lectureListSlot && (
          <Card className="bg-dark border border-secondary">
            <Card.Body className="p-2">
              {lectureListSlot}
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}

export default AutoControlledVideo;
