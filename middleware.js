import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const sessionKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-only-change-this-secret"
);

async function hasValidSession(request) {
  const token = request.cookies.get("routine_session")?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, sessionKey);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const authenticated = await hasValidSession(request);
  const { pathname } = request.nextUrl;
  const isAuthPage = ["/signin", "/signup", "/forgot-password"].includes(pathname);

  if (authenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!authenticated && pathname === "/dashboard") {
    const response = NextResponse.redirect(new URL("/signin", request.url));
    response.cookies.delete("routine_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/signin", "/signup", "/forgot-password"],
};
