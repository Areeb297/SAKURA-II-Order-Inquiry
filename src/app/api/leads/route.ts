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

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const product = searchParams.get("product");
    const timeframe = searchParams.get("timeframe");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = (page - 1) * limit;

    // Build dynamic query
    let leads;
    let countResult;

    if (status && product && dateFrom && dateTo) {
      leads = await sql`
        SELECT * FROM edgecortix_leads
        WHERE status = ${status}
          AND ${product} = ANY(products)
          AND submission_date >= ${dateFrom}::timestamp
          AND submission_date <= ${dateTo}::timestamp
        ORDER BY submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM edgecortix_leads
        WHERE status = ${status}
          AND ${product} = ANY(products)
          AND submission_date >= ${dateFrom}::timestamp
          AND submission_date <= ${dateTo}::timestamp
      `;
    } else if (status) {
      leads = await sql`
        SELECT * FROM edgecortix_leads
        WHERE status = ${status}
        ORDER BY submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM edgecortix_leads
        WHERE status = ${status}
      `;
    } else if (search) {
      const searchTerm = `%${search}%`;
      leads = await sql`
        SELECT * FROM edgecortix_leads
        WHERE company_name ILIKE ${searchTerm}
          OR first_name ILIKE ${searchTerm}
          OR last_name ILIKE ${searchTerm}
          OR company_email ILIKE ${searchTerm}
        ORDER BY submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM edgecortix_leads
        WHERE company_name ILIKE ${searchTerm}
          OR first_name ILIKE ${searchTerm}
          OR last_name ILIKE ${searchTerm}
          OR company_email ILIKE ${searchTerm}
      `;
    } else {
      leads = await sql`
        SELECT * FROM edgecortix_leads
        ORDER BY submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM edgecortix_leads
      `;
    }

    const total = parseInt(countResult[0]?.total || "0");

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
