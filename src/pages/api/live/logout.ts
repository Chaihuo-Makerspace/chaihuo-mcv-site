import type { APIRoute } from 'astro';
import { clearSessionCookieHeader } from '@/lib/live-auth';

export const POST: APIRoute = () => {
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookieHeader() } });
};
