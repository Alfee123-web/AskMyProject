import 'dotenv/config';

const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
  headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
});
const d = await r.json();
console.log(
  (d.models || [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name)
    .join('\n') || JSON.stringify(d)
);