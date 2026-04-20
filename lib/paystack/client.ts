/**
 * Paystack Integration Client for FORGE
 *
 * Handles payment processing for Nigerian users with support for:
 * - Card payments
 * - Bank transfers
 * - USSD
 * - Mobile money
 */

import { createHmac } from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  console.warn("PAYSTACK_SECRET_KEY is not set - payments will not work");
}

// Types
export interface PaystackCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackPlan {
  name: string;
  interval: "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "biannually" | "annually";
  amount: number; // in kobo (NGN smallest unit)
  currency?: string;
  description?: string;
}

export interface PaystackTransaction {
  email: string;
  amount: number; // in kobo
  currency?: string;
  reference?: string;
  callback_url?: string;
  plan?: string;
  channels?: ("card" | "bank" | "ussd" | "qr" | "mobile_money" | "bank_transfer")[];
  metadata?: Record<string, unknown>;
}

export interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// API request helper
async function paystackRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaystackResponse<T>> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Paystack API request failed");
  }

  return response.json();
}

// Initialize a transaction
export async function initializeTransaction(
  transaction: PaystackTransaction
): Promise<PaystackResponse<{ authorization_url: string; access_code: string; reference: string }>> {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      ...transaction,
      currency: transaction.currency || "NGN",
    }),
  });
}

// Verify a transaction
export async function verifyTransaction(
  reference: string
): Promise<PaystackResponse<{
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer: { email: string };
  paid_at: string;
}>> {
  return paystackRequest(`/transaction/verify/${reference}`);
}

// Create a subscription plan
export async function createPlan(
  plan: PaystackPlan
): Promise<PaystackResponse<{ plan_code: string; name: string }>> {
  return paystackRequest("/plan", {
    method: "POST",
    body: JSON.stringify({
      ...plan,
      currency: plan.currency || "NGN",
    }),
  });
}

// Create a customer
export async function createCustomer(
  customer: PaystackCustomer
): Promise<PaystackResponse<{ customer_code: string; email: string }>> {
  return paystackRequest("/customer", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

// Create a subscription
export async function createSubscription(
  customerEmail: string,
  planCode: string,
  authorization?: string
): Promise<PaystackResponse<{ subscription_code: string; email_token: string }>> {
  return paystackRequest("/subscription", {
    method: "POST",
    body: JSON.stringify({
      customer: customerEmail,
      plan: planCode,
      authorization,
    }),
  });
}

// Cancel a subscription
export async function cancelSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<PaystackResponse<{ message: string }>> {
  return paystackRequest("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });
}

// List banks (for bank transfer)
export async function listBanks(
  country: string = "nigeria"
): Promise<PaystackResponse<Array<{ name: string; code: string }>>> {
  return paystackRequest(`/bank?country=${country}`);
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

// Export public key for client-side usage
export { PAYSTACK_PUBLIC_KEY };

// FORGE Pricing Plans (in Kobo - 100 kobo = 1 NGN)
export const FORGE_PLANS = {
  starter: {
    name: "Starter",
    amount: 0, // Free
    interval: "monthly" as const,
    features: ["1 JIRA project", "Quality Gate only", "50 stories/month"],
  },
  pro: {
    name: "Pro",
    amount: 2500000, // NGN 25,000/month (~$29 equivalent)
    interval: "monthly" as const,
    features: ["Unlimited JIRA projects", "All modules", "Unlimited stories", "Slack integration"],
  },
  team: {
    name: "Team",
    amount: 1500000, // NGN 15,000/seat/month (~$19 equivalent)
    interval: "monthly" as const,
    features: ["All Pro features", "Confluence export", "Custom rubrics", "Team billing"],
  },
  enterprise: {
    name: "Enterprise",
    amount: 0, // Custom pricing
    interval: "annually" as const,
    features: ["All Team features", "SSO/SAML", "SLA", "Dedicated support", "On-prem option"],
  },
} as const;
