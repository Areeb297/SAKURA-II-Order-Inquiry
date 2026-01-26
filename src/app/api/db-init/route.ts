import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Simple auth check
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = atob(authHeader.split(" ")[1]);
  const [username, password] = credentials.split(":");

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await initDatabase();
    return NextResponse.json({ message: result });
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { error: "Database initialization failed" },
      { status: 500 }
    );
  }
}
