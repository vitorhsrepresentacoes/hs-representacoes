import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "hs_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getAuthConfig() {
  const secret = process.env.AUTH_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  const emails = process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean) ?? [];
  if (!secret || !password || emails.length === 0) throw new Error("Autenticação administrativa não configurada.");
  return { secret, password, emails };
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function compare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getAuthConfig();
  return config.emails.includes(email.trim().toLowerCase()) && compare(password, config.password);
}

export function createAdminSession(email: string) {
  const { secret } = getAuthConfig();
  const payload = Buffer.from(JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + SESSION_TTL_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readAdminSession(value?: string) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  try {
    const { secret, emails } = getAuthConfig();
    if (!compare(signature, sign(payload, secret))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; exp?: number };
    if (!data.email || !data.exp || data.exp < Date.now() || !emails.includes(data.email)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  return readAdminSession(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return session;
}

export const adminCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  },
};
