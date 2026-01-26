import nodemailer from "nodemailer";

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
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

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
        Submitted via SAKURA-II Order Inquiry Form | Ebttikar Technology × EdgeCortix
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EdgeCortix Leads" <${process.env.SMTP_FROM}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error };
  }
}
