export const FACE_DETECTION_CONFIG = {
  // Time thresholds (in milliseconds)
  FOCUS_LOSS_THRESHOLD: 1000,
  FOCUS_REGAIN_DELAY: 500,
  CHECK_INTERVAL: 100,

  // MediaPipe assets — served locally (no CDN dependency, works in incognito)
  // Files live in client/public/models/ and client/public/wasm/
  MODEL_PATH: "/models/face_landmarker.task",
  WASM_PATH: "/wasm",

  MIN_DETECTION_CONFIDENCE: 0.9,
  MIN_TRACKING_CONFIDENCE: 0.9,

  // Webcam settings
  WEBCAM_WIDTH: 640,
  WEBCAM_HEIGHT: 480,
  PREVIEW_WIDTH: 320,
  PREVIEW_HEIGHT: 240,

  // Focus detection thresholds — pitch is asymmetric (Y-down coordinate system)
  EYE_CLOSED_THRESHOLD: 0.15,
  YAW_THRESHOLD: 5,           // Horizontal head turn (degrees)
  PITCH_DOWN_THRESHOLD: 15,    // Looking DOWN  — pitch > 20 → distracted
  PITCH_UP_THRESHOLD: 5,       // Looking UP    — pitch < 3  → distracted
  ROLL_THRESHOLD: 30,          // Head tilt side-to-side (degrees)
};
