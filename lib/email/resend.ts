/**
 * Resend Email Integration for FORGE
 * Handles transactional emails for team invitations, notifications, etc.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_BASE_URL = "https://api.resend.com";
const FROM_EMAIL = process.env.EMAIL_FROM || "FORGE <hello@useforge.app>";
const SUPPORT_EMAIL = process.env.EMAIL_SUPPORT || "support@useforge.app";

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

/**
 * Result type for email operations - explicit success/failure instead of throwing
 */
export type EmailSendResult =
  | { success: true; messageId: string }
  | { success: false; error: string; code?: string };

/**
 * Send an email via Resend with explicit error handling
 * Returns a discriminated union result instead of throwing exceptions
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
  if (!RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY not configured");
    return {
      success: false,
      error: "Email service not configured. Please contact support.",
      code: "EMAIL_NOT_CONFIGURED",
    };
  }

  // Validate email addresses
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
  if (invalidEmails.length > 0) {
    console.error("[Email] Invalid email addresses:", invalidEmails);
    return {
      success: false,
      error: `Invalid email address: ${invalidEmails[0]}`,
      code: "INVALID_EMAIL",
    };
  }

  try {
    const response = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Email] Resend API error:", response.status, data);

      // Map common Resend errors to user-friendly messages
      let userMessage = "Failed to send email. Please try again.";
      let code = "SEND_FAILED";

      if (response.status === 401) {
        userMessage = "Email service authentication failed. Please contact support.";
        code = "AUTH_FAILED";
      } else if (response.status === 422) {
        userMessage = data.message || "Invalid email content.";
        code = "VALIDATION_FAILED";
      } else if (response.status === 429) {
        userMessage = "Too many emails sent. Please wait a moment and try again.";
        code = "RATE_LIMITED";
      }

      return { success: false, error: userMessage, code };
    }

    console.info("[Email] Sent successfully:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("[Email] Network or unexpected error:", error);
    return {
      success: false,
      error: "Unable to connect to email service. Please try again later.",
      code: "NETWORK_ERROR",
    };
  }
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
  <title>Join ${workspaceName} on FORGE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080C14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0F1219; border-radius: 12px; border: 1px solid #1E2432;">
          <!-- Header with subtle branding -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 14px; font-weight: 600; color: #6366F1; letter-spacing: 0.5px;">FORGE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #FFFFFF; line-height: 1.3;">
                ${inviterName} wants you on the team
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                You've been invited to join <strong style="color: #FFFFFF;">${workspaceName}</strong> as a <strong style="color: #FFFFFF;">${role}</strong>. Your team is using FORGE to ship better software faster.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Join ${workspaceName}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What you'll get -->
              <div style="margin-top: 32px; padding: 20px; background-color: #161B26; border-radius: 8px;">
                <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.5px;">What you'll get access to</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #A0AEC0;">
                      <span style="color: #10B981; margin-right: 8px;">&#10003;</span> AI-powered story quality scoring
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #A0AEC0;">
                      <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Automated stakeholder updates
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #A0AEC0;">
                      <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Visual PI planning and dependency tracking
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                Link not working? Copy and paste: <span style="color: #6366F1;">${inviteUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096; line-height: 1.6;">
                This invitation expires in 7 days. If you weren't expecting this, just ignore it.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE &middot; AI-powered program intelligence
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
  return `${inviterName} wants you on the team

You've been invited to join ${workspaceName} as a ${role}. Your team is using FORGE to ship better software faster.

Join now: ${inviteUrl}

What you'll get access to:
- AI-powered story quality scoring
- Automated stakeholder updates
- Visual PI planning and dependency tracking

This invitation expires in 7 days. If you weren't expecting this, just ignore it.

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
  senderName,
  teamName,
}: {
  recipientName: string;
  updateTitle: string;
  updatePreview: string;
  viewUrl: string;
  senderName?: string;
  teamName?: string;
}): string {
  const fromLine = senderName && teamName
    ? `${senderName} from ${teamName}`
    : senderName || teamName || "Your team";

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
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 12px; font-weight: 600; color: #10B981; text-transform: uppercase; letter-spacing: 1px;">Program Update</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #FFFFFF; line-height: 1.3;">
                ${updateTitle}
              </h1>
              <p style="margin: 0 0 20px; font-size: 14px; color: #718096;">
                From ${fromLine}
              </p>

              <p style="margin: 0 0 16px; font-size: 15px; color: #A0AEC0;">
                Hi ${recipientName},
              </p>

              <div style="padding: 20px; background-color: #161B26; border-radius: 8px; border-left: 3px solid #6366F1;">
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #E2E8F0; white-space: pre-wrap;">
                  ${updatePreview}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
                <tr>
                  <td>
                    <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                      Read Full Update
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Delivered via FORGE Signal &middot; <a href="${viewUrl}" style="color: #6366F1; text-decoration: none;">View in browser</a>
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

export function getSignalUpdateEmailText({
  recipientName,
  updateTitle,
  updatePreview,
  viewUrl,
  senderName,
  teamName,
}: {
  recipientName: string;
  updateTitle: string;
  updatePreview: string;
  viewUrl: string;
  senderName?: string;
  teamName?: string;
}): string {
  const fromLine = senderName && teamName
    ? `${senderName} from ${teamName}`
    : senderName || teamName || "Your team";

  return `${updateTitle}
From ${fromLine}

Hi ${recipientName},

${updatePreview}

Read the full update: ${viewUrl}

---
Delivered via FORGE Signal
`;
}

// Welcome Email Template
export function getWelcomeEmailHtml({
  userName,
  loginUrl,
  workspaceName,
}: {
  userName: string;
  loginUrl: string;
  workspaceName?: string;
}): string {
  const greeting = userName ? `Hey ${userName}` : "Hey there";
  const workspaceNote = workspaceName
    ? `Your workspace <strong style="color: #FFFFFF;">${workspaceName}</strong> is ready to go.`
    : "Your account is all set up.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FORGE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080C14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0F1219; border-radius: 12px; border: 1px solid #1E2432;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <span style="font-size: 14px; font-weight: 600; color: #6366F1; letter-spacing: 0.5px;">FORGE</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #FFFFFF; line-height: 1.3;">
                ${greeting}, welcome aboard
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                ${workspaceNote} Here's what you can start doing right away:
              </p>

              <!-- Features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px; background-color: #161B26; border-radius: 8px; margin-bottom: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 12px;">
                          <span style="display: inline-block; width: 32px; height: 32px; background-color: #1E2432; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">1</span>
                        </td>
                        <td>
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #FFFFFF;">Connect JIRA</p>
                          <p style="margin: 0; font-size: 14px; color: #A0AEC0;">Sync your backlog in one click</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background-color: #161B26; border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 12px;">
                          <span style="display: inline-block; width: 32px; height: 32px; background-color: #1E2432; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">2</span>
                        </td>
                        <td>
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #FFFFFF;">Score your stories</p>
                          <p style="margin: 0; font-size: 14px; color: #A0AEC0;">AI analyzes quality and suggests improvements</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background-color: #161B26; border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 12px;">
                          <span style="display: inline-block; width: 32px; height: 32px; background-color: #1E2432; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">3</span>
                        </td>
                        <td>
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #FFFFFF;">Ship your first update</p>
                          <p style="margin: 0; font-size: 14px; color: #A0AEC0;">Generate stakeholder updates in 30 seconds</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Open FORGE
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #A0AEC0;">
                Questions? Just reply to this email - a real human will get back to you.
              </p>
              <p style="margin: 0; font-size: 13px; color: #718096;">
                - The FORGE team
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE &middot; AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getWelcomeEmailText({
  userName,
  loginUrl,
  workspaceName,
}: {
  userName: string;
  loginUrl: string;
  workspaceName?: string;
}): string {
  const greeting = userName ? `Hey ${userName}` : "Hey there";
  const workspaceNote = workspaceName
    ? `Your workspace "${workspaceName}" is ready to go.`
    : "Your account is all set up.";

  return `${greeting}, welcome aboard

${workspaceNote} Here's what you can start doing right away:

1. Connect JIRA - Sync your backlog in one click
2. Score your stories - AI analyzes quality and suggests improvements
3. Ship your first update - Generate stakeholder updates in 30 seconds

Open FORGE: ${loginUrl}

Questions? Just reply to this email - a real human will get back to you.

- The FORGE team
`;
}

// Password Reset Email Template
export function getPasswordResetEmailHtml({
  userName,
  resetUrl,
}: {
  userName: string;
  resetUrl: string;
}): string {
  const greeting = userName ? `Hi ${userName}` : "Hi there";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080C14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0F1219; border-radius: 12px; border: 1px solid #1E2432;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <span style="font-size: 14px; font-weight: 600; color: #6366F1; letter-spacing: 0.5px;">FORGE</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #FFFFFF;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                ${greeting}, someone requested a password reset for your FORGE account. If that was you, click below to set a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                Link not working? Copy and paste: <span style="color: #6366F1; word-break: break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #718096;">
                This link expires in 1 hour.
              </p>
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Didn't request this? You can ignore this email - your password won't change.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE &middot; AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getPasswordResetEmailText({
  userName,
  resetUrl,
}: {
  userName: string;
  resetUrl: string;
}): string {
  const greeting = userName ? `Hi ${userName}` : "Hi there";

  return `Reset your password

${greeting}, someone requested a password reset for your FORGE account. If that was you, use the link below to set a new password.

Reset your password: ${resetUrl}

This link expires in 1 hour.

Didn't request this? You can ignore this email - your password won't change.

---
FORGE - AI-powered program intelligence
`;
}
