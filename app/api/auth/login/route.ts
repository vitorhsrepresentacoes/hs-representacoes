import { NextResponse } from "next/server";
import { adminCookie, createAdminSession, verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.redirect(new URL("/login?erro=1", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/painel", request.url), 303);
  response.cookies.set(adminCookie.name, createAdminSession(email), adminCookie.options);
  return response;
}
