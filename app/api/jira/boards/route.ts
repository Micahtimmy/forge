import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";

// Get ALL JIRA boards the user has access to
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    // Get JIRA client
    const client = await getJiraClientForWorkspace(workspaceId);
    if (!client) {
      return NextResponse.json(
        { error: "JIRA not connected" },
        { status: 400 }
      );
    }

    // Fetch ALL boards
    console.log("Fetching all JIRA boards...");
    const boards = await client.getBoards();

    const allBoards = boards.map((board) => ({
      id: board.id,
      name: board.name,
      type: board.type,
      projectKey: board.location?.projectKey || null,
      projectName: board.location?.projectName || null,
    }));

    console.log(`Found ${allBoards.length} boards total`);

    return NextResponse.json({
      boards: allBoards,
      total: allBoards.length,
    });
  } catch (error) {
    console.error("Failed to fetch JIRA boards:", error);
    Sentry.captureException(error, { tags: { api: "jira-boards" } });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch boards",
      },
      { status: 500 }
    );
  }
}
