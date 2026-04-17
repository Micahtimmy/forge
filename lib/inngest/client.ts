import { Inngest } from "inngest";

// Create the Inngest client
export const inngest = new Inngest({
  id: "forge",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event types
export type ForgeEvents = {
  "jira/sync.requested": {
    data: {
      workspaceId: string;
      projectKey: string;
      boardId?: number;
      fullSync?: boolean;
      triggeredBy: "manual" | "scheduled" | "webhook";
    };
  };
  "stories/score.requested": {
    data: {
      workspaceId: string;
      storyIds: string[];
      rubricId?: string;
    };
  };
  "stories/score-sprint.requested": {
    data: {
      workspaceId: string;
      sprintId: number;
      rubricId?: string;
    };
  };
  "signal/send.requested": {
    data: {
      updateId: string;
      audiences: string[];
      channels: ("email" | "slack")[];
    };
  };
};
