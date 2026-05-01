import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import {
  getTeamProfile,
  getTeamMemberMetricsHistory,
} from "@/lib/db/queries/team-profiles";

/**
 * GET /api/team/profiles/[userId]
 * Get a team member profile with metrics history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";

    const profile = await getTeamProfile(workspaceId, userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    let metricsHistory = null;
    if (includeHistory) {
      metricsHistory = await getTeamMemberMetricsHistory(profile.id, {
        limit: 12,
      });
    }

    return NextResponse.json({
      profile,
      ...(metricsHistory && { metricsHistory }),
    });
  } catch (error) {
    console.error("[Team Profile GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "team-profile-get" } });
    return NextResponse.json(
      { error: "Failed to get team profile" },
      { status: 500 }
    );
  }
}
