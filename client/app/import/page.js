'use client';
import { useState, useEffect } from 'react';

export default function ImportRepos() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/api/github/repos', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleImport = async (repo) => {
    setImportStatus(prev => ({ ...prev, [repo.id]: 'Importing...' }));
    try {
      const res = await fetch('http://localhost:5000/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          githubId: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.html_url
        })
      });
      
      if (res.ok) {
        setImportStatus(prev => ({ ...prev, [repo.id]: 'Imported!' }));
      } else {
        const error = await res.json();
        setImportStatus(prev => ({ ...prev, [repo.id]: error.error || 'Failed' }));
      }
    } catch (err) {
      setImportStatus(prev => ({ ...prev, [repo.id]: 'Error' }));
    }
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Loading repositories...</div>;

  return (
    <div className="p-10 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">Import & Select Repos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.length > 0 ? (
          repos.map(repo => (
            <div key={repo.id} className="border border-gray-700 p-4 rounded-lg bg-gray-900">
              <h2 className="text-xl font-semibold">{repo.name}</h2>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {repo.description || 'No description provided.'}
              </p>
              <button 
                onClick={() => handleImport(repo)}
                disabled={importStatus[repo.id] === 'Imported!' || importStatus[repo.id] === 'Importing...'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                {importStatus[repo.id] || 'Import to AskMyProject'}
              </button>
            </div>
          ))
        ) : (
          <p>No repositories found.</p>
        )}
      </div>
    </div>
  );
}