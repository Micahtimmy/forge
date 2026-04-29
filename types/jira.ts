// JIRA API Types

export interface JiraAccessToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  cloudId: string;
  siteUrl: string;
}

export interface JiraCloudResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

export interface JiraUser {
  accountId: string;
  accountType: string;
  emailAddress: string;
  avatarUrls: {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
  };
  displayName: string;
  active: boolean;
  timeZone: string;
  locale: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  avatarUrls: {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
  };
}

export interface JiraSprint {
  id: number;
  self: string;
  state: "active" | "closed" | "future";
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId: number;
  goal?: string;
}

export interface JiraIssueFields {
  summary: string;
  description?: string | JiraDocument;
  project?: {
    id: string;
    key: string;
    name: string;
  };
  status: {
    id: string;
    name: string;
    statusCategory: {
      id: number;
      key: string;
      name: string;
    };
  };
  issuetype: {
    id: string;
    name: string;
    subtask: boolean;
  };
  priority?: {
    id: string;
    name: string;
  };
  assignee?: JiraUser;
  reporter?: JiraUser;
  labels: string[];
  created: string;
  updated: string;
  customfield_10016?: number; // Story points (may vary by instance)
  customfield_10020?: JiraSprint[]; // Sprint field (may vary by instance)
  parent?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      issuetype: {
        name: string;
      };
    };
  };
  subtasks?: Array<{
    id: string;
    key: string;
    fields: {
      summary: string;
      status: {
        name: string;
      };
    };
  }>;
  attachment?: Array<{
    id: string;
    filename: string;
    created: string;
    size: number;
    mimeType: string;
    content: string;
  }>;
  comment?: {
    comments: Array<{
      id: string;
      author: JiraUser;
      body: string | JiraDocument;
      created: string;
      updated: string;
    }>;
    total: number;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

// JIRA Document Format (Atlassian Document Format - ADF)
export interface JiraDocument {
  type: "doc";
  version: 1;
  content: JiraDocumentNode[];
}

export interface JiraDocumentNode {
  type: string;
  content?: JiraDocumentNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

// Search response
export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

// Board response
export interface JiraBoard {
  id: number;
  self: string;
  name: string;
  type: "scrum" | "kanban";
  location?: {
    projectId: number;
    displayName: string;
    projectName: string;
    projectKey: string;
    projectTypeKey: string;
    avatarURI: string;
    name: string;
  };
}

export interface JiraBoardListResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: JiraBoard[];
}

// Webhook types
export interface JiraWebhookEvent {
  timestamp: number;
  webhookEvent: string;
  issue_event_type_name?: string;
  user: JiraUser;
  issue?: JiraIssue;
  changelog?: {
    id: string;
    items: Array<{
      field: string;
      fieldtype: string;
      fieldId?: string;
      from: string | null;
      fromString: string | null;
      to: string | null;
      toString: string | null;
    }>;
  };
  sprint?: JiraSprint;
}

// Sync status
export interface JiraSyncStatus {
  workspaceId: string;
  lastSyncAt: Date | null;
  lastSyncStatus: "success" | "error" | "in_progress" | null;
  lastSyncError: string | null;
  storiesSynced: number;
  sprintsSynced: number;
}

// Field configuration (for custom field mapping)
export interface JiraFieldConfig {
  storyPointsField: string;
  sprintField: string;
  acceptanceCriteriaField?: string;
}

// Normalized story for FORGE
export interface NormalizedJiraStory {
  jiraKey: string;
  jiraId: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  status: string;
  statusCategory: "todo" | "in_progress" | "done";
  issueType: string;
  priority: string | null;
  labels: string[];
  epicKey: string | null;
  epicName: string | null;
  sprintId: number | null;
  sprintName: string | null;
  assigneeEmail: string | null;
  assigneeName: string | null;
  reporterEmail: string | null;
  reporterName: string | null;
  createdAt: Date;
  updatedAt: Date;
}
