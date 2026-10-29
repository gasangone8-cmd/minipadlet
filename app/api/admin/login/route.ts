import { readJsonObject, invalidRequest } from "@/lib/request";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createAdminSessionToken } from "@/lib/adminSession";
import { verifyPlainPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    if (!body) return invalidRequest();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "관리자 설정을 확인해 주세요." },
        { status: 500 },
      );
    }
    if (typeof body.password !== "string") {
      return NextResponse.json(
        { error: "관리자 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const matches = verifyPlainPassword(body.password, adminPassword);
    if (!matches) {
      return NextResponse.json(
        { error: "관리자 비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("POST /api/admin/login", error);
    return NextResponse.json(
      { error: "관리자 로그인에 실패했습니다." },
      { status: 500 },
    );
  }
}
