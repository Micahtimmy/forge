import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api/auth";
import { type PlanId } from "@/lib/billing/paystack";

export interface SubscriptionData {
  plan: PlanId;
  status: "active" | "cancelled" | "past_due" | null;
  currentPeriodEnd: string | null;
  workspaceName: string;
}

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    const supabase = await createSupabaseServerClient();

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("workspace_id", workspaceId)
      .single();

    // Get workspace data
    const { data: workspaceData } = await supabase
      .from("workspaces")
      .select("name, plan")
      .eq("id", workspaceId)
      .single();

    const plan = (subscription?.plan || workspaceData?.plan || "free") as PlanId;

    return NextResponse.json({
      plan,
      status: subscription?.status || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      workspaceName: workspaceData?.name || "Workspace",
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    Sentry.captureException(error, {
      tags: { api: "billing-subscription" },
    });
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
