import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "minipadlet_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

function signature(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("관리자 세션 환경 변수가 설정되지 않았습니다.");
  return createHmac("sha256", secret)
    .update(`${payload}:${process.env.ADMIN_PASSWORD ?? ""}`)
    .digest("hex");
}

export function createAdminSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const payload = `minipadlet-v1.${expires}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSessionToken(token: string) {
  if (!process.env.ADMIN_SESSION_SECRET || !process.env.ADMIN_PASSWORD) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "minipadlet-v1") return false;
  const expires = Number(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expires) || expires <= now || expires > now + ADMIN_SESSION_SECONDS) return false;
  if (!/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{64}$/.test(parts[3])) return false;
  const expected = signature(parts.slice(0, 3).join("."));
  return timingSafeEqual(Buffer.from(parts[3]), Buffer.from(expected));
}

export async function isAdminRequest() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return token ? verifyAdminSessionToken(token) : false;
}
