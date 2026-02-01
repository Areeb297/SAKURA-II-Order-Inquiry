// Send emails via SMTP (Ebttikar Exchange)
// Static IP 145.79.13.137 whitelisted by IT for SMTP relay

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "webmail.ebttikar.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "edgecortix@ebttikar.com";
const SMTP_PASS = process.env.SMTP_PASS || "";

const FROM_EMAIL = `EdgeCortix Orders <${SMTP_USER}>`;

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

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
}

function buildLeadHtml(data: LeadEmailData): string {
  const productRows = data.products
    .map((p) => `<tr><td style="padding:4px 8px;color:#333333;font-family:Arial,sans-serif;font-size:14px;">&#8226; ${p}</td></tr>`)
    .join("");

  return `<html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4"><tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border:1px solid #dddddd;">
<tr><td bgcolor="#1a2744" style="padding:25px 30px;text-align:center;">
<font face="Arial,sans-serif" size="5" color="#ffffff"><b>SAKURA-II Order Inquiry</b></font><br>
<font face="Arial,sans-serif" size="2" color="#00a0ab">New Lead Submission</font>
</td></tr>
<tr><td style="padding:25px 30px 10px;">
<font face="Arial,sans-serif" size="4" color="#1a2744"><b>Contact Information</b></font>
<hr color="#00a0ab" size="2" noshade>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Name:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333"><b>${data.firstName} ${data.lastName}</b></font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Company:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333"><b>${data.companyName}</b></font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Job Title:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.jobTitle}</font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Email:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2"><a href="mailto:${data.companyEmail}" style="color:#00a0ab;">${data.companyEmail}</a></font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Phone:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.phone}</font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Location:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.city ? data.city + ", " : ""}${data.country}</font></td></tr>
</table>
</td></tr>
<tr><td style="padding:15px 30px 10px;">
<font face="Arial,sans-serif" size="4" color="#1a2744"><b>Products Selected</b></font>
<hr color="#00a0ab" size="2" noshade>
<table width="100%" cellpadding="4" cellspacing="0" border="0" bgcolor="#f5f5f5">
${productRows}
</table>
</td></tr>
<tr><td style="padding:15px 30px 10px;">
<font face="Arial,sans-serif" size="4" color="#1a2744"><b>Business Details</b></font>
<hr color="#00a0ab" size="2" noshade>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Quantity:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333"><b>${data.estimatedQuantity}</b></font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Timeframe:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.purchaseTimeframe}</font></td></tr>
<tr><td width="120" valign="top" style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Use Case:</font></td>
<td style="padding:8px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.useCase}</font></td></tr>
</table>
</td></tr>
${data.message ? `<tr><td style="padding:15px 30px 10px;">
<font face="Arial,sans-serif" size="4" color="#1a2744"><b>Message</b></font>
<hr color="#00a0ab" size="2" noshade>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="#f5f5f5" style="padding:12px;"><font face="Arial,sans-serif" size="2" color="#333333">${data.message}</font></td>
</tr></table>
</td></tr>` : ""}
<tr><td bgcolor="#f5f5f5" style="padding:15px 30px;text-align:center;border-top:1px solid #eeeeee;">
<font face="Arial,sans-serif" size="1" color="#888888">Submitted via SAKURA-II Order Inquiry Form | Ebttikar Technology x EdgeCortix</font>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildConfirmationHtml(data: LeadEmailData): string {
  return `<html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background-color:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4"><tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border:1px solid #dddddd;">
<tr><td bgcolor="#1a2744" style="padding:25px 30px;text-align:center;">
<font face="Arial,sans-serif" size="5" color="#ffffff"><b>Thank You for Your Inquiry!</b></font><br>
<font face="Arial,sans-serif" size="2" color="#00a0ab">SAKURA-II Edge AI Accelerator</font>
</td></tr>
<tr><td style="padding:25px 30px;">
<font face="Arial,sans-serif" size="3" color="#333333">Dear ${data.firstName},</font><br><br>
<font face="Arial,sans-serif" size="2" color="#555555">We have received your SAKURA-II order inquiry. Our team at Ebttikar Technology will review your request and get back to you within <b>1-2 business days</b>.</font><br><br>
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f9fa" style="border-left:4px solid #00a0ab;">
<tr><td style="padding:15px 20px;">
<font face="Arial,sans-serif" size="3" color="#1a2744"><b>Your Inquiry Summary</b></font><br><br>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td width="110" valign="top" style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Product(s):</font></td>
<td style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.products.join(", ")}</font></td></tr>
<tr><td width="110" valign="top" style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Quantity:</font></td>
<td style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.estimatedQuantity}</font></td></tr>
<tr><td width="110" valign="top" style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Timeframe:</font></td>
<td style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.purchaseTimeframe}</font></td></tr>
<tr><td width="110" valign="top" style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#666666">Use Case:</font></td>
<td style="padding:6px 0;"><font face="Arial,sans-serif" size="2" color="#333333">${data.useCase}</font></td></tr>
</table>
</td></tr></table><br>
<font face="Arial,sans-serif" size="2" color="#555555">Need immediate assistance? Contact us at <a href="mailto:edgecortix@ebttikar.com" style="color:#00a0ab;">edgecortix@ebttikar.com</a></font><br><br>
<font face="Arial,sans-serif" size="2" color="#555555">Best regards,<br><b>Ebttikar Technology x EdgeCortix Team</b></font>
</td></tr>
<tr><td bgcolor="#f5f5f5" style="padding:15px 30px;text-align:center;border-top:1px solid #eeeeee;">
<font face="Arial,sans-serif" size="1" color="#888888">Ebttikar Technology Co. Ltd. | Authorized EdgeCortix Partner</font>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function sendLeadNotification(data: LeadEmailData) {
  const subject = `[EdgeCortix Lead] ${data.companyName} – ${data.products[0] || "Product Inquiry"} – Qty: ${data.estimatedQuantity}`;

  // Send to EdgeCortix team, BCC backup
  const recipients = ["edgecortix@ebttikar.com"];
  const bccRecipients = ["areebshafqat@gmail.com"];

  if (!SMTP_PASS) {
    console.error("[EMAIL] SMTP_PASS not configured!");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const transporter = createTransporter();

    console.log("[EMAIL] Sending lead notification via SMTP...");
    console.log("[EMAIL] Host:", SMTP_HOST, "Port:", SMTP_PORT, "User:", SMTP_USER);

    // Send lead notification to team
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipients.join(", "),
      bcc: bccRecipients.join(", "),
      replyTo: data.companyEmail,
      subject: subject,
      html: buildLeadHtml(data),
    });

    console.log("[EMAIL] Lead notification sent successfully");

    // Send confirmation to customer
    console.log("[EMAIL] Sending confirmation to:", data.companyEmail);

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.companyEmail,
      replyTo: "edgecortix@ebttikar.com",
      subject: "Thank You for Your SAKURA-II Inquiry - Ebttikar Technology",
      html: buildConfirmationHtml(data),
    });

    console.log("[EMAIL] Confirmation sent successfully");

    return { success: true, method: "SMTP" };
  } catch (error) {
    console.error("[EMAIL] SMTP failed:", error);
    return { success: false, error };
  }
}
