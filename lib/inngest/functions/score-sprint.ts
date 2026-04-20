import { inngest } from "../client";
import { scoreStory } from "@/lib/ai/score-story";
import { getStoriesByWorkspace, getStoryById } from "@/lib/db/queries/stories";
import { upsertStoryScore } from "@/lib/db/queries/scores";
import { PROMPT_VERSION } from "@/lib/ai/prompts/score-story";

// Score individual stories
export const scoreStories = inngest.createFunction(
  {
    id: "score-stories",
    name: "Score Stories",
    retries: 2,
    concurrency: {
      limit: 5,
      key: "event.data.workspaceId",
    },
    rateLimit: {
      limit: 10,
      period: "1m",
      key: "event.data.workspaceId",
    },
    triggers: [{ event: "stories/score.requested" }],
  },
  async ({ event, step }) => {
    const { workspaceId, storyIds } = event.data;

    console.log("[FORGE] Story scoring started", {
      workspaceId,
      storyCount: storyIds.length,
    });

    const results: Array<{ storyId: string; score: number | null; error?: string }> = [];

    // Score stories in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < storyIds.length; i += batchSize) {
      const batch = storyIds.slice(i, i + batchSize);

      const batchResults = await step.run(`score-batch-${i}`, async () => {
        const batchResults: typeof results = [];

        for (const storyId of batch) {
          try {
            // Get story details
            const story = await getStoryById(workspaceId, storyId);
            if (!story) {
              batchResults.push({ storyId, score: null, error: "Story not found" });
              continue;
            }

            // Score the story
            const scoreResult = await scoreStory({
              key: story.jiraKey,
              title: story.title,
              description: story.description,
              acceptanceCriteria: story.acceptanceCriteria,
              storyPoints: story.storyPoints,
              epicKey: story.epicKey,
              labels: story.labels,
            });

            // Save the score
            await upsertStoryScore(workspaceId, storyId, {
              totalScore: scoreResult.totalScore,
              completeness: {
                score: scoreResult.dimensions.completeness.score,
                max: scoreResult.dimensions.completeness.max,
                reasoning: scoreResult.dimensions.completeness.reasoning,
              },
              clarity: {
                score: scoreResult.dimensions.clarity.score,
                max: scoreResult.dimensions.clarity.max,
                reasoning: scoreResult.dimensions.clarity.reasoning,
              },
              estimability: {
                score: scoreResult.dimensions.estimability.score,
                max: scoreResult.dimensions.estimability.max,
                reasoning: scoreResult.dimensions.estimability.reasoning,
              },
              traceability: {
                score: scoreResult.dimensions.traceability.score,
                max: scoreResult.dimensions.traceability.max,
                reasoning: scoreResult.dimensions.traceability.reasoning,
              },
              testability: {
                score: scoreResult.dimensions.testability.score,
                max: scoreResult.dimensions.testability.max,
                reasoning: scoreResult.dimensions.testability.reasoning,
              },
              suggestions: scoreResult.suggestions.map((s) => ({
                type: s.type,
                current: s.current,
                improved: s.improved,
              })),
              aiModel: "gemini-2.0-flash",
              promptVersion: PROMPT_VERSION,
            });

            batchResults.push({ storyId, score: scoreResult.totalScore });
          } catch (error) {
            batchResults.push({
              storyId,
              score: null,
              error: error instanceof Error ? error.message : "Scoring failed",
            });
          }
        }

        return batchResults;
      });

      results.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < storyIds.length) {
        await step.sleep("batch-delay", "2s");
      }
    }

    const successCount = results.filter((r) => r.score !== null).length;
    const errorCount = results.filter((r) => r.error).length;

    console.log("[FORGE] Story scoring completed", {
      workspaceId,
      successCount,
      errorCount,
    });

    return {
      status: "success",
      scored: successCount,
      errors: errorCount,
      results,
    };
  }
);

// Score all stories in a sprint
export const scoreSprintStories = inngest.createFunction(
  {
    id: "score-sprint-stories",
    name: "Score Sprint Stories",
    retries: 2,
    concurrency: {
      limit: 3,
      key: "event.data.workspaceId",
    },
    triggers: [{ event: "stories/score-sprint.requested" }],
  },
  async ({ event, step }) => {
    const { workspaceId, sprintId } = event.data;

    console.log("[FORGE] Sprint scoring started", {
      workspaceId,
      sprintId,
    });

    // Get all stories in the sprint
    const stories = await step.run("get-sprint-stories", async () => {
      return getStoriesByWorkspace(workspaceId, {
        sprintId,
        limit: 100,
      });
    });

    if (stories.length === 0) {
      console.warn("[FORGE] No stories found in sprint", { workspaceId, sprintId });
      return { status: "skipped", reason: "No stories in sprint" };
    }

    // Trigger scoring for all stories
    await step.sendEvent("trigger-story-scoring", {
      name: "stories/score.requested",
      data: {
        workspaceId,
        storyIds: stories.map((s) => s.id),
      },
    });

    return {
      status: "triggered",
      storyCount: stories.length,
    };
  }
);

// getStoryById is now imported from @/lib/db/queries/stories
