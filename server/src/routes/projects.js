import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Project from '../models/Project.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

export default router;