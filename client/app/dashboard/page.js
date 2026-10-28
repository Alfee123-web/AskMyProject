'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setUser)
      .catch(() => router.replace('/login'));
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
  };

  if (!user) return <p className="p-8">Loading...</p>;

  return (
    <main className="p-8">
      <div className="flex items-center gap-4">
        <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full" />
        <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>
      </div>
      <button onClick={logout} className="mt-6 rounded border px-4 py-2">
        Log out
      </button>
    </main>
  );
}