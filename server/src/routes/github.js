import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { decrypt } from '../services/crypto.js';

const router = express.Router();

const gh = (token, path, accept = 'application/vnd.github+json') =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

const getToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user?.accessToken) throw Object.assign(new Error('No GitHub token'), { status: 401 });
  return decrypt(user.accessToken);
};

// Mongoose Map keys cannot contain "."
const cleanKeys = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k.replace(/\./g, '_'), v]));

// GitHub is the source of truth: we fetch everything server-side by repo id
const fetchRepoData = async (token, repoId, username) => {
  const repoRes = await gh(token, `/repositories/${repoId}`);
  if (!repoRes.ok) {
    throw Object.assign(new Error(`GitHub returned ${repoRes.status} for this repository`), { status: repoRes.status });
  }
  const repo = await repoRes.json();

  const isOwner = repo.owner?.login?.toLowerCase() === username?.toLowerCase();
  if (!isOwner && !repo.permissions?.push) {
    throw Object.assign(new Error('You can only import repositories you own or contribute to'), { status: 403 });
  }

  const [readmeRes, langRes] = await Promise.all([
    gh(token, `/repos/${repo.full_name}/readme`, 'application/vnd.github.raw+json'),
    gh(token, `/repos/${repo.full_name}/languages`),
  ]);

  return {
    repoId: repo.id,
    name: repo.name,
    description: repo.description || '',
    repoUrl: repo.html_url,
    liveUrl: repo.homepage || '',
    topics: repo.topics || [],
    languages: langRes.ok ? cleanKeys(await langRes.json()) : {},
    readme: readmeRes.ok ? (await readmeRes.text()).slice(0, 20000) : '',
    stats: { stars: repo.stargazers_count, lastPushedAt: repo.pushed_at },
  };
};

const sendError = (res, err, fallback) => {
  console.error(fallback, err.message);
  res.status(err.status || 500).json({ error: err.status ? err.message : fallback });
};

router.get('/repos', requireAuth, async (req, res) => {
  try {
    const token = await getToken(req.user.id);
    const response = await gh(token, '/user/repos?sort=updated&per_page=100');
    if (!response.ok) return res.status(response.status).json({ error: 'GitHub request failed' });
    res.json(await response.json());
  } catch (err) {
    sendError(res, err, 'Failed to fetch repositories');
  }
});

router.post('/import', requireAuth, async (req, res) => {
  try {
    const repoId = Number(req.body.githubId);
    if (!Number.isInteger(repoId)) return res.status(400).json({ error: 'githubId is required' });

    if (await Project.exists({ user: req.user.id, repoId })) {
      return res.status(400).json({ error: 'Project already imported' });
    }

    const token = await getToken(req.user.id);
    const data = await fetchRepoData(token, repoId, req.user.username);
    const project = await Project.create({ user: req.user.id, ...data });
    res.status(201).json(project);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Project already imported' });
    sendError(res, err, 'Failed to import project');
  }
});

const refreshProject = async (project, token, username) => {
  const data = await fetchRepoData(token, project.repoId, username);
  if (!data.liveUrl) delete data.liveUrl; // keep a live URL you set manually
  Object.assign(project, data);
  await project.save();
};

router.post('/refresh/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await refreshProject(project, await getToken(req.user.id), req.user.username);
    res.json(project);
  } catch (err) {
    sendError(res, err, 'Failed to refresh project');
  }
});

// One-time helper: backfill README, languages, topics and repoUrl for projects imported earlier
router.post('/refresh-all', requireAuth, async (req, res) => {
  try {
    const token = await getToken(req.user.id);
    const projects = await Project.find({ user: req.user.id });
    const results = [];
    for (const project of projects) {
      try {
        await refreshProject(project, token, req.user.username);
        results.push({ name: project.name, ok: true });
      } catch (err) {
        results.push({ name: project.name, ok: false, error: err.message });
      }
    }
    res.json(results);
  } catch (err) {
    sendError(res, err, 'Failed to refresh projects');
  }
});

export default router;