import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getStoryById } from "@/lib/db/queries/stories";
import { getLatestScoreForStory } from "@/lib/db/queries/scores";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;

    const story = await getStoryById(workspaceId, id);

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const score = await getLatestScoreForStory(workspaceId, id);

    return NextResponse.json({
      ...story,
      jiraCreatedAt: story.jiraCreatedAt.toISOString(),
      jiraUpdatedAt: story.jiraUpdatedAt.toISOString(),
      syncedAt: story.syncedAt.toISOString(),
      score: score
        ? {
            id: score.id,
            totalScore: score.totalScore,
            completeness: score.completeness,
            clarity: score.clarity,
            estimability: score.estimability,
            traceability: score.traceability,
            testability: score.testability,
            suggestions: score.suggestions,
            aiModel: score.aiModel,
            promptVersion: score.promptVersion,
            scoredAt: score.scoredAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Story API error:", error);
    Sentry.captureException(error, {
      tags: { api: "story-detail" },
    });
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}
