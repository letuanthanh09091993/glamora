import { NextResponse, type NextRequest } from "next/server";

/** Pass-through only — auth is enforced in server layouts via getCurrentUser(). */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
