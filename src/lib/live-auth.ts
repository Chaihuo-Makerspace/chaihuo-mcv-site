import { createHmac, timingSafeEqual } from 'node:crypto';

// 成员后台（/live/admin）的共享口令认证。
// 口令来自环境变量 LIVE_ADMIN_PASSWORD；未配置时后台整体不可用。
// 会话 = HMAC 签名的过期时间戳，签名密钥由口令派生 —— 改口令即全体会话失效。

export const SESSION_COOKIE = 'mcv_live_admin';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function adminPassword(): string | null {
  // 生产：compose 注入 process.env；本地 dev：Astro 把 .env 装进 import.meta.env。
  // 生产镜像构建环境没有 .env（gitignored + .dockerignore），import.meta.env 为 undefined，
  // 不会把本地密码烘进 bundle。
  const value = (process.env.LIVE_ADMIN_PASSWORD ?? import.meta.env.LIVE_ADMIN_PASSWORD)?.trim();
  return value ? value : null;
}

function hmac(payload: string, password: string): string {
  return createHmac('sha256', password).update(payload).digest('base64url');
}

/** 签发会话 token：`${expiresMs}.${hmac}` */
export function signSession(password: string, now = Date.now()): string {
  const expires = String(now + SESSION_TTL_MS);
  return `${expires}.${hmac(expires, password)}`;
}

export function verifySession(token: string | undefined, now = Date.now()): boolean {
  const password = adminPassword();
  if (!password || !token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d+$/.test(expires) || Number(expires) <= now) return false;
  const expected = Buffer.from(hmac(expires, password));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** 从请求头取会话 cookie 并校验 */
export function isAuthed(request: Request): boolean {
  const header = request.headers.get('cookie') ?? '';
  const pair = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return verifySession(
    pair ? decodeURIComponent(pair.slice(SESSION_COOKIE.length + 1)) : undefined,
  );
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ─── 登录限流：每 IP 每分钟 ≤10 次（内存态，重启清零，够用） ───
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 10;
const attempts = new Map<string, number[]>();

export function loginRateLimited(ip: string, now = Date.now()): boolean {
  const list = (attempts.get(ip) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);
  if (list.length >= LOGIN_MAX_ATTEMPTS) {
    attempts.set(ip, list);
    return true;
  }
  list.push(now);
  attempts.set(ip, list);
  return false;
}
