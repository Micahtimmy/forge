import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getStoriesWithScores } from "@/lib/db/queries/stories";
import { getScoreDistribution } from "@/lib/db/queries/scores";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } = auth.context;

    // Rate limiting
    const rateLimit = checkRateLimit(req, auth.context.user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }
    const { searchParams } = new URL(req.url);

    const sprintId = searchParams.get("sprintId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const scoreFilter = searchParams.get("scoreFilter") as
      | "all"
      | "excellent"
      | "good"
      | "fair"
      | "poor"
      | null;
    const searchQuery = searchParams.get("q");

    const stories = await getStoriesWithScores(workspaceId, {
      sprintId: sprintId ? parseInt(sprintId, 10) : undefined,
      limit: limit + 1,
    });

    let filteredStories = stories;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredStories = filteredStories.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.jiraKey.toLowerCase().includes(query)
      );
    }

    if (scoreFilter && scoreFilter !== "all") {
      filteredStories = filteredStories.filter((s) => {
        const score = s.latestScore?.totalScore ?? 0;
        switch (scoreFilter) {
          case "excellent":
            return score >= 85;
          case "good":
            return score >= 70 && score < 85;
          case "fair":
            return score >= 50 && score < 70;
          case "poor":
            return score < 50;
          default:
            return true;
        }
      });
    }

    const hasMore = filteredStories.length > limit;
    const paginatedStories = filteredStories.slice(offset, offset + limit);

    const distribution = await getScoreDistribution(
      workspaceId,
      sprintId ? parseInt(sprintId, 10) : undefined
    );

    const formattedStories = paginatedStories.map((story) => ({
      id: story.id,
      workspaceId: story.workspaceId,
      jiraId: story.jiraId,
      jiraKey: story.jiraKey,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptanceCriteria,
      storyPoints: story.storyPoints,
      status: story.status,
      statusCategory: story.statusCategory,
      epicKey: story.epicKey,
      epicName: story.epicName,
      sprintId: story.sprintId,
      sprintName: story.sprintName,
      assigneeName: story.assigneeName,
      labels: story.labels,
      jiraUpdatedAt: story.jiraUpdatedAt.toISOString(),
      syncedAt: story.syncedAt.toISOString(),
      score: story.latestScore
        ? {
            totalScore: story.latestScore.totalScore,
            scoredAt: story.latestScore.scoredAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({
      stories: formattedStories,
      total: filteredStories.length,
      hasMore,
      distribution,
    });
  } catch (error) {
    console.error("Stories API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
