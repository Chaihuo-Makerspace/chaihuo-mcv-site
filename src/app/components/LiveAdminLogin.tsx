import { LogIn } from 'lucide-react';
import { useState } from 'react';

interface LiveAdminLoginProps {
  t: Record<string, string>;
}

export default function LiveAdminLogin({ t }: LiveAdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (pending || password.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/live/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        window.location.href = '/live/admin';
        return;
      }
      if (response.status === 401) setError(t['login.error']);
      else if (response.status === 429) setError(t['login.rateLimited']);
      else if (response.status === 503) setError(t['login.disabled']);
      else setError(t['error.generic']);
    } catch {
      setError(t['error.generic']);
    }
    setPending(false);
  };

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-md px-6 py-24">
        <div className="rounded-lg border border-neutral-300 bg-surface-card p-8 shadow-sm">
          <h1 className="text-center">{t['login.title']}</h1>
          <p className="mt-3 text-center text-sm text-neutral-500">{t['login.body']}</p>
          <form onSubmit={submit} className="mt-8">
            <label htmlFor="live-admin-password" className="text-sm">
              {t['login.password']}
            </label>
            <input
              id="live-admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-neutral-300 bg-surface-card px-3 py-2.5 outline-none transition-colors duration-200 focus:border-brand-dark"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || password.length === 0}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 font-medium text-brand-foreground transition-colors duration-200 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={16} aria-hidden />
              {t['login.submit']}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
