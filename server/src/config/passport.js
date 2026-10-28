import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';
import { encrypt } from '../services/crypto.js';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['read:user', 'user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOneAndUpdate(
          { githubId: profile.id },
          {
            username: profile.username,
            avatarUrl: profile.photos?.[0]?.value,
            email: profile.emails?.[0]?.value,
            accessToken: encrypt(accessToken),
          },
          { upsert: true, new: true }
        );
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);