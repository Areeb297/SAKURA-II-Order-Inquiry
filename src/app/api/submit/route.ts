import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendLeadNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "companyName",
      "jobTitle",
      "companyEmail",
      "phone",
      "country",
      "products",
      "estimatedQuantity",
      "purchaseTimeframe",
      "useCase",
      "consent",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.companyEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate products array
    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { error: "At least one product must be selected" },
        { status: 400 }
      );
    }

    // Validate consent
    if (!body.consent) {
      return NextResponse.json(
        { error: "Consent is required" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Insert into database
    const result = await sql`
      INSERT INTO edgecortix_leads (
        first_name, last_name, company_name, job_title,
        company_email, phone, country, city,
        products, estimated_quantity, purchase_timeframe,
        use_case, message, consent,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        source, status
      ) VALUES (
        ${body.firstName}, ${body.lastName}, ${body.companyName}, ${body.jobTitle},
        ${body.companyEmail}, ${body.phone}, ${body.country}, ${body.city || null},
        ${body.products}, ${body.estimatedQuantity}, ${body.purchaseTimeframe},
        ${body.useCase}, ${body.message || null}, ${body.consent},
        ${body.utm_source || null}, ${body.utm_medium || null}, ${body.utm_campaign || null},
        ${body.utm_term || null}, ${body.utm_content || null},
        'web_form', 'New'
      )
      RETURNING id
    `;

    // Send email notification (non-blocking so form returns fast)
    sendLeadNotification({
      firstName: body.firstName,
      lastName: body.lastName,
      companyName: body.companyName,
      jobTitle: body.jobTitle,
      companyEmail: body.companyEmail,
      phone: body.phone,
      country: body.country,
      city: body.city,
      products: body.products,
      estimatedQuantity: body.estimatedQuantity,
      purchaseTimeframe: body.purchaseTimeframe,
      useCase: body.useCase,
      message: body.message,
    }).then((r) => console.log("[SUBMIT] Email result:", r))
      .catch((err) => console.error("[SUBMIT] Email error:", err));

    return NextResponse.json(
      {
        success: true,
        message: "Inquiry submitted successfully",
        id: result[0]?.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
