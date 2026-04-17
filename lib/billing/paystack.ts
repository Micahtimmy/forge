/**
 * Paystack Integration for FORGE Billing
 * Nigerian payment processor for subscriptions
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  console.warn("PAYSTACK_SECRET_KEY not set - billing features disabled");
}

function getHeaders(): Record<string, string> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// Plans configuration (amounts in kobo - 100 kobo = 1 NGN)
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "1 workspace",
      "5 team members",
      "100 stories/month",
      "Basic scoring",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 1500000, // 15,000 NGN
    priceYearly: 15000000, // 150,000 NGN (2 months free)
    paystackPlanCodeMonthly: process.env.PAYSTACK_PRO_MONTHLY_PLAN,
    paystackPlanCodeYearly: process.env.PAYSTACK_PRO_YEARLY_PLAN,
    features: [
      "Unlimited workspaces",
      "15 team members",
      "Unlimited stories",
      "Advanced scoring",
      "Signal updates",
      "Email support",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 4500000, // 45,000 NGN
    priceYearly: 45000000, // 450,000 NGN (2 months free)
    paystackPlanCodeMonthly: process.env.PAYSTACK_TEAM_MONTHLY_PLAN,
    paystackPlanCodeYearly: process.env.PAYSTACK_TEAM_YEARLY_PLAN,
    features: [
      "Everything in Pro",
      "50 team members",
      "Horizon PI Planning",
      "Risk Analysis",
      "Priority support",
      "SSO (coming soon)",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 0, // Custom pricing
    priceYearly: 0,
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Customer operations
export interface CreateCustomerParams {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export async function createCustomer(
  params: CreateCustomerParams
): Promise<PaystackCustomer> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      metadata: params.metadata,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to create customer");
  }

  return data.data;
}

// Transaction initialization
export interface InitializeTransactionParams {
  email: string;
  amount: number; // in kobo
  currency?: string;
  reference?: string;
  callbackUrl?: string;
  plan?: string; // Paystack plan code for subscriptions
  channels?: string[];
  metadata?: Record<string, unknown>;
}

export interface InitializedTransaction {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializedTransaction> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      currency: params.currency || "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      plan: params.plan,
      channels: params.channels || ["card", "bank", "ussd", "bank_transfer"],
      metadata: params.metadata,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initialize transaction");
  }

  return data.data;
}

// Verify transaction
export interface VerifiedTransaction {
  id: number;
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at: string;
  customer: PaystackCustomer;
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bank: string;
    reusable: boolean;
  };
  plan?: {
    plan_code: string;
    name: string;
  };
}

export async function verifyTransaction(
  reference: string
): Promise<VerifiedTransaction> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to verify transaction");
  }

  return data.data;
}

// Subscription operations
export interface CreateSubscriptionParams {
  customerCode: string;
  planCode: string;
  startDate?: string;
  authorizationCode?: string;
}

export interface PaystackSubscription {
  id: number;
  subscription_code: string;
  email_token: string;
  status: "active" | "cancelled" | "non-renewing" | "attention";
  amount: number;
  next_payment_date: string;
  plan: {
    plan_code: string;
    name: string;
    amount: number;
    interval: string;
  };
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<PaystackSubscription> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/subscription`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      customer: params.customerCode,
      plan: params.planCode,
      start_date: params.startDate,
      authorization: params.authorizationCode,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to create subscription");
  }

  return data.data;
}

export async function getSubscription(
  subscriptionCode: string
): Promise<PaystackSubscription> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/subscription/${subscriptionCode}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to get subscription");
  }

  return data.data;
}

export async function cancelSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<boolean> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/subscription/disable`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to cancel subscription");
  }

  return true;
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!PAYSTACK_SECRET_KEY) return false;

  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

// Format amount from kobo to Naira
export function formatNaira(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(naira);
}
