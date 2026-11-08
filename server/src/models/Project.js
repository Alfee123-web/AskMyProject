import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repoId: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    url: String, // legacy field from the first import version
    repoUrl: String,
    liveUrl: String,
    repoCreatedAt: Date, // when the repo was created on GitHub (used for the growth timeline)
    topics: [String],
    languages: { type: Map, of: Number },
    readme: String,
    stats: { stars: Number, lastPushedAt: Date },
    skills: [String],
    ai: {
      narrative: String,
      bullets: [String],
      questions: [String],
      generatedAt: Date,
    },
    // Team / Collaborator View array
    collaborators: [{
      name: String,
      role: String,
      skills: [String]
    }]
  },
  { timestamps: true }
);

// One project per repo per user: duplicate imports are rejected by the database itself
projectSchema.index({ user: 1, repoId: 1 }, { unique: true });

// Prevent Mongoose from compiling the model multiple times during hot-reloads
export default mongoose.models.Project || mongoose.model('Project', projectSchema);