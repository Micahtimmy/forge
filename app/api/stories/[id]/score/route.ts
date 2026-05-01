import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getStoryById } from "@/lib/db/queries/stories";
import { upsertStoryScore } from "@/lib/db/queries/scores";
import { scoreStory } from "@/lib/ai/score-story";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const rateLimit = checkRateLimit(
      req,
      auth.context.user.id,
      RATE_LIMITS.aiScoring
    );
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;

    const story = await getStoryById(workspaceId, id);

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const aiResult = await scoreStory({
      key: story.jiraKey,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptanceCriteria,
      storyPoints: story.storyPoints,
      epicKey: story.epicKey,
      labels: story.labels,
    });

    const savedScore = await upsertStoryScore(workspaceId, id, {
      totalScore: aiResult.totalScore,
      completeness: {
        score: aiResult.dimensions.completeness.score,
        max: aiResult.dimensions.completeness.max,
        reasoning: aiResult.dimensions.completeness.reasoning,
      },
      clarity: {
        score: aiResult.dimensions.clarity.score,
        max: aiResult.dimensions.clarity.max,
        reasoning: aiResult.dimensions.clarity.reasoning,
      },
      estimability: {
        score: aiResult.dimensions.estimability.score,
        max: aiResult.dimensions.estimability.max,
        reasoning: aiResult.dimensions.estimability.reasoning,
      },
      traceability: {
        score: aiResult.dimensions.traceability.score,
        max: aiResult.dimensions.traceability.max,
        reasoning: aiResult.dimensions.traceability.reasoning,
      },
      testability: {
        score: aiResult.dimensions.testability.score,
        max: aiResult.dimensions.testability.max,
        reasoning: aiResult.dimensions.testability.reasoning,
      },
      suggestions: aiResult.suggestions,
      aiModel: "gemini-2.0-flash",
      promptVersion: "1.0.0",
    });

    return NextResponse.json({
      success: true,
      score: {
        id: savedScore.id,
        totalScore: savedScore.totalScore,
        completeness: savedScore.completeness,
        clarity: savedScore.clarity,
        estimability: savedScore.estimability,
        traceability: savedScore.traceability,
        testability: savedScore.testability,
        suggestions: savedScore.suggestions,
        scoredAt: savedScore.scoredAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Score story API error:", error);
    Sentry.captureException(error, {
      tags: { api: "story-score" },
    });
    return NextResponse.json(
      { error: "Failed to score story" },
      { status: 500 }
    );
  }
}
