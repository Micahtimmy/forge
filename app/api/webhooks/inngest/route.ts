import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { jiraSync, scheduledJiraSync } from "@/lib/inngest/functions/sync-jira";
import { scoreStories, scoreSprintStories } from "@/lib/inngest/functions/score-sprint";

// Export all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    jiraSync,
    scheduledJiraSync,
    scoreStories,
    scoreSprintStories,
  ],
});
