import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const credentials = atob(authHeader.split(" ")[1]);
  const [username, password] = credentials.split(":");

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const sql = getDb();

    const validStatuses = [
      "New",
      "Contacted",
      "Qualified",
      "Quoted",
      "Closed",
      "Lost",
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    if (body.status) {
      await sql`
        UPDATE edgecortix_leads
        SET status = ${body.status}, updated_at = NOW()
        WHERE id = ${parseInt(id)}
      `;
    }

    if (body.notes !== undefined) {
      await sql`
        UPDATE edgecortix_leads
        SET notes = ${body.notes}, updated_at = NOW()
        WHERE id = ${parseInt(id)}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sql = getDb();

    const result = await sql`
      SELECT * FROM edgecortix_leads WHERE id = ${parseInt(id)}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
