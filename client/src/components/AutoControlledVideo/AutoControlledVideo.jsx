import YouTube from "react-youtube";
import { useRef, useState } from "react";
import { useFaceMeshDetection } from "../../hooks/useFaceMeshDetection";
import WebcamMonitor from "../WebcamMonitor/WebcamMonitor";
import { Container, Row, Col, Card, Badge, Alert, Button } from "react-bootstrap";

function AutoControlledVideo() {
  const playerRef = useRef(null);
  const webcamRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const handleFocusLost = () => {
    if (playerRef.current && isVideoPlaying) {
      playerRef.current.pauseVideo();
      setIsVideoPlaying(false);
    }
  };

  const handleFocusRegained = () => {
    if (playerRef.current && !isVideoPlaying) {
      playerRef.current.playVideo();
      setIsVideoPlaying(true);
    }
  };

  const { isInitialized, isFocused, error, debugInfo } = useFaceMeshDetection(
    webcamRef,
    {
      onFocusLost: handleFocusLost,
      onFocusRegained: handleFocusRegained,
    }
  );

  const onReady = (event) => {
    playerRef.current = event.target;
    playerRef.current.playVideo();
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">SYNTRIX Dashboard</h2>
          <p className="text-secondary">AI Focus Monitor is actively running.</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="shadow-sm">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {!isInitialized && !error && (
        <Alert variant="info" className="shadow-sm d-flex align-items-center">
          <div className="spinner-border spinner-border-sm me-3" role="status"></div>
          Initializing advanced face detection model...
        </Alert>
      )}

      <Row>
        {/* Left Column: Main Video Area */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm bg-dark text-white h-100">
            <Card.Body className="p-0 overflow-hidden" style={{ borderRadius: '8px 8px 0 0' }}>
              {/* Responsive 16:9 aspect ratio container for YouTube */}
              <div className="ratio ratio-16x9">
                <YouTube
                  videoId="dQw4w9WgXcQ"
                  onReady={onReady}
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: {
                      autoplay: 1,
                      controls: 0,
                      disablekb: 1,
                      modestbranding: 0,
                      rel: 0,
                    },
                  }}
                />
              </div>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-between align-items-center bg-dark border-top border-secondary py-3">
              <div className="d-flex align-items-center">
                <span className="me-2 fw-semibold">Status:</span>
                <Badge bg={isVideoPlaying ? "success" : "danger"} pill className="px-3 py-2">
                  {isVideoPlaying ? "Playing" : "Paused"}
                </Badge>
              </div>
              <div>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  className="me-2 px-3"
                  onClick={() => {
                    playerRef.current?.playVideo();
                    setIsVideoPlaying(true);
                  }}
                >
                  Play
                </Button>
                <Button 
                  variant="outline-light" 
                  size="sm"
                  className="px-3"
                  onClick={() => {
                    playerRef.current?.pauseVideo();
                    setIsVideoPlaying(false);
                  }}
                >
                  Pause
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>

        {/* Right Column: Sidebar for Monitoring */}
        <Col lg={4}>
          <WebcamMonitor
            ref={webcamRef}
            isFocused={isFocused}
            debugInfo={debugInfo}
            showPreview={true}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default AutoControlledVideo;