import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Signup API placeholder. Connect your database and password hashing provider here.",
    },
    { status: 501 },
  );
}
