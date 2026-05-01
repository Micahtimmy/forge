import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { createUntypedServerClient } from "@/lib/db/client";
import * as Sentry from "@sentry/nextjs";

/**
 * GET /api/user/onboarding-status
 * Check if the user has completed onboarding
 */
export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const supabase = createUntypedServerClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("onboarding_complete")
      .eq("id", auth.context.user.id)
      .single();

    if (error) {
      // If user doesn't exist yet, onboarding is not complete
      return NextResponse.json({ onboardingComplete: false });
    }

    return NextResponse.json({
      onboardingComplete: user?.onboarding_complete ?? false,
    });
  } catch (error) {
    console.error("[API] Get onboarding status error:", error);
    Sentry.captureException(error, { tags: { api: "user-onboarding-status" } });
    return NextResponse.json(
      { error: "Failed to get onboarding status" },
      { status: 500 }
    );
  }
}

const updateOnboardingSchema = z.object({
  onboardingComplete: z.boolean(),
});

/**
 * POST /api/user/onboarding-status
 * Update the user's onboarding status
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const body = await req.json();
    const validated = updateOnboardingSchema.parse(body);

    const supabase = createUntypedServerClient();

    const { error } = await supabase
      .from("users")
      .update({ onboarding_complete: validated.onboardingComplete })
      .eq("id", auth.context.user.id);

    if (error) {
      throw new Error(`Failed to update onboarding status: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[API] Update onboarding status error:", error);
    Sentry.captureException(error, { tags: { api: "user-onboarding-status" } });
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
