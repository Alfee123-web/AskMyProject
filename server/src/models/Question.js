import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    source: { type: String, enum: ['ai', 'manual'], default: 'manual' },
    answer: String,
    confidence: { type: Number, min: 1, max: 5 },
    lastReviewedAt: Date,
    nextReviewAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);