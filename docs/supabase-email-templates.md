# Supabase Email Templates for FORGE

These templates should be configured in your **Supabase Dashboard** under:
**Authentication → Email Templates**

Copy the HTML into each respective template. Replace `{{ .SiteURL }}` and `{{ .Token }}` variables - Supabase will substitute these automatically.

---

## 1. Confirm Signup

**Subject:** `Confirm your FORGE account`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email</title>
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
                One click to get started
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                Thanks for signing up for FORGE. Confirm your email to start shipping better software with AI-powered insights.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Confirm Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                This link expires in 24 hours. If you didn't create a FORGE account, just ignore this.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Questions? Reply to this email and we'll help you out.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset Password

**Subject:** `Reset your FORGE password`

**HTML Body:**
```html
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
                Someone requested a password reset for your FORGE account. If that was you, click below to set a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                This link expires in 1 hour.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Didn't request this? You can ignore this email - your password won't change.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link

**Subject:** `Your FORGE login link`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to FORGE</title>
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
                Your login link
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                Click below to sign in to FORGE. No password needed.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                This link expires in 1 hour and can only be used once.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Didn't request this? Someone may have typed your email by mistake. You can ignore it.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Invite User (if using Supabase invites)

**Subject:** `You've been invited to FORGE`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited</title>
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
                You've been invited to FORGE
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                Someone invited you to join their team on FORGE - the AI-powered platform for shipping better software.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Accept Invite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                This invite expires in 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Not expecting this? You can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Change Email Address

**Subject:** `Confirm your new email address`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm email change</title>
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
                Confirm your new email
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                You requested to change your FORGE email address. Click below to confirm this change.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Confirm New Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                This link expires in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Didn't request this change? Contact us immediately at support@useforge.app
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Configuration Notes

### Option 1: Use Supabase's Built-in Email (Default)
- Go to Supabase Dashboard → Authentication → Email Templates
- Paste each HTML template into the corresponding section
- Update the Subject line for each

### Option 2: Use Resend as Custom SMTP
If you want all emails (including auth) to come from Resend:

1. Go to Supabase Dashboard → Project Settings → Auth
2. Enable "Custom SMTP"
3. Configure with Resend's SMTP:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: Your Resend API key
   - Sender email: `hello@useforge.app` (must be verified in Resend)

### Testing
After updating templates:
1. Create a test account with a real email
2. Trigger each email type (signup, password reset, etc.)
3. Check formatting on mobile and desktop

---

## 6. Password Changed (Notification)

> **Note:** This is a notification email, not a confirmation. Configure in Supabase under **Authentication → Email Templates → Password Changed**.

**Subject:** `Your FORGE password was changed`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password changed</title>
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
                Your password was changed
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                The password for your FORGE account ({{ .Email }}) was just changed. If you made this change, you're all set.
              </p>
              
              <div style="padding: 16px; background-color: #1E2432; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #F59E0B;">
                  <strong>Didn't change your password?</strong>
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #A0AEC0;">
                  Someone may have access to your account. Reset your password immediately and enable two-factor authentication.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/forgot-password" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Secure My Account
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
                If you didn't make this change, contact us immediately at support@useforge.app
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 7. MFA Enrolled (Two-Factor Enabled)

> **Note:** This is a security notification. Supabase sends this automatically when MFA is enrolled.

**Subject:** `Two-factor authentication enabled on your FORGE account`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2FA enabled</title>
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
              <div style="width: 48px; height: 48px; background-color: rgba(16, 185, 129, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 24px;">&#128274;</span>
              </div>
              
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #FFFFFF;">
                Two-factor authentication enabled
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                Great news! Your FORGE account ({{ .Email }}) is now protected with two-factor authentication. You'll need to enter a code from your authenticator app each time you sign in.
              </p>
              
              <div style="padding: 16px; background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10B981;">
                <p style="margin: 0; font-size: 14px; color: #10B981;">
                  <strong>Keep your recovery codes safe</strong>
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #A0AEC0;">
                  If you lose access to your authenticator app, you'll need your recovery codes to sign in.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                If you didn't enable 2FA, someone may have access to your account. Contact us at support@useforge.app
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 8. MFA Unenrolled (Two-Factor Disabled)

> **Note:** Security notification sent when MFA is removed from an account.

**Subject:** `Two-factor authentication removed from your FORGE account`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2FA disabled</title>
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
              <div style="width: 48px; height: 48px; background-color: rgba(245, 158, 11, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 24px;">&#9888;</span>
              </div>
              
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #FFFFFF;">
                Two-factor authentication removed
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                Two-factor authentication has been removed from your FORGE account ({{ .Email }}). Your account is now protected by your password only.
              </p>
              
              <div style="padding: 16px; background-color: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 3px solid #F59E0B;">
                <p style="margin: 0; font-size: 14px; color: #F59E0B;">
                  <strong>Your account is less secure</strong>
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #A0AEC0;">
                  We recommend re-enabling two-factor authentication to protect your account from unauthorized access.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/settings/security" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Re-enable 2FA
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
                If you didn't make this change, someone may have access to your account. Contact us immediately at support@useforge.app
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 9. Reauthentication (Security Check)

> **Note:** Sent when a sensitive action requires the user to re-verify their identity.

**Subject:** `Verify your identity for FORGE`

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your identity</title>
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
                Verify it's you
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #A0AEC0;">
                We received a request for a sensitive action on your FORGE account. Click below to verify your identity and continue.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=reauthentication" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Verify Identity
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #718096;">
                This link expires in 10 minutes.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1E2432;">
              <p style="margin: 0; font-size: 13px; color: #718096;">
                Didn't request this? Someone may be trying to access your account. You can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer links -->
        <p style="margin: 24px 0 0; font-size: 12px; color: #4A5568;">
          FORGE · AI-powered program intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Variables Reference

Supabase provides these variables in email templates:

| Variable | Description |
|----------|-------------|
| `{{ .SiteURL }}` | Your app's URL |
| `{{ .TokenHash }}` | The verification token hash |
| `{{ .Token }}` | The raw token (for some templates) |
| `{{ .Email }}` | User's email address |
| `{{ .NewEmail }}` | New email (for email change) |
| `{{ .Data }}` | Custom user metadata |

Use `{{ .ConfirmationURL }}` as a shorthand for the full confirmation link in some Supabase versions.
