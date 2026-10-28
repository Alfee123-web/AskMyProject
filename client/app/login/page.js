export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">AskMyProject</h1>
      <p className="text-gray-500">Know your projects. Ace your interviews.</p>
      <a
        href="/api/auth/github"
        className="rounded bg-black px-6 py-3 text-white hover:bg-gray-800"
      >
        Sign in with GitHub
      </a>
    </main>
  );
}
