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

function buildSoapEnvelope(to: string[], subject: string, htmlBody: string, replyTo?: string): string {
  const toRecipients = to
    .map((email) => `<t:Mailbox><t:EmailAddress>${email}</t:EmailAddress></t:Mailbox>`)
    .join("");

  const replyToXml = replyTo
    ? `<t:ReplyTo><t:Mailbox><t:EmailAddress>${replyTo}</t:EmailAddress></t:Mailbox></t:ReplyTo>`
    : "";

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
          <t:Subject>${subject}</t:Subject>
          <t:Body BodyType="HTML"><![CDATA[${htmlBody}]]></t:Body>
          <t:ToRecipients>${toRecipients}</t:ToRecipients>
          ${replyToXml}
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
    .map((p) => `<tr><td style="padding:4px 0 4px 10px;color:#333;font-family:Arial,sans-serif;font-size:14px;">&bull; ${p}</td></tr>`)
    .join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SAKURA-II Order Inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dddddd;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a2744;padding:25px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-family:Arial,sans-serif;">SAKURA-II Order Inquiry</h1>
              <p style="color:#00a0ab;margin:8px 0 0;font-size:14px;font-family:Arial,sans-serif;">New Lead Submission</p>
            </td>
          </tr>
          <!-- Contact Information -->
          <tr>
            <td style="padding:25px 30px 10px;">
              <h2 style="color:#1a2744;font-size:18px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #00a0ab;font-family:Arial,sans-serif;">Contact Information</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Name:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;"><strong>${data.firstName} ${data.lastName}</strong></td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Company:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;"><strong>${data.companyName}</strong></td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Job Title:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.jobTitle}</td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Email:</td>
                  <td style="padding:8px 0;font-size:14px;font-family:Arial,sans-serif;"><a href="mailto:${data.companyEmail}" style="color:#00a0ab;text-decoration:none;">${data.companyEmail}</a></td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Phone:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.phone}</td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Location:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.city ? data.city + ", " : ""}${data.country}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Products Selected -->
          <tr>
            <td style="padding:15px 30px 10px;">
              <h2 style="color:#1a2744;font-size:18px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #00a0ab;font-family:Arial,sans-serif;">Products Selected</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;border-radius:6px;">
                ${productRows}
              </table>
            </td>
          </tr>
          <!-- Business Details -->
          <tr>
            <td style="padding:15px 30px 10px;">
              <h2 style="color:#1a2744;font-size:18px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #00a0ab;font-family:Arial,sans-serif;">Business Details</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Quantity:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;"><strong>${data.estimatedQuantity}</strong></td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Timeframe:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.purchaseTimeframe}</td>
                </tr>
                <tr>
                  <td width="120" style="padding:8px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Use Case:</td>
                  <td style="padding:8px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.useCase}</td>
                </tr>
              </table>
            </td>
          </tr>
          ${data.message ? `<!-- Message -->
          <tr>
            <td style="padding:15px 30px 10px;">
              <h2 style="color:#1a2744;font-size:18px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #00a0ab;font-family:Arial,sans-serif;">Message</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#f5f5f5;padding:12px;border-radius:6px;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.message}</td>
                </tr>
              </table>
            </td>
          </tr>` : ""}
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f5f5;padding:15px 30px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="color:#888888;font-size:12px;margin:0;font-family:Arial,sans-serif;">Submitted via SAKURA-II Order Inquiry Form | Ebttikar Technology x EdgeCortix</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildConfirmationHtml(data: LeadEmailData): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank You for Your Inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dddddd;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a2744;padding:25px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-family:Arial,sans-serif;">Thank You for Your Inquiry!</h1>
              <p style="color:#00a0ab;margin:8px 0 0;font-size:14px;font-family:Arial,sans-serif;">SAKURA-II Edge AI Accelerator</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:25px 30px;">
              <p style="font-size:16px;color:#333333;margin:0 0 15px;font-family:Arial,sans-serif;">Dear ${data.firstName},</p>
              <p style="color:#555555;line-height:1.6;font-size:14px;margin:0 0 20px;font-family:Arial,sans-serif;">We have received your SAKURA-II order inquiry. Our team at Ebttikar Technology will review your request and get back to you within <strong>1-2 business days</strong>.</p>
              <!-- Summary Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f9fa;border-left:4px solid #00a0ab;">
                <tr>
                  <td style="padding:15px 20px;">
                    <h3 style="color:#1a2744;margin:0 0 12px;font-size:16px;font-family:Arial,sans-serif;">Your Inquiry Summary</h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="110" style="padding:6px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Product(s):</td>
                        <td style="padding:6px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.products.join(", ")}</td>
                      </tr>
                      <tr>
                        <td width="110" style="padding:6px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Quantity:</td>
                        <td style="padding:6px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.estimatedQuantity}</td>
                      </tr>
                      <tr>
                        <td width="110" style="padding:6px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Timeframe:</td>
                        <td style="padding:6px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.purchaseTimeframe}</td>
                      </tr>
                      <tr>
                        <td width="110" style="padding:6px 0;color:#666666;font-size:14px;font-family:Arial,sans-serif;vertical-align:top;">Use Case:</td>
                        <td style="padding:6px 0;color:#333333;font-size:14px;font-family:Arial,sans-serif;">${data.useCase}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color:#555555;line-height:1.6;font-size:14px;margin:20px 0 15px;font-family:Arial,sans-serif;">Need immediate assistance? Contact us at <a href="mailto:edgecortix@ebttikar.com" style="color:#00a0ab;text-decoration:none;">edgecortix@ebttikar.com</a></p>
              <p style="color:#555555;font-size:14px;margin:0;font-family:Arial,sans-serif;">Best regards,<br /><strong>Ebttikar Technology x EdgeCortix Team</strong></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f5f5;padding:15px 30px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="color:#888888;font-size:12px;margin:0;font-family:Arial,sans-serif;">Ebttikar Technology Co. Ltd. | Authorized EdgeCortix Partner</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
