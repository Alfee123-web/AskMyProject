import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repoId: { type: Number, required: true },
    name: String,
    description: String,
    repoUrl: String,
    liveUrl: String,
    languages: { type: Map, of: Number },
    topics: [String],
    skills: [String],
    stats: { stars: Number, commits: Number, lastPushedAt: Date },
    readme: String,
    notes: String,
    decisions: [{ title: String, why: String, alternatives: String }],
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    embedding: { type: [Number], select: false },
    ai: { narrative: String, bullets: [String], generatedAt: Date },
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, repoId: 1 }, { unique: true });
projectSchema.index({ user: 1, skills: 1 });

export default mongoose.model('Project', projectSchema);