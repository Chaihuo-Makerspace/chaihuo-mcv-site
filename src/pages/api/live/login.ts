import type { APIRoute } from 'astro';
import { adminPassword, loginRateLimited, sessionCookieHeader, signSession } from '@/lib/live-auth';

// 成员后台登录：共享口令 → HttpOnly 会话 cookie。每 IP 每分钟 ≤10 次。
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const password = adminPassword();
  if (!password) {
    return Response.json({ ok: false, error: 'disabled' }, { status: 503 });
  }
  if (loginRateLimited(clientAddress ?? 'unknown')) {
    return Response.json({ ok: false, error: 'rate-limited' }, { status: 429 });
  }
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }
  if (typeof body.password !== 'string' || body.password !== password) {
    return Response.json({ ok: false, error: 'wrong-password' }, { status: 401 });
  }
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': sessionCookieHeader(signSession(password)) } },
  );
};
