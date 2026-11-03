import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import githubRoutes from './routes/github.js';
import projectRoutes from './routes/projects.js';
import aiRoutes from './routes/ai.js';


const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(passport.initialize());
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);


app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);

app.use(errorHandler);

export default app;