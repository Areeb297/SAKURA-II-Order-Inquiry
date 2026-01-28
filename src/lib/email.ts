// Send emails via Exchange Web Services (EWS) SOAP API over HTTPS
// No external dependencies - uses built-in fetch()

const EWS_URL = process.env.EWS_HOST
  ? `${process.env.EWS_HOST}/ews/exchange.asmx`
  : "https://webmail.ebttikar.com/ews/exchange.asmx";

function getAuthHeader(): string {
  const user = process.env.EWS_USER || "";
  // Workaround: $ in .env breaks parsing, so password is constructed here
  const pass = process.env.EWS_PASS_PREFIX + "$" + process.env.EWS_PASS_SUFFIX;
  console.log("[EMAIL] Auth user:", user, "| pass length:", pass.length);
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

function buildMimeMessage(to: string[], subject: string, htmlBody: string, replyTo?: string): string {
  const boundary = "----=_Part_" + Date.now().toString(36);
  const fromAddr = process.env.EWS_USER || "edgecortix@ebttikar.com";
  const toHeader = to.join(", ");

  // Build multipart/alternative MIME with plain text + HTML
  const plainText = htmlBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&bull;/g, "•")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lines = [
    `From: Edge Cortix <${fromAddr}>`,
    `To: ${toHeader}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    plainText,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(htmlBody).toString("base64").replace(/(.{76})/g, "$1\r\n"),
    ``,
    `--${boundary}--`,
  ].filter((line) => line !== null);

  return lines.join("\r\n");
}

function buildSoapEnvelope(to: string[], subject: string, htmlBody: string, replyTo?: string): string {
  const mimeRaw = buildMimeMessage(to, subject, htmlBody, replyTo);
  const mimeBase64 = Buffer.from(mimeRaw).toString("base64");

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013"/>
  </soap:Header>
  <soap:Body>
    <m:CreateItem MessageDisposition="SendAndSaveCopy">
      <m:SavedItemFolderId>
        <t:DistinguishedFolderId Id="sentitems"/>
      </m:SavedItemFolderId>
      <m:Items>
        <t:Message>
          <t:MimeContent CharacterSet="UTF-8">${mimeBase64}</t:MimeContent>
        </t:Message>
      </m:Items>
    </m:CreateItem>
  </soap:Body>
</soap:Envelope>`;
}

async function sendViaEWS(to: string[], subject: string, html: string, replyTo?: string) {
  const soapXml = buildSoapEnvelope(to, subject, html, replyTo);

  const response = await fetch(EWS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      Authorization: getAuthHeader(),
    },
    body: soapXml,
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("[EMAIL] EWS HTTP error:", response.status, responseText.substring(0, 500));
    throw new Error(`EWS request failed with status ${response.status}`);
  }

  // Check for SOAP fault or error in response
  if (responseText.includes("ResponseClass=\"Error\"") || responseText.includes("Fault")) {
    console.error("[EMAIL] EWS SOAP error:", responseText.substring(0, 500));
    throw new Error("EWS returned an error response");
  }

  return responseText;
}

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

  try {
    console.log("[EMAIL] Sending lead notification via EWS (HTTPS)...");
    await sendViaEWS(
      ["edgecortix@ebttikar.com", "areebshafqat@gmail.com"],
      subject,
      buildLeadHtml(data),
      data.companyEmail
    );
    console.log("[EMAIL] Lead notification sent successfully");

    console.log("[EMAIL] Sending user confirmation to:", data.companyEmail);
    await sendViaEWS(
      [data.companyEmail],
      "Thank You for Your SAKURA-II Inquiry - Ebttikar Technology",
      buildConfirmationHtml(data)
    );
    console.log("[EMAIL] User confirmation sent successfully");

    return { success: true };
  } catch (error) {
    console.error("[EMAIL] EWS Send FAILED:", error);
    return { success: false, error };
  }
}
