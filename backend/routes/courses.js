const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: extract an 11-char YouTube video ID from a full URL or return the ID directly
const extractYouTubeId = (input) => {
  if (!input) return null;
  const trimmed = input.trim();
  // Already an 11-char ID (no slashes/dots)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
};

// ─── POST /api/courses — Admin only: create a course ────────────────────────
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, lectures } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Course title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Course description is required.' });
    }
    if (!Array.isArray(lectures) || lectures.length === 0) {
      return res.status(400).json({ message: 'At least one lecture is required.' });
    }

    // Build + validate lecture list
    const processedLectures = [];
    for (let i = 0; i < lectures.length; i++) {
      const lec = lectures[i];
      if (!lec.title || !lec.title.trim()) {
        return res.status(400).json({ message: `Lecture ${i + 1}: title is required.` });
      }
      if (!lec.videoUrl) {
        return res.status(400).json({ message: `Lecture ${i + 1}: videoUrl is required.` });
      }
      const videoId = extractYouTubeId(lec.videoUrl);
      if (!videoId) {
        return res.status(400).json({ message: `Lecture ${i + 1}: invalid YouTube URL or ID.` });
      }
      processedLectures.push({
        title: lec.title.trim(),
        videoUrl: videoId,
        order: lec.order !== undefined ? lec.order : i,
        durationSeconds: lec.durationSeconds || 0,
      });
    }

    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      lectures: processedLectures,
      createdBy: req.user.id,
    });

    await course.save();

    return res.status(201).json(course);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error creating course.' });
  }
});

// ─── GET /api/courses/enrolled — user's enrolled courses ────────────────────
// NOTE: This route MUST come before GET /api/courses/:id to avoid "enrolled"
// being parsed as a MongoDB ObjectId.
router.get('/enrolled', verifyToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id }).populate({
      path: 'course',
      select: 'title description lectures',
    });

    const result = enrollments.map((enr) => {
      const course = enr.course;
      // Build a completion map: lectureId.toString() -> completed
      const completionMap = {};
      enr.lectures.forEach((l) => {
        completionMap[l.lectureId.toString()] = l.completed;
      });

      // Attach completion to each lecture
      const lecturesWithCompletion = course
        ? course.lectures.map((lec) => ({
            _id: lec._id,
            title: lec.title,
            videoUrl: lec.videoUrl,
            order: lec.order,
            completed: completionMap[lec._id.toString()] || false,
          }))
        : [];

      const totalLectures = lecturesWithCompletion.length;
      const completedLectures = lecturesWithCompletion.filter((l) => l.completed).length;

      return {
        enrollmentId: enr._id,
        enrolledAt: enr.enrolledAt,
        completedAt: enr.completedAt,
        course: course
          ? {
              _id: course._id,
              title: course.title,
              description: course.description,
              lectures: lecturesWithCompletion,
            }
          : null,
        progress: { completed: completedLectures, total: totalLectures },
      };
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching enrollments.' });
  }
});

// ─── GET /api/courses — list all courses ────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const courses = await Course.find()
      .select('_id title description lectures createdBy')
      .populate({ path: 'createdBy', select: 'name' });

    const result = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      lectureCount: c.lectures.length,
      createdBy: c.createdBy,
    }));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching courses.' });
  }
});

// ─── GET /api/courses/:id — single course + requester's completion ───────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const course = await Course.findById(req.params.id).select('-__v');
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Fetch the user's enrollment (if any) to merge completion data
    const enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: course._id,
    });

    const completionMap = {};
    if (enrollment) {
      enrollment.lectures.forEach((l) => {
        completionMap[l.lectureId.toString()] = { completed: l.completed, completedAt: l.completedAt };
      });
    }

    const lecturesWithCompletion = course.lectures.map((lec) => {
      const comp = completionMap[lec._id.toString()] || { completed: false, completedAt: null };
      return {
        _id: lec._id,
        title: lec.title,
        videoUrl: lec.videoUrl,
        order: lec.order,
        durationSeconds: lec.durationSeconds,
        completed: comp.completed,
        completedAt: comp.completedAt,
      };
    });

    return res.json({
      _id: course._id,
      title: course.title,
      description: course.description,
      createdBy: course.createdBy,
      createdAt: course.createdAt,
      lectures: lecturesWithCompletion,
      enrolled: !!enrollment,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching course.' });
  }
});

// ─── POST /api/courses/:courseId/enroll ─────────────────────────────────────
router.post('/:courseId/enroll', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Idempotent: return 200 if already enrolled
    const existing = await Enrollment.findOne({ user: req.user.id, course: course._id });
    if (existing) {
      return res.status(200).json({ message: 'Already enrolled.', enrollment: existing });
    }

    // Initialize lecture progress from course.lectures
    const lectureProgress = course.lectures.map((lec) => ({
      lectureId: lec._id,
      completed: false,
      completedAt: null,
    }));

    const enrollment = new Enrollment({
      user: req.user.id,
      course: course._id,
      lectures: lectureProgress,
    });

    await enrollment.save();

    return res.status(201).json({ message: 'Enrolled successfully.', enrollment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during enrollment.' });
  }
});

// ─── POST /api/courses/:courseId/lectures/:lectureId/complete ────────────────
router.post('/:courseId/lectures/:lectureId/complete', verifyToken, async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: 'Course or lecture not found.' });
    }

    // Verify the course and the lecture both exist
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const lectureExists = course.lectures.some((l) => l._id.toString() === lectureId);
    if (!lectureExists) {
      return res.status(404).json({ message: 'Lecture not found in this course.' });
    }

    // Load the user's enrollment
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ message: 'You are not enrolled in this course.' });
    }

    // Find the lecture subdoc in the enrollment
    const lecSubdoc = enrollment.lectures.find((l) => l.lectureId.toString() === lectureId);
    if (!lecSubdoc) {
      return res.status(404).json({ message: 'Lecture progress record not found.' });
    }

    // Idempotent — mark complete only if not already done
    if (!lecSubdoc.completed) {
      lecSubdoc.completed = true;
      lecSubdoc.completedAt = new Date();
    }

    // Check if ALL lectures are now complete — set course completedAt if so
    const allDone = enrollment.lectures.every((l) => l.completed);
    if (allDone && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    const completedCount = enrollment.lectures.filter((l) => l.completed).length;
    const total = enrollment.lectures.length;

    return res.json({ completed: completedCount, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error marking lecture complete.' });
  }
});

module.exports = router;
