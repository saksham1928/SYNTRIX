import { forwardRef } from "react";
import Webcam from "react-webcam";
import { FACE_DETECTION_CONFIG } from "../../utils/faceDetectionConfig";
import { Card, Badge } from "react-bootstrap";

const WebcamMonitor = forwardRef(({ isFocused, debugInfo, showPreview = true }, ref) => {
  if (!showPreview) {
    return (
      <Webcam
        ref={ref}
        audio={false}
        width={FACE_DETECTION_CONFIG.WEBCAM_WIDTH}
        height={FACE_DETECTION_CONFIG.WEBCAM_HEIGHT}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: FACE_DETECTION_CONFIG.WEBCAM_WIDTH,
          height: FACE_DETECTION_CONFIG.WEBCAM_HEIGHT,
          facingMode: "user",
        }}
        style={{ display: "none" }}
      />
    );
  }

  // Determine colors based on focus state
  const borderColor = isFocused ? "border-success" : "border-danger";
  const badgeColor = isFocused ? "success" : "danger";
  const bgColor = isFocused ? "bg-success" : "bg-danger";

  return (
    <Card className={`shadow-sm border-2 ${borderColor}`}>
      <Card.Header className="d-flex justify-content-between align-items-center bg-white">
        <h6 className="mb-0 fw-bold text-dark">Camera Feed</h6>
        <Badge bg={badgeColor} pill className="px-3">
          {isFocused ? "Focused" : "Distracted"}
        </Badge>
      </Card.Header>
      
      <Card.Body className="p-2 text-center bg-dark">
        <Webcam
          ref={ref}
          audio={false}
          width="100%" // Make it fill the card width dynamically
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: FACE_DETECTION_CONFIG.WEBCAM_WIDTH,
            height: FACE_DETECTION_CONFIG.WEBCAM_HEIGHT,
            facingMode: "user",
          }}
          style={{
            borderRadius: "4px",
            objectFit: "cover",
            maxHeight: "240px" // Keep it from getting too tall
          }}
        />
      </Card.Body>
      
      <Card.Footer className={`${bgColor} text-white bg-opacity-10 py-2`}>
        <small className="font-monospace text-dark d-block text-truncate" style={{ fontSize: '0.75rem' }}>
          {debugInfo || "Waiting for detection..."}
        </small>
      </Card.Footer>
    </Card>
  );
});

WebcamMonitor.displayName = "WebcamMonitor";

export default WebcamMonitor;