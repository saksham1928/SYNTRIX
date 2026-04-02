export const FACE_DETECTION_CONFIG = {
  // Time thresholds (in milliseconds)
  FOCUS_LOSS_THRESHOLD: 1500,
  FOCUS_REGAIN_DELAY: 500,
  CHECK_INTERVAL: 100,
  
  // MediaPipe Face Mesh settings (upgraded from BlazeFace)
  MODEL_PATH: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  WASM_PATH: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  MIN_DETECTION_CONFIDENCE: 0.9,
  MIN_TRACKING_CONFIDENCE: 0.9,
  
  // Webcam settings
  WEBCAM_WIDTH: 640,
  WEBCAM_HEIGHT: 480,
  PREVIEW_WIDTH: 320,
  PREVIEW_HEIGHT: 240,
  
  // Focus detection thresholds
  EYE_CLOSED_THRESHOLD: 0.15,
  YAW_THRESHOLD: 10,      // Horizontal head turn (degrees)
  PITCH_THRESHOLD: 20,    // Vertical head turn (degrees)
  ROLL_THRESHOLD: 40,     // Head tilt (degrees)
};