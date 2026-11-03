import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Project from '../models/Project.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/enrich/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const prompt = `Analyze this software project:
    Name: ${project.name}
    Description: ${project.description || 'No description provided'}
    URL: ${project.url}

    Return a raw JSON object (no markdown wrapping) with this exact structure:
    {
      "skills": ["array of up to 6 technical skills, frameworks, or tools used"],
      "bullets": ["2 professional resume bullet points highlighting technical impact"],
      "questions": ["2 likely technical interview questions about this project"],
      "narrative": "A 2-sentence summary of the developer's growth and what was built."
    }`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

   const aiData = JSON.parse(textResponse);
    project.ai = {
      bullets: aiData.bullets || [],
      // Catch variations in how Gemini might format the key
      questions: aiData.questions || aiData.interviewQuestions || aiData.interview_questions || [],
      narrative: aiData.narrative || 'Narrative pending.'
    };
    project.skills = aiData.skills || []; 
    await project.save();

    res.json(project);
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

export default router;