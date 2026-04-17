import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  verifyWebhookSignature,
  verifyTransaction,
  getSubscription,
} from "@/lib/billing/paystack";

// Paystack webhook events we care about
type PaystackEvent =
  | "charge.success"
  | "subscription.create"
  | "subscription.disable"
  | "subscription.not_renew"
  | "invoice.payment_failed";

interface WebhookPayload {
  event: PaystackEvent;
  data: {
    id: number;
    reference?: string;
    status?: string;
    subscription_code?: string;
    customer?: {
      customer_code: string;
      email: string;
    };
    plan?: {
      plan_code: string;
      name: string;
      interval: string;
    };
    metadata?: {
      user_id?: string;
      workspace_id?: string;
      plan_id?: string;
      interval?: string;
      customer_code?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: WebhookPayload = JSON.parse(payload);
    console.log("Paystack webhook received:", event.event);

    // Create Supabase client with service role for database operations
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Webhooks don't need to set cookies
          },
        },
      }
    );

    switch (event.event) {
      case "charge.success": {
        // Payment successful - verify and create subscription record
        if (!event.data.reference) break;

        const transaction = await verifyTransaction(event.data.reference);

        if (transaction.status !== "success") {
          console.error("Transaction verification failed");
          break;
        }

        const metadata = transaction.plan ? event.data.metadata : null;
        if (!metadata?.workspace_id) {
          console.error("Missing workspace_id in metadata");
          break;
        }

        // Determine plan from metadata or transaction
        const planId = metadata.plan_id || "pro";
        const interval = metadata.interval || "monthly";

        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (interval === "yearly") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Upsert subscription record
        await supabase.from("subscriptions").upsert(
          {
            workspace_id: metadata.workspace_id,
            paystack_customer_code: transaction.customer.customer_code,
            plan: planId as "free" | "pro" | "team" | "enterprise",
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          },
          { onConflict: "workspace_id" }
        );

        // Update workspace plan
        await supabase
          .from("workspaces")
          .update({ plan: planId as "free" | "pro" | "team" | "enterprise" })
          .eq("id", metadata.workspace_id);

        console.log(`Subscription activated for workspace ${metadata.workspace_id}`);
        break;
      }

      case "subscription.create": {
        // Subscription created via Paystack dashboard or API
        if (!event.data.subscription_code) break;

        const subscription = await getSubscription(event.data.subscription_code);
        const customerCode = event.data.customer?.customer_code;

        if (!customerCode) break;

        // Find workspace by customer code
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("workspace_id")
          .eq("paystack_customer_code", customerCode)
          .single();

        if (existingSub) {
          await supabase
            .from("subscriptions")
            .update({
              paystack_subscription_code: subscription.subscription_code,
              status: "active" as const,
              current_period_end: subscription.next_payment_date,
            })
            .eq("workspace_id", existingSub.workspace_id);
        }
        break;
      }

      case "subscription.disable": {
        // Subscription cancelled
        const subscriptionCode = event.data.subscription_code;
        if (!subscriptionCode) break;

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" as const })
          .eq("paystack_subscription_code", subscriptionCode);

        console.log(`Subscription ${subscriptionCode} cancelled`);
        break;
      }

      case "subscription.not_renew": {
        // Subscription set to not renew
        const subscriptionCode = event.data.subscription_code;
        if (!subscriptionCode) break;

        // Keep active until period ends, but mark status
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" as const })
          .eq("paystack_subscription_code", subscriptionCode);

        console.log(`Subscription ${subscriptionCode} will not renew`);
        break;
      }

      case "invoice.payment_failed": {
        // Payment failed for renewal
        const subscriptionCode = event.data.subscription_code;
        if (!subscriptionCode) break;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due" as const })
          .eq("paystack_subscription_code", subscriptionCode);

        // TODO: Send email notification to workspace admin
        console.log(`Payment failed for subscription ${subscriptionCode}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}
