const mongoose = require('mongoose');

// ---------- Question subdocument ----------
const questionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  questionText: { type: String, required: true, trim: true },
  options: [{ type: String, required: true, trim: true }], // 2 – 4 option strings
  correctOptionIndex: { type: Number, required: true },    // 0-based index of the correct option
});

// ---------- Lecture subdocument ----------
const lectureSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, required: true }, // YouTube VIDEO ID (11 chars)
  order: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
  questions: [questionSchema],                             // Every lecture must have >= 1 question
  totalObtainableScore: { type: Number, default: 0 },     // Synced = questions.length on save
});

// ---------- Course schema ----------
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  lectures: [lectureSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Sort lectures by order and sync totalObtainableScore before saving
// (Mongoose 9: use async, no next callback)
courseSchema.pre('save', async function () {
  if (this.lectures && this.lectures.length > 0) {
    // Sync each lecture's totalObtainableScore to the number of questions
    this.lectures.forEach((lec) => {
      lec.totalObtainableScore = Array.isArray(lec.questions) ? lec.questions.length : 0;
    });

    // Keep lectures sorted by their display order
    if (this.lectures.length > 1) {
      this.lectures.sort((a, b) => a.order - b.order);
    }
  }
});

module.exports = mongoose.model('Course', courseSchema);
