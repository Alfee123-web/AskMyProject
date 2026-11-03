'use client';
import { useState, useEffect } from 'react';

// A project counts as "enriched" only if real AI content exists
const hasInsights = (p) =>
  !!(p.ai && (p.ai.narrative || (p.ai.bullets && p.ai.bullets.length > 0)));

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState({});
  const [aiError, setAiError] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);

  const fetchProjects = () => {
    fetch('/api/projects', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleGenerateAI = async (projectId) => {
    setAiLoading((prev) => ({ ...prev, [projectId]: true }));
    setAiError((prev) => ({ ...prev, [projectId]: null }));
    try {
      const res = await fetch(`/api/ai/enrich/${projectId}?force=true`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        fetchProjects();
      } else {
        const data = await res.json().catch(() => ({}));
        setAiError((prev) => ({
          ...prev,
          [projectId]: data.error || 'Failed to generate insights',
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      setAiError((prev) => ({ ...prev, [projectId]: 'Network error. Try again.' }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  if (loading)
    return <div className="p-10 text-white bg-black min-h-screen">Loading dashboard...</div>;

  // 1. Aggregate unique skills for Skill Map
  const skillCounts = {};
  projects.forEach((p) => {
    if (p.skills) {
      p.skills.forEach((skill) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });
  const uniqueSkills = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]);

  // 2. Filter projects based on selected skill
  const filteredProjects = selectedSkill
    ? projects.filter((p) => p.skills && p.skills.includes(selectedSkill))
    : projects;

  // 3. Aggregate all AI questions for the Interview Prep Widget
  const allQuestions = [];
  projects.forEach((p) => {
    if (p.ai && p.ai.questions) {
      p.ai.questions.forEach((q) => {
        allQuestions.push({ projectName: p.name, question: q });
      });
    }
  });

  // 4. Redundancy (skill overlap / Jaccard similarity)
  const redundancyAlerts = [];
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const skills1 = projects[i].skills || [];
      const skills2 = projects[j].skills || [];

      if (skills1.length > 0 && skills2.length > 0) {
        const intersection = skills1.filter((s) => skills2.includes(s));
        const union = new Set([...skills1, ...skills2]);
        const similarity = Math.round((intersection.length / union.size) * 100);

        // Flag pairs with more than 50% skill overlap
        if (similarity > 50) {
          redundancyAlerts.push({
            p1: projects[i].name,
            p2: projects[j].name,
            score: similarity,
            shared: intersection.join(', '),
          });
        }
      }
    }
  }
  redundancyAlerts.sort((a, b) => b.score - a.score);

  // Summary metrics
  const readiness =
    projects.length > 0
      ? Math.round(
          (projects.filter((p) => p.ai?.questions?.length > 0).length / projects.length) * 100
        )
      : 0;

  const overallHealth =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => {
            let score = 0;
            if (p.description) score += 25;
            if (p.repoUrl) score += 25;
            if (p.skills?.length > 0) score += 25;
            if (hasInsights(p)) score += 25;
            return acc + score;
          }, 0) / projects.length
        )
      : 0;

  return (
    <div className="p-10 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">AskMyProject Dashboard</h1>

      {/* Summary Bar */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6 flex justify-between items-center border border-gray-700">
        <div>
          <p className="text-gray-400 text-sm">Total Projects</p>
          <p className="text-2xl font-bold text-blue-400">{projects.length}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Interview Readiness</p>
          <p className="text-2xl font-bold text-purple-400">{readiness}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Overall Health Score</p>
          <p className="text-2xl font-bold text-green-400">{overallHealth}/100</p>
        </div>
      </div>

      {/* Top Widgets Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Skill Map */}
        <div className="lg:col-span-1 bg-gray-800 p-5 rounded-lg border border-gray-700 flex flex-col max-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Skill Map</h2>
            {selectedSkill && (
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            {uniqueSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniqueSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedSkill === skill
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-900 text-gray-300 hover:bg-gray-700 border-gray-600'
                    } border`}
                  >
                    {skill} <span className="ml-1 opacity-60">({skillCounts[skill]})</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                No skills detected yet. Generate AI insights to build your map.
              </p>
            )}
          </div>
        </div>

        {/* Interview Prep Widget */}
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 flex flex-col max-h-[300px]">
          <h2 className="text-xl font-bold text-white mb-3">Interview Q&A Bank</h2>
          {allQuestions.length > 0 ? (
            <div className="overflow-y-auto pr-2 space-y-3 flex-grow custom-scrollbar">
              {allQuestions.map((item, i) => (
                <div key={i} className="bg-gray-900 p-3 rounded border border-gray-700">
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1 block">
                    {item.projectName}
                  </span>
                  <p className="text-gray-200 text-sm">{item.question}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No interview questions generated yet.</p>
          )}
        </div>

        {/* Redundancy Alerts Widget */}
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 flex flex-col max-h-[300px]">
          <h2 className="text-xl font-bold text-white mb-3">Redundancy Alerts</h2>
          {redundancyAlerts.length > 0 ? (
            <div className="overflow-y-auto pr-2 space-y-3 flex-grow custom-scrollbar">
              {redundancyAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="bg-gray-900 p-3 rounded border border-red-900/50 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-gray-200">
                      {alert.p1} ↔ {alert.p2}
                    </span>
                    <span className="text-xs font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
                      {alert.score}% Match
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Shared: {alert.shared}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Portfolio is lean. No highly overlapping projects detected.
            </p>
          )}
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="mb-6 bg-gray-800 p-5 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Growth Timeline</h2>
        {projects.filter((p) => p.ai && p.ai.narrative).length > 0 ? (
          <div className="relative border-l border-gray-600 ml-3 space-y-6">
            {projects
              .filter((p) => p.ai && p.ai.narrative)
              .map((project, i) => (
                <div key={i} className="pl-6 relative">
                  {/* Timeline Dot */}
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-gray-800"></div>
                  <h3 className="text-md font-bold text-blue-300">{project.name}</h3>
                  <p className="text-sm text-gray-300 mt-1">{project.ai.narrative}</p>
                  {project.skills && project.skills.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      Stack: {project.skills.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            No narratives found. Generate AI insights to build your growth timeline.
          </p>
        )}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const enriched = hasInsights(project);
            const healthChecks = [
              { label: 'Description', passed: !!project.description },
              { label: 'Repo Link', passed: !!project.repoUrl },
              { label: 'Skills', passed: !!(project.skills && project.skills.length > 0) },
              { label: 'AI Insights', passed: enriched },
            ];
            const score = Math.round(
              (healthChecks.filter((c) => c.passed).length / healthChecks.length) * 100
            );

            return (
              <div
                key={project._id}
                className="border border-gray-700 p-5 rounded-lg bg-gray-900 flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  {enriched && (
                    <button
                      onClick={() => handleGenerateAI(project._id)}
                      disabled={aiLoading[project._id]}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors"
                    >
                      {aiLoading[project._id] ? 'Updating...' : 'Regenerate'}
                    </button>
                  )}
                </div>

                {aiError[project._id] && (
                  <p className="text-xs text-red-400 mb-2">{aiError[project._id]}</p>
                )}

                {/* Completeness Score UI */}
                <div className="mb-4 bg-gray-800 p-3 rounded border border-gray-700">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Completeness Score</span>
                    <span
                      className={
                        score === 100 ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'
                      }
                    >
                      {score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div
                      className={
                        score === 100
                          ? 'bg-green-400 h-1.5 rounded-full'
                          : 'bg-yellow-400 h-1.5 rounded-full'
                      }
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {healthChecks.map((check, i) => (
                      <span
                        key={i}
                        className={check.passed ? 'text-green-400' : 'text-gray-500 line-through'}
                      >
                        {check.label}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                {project.skills && project.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-blue-900/40 text-blue-300 text-xs px-2 py-1 rounded border border-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {enriched ? (
                  <div className="mt-2 bg-gray-800 p-4 rounded text-sm flex-grow">
                    <p className="font-bold text-blue-400 mb-1">Growth Narrative:</p>
                    <p className="mb-4 text-gray-300">
                      {project.ai.narrative || 'Narrative pending.'}
                    </p>

                    <p className="font-bold text-green-400 mb-1">Resume Bullets:</p>
                    <ul className="list-disc pl-4 mb-4 text-gray-300">
                      {(project.ai.bullets || []).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>

                    <p className="font-bold text-purple-400 mb-1">Interview Questions:</p>
                    <ul className="list-disc pl-4 text-gray-300">
                      {(project.ai.questions || []).map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateAI(project._id)}
                    disabled={aiLoading[project._id]}
                    className="mt-auto bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm w-full font-semibold transition-colors"
                  >
                    {aiLoading[project._id] ? 'Generating...' : 'Generate AI Insights'}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-sm">
            No projects match this filter or no projects imported yet.
          </p>
        )}
      </div>
    </div>
  );
}