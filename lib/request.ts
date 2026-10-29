import { NextResponse } from "next/server";

export async function readJsonObject(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

export function invalidRequest() {
  return NextResponse.json({ error: "올바른 JSON 요청을 보내 주세요." }, { status: 400 });
}

export function isMemoId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
