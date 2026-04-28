# TODO: Email Setup for FORGE

> Priority: High (needed for user authentication and team features)
> Estimated time: 30 minutes

---

## Overview

FORGE uses two email systems:
- **Resend** - Team invitations, Signal updates, notifications
- **Supabase Auth** - Signup confirmation, password reset, magic links

Both can use Resend for consistent branding and deliverability.

---

## Checklist

### 1. Set Up Resend Account

- [ ] Go to [resend.com](https://resend.com) and create account
- [ ] Navigate to **API Keys** in dashboard
- [ ] Click **Create API Key**
- [ ] Name it "FORGE Production"
- [ ] Copy the key (starts with `re_`)

### 2. Add Environment Variable

- [ ] Open `.env.local`
- [ ] Add your Resend API key:
  ```bash
  RESEND_API_KEY=re_your_actual_key_here
  ```

### 3. Verify Domain (Production Only)

> Skip this for local development - Resend allows sending to your own email without verification.

- [ ] In Resend dashboard → **Domains** → **Add Domain**
- [ ] Enter your domain: `useforge.app` (or your domain)
- [ ] Add DNS records to your domain provider:
  - [ ] 1 TXT record (for verification)
  - [ ] 3 CNAME records (for DKIM signing)
- [ ] Wait for verification (5-30 minutes)
- [ ] Update `EMAIL_FROM` in `.env.local`:
  ```bash
  EMAIL_FROM=FORGE <hello@useforge.app>
  ```

### 4. Configure Supabase Auth Emails (Optional but Recommended)

This makes ALL emails (including signup/password reset) go through Resend for consistent branding.

- [ ] Go to **Supabase Dashboard** → your project
- [ ] Navigate to **Project Settings** → **Auth**
- [ ] Scroll to **SMTP Settings**
- [ ] Enable **Custom SMTP**
- [ ] Fill in:
  | Field | Value |
  |-------|-------|
  | Host | `smtp.resend.com` |
  | Port | `465` |
  | Username | `resend` |
  | Password | Your `RESEND_API_KEY` |
  | Sender email | `hello@useforge.app` |
  | Sender name | `FORGE` |
- [ ] Click **Save**

### 5. Update Supabase Email Templates

- [ ] In Supabase Dashboard → **Authentication** → **Email Templates**
- [ ] Update each template from `docs/supabase-email-templates.md`:
  - [ ] **Confirm signup** - Copy HTML and set subject: `Confirm your FORGE account`
  - [ ] **Reset password** - Copy HTML and set subject: `Reset your FORGE password`
  - [ ] **Magic link** - Copy HTML and set subject: `Your FORGE login link`
  - [ ] **Invite user** - Copy HTML and set subject: `You've been invited to FORGE`
  - [ ] **Change email** - Copy HTML and set subject: `Confirm your new email address`

### 6. Test Emails

- [ ] Start dev server: `npm run dev`
- [ ] Test signup confirmation:
  - [ ] Create new account with real email
  - [ ] Check inbox for confirmation email
  - [ ] Verify email arrives and looks correct
- [ ] Test password reset:
  - [ ] Go to `/forgot-password`
  - [ ] Enter your email
  - [ ] Check inbox for reset email
  - [ ] Verify link works
- [ ] Test team invitation:
  - [ ] Go to Settings → Team → Invite Member
  - [ ] Invite a real email address
  - [ ] Check inbox for invitation email

---

## Resend Pricing Reference

| Plan | Emails/Month | Daily Limit | Price |
|------|--------------|-------------|-------|
| **Free** | 3,000 | 100/day | $0 |
| Pro | 50,000 | None | $20/month |
| Enterprise | Unlimited | None | Custom |

Free tier is sufficient for launch and early growth.

---

## Environment Variables Summary

```bash
# Required
RESEND_API_KEY=re_xxxxx

# Optional (after domain verification)
EMAIL_FROM=FORGE <hello@useforge.app>
EMAIL_SUPPORT=support@useforge.app
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/email/resend.ts` | Email sending functions and templates |
| `docs/supabase-email-templates.md` | Supabase auth email templates |
| `.env.local.example` | Environment variable reference |

---

## Troubleshooting

**Emails not sending locally?**
- Check `RESEND_API_KEY` is set in `.env.local`
- Restart dev server after adding env var
- Check Resend dashboard → Logs for errors

**Emails going to spam?**
- Verify your domain in Resend
- Ensure DKIM records are properly configured
- Check sender email matches verified domain

**Supabase auth emails still using default template?**
- Clear browser cache
- Check SMTP settings are saved in Supabase
- Verify Resend API key is correct in SMTP password field

---

---

## Enable MFA in Supabase

> Required for the Security Settings page to work properly.

### 1. Enable MFA in Supabase Dashboard

- [ ] Go to **Supabase Dashboard** → your project
- [ ] Navigate to **Authentication** → **Providers**
- [ ] Scroll to **Multi-Factor Authentication**
- [ ] Enable **TOTP (Authenticator App)**
- [ ] Click **Save**

### 2. (Optional) Require MFA for All Users

Only do this if you want to enforce MFA for everyone:

- [ ] In the same MFA section, enable **Require MFA**
- [ ] New users will be prompted to set up MFA during onboarding

### 3. Add MFA Email Templates

- [ ] In **Authentication** → **Email Templates**
- [ ] Add templates from `docs/supabase-email-templates.md`:
  - [ ] **Password Changed** (Section 6)
  - [ ] **MFA Enrolled** (Section 7)
  - [ ] **MFA Unenrolled** (Section 8)
  - [ ] **Reauthentication** (Section 9)

### 4. Test MFA Flow

- [ ] Go to Settings → Security in FORGE
- [ ] Click "Enable 2FA"
- [ ] Scan QR code with authenticator app (Google Authenticator, Authy)
- [ ] Enter 6-digit code to verify
- [ ] Sign out and sign back in to test MFA prompt

---

## Done?

Once all items are checked:
- [ ] Mark this task complete
- [ ] Delete or archive this file
- [ ] Test with a few real users before launch
