import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import { PLANS, type PlanId } from "@/lib/billing/paystack";

export interface SubscriptionData {
  plan: PlanId;
  status: "active" | "cancelled" | "past_due" | null;
  currentPeriodEnd: string | null;
  workspaceName: string;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const workspace = await getUserWorkspace(user.id);

    if (!workspace) {
      return NextResponse.json({
        plan: "free" as PlanId,
        status: null,
        currentPeriodEnd: null,
        workspaceName: "No Workspace",
      });
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("workspace_id", workspace.workspaceId)
      .single();

    // Get workspace plan
    const { data: workspaceData } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspace.workspaceId)
      .single();

    const plan = (subscription?.plan || workspaceData?.plan || "free") as PlanId;

    return NextResponse.json({
      plan,
      status: subscription?.status || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      workspaceName: workspace.workspaceName,
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
