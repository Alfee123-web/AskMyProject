import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Project from '../models/Project.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ repoCreatedAt: -1, createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Add a collaborator to a specific project
router.post('/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { name, role, skills } = req.body;

    if (!name?.trim() || !role?.trim()) {
      return res.status(400).json({ error: 'Teammate name and role are required' });
    }

    // Ensure the skills are formatted as an array
    const skillsArray = Array.isArray(skills)
      ? skills
      : String(skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    project.collaborators.push({
      name: name.trim(),
      role: role.trim(),
      skills: skillsArray,
    });

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Collaborator Error:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Delete one of the user's own projects
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ deleted: deleted.name, id: deleted._id });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;