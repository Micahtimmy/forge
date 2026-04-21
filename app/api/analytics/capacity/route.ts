import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import { getTeamCapacity } from "@/lib/db/queries/analytics";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(req, user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json([]);
    }

    const data = await getTeamCapacity(workspace.workspaceId);
    return NextResponse.json(data);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to fetch capacity data" }, { status: 500 });
  }
}
