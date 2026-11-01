const mongoose = require('mongoose');

// ---------- Question-level score subdocument ----------
const questionScoreSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOption: { type: Number, default: null }, // 0-based index, or null if timed-out without selection
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },             // 1 if correct, 0 if incorrect / unattempted
  },
  { _id: false }
);

// ---------- Per-lecture progress subdocument ----------
const enrollmentLectureSchema = new mongoose.Schema(
  {
    lectureId: { type: mongoose.Schema.Types.ObjectId, required: true },
    videoWatched: { type: Boolean, default: false },   // true when the video reaches ENDED
    quizScore: { type: Number, default: 0 },           // sum of correct answers for this attempt
    totalScore: { type: Number, default: 0 },          // total obtainable score (= questions.length)
    quizPassed: { type: Boolean, default: false },     // true when quizScore / totalScore >= 0.5
    questionScores: [questionScoreSchema],             // detailed attempt record per question
    completed: { type: Boolean, default: false },      // true ONLY when videoWatched AND quizPassed
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ---------- Enrollment schema ----------
const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  enrolledAt: { type: Date, default: Date.now },
  lectures: [enrollmentLectureSchema],
  completedAt: { type: Date, default: null }, // set when ALL lectures are completed
});

// Compound unique index — a user can only enroll once per course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
