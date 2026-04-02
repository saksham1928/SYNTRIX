import {FACE_DETECTION_CONFIG} from './faceDetectionConfig';
export function calculateEyeAspectRatio(eyeLandmarks) {
  // Eye landmarks (6 points per eye)
  // For left eye: points [33, 160, 158, 133, 153, 144]
  // For right eye: points [362, 385, 387, 263, 373, 380]
  
  const p1 = eyeLandmarks[1]; // Top
  const p2 = eyeLandmarks[5]; // Bottom
  const p3 = eyeLandmarks[0]; // Left corner
  const p4 = eyeLandmarks[3]; // Right corner

  // Vertical distances
  const v1 = distance(p1, p2);
  
  // Horizontal distance
  const h1 = distance(p3, p4);

  // EAR formula
  const ear = v1 / h1;
  
  return ear;
}

/**
 * Calculate head pose angles (yaw, pitch, roll)
 * to detect if user is looking away
 */
export function calculateHeadPose(faceLandmarks) {
  // Key face points for pose estimation
  const noseTip = faceLandmarks[1];      // Nose tip
  const chin = faceLandmarks[152];       // Chin
  const leftEye = faceLandmarks[33];     // Left eye
  const rightEye = faceLandmarks[263];   // Right eye
  const leftMouth = faceLandmarks[61];   // Left mouth corner
  const rightMouth = faceLandmarks[291]; // Right mouth corner

  // Calculate yaw (horizontal head rotation: left/right)
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const mouthCenterX = (leftMouth.x + rightMouth.x) / 2;
  const noseTipX = noseTip.x;
  
  // If nose is far from center, head is turned
  const yaw = (noseTipX - eyeCenterX) * 100; // Scale to degrees (approximate)

  // Calculate pitch (vertical head rotation: up/down)
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const noseTipY = noseTip.y;
  
  const pitch = (noseTipY - eyeCenterY) * 100; // Scale to degrees (approximate)

  // Calculate roll (head tilt: side to side)
  const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);
  const roll = Math.atan(eyeSlope) * (180 / Math.PI);

  return { yaw, pitch, roll };
}

/**
 * Helper function to calculate Euclidean distance
 */
function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );
}

/**
 * Main focus detection function
 * Returns whether user is focused based on multiple factors
 */
export function detectFocus(faceLandmarks) {
  // Thresholds (adjust these based on testing)
  const EYE_CLOSED_THRESHOLD = FACE_DETECTION_CONFIG.EYE_CLOSED_THRESHOLD;
  const YAW_THRESHOLD = FACE_DETECTION_CONFIG.YAW_THRESHOLD;
  const PITCH_THRESHOLD = FACE_DETECTION_CONFIG.PITCH_THRESHOLD;
  const ROLL_THRESHOLD = FACE_DETECTION_CONFIG.ROLL_THRESHOLD;

  // Extract eye landmarks
  const leftEyeLandmarks = [
    faceLandmarks[33],  // Left corner
    faceLandmarks[160], // Top
    faceLandmarks[158], // Top-right
    faceLandmarks[133], // Right corner
    faceLandmarks[153], // Bottom-right
    faceLandmarks[144], // Bottom
  ];

  const rightEyeLandmarks = [
    faceLandmarks[362], // Right corner
    faceLandmarks[385], // Top
    faceLandmarks[387], // Top-left
    faceLandmarks[263], // Left corner
    faceLandmarks[373], // Bottom-left
    faceLandmarks[380], // Bottom
  ];

  // Calculate eye openness
  const leftEAR = calculateEyeAspectRatio(leftEyeLandmarks);
  const rightEAR = calculateEyeAspectRatio(rightEyeLandmarks);
  const avgEAR = (leftEAR + rightEAR) / 2;

  // Calculate head pose
  const { yaw, pitch, roll } = calculateHeadPose(faceLandmarks);

  // Determine focus status
  const eyesClosed = avgEAR < EYE_CLOSED_THRESHOLD;
  const lookingAway = 
    Math.abs(yaw) > YAW_THRESHOLD || 
    Math.abs(pitch) > PITCH_THRESHOLD;
  const headTilted = Math.abs(roll) > ROLL_THRESHOLD;

  const isFocused = !eyesClosed && !lookingAway && !headTilted;

  return {
    isFocused,
    details: {
      eyeAspectRatio: avgEAR.toFixed(3),
      eyesClosed,
      yaw: yaw.toFixed(1),
      pitch: pitch.toFixed(1),
      roll: roll.toFixed(1),
      lookingAway,
      headTilted,
    },
  };
}