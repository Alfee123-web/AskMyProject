# AskMyProject

A dashboard that turns your GitHub repositories into an interview-ready portfolio.

## Features
- GitHub OAuth login and repository import
- Automatic skill tagging per project
- Growth timeline of how your stack evolved
- AI-generated resume bullets and interview questions (Google Gemini)
- Completeness score per project
- Redundancy alerts using tag-overlap (Jaccard) similarity

## Tech stack
Next.js, React, Tailwind CSS, Node.js, Express, MongoDB Atlas, Mongoose,
Passport (GitHub OAuth), JWT cookies, Google Gemini API

## How it works
1. Sign in with GitHub and import repositories
2. The server saves each repo's README, languages and topics
3. Gemini generates insights using only that saved evidence
4. The dashboard shows skills, timeline, questions and scores

## Run locally
1. Clone the repo
2. Add a `.env` file in `server` with MONGO_URI, GITHUB_CLIENT_ID,
   GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL, JWT_SECRET, TOKEN_KEY, GEMINI_API_KEY
3. Add `API_URL=http://localhost:5000` to `client/.env.local`
4. Run `npm install` and `npm run dev` in both `client` and `server`
