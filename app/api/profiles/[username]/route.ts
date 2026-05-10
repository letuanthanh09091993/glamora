import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Public profile API placeholder. Add server-side role filters and visibility checks.",
    },
    { status: 501 },
  );
}
