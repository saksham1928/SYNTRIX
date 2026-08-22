const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, required: true }, // YouTube VIDEO ID (11 chars)
  order: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
});

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

// Sort lectures by order before saving (Mongoose 9: use async, no next callback)
courseSchema.pre('save', async function () {
  if (this.lectures && this.lectures.length > 1) {
    this.lectures.sort((a, b) => a.order - b.order);
  }
});

module.exports = mongoose.model('Course', courseSchema);
