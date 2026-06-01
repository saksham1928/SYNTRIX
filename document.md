# SYNTRIX - Project Documentation & Workflow

This document outlines the current state, architecture, and workflows of the SYNTRIX (AI Focus-Aware Learning Platform) project. It serves as a high-level reference to understand what has been implemented so far and provides a foundation for planning future features and requirements.

---

## 1. Project Overview

SYNTRIX is an intelligent online learning application designed to ensure active student engagement. It utilizes real-time facial analysis to monitor a user's attention. When the system detects that the user is distracted or not looking at the screen, it automatically pauses the educational video content. Once focus is regained, the video seamlessly resumes playing.

---

## 2. System Architecture

The project is structured as a full-stack application divided into two main environments:

### 2.1. Client-Side (Frontend)
The user-facing application where students interact with the content and where the AI monitoring takes place locally in their browser.
- **Framework:** React.js
- **Styling & UI:** React-Bootstrap (modern, dark-themed responsive UI)
- **AI/Monitoring:** Google MediaPipe (Face Mesh detection) running directly in the browser to ensure privacy (no video data is sent to the server).
- **Routing:** Handled via React Router to manage public and private (authenticated) views.

### 2.2. Server-Side (Backend)
The central server responsible for securely managing user data and authentication.
- **Environment:** Node.js with Express.js
- **Database:** MongoDB (using MongoDB Atlas cloud database)
- **Authentication:** JSON Web Tokens (JWT) for secure session management and password hashing for security.

---

## 3. Implemented Features

### 3.1. User Authentication System
- **Registration:** Users can create an account providing their name, email, and password. Passwords are securely hashed before storage.
- **Login:** Users authenticate using their email and password. Upon success, they receive a secure token that keeps them logged in during their session.
- **Protected Routes:** Certain pages (like the Dashboard, Courses, and Analytics) are locked and cannot be accessed unless the user is actively logged in.

### 3.2. AI-Powered Focus Monitoring
- **Webcam Integration:** The application requests local webcam access to monitor the user.
- **Facial Landmark Detection:** The system tracks precise facial geometry without recording the user.
- **Focus Metrics:** It calculates if the user's eyes are open or closed, and tracks the rotation and pitch of their head (e.g., looking away, looking down at a phone).
- **Visual Feedback:** A real-time badge indicates to the user whether they are currently "Focused" or "Distracted".

### 3.3. Smart Video Control Integration
- **Auto-Pause/Play:** An integrated YouTube video player listens to the focus monitor. If distraction is detected for a set threshold (e.g., 1.5 seconds), the video pauses. It resumes automatically when the user looks back at the screen.
- **Manual Overrides:** Users still have manual control to pause or play the video if needed.

---

## 4. Core Workflows

### Workflow 1: Onboarding and Authentication
1. User arrives at the web application.
2. If they try to access the Dashboard without an account, they are redirected to the **Login / Register** page.
3. User enters credentials. The backend verifies them.
4. On success, the user is granted a secure token and redirected to the **Dashboard**.

### Workflow 2: Learning and Focus Monitoring
1. Once on the **Dashboard**, the application initializes the AI models.
2. The webcam feed activates (showing a small preview to the user).
3. The educational video begins playing.
4. **Distraction Event:** The user looks away from the screen for more than 1.5 seconds.
5. The AI system flags "Focus Lost".
6. The video player immediately pauses, and the status indicator turns red ("Distracted").
7. **Regaining Focus:** The user looks back at the screen.
8. The AI system flags "Focus Regained".
9. The video player resumes, and the status indicator turns green ("Focused").

---

## 5. High-Level Application Structure

### Main Pages (Views)
- **Dashboard:** The primary interface containing the video player and the AI focus monitor.
- **Courses:** A placeholder view for the catalog of available educational content.
- **Analytics:** A placeholder view intended to show students their focus statistics and learning progress over time.
- **Profile:** A view for managing user account settings.
- **Auth (Login/Register):** The entry point screens for authentication.

### Core Components
- **AutoControlledVideo:** The central orchestrator on the dashboard. It holds the video player and listens to the AI to trigger play/pause actions.
- **WebcamMonitor:** The visual component displaying the camera feed and the live focus status badge.
- **Navbar:** The consistent top navigation menu for moving between pages and logging out.

---

## 6. Future Planning & Requirements

*(Use this section to outline upcoming features, database changes, or workflow modifications you plan to implement.)*

- **[Add your future requirements here]**
- **[Add your database structure ideas here]**
- **[Add new workflow plans here]**
