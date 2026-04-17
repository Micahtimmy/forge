/**
 * Resend Email Integration for FORGE
 * Handles transactional emails for team invitations, notifications, etc.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_BASE_URL = "https://api.resend.com";
const FROM_EMAIL = "FORGE <noreply@forge.dev>";

if (!RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set - email features disabled");
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface ResendResponse {
  id: string;
}

export async function sendEmail(params: SendEmailParams): Promise<ResendResponse> {
  if (!RESEND_API_KEY) {
    throw new Error("Resend API key not configured");
  }

  const response = await fetch(`${RESEND_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send email");
  }

  return data;
}

// Team Invitation Email Template
export function getTeamInviteEmailHtml({
  inviterName,
  workspaceName,
  inviteUrl,
  role,
}: {
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  role: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to FORGE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080C14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0F1219; border-radius: 12px; border: 1px solid #1E2432;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                FORGE
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #FFFFFF;">
                You've been invited to join ${workspaceName}
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #A0AEC0;">
                ${inviterName} has invited you to join their workspace on FORGE as a <strong style="color: #FFFFFF;">${role}</strong>.
              </p>
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #A0AEC0;">
                FORGE is an AI-powered program intelligence platform that helps teams deliver better software with real-time story scoring, stakeholder updates, and PI planning.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; font-size: 13px; color: #718096;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0; font-size: 13px; color: #6366F1; word-break: break-all;">
                ${inviteUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #718096;">
                This invitation will expire in 7 days.
              </p>
              <p style="margin: 0; font-size: 13px; color: #718096;">
                If you didn't expect this invitation, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Copyright -->
        <p style="margin: 32px 0 0; font-size: 12px; color: #4A5568;">
          &copy; ${new Date().getFullYear()} FORGE. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getTeamInviteEmailText({
  inviterName,
  workspaceName,
  inviteUrl,
  role,
}: {
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  role: string;
}): string {
  return `
You've been invited to join ${workspaceName} on FORGE

${inviterName} has invited you to join their workspace as a ${role}.

FORGE is an AI-powered program intelligence platform that helps teams deliver better software with real-time story scoring, stakeholder updates, and PI planning.

Accept your invitation: ${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can ignore this email.

---
FORGE - AI-powered program intelligence
`;
}

// Signal Update Notification Email
export function getSignalUpdateEmailHtml({
  recipientName,
  updateTitle,
  updatePreview,
  viewUrl,
}: {
  recipientName: string;
  updateTitle: string;
  updatePreview: string;
  viewUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${updateTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080C14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0F1219; border-radius: 12px; border: 1px solid #1E2432;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px;">
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #10B981; text-transform: uppercase; letter-spacing: 1px;">
                Program Update
              </p>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; line-height: 1.3;">
                ${updateTitle}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #A0AEC0;">
                Hi ${recipientName},
              </p>
              <div style="padding: 20px; background-color: #161B26; border-radius: 8px; border-left: 3px solid #6366F1;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #E2E8F0;">
                  ${updatePreview}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="${viewUrl}" style="display: inline-block; padding: 12px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      View Full Update
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Sent via FORGE Signal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
