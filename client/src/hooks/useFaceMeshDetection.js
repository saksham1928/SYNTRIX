import { useRef, useEffect, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { detectFocus } from "../utils/facialAnalysis";
import { FACE_DETECTION_CONFIG } from "../utils/faceDetectionConfig";

export function useFaceMeshDetection(webcamRef, options = {}) {
  const {
    onFocusLost,
    onFocusRegained,
    focusLossThreshold = FACE_DETECTION_CONFIG.FOCUS_LOSS_THRESHOLD,
  } = options;

  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastFocusTimeRef = useRef(Date.now());
  const wasFocusedRef = useRef(true);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;

    const initializeFaceLandmarker = async () => {
      try {
        console.log("Loading MediaPipe Face Mesh model...");
        
        const vision = await FilesetResolver.forVisionTasks(
          FACE_DETECTION_CONFIG.WASM_PATH
        );

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_DETECTION_CONFIG.MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: FACE_DETECTION_CONFIG.MIN_DETECTION_CONFIDENCE,
          minFacePresenceConfidence: FACE_DETECTION_CONFIG.MIN_DETECTION_CONFIDENCE,
          minTrackingConfidence: FACE_DETECTION_CONFIG.MIN_TRACKING_CONFIDENCE,
        });

        if (isMounted) {
          faceLandmarkerRef.current = landmarker;
          setIsInitialized(true);
          console.log("Face Mesh model loaded successfully");
        }
      } catch (err) {
        console.error("Error initializing face landmarker:", err);
        if (isMounted) {
          setError(err.message);
        }
      }
    };

    initializeFaceLandmarker();

    return () => {
      isMounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  // Detection loop with facial analysis
  const detectFaceAndFocus = useCallback(async () => {
    if (
      !webcamRef.current ||
      !webcamRef.current.video ||
      webcamRef.current.video.readyState !== 4 ||
      !faceLandmarkerRef.current
    ) {
      animationRef.current = requestAnimationFrame(detectFaceAndFocus);
      return;
    }

    const video = webcamRef.current.video;
    const nowInMs = Date.now();

    try {
      // Detect face landmarks (478 points)
      const results = faceLandmarkerRef.current.detectForVideo(video, nowInMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        // Analyze first face for focus
        const landmarks = results.faceLandmarks[0];
        const focusResult = detectFocus(landmarks);

        setIsFocused(focusResult.isFocused);

        if (focusResult.isFocused) {
          // User is focused
          lastFocusTimeRef.current = nowInMs;

          // Check if focus was just regained
          if (!wasFocusedRef.current) {
            wasFocusedRef.current = true;
            onFocusRegained?.();
          }

          setDebugInfo(
            `Focused | Eyes: ${focusResult.details.eyeAspectRatio} | ` +
            `Yaw: ${focusResult.details.yaw}° |Roll: ${focusResult.details.roll}° |Pitch: ${focusResult.details.pitch}°`
          );
        } else {
          // User lost focus
          const timeSinceFocus = nowInMs - lastFocusTimeRef.current;

          const reasons = [];
          if (focusResult.details.eyesClosed) reasons.push("Eyes closed");
          if (focusResult.details.lookingAway) reasons.push("Looking away");
          if (focusResult.details.headTilted) reasons.push("Head tilted");

          setDebugInfo(
            ` Not Focused (${timeSinceFocus}ms) | Reason: ${reasons.join(", ")} | ` +
            `EAR: ${focusResult.details.eyeAspectRatio} | ` +
            `Yaw: ${focusResult.details.yaw}° |Roll: ${focusResult.details.roll}° | Pitch: ${focusResult.details.pitch}°`
          );

          // Check if focus was lost for too long
          if (timeSinceFocus > focusLossThreshold && wasFocusedRef.current) {
            wasFocusedRef.current = false;
            onFocusLost?.();
          }
        }
      } else {
        // No face detected at all
        setIsFocused(false);
        const timeSinceFocus = nowInMs - lastFocusTimeRef.current;
        
        setDebugInfo(` No face detected (${timeSinceFocus}ms)`);

        if (timeSinceFocus > focusLossThreshold && wasFocusedRef.current) {
          wasFocusedRef.current = false;
          onFocusLost?.();
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
      setDebugInfo(`Error: ${err.message}`);
    }

    animationRef.current = requestAnimationFrame(detectFaceAndFocus);
  }, [webcamRef, onFocusLost, onFocusRegained, focusLossThreshold]);

  // Start detection when initialized
  useEffect(() => {
    if (isInitialized) {
      detectFaceAndFocus();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, detectFaceAndFocus]);

  return {
    isInitialized,
    isFocused,
    error,
    debugInfo,
  };
}