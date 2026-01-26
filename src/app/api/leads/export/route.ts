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

    const leads = await sql`
      SELECT
        id,
        first_name,
        last_name,
        company_name,
        job_title,
        company_email,
        phone,
        country,
        city,
        array_to_string(products, '; ') as products,
        estimated_quantity,
        purchase_timeframe,
        use_case,
        message,
        status,
        utm_source,
        utm_medium,
        utm_campaign,
        source,
        submission_date,
        updated_at,
        notes
      FROM edgecortix_leads
      ORDER BY submission_date DESC
    `;

    // Generate CSV
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Company",
      "Job Title",
      "Email",
      "Phone",
      "Country",
      "City",
      "Products",
      "Quantity",
      "Timeframe",
      "Use Case",
      "Message",
      "Status",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
      "Source",
      "Submission Date",
      "Updated At",
      "Notes",
    ];

    const csvRows = [headers.join(",")];

    for (const lead of leads) {
      const row = [
        lead.id,
        escapeCSV(lead.first_name),
        escapeCSV(lead.last_name),
        escapeCSV(lead.company_name),
        escapeCSV(lead.job_title),
        escapeCSV(lead.company_email),
        escapeCSV(lead.phone),
        escapeCSV(lead.country),
        escapeCSV(lead.city || ""),
        escapeCSV(lead.products || ""),
        lead.estimated_quantity,
        escapeCSV(lead.purchase_timeframe),
        escapeCSV(lead.use_case),
        escapeCSV(lead.message || ""),
        escapeCSV(lead.status),
        escapeCSV(lead.utm_source || ""),
        escapeCSV(lead.utm_medium || ""),
        escapeCSV(lead.utm_campaign || ""),
        escapeCSV(lead.source || ""),
        lead.submission_date,
        lead.updated_at,
        escapeCSV(lead.notes || ""),
      ];
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="edgecortix-leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
