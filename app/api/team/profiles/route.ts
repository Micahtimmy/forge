import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  getTeamProfiles,
  upsertTeamProfile,
  getTeamAnalytics,
} from "@/lib/db/queries/team-profiles";

const UpsertProfileSchema = z.object({
  user_id: z.string().uuid(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  strengths: z.array(z.string()).optional(),
  growth_areas: z.array(z.string()).optional(),
  coaching_suggestions: z.record(z.string(), z.unknown()).optional(),
  velocity_trend: z.enum(["improving", "stable", "declining"]).nullable().optional(),
  quality_trend: z.enum(["improving", "stable", "declining"]).nullable().optional(),
  visibility: z.enum(["self_only", "manager_visible", "team_visible", "anonymous_team"]).optional(),
});

/**
 * GET /api/team/profiles
 * Get all team member profiles
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get("analytics") === "true";

    const profiles = await getTeamProfiles(workspaceId);

    let analytics = null;
    if (includeAnalytics) {
      analytics = await getTeamAnalytics(workspaceId);
    }

    return NextResponse.json({
      profiles,
      ...(analytics && { analytics }),
    });
  } catch (error) {
    console.error("[Team Profiles GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get team profiles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/profiles
 * Create or update a team member profile
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const validated = UpsertProfileSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { user_id, ...profileData } = validated.data;

    const profile = await upsertTeamProfile(
      workspaceId,
      user_id,
      profileData
    );

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("[Team Profiles POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update team profile" },
      { status: 500 }
    );
  }
}
