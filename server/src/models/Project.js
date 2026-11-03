import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  url: String,
  skills: [String],
  ai: {
    narrative: String,
    bullets: [String],
    questions: [String]
  }
}, { timestamps: true });

// Prevent Mongoose from compiling the model multiple times during hot-reloads
export default mongoose.models.Project || mongoose.model('Project', projectSchema);