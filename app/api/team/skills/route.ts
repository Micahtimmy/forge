import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { findTeamMembersBySkill } from "@/lib/db/queries/team-profiles";

const SkillSearchSchema = z.object({
  skill: z.string().min(1),
  minLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

/**
 * GET /api/team/skills
 * Find team members by skill
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = SkillSearchSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const profiles = await findTeamMembersBySkill(
      workspaceId,
      validated.data.skill,
      validated.data.minLevel
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("[Team Skills GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "team-skills" } });
    return NextResponse.json(
      { error: "Failed to search by skill" },
      { status: 500 }
    );
  }
}
