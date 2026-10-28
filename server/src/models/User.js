import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    githubId: { type: String, required: true, unique: true },
    username: String,
    avatarUrl: String,
    email: String,
    accessToken: String,
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);