import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { decrypt } from '../services/crypto.js';

const router = express.Router();

router.get('/repos', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const accessToken = decrypt(user.accessToken);

    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const repos = await response.json();
    res.json(repos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

router.post('/import', requireAuth, async (req, res) => {
  try {
    const { githubId, name, description, url } = req.body;
    
    // Check using repoId to match your schema
    const existingProject = await Project.findOne({ repoId: githubId, user: req.user.id });
    if (existingProject) {
      return res.status(400).json({ error: 'Project already imported' });
    }
    
    const newProject = new Project({
      user: req.user.id,
      repoId: githubId, 
      name,
      description,
      url
    });
    
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import project' });
  }
});

export default router;