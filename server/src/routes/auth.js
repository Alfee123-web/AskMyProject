import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import '../config/passport.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';

// One set of cookie options, shared by login and logout so they always match
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

router.get('/github', passport.authenticate('github', { session: false }));

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

router.get('/me', requireAuth, (req, res) => res.json(req.user));

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
});

export default router;