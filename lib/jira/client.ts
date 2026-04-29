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

// Request timeout in milliseconds (30 seconds for JIRA API calls)
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new JiraApiError(
        `Request timeout after ${timeout}ms: ${url}`,
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

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
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const response = await fetchWithTimeout(url, {
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
    const response = await fetchWithTimeout(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
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
    try {
      // Try the newer search endpoint first
      const response = await this.request<{
        values: JiraProject[];
        isLast: boolean;
      }>(`${this.baseUrl}/project/search?maxResults=100`);
      return response.values;
    } catch (error) {
      // Fall back to the older endpoint if search fails (410 Gone or other errors)
      if (error instanceof JiraApiError && (error.statusCode === 410 || error.statusCode === 404)) {
        const projects = await this.request<JiraProject[]>(`${this.baseUrl}/project`);
        return projects;
      }
      throw error;
    }
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

  // ============================================
  // WRITE OPERATIONS (Bi-directional sync)
  // ============================================

  /**
   * Update issue fields
   */
  async updateIssue(
    issueKeyOrId: string,
    update: {
      fields?: Partial<{
        summary: string;
        description: string | JiraDocument;
        labels: string[];
        priority: { name: string };
        assignee: { accountId: string } | null;
        customfield_10016: number; // Story points
      }>;
      update?: {
        labels?: Array<{ add: string } | { remove: string }>;
      };
    }
  ): Promise<void> {
    await this.request<void>(`${this.baseUrl}/issue/${issueKeyOrId}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  /**
   * Add a comment to an issue
   */
  async addComment(
    issueKeyOrId: string,
    body: string | JiraDocument
  ): Promise<{ id: string; created: string }> {
    // Convert plain text to ADF if needed
    const commentBody = typeof body === "string"
      ? this.textToAdf(body)
      : body;

    return this.request<{ id: string; created: string }>(
      `${this.baseUrl}/issue/${issueKeyOrId}/comment`,
      {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      }
    );
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKeyOrId: string): Promise<{
    transitions: Array<{
      id: string;
      name: string;
      to: { id: string; name: string; statusCategory: { name: string } };
    }>;
  }> {
    return this.request<{
      transitions: Array<{
        id: string;
        name: string;
        to: { id: string; name: string; statusCategory: { name: string } };
      }>;
    }>(`${this.baseUrl}/issue/${issueKeyOrId}/transitions`);
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(
    issueKeyOrId: string,
    transitionId: string,
    fields?: Record<string, unknown>
  ): Promise<void> {
    const body: { transition: { id: string }; fields?: Record<string, unknown> } = {
      transition: { id: transitionId },
    };
    if (fields) {
      body.fields = fields;
    }

    await this.request<void>(
      `${this.baseUrl}/issue/${issueKeyOrId}/transitions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Add labels to an issue
   */
  async addLabels(issueKeyOrId: string, labels: string[]): Promise<void> {
    await this.updateIssue(issueKeyOrId, {
      update: {
        labels: labels.map((label) => ({ add: label })),
      },
    });
  }

  /**
   * Remove labels from an issue
   */
  async removeLabels(issueKeyOrId: string, labels: string[]): Promise<void> {
    await this.updateIssue(issueKeyOrId, {
      update: {
        labels: labels.map((label) => ({ remove: label })),
      },
    });
  }

  /**
   * Update story points
   */
  async updateStoryPoints(
    issueKeyOrId: string,
    points: number,
    storyPointsField = "customfield_10016"
  ): Promise<void> {
    await this.request<void>(`${this.baseUrl}/issue/${issueKeyOrId}`, {
      method: "PUT",
      body: JSON.stringify({
        fields: {
          [storyPointsField]: points,
        },
      }),
    });
  }

  /**
   * Assign issue to a user
   */
  async assignIssue(
    issueKeyOrId: string,
    accountId: string | null
  ): Promise<void> {
    await this.request<void>(
      `${this.baseUrl}/issue/${issueKeyOrId}/assignee`,
      {
        method: "PUT",
        body: JSON.stringify({ accountId }),
      }
    );
  }

  /**
   * Search for users (for assignee picker)
   */
  async searchUsers(query: string): Promise<JiraUser[]> {
    const response = await this.request<JiraUser[]>(
      `${this.baseUrl}/user/search?query=${encodeURIComponent(query)}&maxResults=10`
    );
    return response;
  }

  /**
   * Get issue edit metadata (available fields and their options)
   */
  async getEditMeta(issueKeyOrId: string): Promise<{
    fields: Record<string, {
      required: boolean;
      name: string;
      allowedValues?: Array<{ id: string; name: string }>;
    }>;
  }> {
    return this.request<{
      fields: Record<string, {
        required: boolean;
        name: string;
        allowedValues?: Array<{ id: string; name: string }>;
      }>;
    }>(`${this.baseUrl}/issue/${issueKeyOrId}/editmeta`);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Convert plain text to Atlassian Document Format (ADF)
   */
  private textToAdf(text: string): JiraDocument {
    const lines = text.split("\n");
    const content: JiraDocumentNode[] = [];

    for (const line of lines) {
      if (line.trim()) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: line }],
        });
      }
    }

    return {
      type: "doc",
      version: 1,
      content: content.length > 0 ? content : [{ type: "paragraph", content: [] }],
    };
  }

  /**
   * Convert ADF to plain text
   */
  static adfToText(doc: JiraDocument | string | undefined | null): string {
    if (!doc) return "";
    if (typeof doc === "string") return doc;

    const extractText = (nodes: JiraDocumentNode[]): string => {
      return nodes
        .map((node) => {
          if (node.text) return node.text;
          if (node.content) return extractText(node.content);
          if (node.type === "hardBreak") return "\n";
          return "";
        })
        .join("");
    };

    return extractText(doc.content);
  }
}

// Types for JiraDocument that were added separately
interface JiraDocumentNode {
  type: string;
  text?: string;
  content?: JiraDocumentNode[];
}

interface JiraDocument {
  type: "doc";
  version: 1;
  content: JiraDocumentNode[];
}

interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: Record<string, string>;
  active: boolean;
}

// Helper to create client from stored credentials
export function createJiraClient(config: JiraClientConfig): JiraClient {
  return new JiraClient(config);
}
