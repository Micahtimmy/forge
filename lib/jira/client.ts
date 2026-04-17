import type {
  JiraSearchResponse,
  JiraIssue,
  JiraSprint,
  JiraBoard,
  JiraBoardListResponse,
  JiraProject,
  JiraCloudResource,
} from "@/types/jira";

const JIRA_API_VERSION = "3";
const JIRA_AGILE_API_VERSION = "1.0";

export interface JiraClientConfig {
  accessToken: string;
  cloudId: string;
  siteUrl: string;
}

export class JiraApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorMessages?: string[]
  ) {
    super(message);
    this.name = "JiraApiError";
  }
}

export class JiraClient {
  private accessToken: string;
  private cloudId: string;
  private baseUrl: string;
  private agileBaseUrl: string;

  constructor(config: JiraClientConfig) {
    this.accessToken = config.accessToken;
    this.cloudId = config.cloudId;
    this.baseUrl = `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/api/${JIRA_API_VERSION}`;
    this.agileBaseUrl = `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/agile/${JIRA_AGILE_API_VERSION}`;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessages: string[] | undefined;
      try {
        const errorBody = await response.json();
        errorMessages = errorBody.errorMessages || [errorBody.message];
      } catch {
        // Failed to parse error body
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new JiraApiError(
          `Rate limited. Retry after ${retryAfter || "unknown"} seconds`,
          429,
          errorMessages
        );
      }

      throw new JiraApiError(
        `JIRA API error: ${response.statusText}`,
        response.status,
        errorMessages
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Get accessible resources (cloud instances)
  static async getAccessibleResources(
    accessToken: string
  ): Promise<JiraCloudResource[]> {
    const response = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new JiraApiError(
        "Failed to get accessible resources",
        response.status
      );
    }

    return response.json();
  }

  // Projects
  async getProjects(): Promise<JiraProject[]> {
    const response = await this.request<{
      values: JiraProject[];
      isLast: boolean;
    }>(`${this.baseUrl}/project/search?maxResults=100`);
    return response.values;
  }

  async getProject(projectKeyOrId: string): Promise<JiraProject> {
    return this.request<JiraProject>(
      `${this.baseUrl}/project/${projectKeyOrId}`
    );
  }

  // Issues/Stories
  async searchIssues(
    jql: string,
    options: {
      startAt?: number;
      maxResults?: number;
      fields?: string[];
      expand?: string[];
    } = {}
  ): Promise<JiraSearchResponse> {
    const {
      startAt = 0,
      maxResults = 50,
      fields = [
        "summary",
        "description",
        "status",
        "issuetype",
        "priority",
        "assignee",
        "reporter",
        "labels",
        "created",
        "updated",
        "customfield_10016", // Story points
        "customfield_10020", // Sprint
        "parent",
      ],
      expand = [],
    } = options;

    return this.request<JiraSearchResponse>(`${this.baseUrl}/search`, {
      method: "POST",
      body: JSON.stringify({
        jql,
        startAt,
        maxResults,
        fields,
        expand,
      }),
    });
  }

  async getIssue(
    issueKeyOrId: string,
    fields?: string[]
  ): Promise<JiraIssue> {
    const fieldsParam = fields?.join(",") || "";
    const url = fieldsParam
      ? `${this.baseUrl}/issue/${issueKeyOrId}?fields=${fieldsParam}`
      : `${this.baseUrl}/issue/${issueKeyOrId}`;
    return this.request<JiraIssue>(url);
  }

  async getIssuesByProject(
    projectKey: string,
    options: {
      issueTypes?: string[];
      statuses?: string[];
      maxResults?: number;
    } = {}
  ): Promise<JiraIssue[]> {
    const { issueTypes = ["Story", "Bug", "Task"], statuses, maxResults = 100 } = options;

    let jql = `project = "${projectKey}" AND issuetype IN (${issueTypes
      .map((t) => `"${t}"`)
      .join(", ")})`;

    if (statuses && statuses.length > 0) {
      jql += ` AND status IN (${statuses.map((s) => `"${s}"`).join(", ")})`;
    }

    jql += " ORDER BY updated DESC";

    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    let hasMore = true;

    while (hasMore && allIssues.length < maxResults) {
      const response = await this.searchIssues(jql, {
        startAt,
        maxResults: Math.min(50, maxResults - allIssues.length),
      });

      allIssues.push(...response.issues);
      startAt += response.issues.length;
      hasMore = startAt < response.total;
    }

    return allIssues;
  }

  // Boards
  async getBoards(projectKeyOrId?: string): Promise<JiraBoard[]> {
    let url = `${this.agileBaseUrl}/board?maxResults=100`;
    if (projectKeyOrId) {
      url += `&projectKeyOrId=${projectKeyOrId}`;
    }

    const response = await this.request<JiraBoardListResponse>(url);
    return response.values;
  }

  async getBoard(boardId: number): Promise<JiraBoard> {
    return this.request<JiraBoard>(`${this.agileBaseUrl}/board/${boardId}`);
  }

  // Sprints
  async getSprintsForBoard(
    boardId: number,
    state?: "active" | "closed" | "future"
  ): Promise<JiraSprint[]> {
    let url = `${this.agileBaseUrl}/board/${boardId}/sprint?maxResults=100`;
    if (state) {
      url += `&state=${state}`;
    }

    const response = await this.request<{
      values: JiraSprint[];
      isLast: boolean;
    }>(url);
    return response.values;
  }

  async getSprint(sprintId: number): Promise<JiraSprint> {
    return this.request<JiraSprint>(`${this.agileBaseUrl}/sprint/${sprintId}`);
  }

  async getIssuesForSprint(
    sprintId: number,
    options: {
      maxResults?: number;
      fields?: string[];
    } = {}
  ): Promise<JiraIssue[]> {
    const { maxResults = 100, fields } = options;

    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    let hasMore = true;

    while (hasMore && allIssues.length < maxResults) {
      let url = `${this.agileBaseUrl}/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=50`;
      if (fields) {
        url += `&fields=${fields.join(",")}`;
      }

      const response = await this.request<{
        issues: JiraIssue[];
        total: number;
      }>(url);

      allIssues.push(...response.issues);
      startAt += response.issues.length;
      hasMore = response.issues.length === 50 && allIssues.length < maxResults;
    }

    return allIssues;
  }

  // Get active sprint for a board
  async getActiveSprint(boardId: number): Promise<JiraSprint | null> {
    const sprints = await this.getSprintsForBoard(boardId, "active");
    return sprints.length > 0 ? sprints[0] : null;
  }

  // Get all stories in current sprint for a project
  async getCurrentSprintStories(projectKey: string): Promise<{
    sprint: JiraSprint | null;
    issues: JiraIssue[];
  }> {
    // Find boards for project
    const boards = await this.getBoards(projectKey);
    const scrumBoard = boards.find((b) => b.type === "scrum");

    if (!scrumBoard) {
      return { sprint: null, issues: [] };
    }

    // Get active sprint
    const activeSprint = await this.getActiveSprint(scrumBoard.id);
    if (!activeSprint) {
      return { sprint: null, issues: [] };
    }

    // Get issues in sprint
    const issues = await this.getIssuesForSprint(activeSprint.id);

    return { sprint: activeSprint, issues };
  }

  // Get backlog items
  async getBacklog(
    boardId: number,
    options: {
      maxResults?: number;
    } = {}
  ): Promise<JiraIssue[]> {
    const { maxResults = 100 } = options;

    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    let hasMore = true;

    while (hasMore && allIssues.length < maxResults) {
      const response = await this.request<{
        issues: JiraIssue[];
        total: number;
      }>(
        `${this.agileBaseUrl}/board/${boardId}/backlog?startAt=${startAt}&maxResults=50`
      );

      allIssues.push(...response.issues);
      startAt += response.issues.length;
      hasMore = response.issues.length === 50 && allIssues.length < maxResults;
    }

    return allIssues;
  }
}

// Helper to create client from stored credentials
export function createJiraClient(config: JiraClientConfig): JiraClient {
  return new JiraClient(config);
}
