import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest, requireRole } from "@/lib/api/auth";
import { disconnectJira } from "@/lib/jira/auth";

// Disconnect JIRA integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    // Only admins can disconnect
    const roleError = requireRole(auth.context, "admin");
    if (roleError) {
      return roleError;
    }

    await disconnectJira(workspaceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("JIRA disconnect error:", error);
    Sentry.captureException(error, { tags: { api: "jira-disconnect" } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Disconnect failed" },
      { status: 500 }
    );
  }
}
