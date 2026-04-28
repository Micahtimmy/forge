import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getTeamCapacity } from "@/lib/db/queries/team-profiles";

/**
 * GET /api/team/capacity
 * Get team capacity overview
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const capacity = await getTeamCapacity(workspaceId);

    return NextResponse.json(capacity);
  } catch (error) {
    console.error("[Team Capacity GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get team capacity" },
      { status: 500 }
    );
  }
}
