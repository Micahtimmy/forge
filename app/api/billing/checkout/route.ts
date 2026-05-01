import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  initializeTransaction,
  createCustomer,
  PLANS,
} from "@/lib/billing/paystack";
import { checkRateLimit } from "@/lib/api/rate-limit";

const checkoutSchema = z.object({
  planId: z.enum(["pro", "team"]),
  interval: z.enum(["monthly", "yearly"]),
});

// Rate limit config for checkout (prevents payment abuse)
const CHECKOUT_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 300, // 5 minutes
  identifier: "billing-checkout",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Rate limiting - prevents checkout abuse
    const rateLimit = checkRateLimit(req, user.id, CHECKOUT_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    // Only pro and team have Paystack plan codes
    const plan = PLANS[validated.planId as "pro" | "team"];
    const amount =
      validated.interval === "monthly"
        ? plan.priceMonthly
        : plan.priceYearly;

    const planCode =
      validated.interval === "monthly"
        ? plan.paystackPlanCodeMonthly
        : plan.paystackPlanCodeYearly;

    if (!planCode) {
      return NextResponse.json(
        { success: false, error: "Plan not configured" },
        { status: 400 }
      );
    }

    // Get or create Paystack customer
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, workspace_id")
      .eq("id", user.id)
      .single<{ full_name: string | null; workspace_id: string | null }>();

    // Check if workspace already has a subscription
    if (profile?.workspace_id) {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, status")
        .eq("workspace_id", profile.workspace_id)
        .eq("status", "active")
        .single();

      if (existingSub) {
        return NextResponse.json(
          { success: false, error: "Workspace already has an active subscription" },
          { status: 400 }
        );
      }
    }

    // Create Paystack customer if needed
    let customerCode: string;
    const { data: existingCustomer } = await supabase
      .from("subscriptions")
      .select("paystack_customer_code")
      .eq("workspace_id", profile?.workspace_id || "")
      .single<{ paystack_customer_code: string }>();

    if (existingCustomer?.paystack_customer_code) {
      customerCode = existingCustomer.paystack_customer_code;
    } else {
      const names = (profile?.full_name || "").split(" ");
      const customer = await createCustomer({
        email: user.email!,
        firstName: names[0],
        lastName: names.slice(1).join(" "),
        metadata: {
          user_id: user.id,
          workspace_id: profile?.workspace_id,
        },
      });
      customerCode = customer.customer_code;
    }

    // Generate unique reference
    const reference = `forge_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Initialize transaction
    const transaction = await initializeTransaction({
      email: user.email!,
      amount,
      plan: planCode,
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing/callback`,
      metadata: {
        user_id: user.id,
        workspace_id: profile?.workspace_id,
        plan_id: validated.planId,
        interval: validated.interval,
        customer_code: customerCode,
      },
    });

    return NextResponse.json({
      success: true,
      authorization_url: transaction.authorization_url,
      reference: transaction.reference,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    Sentry.captureException(error, {
      tags: { api: "billing-checkout" },
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 }
    );
  }
}
