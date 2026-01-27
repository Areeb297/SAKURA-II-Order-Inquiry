import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 30000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

interface LeadEmailData {
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  companyEmail: string;
  phone: string;
  country: string;
  city?: string;
  products: string[];
  estimatedQuantity: number;
  purchaseTimeframe: string;
  useCase: string;
  message?: string;
}

export async function sendLeadNotification(data: LeadEmailData) {
  const productList = data.products.map((p) => `• ${p}`).join("\n");
  const subject = `[EdgeCortix Lead] ${data.companyName} – ${data.products[0] || "Product Inquiry"} – Qty: ${data.estimatedQuantity}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a2744; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">SAKURA-II Order Inquiry</h1>
        <p style="color: #00a0ab; margin: 5px 0 0;">New Lead Submission</p>
      </div>

      <div style="padding: 25px; background: #ffffff;">
        <h2 style="color: #1a2744; border-bottom: 2px solid #00a0ab; padding-bottom: 8px;">Contact Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Name:</td><td style="padding: 6px 0;"><strong>${data.firstName} ${data.lastName}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Company:</td><td style="padding: 6px 0;"><strong>${data.companyName}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Job Title:</td><td style="padding: 6px 0;">${data.jobTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Email:</td><td style="padding: 6px 0;"><a href="mailto:${data.companyEmail}">${data.companyEmail}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Phone:</td><td style="padding: 6px 0;">${data.phone}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Location:</td><td style="padding: 6px 0;">${data.city ? data.city + ", " : ""}${data.country}</td></tr>
        </table>

        <h2 style="color: #1a2744; border-bottom: 2px solid #00a0ab; padding-bottom: 8px; margin-top: 25px;">Products Selected</h2>
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; font-family: Arial;">${productList}</pre>

        <h2 style="color: #1a2744; border-bottom: 2px solid #00a0ab; padding-bottom: 8px; margin-top: 25px;">Business Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Quantity:</td><td style="padding: 6px 0;"><strong>${data.estimatedQuantity}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Timeframe:</td><td style="padding: 6px 0;">${data.purchaseTimeframe}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Use Case:</td><td style="padding: 6px 0;">${data.useCase}</td></tr>
        </table>

        ${data.message ? `
        <h2 style="color: #1a2744; border-bottom: 2px solid #00a0ab; padding-bottom: 8px; margin-top: 25px;">Message</h2>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${data.message}</p>
        ` : ""}
      </div>

      <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #888; font-size: 12px;">
        Submitted via SAKURA-II Order Inquiry Form | Ebttikar Technology &times; EdgeCortix
      </div>
    </div>
  `;

  const userConfirmationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a2744; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Thank You for Your Inquiry!</h1>
        <p style="color: #00a0ab; margin: 5px 0 0;">SAKURA-II Edge AI Accelerator</p>
      </div>

      <div style="padding: 25px; background: #ffffff;">
        <p style="font-size: 16px; color: #333;">Dear ${data.firstName},</p>

        <p style="color: #555; line-height: 1.6;">
          We have received your SAKURA-II order inquiry. Our team at Ebttikar Technology will review your request and get back to you within <strong>1-2 business days</strong>.
        </p>

        <div style="background: #f0f9fa; border-left: 4px solid #00a0ab; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <h3 style="color: #1a2744; margin: 0 0 10px;">Your Inquiry Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #666;">Product(s):</td><td style="padding: 4px 0;">${data.products.join(", ")}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Quantity:</td><td style="padding: 4px 0;">${data.estimatedQuantity}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Timeframe:</td><td style="padding: 4px 0;">${data.purchaseTimeframe}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Use Case:</td><td style="padding: 4px 0;">${data.useCase}</td></tr>
          </table>
        </div>

        <p style="color: #555; line-height: 1.6;">
          Need immediate assistance? Contact us at
          <a href="mailto:edgecortix@ebttikar.com" style="color: #00a0ab;">edgecortix@ebttikar.com</a>
        </p>

        <p style="color: #555;">Best regards,<br><strong>Ebttikar Technology &times; EdgeCortix Team</strong></p>
      </div>

      <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #888; font-size: 12px;">
        Ebttikar Technology Co. Ltd. | Authorized EdgeCortix Partner
      </div>
    </div>
  `;

  try {
    console.log("[EMAIL] Sending lead notification via SMTP...");
    const leadResult = await transporter.sendMail({
      from: process.env.SMTP_FROM || "edgecortix@ebttikar.com",
      to: "edgecortix@ebttikar.com, areebshafqat@gmail.com",
      replyTo: data.companyEmail,
      subject,
      html: htmlContent,
    });
    console.log("[EMAIL] Lead notification sent:", leadResult.messageId);

    console.log("[EMAIL] Sending user confirmation to:", data.companyEmail);
    const confirmResult = await transporter.sendMail({
      from: process.env.SMTP_FROM || "edgecortix@ebttikar.com",
      to: data.companyEmail,
      subject: "Thank You for Your SAKURA-II Inquiry – Ebttikar Technology",
      html: userConfirmationHtml,
    });
    console.log("[EMAIL] User confirmation sent:", confirmResult.messageId);

    return {
      success: true,
      messageId: leadResult.messageId,
      confirmationSent: true,
    };
  } catch (error) {
    console.error("[EMAIL] Send FAILED:", error);
    return { success: false, error };
  }
}
