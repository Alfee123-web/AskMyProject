import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import githubRoutes from './routes/github.js';
import projectRoutes from './routes/projects.js';
import aiRoutes from './routes/ai.js';

const app = express();

// Render sits behind a proxy: needed so rate limiting sees the real visitor IP
app.set('trust proxy', 1);

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Health check first: no limits, used by uptime pings to keep Render awake
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(passport.initialize());

const limiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

// General limit for the whole API
app.use('/api', limiter(15, 300, 'Too many requests. Please slow down.'));

// Stricter limits on expensive or sensitive routes
app.use('/api/ai', limiter(15, 10, 'AI limit reached. Try again in a few minutes.'));
app.use('/api/auth', limiter(15, 30, 'Too many login attempts. Try again later.'));
app.use('/api/github/import', limiter(15, 30, 'Too many imports. Try again later.'));

app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);

app.use(errorHandler);

export default app;