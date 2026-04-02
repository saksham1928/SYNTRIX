# SYNTRIX - AI Focus-Aware Learning Platform 

SYNTRIX is an intelligent, AI-powered web application designed to monitor student engagement and focus during online learning sessions. By leveraging advanced facial landmark detection in real-time, SYNTRIX ensures active participation by automatically pausing educational content when the user becomes distracted, and seamlessly resuming when focus is regained.

##  Key Features

* **Real-Time Engagement Monitoring:** Uses a webcam feed to track user attention without recording or storing any personal video data.
* **Advanced Facial Analysis:** Implements Google's MediaPipe Face Mesh (478 3D landmarks) to calculate precise facial geometry.
* **Smart Video Control:** Automatically pauses the integrated YouTube video player if the user looks away or closes their eyes for more than 1.5 seconds, and resumes playback upon regaining focus.
* **Live Metrics Dashboard:** Provides real-time visual feedback on focus status, including debugging metrics like EAR, Yaw, and Pitch.
* **Modern UI/UX:** Built with a sleek, dark-mode dashboard interface using React-Bootstrap.

##  How It Works (Under the Hood)

The core detection engine relies on mathematical analysis of facial landmarks to determine a user's focus state:

1.  **Eye Aspect Ratio (EAR):** Calculates the distance between the eyelids to detect if the user's eyes are open, closed, or drowsy.
2.  **Head Pose Estimation:** * **Yaw:** Detects horizontal head rotation (shaking head or looking off-screen left/right).
    * **Pitch:** Detects vertical head movement (looking up at the ceiling or down at a phone).
    * **Roll:** Detects excessive head tilt.
3.  **Threshold Logic:** If the calculated EAR drops below the threshold, or if Yaw/Pitch/Roll exceed acceptable degrees for a sustained duration (1500ms), the system flags a "Focus Lost" event.

##  Tech Stack

* **Frontend Framework:** React.js (v19)
* **Styling:** React-Bootstrap & CSS
* **AI / Machine Learning:** `@mediapipe/tasks-vision` (Face Landmarker Model)
* **Media Components:** `react-youtube`, `react-webcam`

##  Project Structure

\`\`\`text
src/
├── components/
│   ├── AutoControlledVideo/   # Main dashboard orchestrator gluing AI and Video
│   ├── Navbar/                # Top navigation and branding
│   └── WebcamMonitor/         # Visual camera feed and status indicator
├── hooks/
│   ├── useFaceMeshDetection.js # Custom hook managing the MediaPipe AI loop
│   └── useFaceDetection.js     # Legacy/Basic face detection hook
├── utils/
│   ├── facialAnalysis.js       # Core math logic (EAR, Head Pose calculations)
│   └── faceDetectionConfig.js  # Centralized configuration and model URLs
├── App.js                     # Root component and layout wrapper
└── index.js                   # Application entry point
\`\`\`

##  Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1.  Clone the repository:
    \`\`\`bash
    git clone https://github.com/saksham1928/SYNTRIX.git
    cd SYNTRIX
    \`\`\`

2.  Install the dependencies:
    \`\`\`bash
    npm install
    \`\`\`

3.  Start the development server:
    \`\`\`bash
    npm start
    \`\`\`

4.  Open [http://localhost:3000](http://localhost:3000) to view it in your browser. *Note: Ensure you grant your browser permission to access your camera.*

##  Future Enhancements (Roadmap)

* **Backend Integration:** Connect to a Node.js/Express backend with MongoDB to store user session data and generate focus analytics reports.
* **Authentication:** Add user login to track individual learning progress over time.
* **Custom Video Uploads:** Expand beyond YouTube to allow local video file uploads (`.mp4`) for offline courses.