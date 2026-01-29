import type {
  JiraIssue,
  JiraSearchResult,
  CreateIssueResponse,
  AddCommentRequest,
  JiraComment,
} from "../types/jira";
import { logger } from "../utils/logger";

function getConfig() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error("Missing Jira configuration");
  }

  return { baseUrl, email, apiToken, projectKey };
}

function getAuthHeader(): string {
  const { email, apiToken } = getConfig();
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
}

async function jiraFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { baseUrl } = getConfig();
  const url = `${baseUrl}/rest/api/3${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Jira API error ${response.status}: ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const result = await response.json();
  logger.debug({ result }, "Jira API response");
  return result as T;
}

async function searchIssues(
  jql: string,
  maxResults = 20,
): Promise<JiraSearchResult> {
  return jiraFetch<JiraSearchResult>("/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql,
      maxResults,
      fields: [
        "summary",
        "status",
        "issuetype",
        "project",
        "assignee",
        "reporter",
        "created",
        "updated",
        "priority",
        "description",
      ],
    }),
  });
}

export async function findEpicByName(
  epicName: string,
): Promise<JiraIssue | null> {
  const { projectKey } = getConfig();
  const jql = `project = "${projectKey}" AND issuetype = Project AND summary ~ "${epicName}" ORDER BY updated DESC`;
  const result = await searchIssues(jql, 1);
  return result.issues[0] || null;
}

export async function getIssuesUnderEpic(
  epicKey: string,
  maxResults = 20,
): Promise<JiraSearchResult> {
  const { projectKey } = getConfig();
  const jql = `project = "${projectKey}" AND parent = "${epicKey}" ORDER BY updated DESC`;
  return searchIssues(jql, maxResults);
}

export async function getIssue(issueKey: string): Promise<JiraIssue> {
  return jiraFetch<JiraIssue>(`/issue/${issueKey}`);
}

export async function createIssueUnderEpic(
  epicKey: string,
  summary: string,
  description?: string,
  issueType = "Task",
): Promise<CreateIssueResponse> {
  const { projectKey } = getConfig();

  const request = {
    fields: {
      project: { key: projectKey },
      parent: { key: epicKey },
      summary,
      issuetype: { name: issueType },
      ...(description && {
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: description }],
            },
          ],
        },
      }),
    },
  };

  return jiraFetch<CreateIssueResponse>("/issue", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateIssue(
  issueKey: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await jiraFetch<void>(`/issue/${issueKey}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export async function addComment(
  issueKey: string,
  commentText: string,
): Promise<JiraComment> {
  const request: AddCommentRequest = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: commentText }],
        },
      ],
    },
  };

  return jiraFetch<JiraComment>(`/issue/${issueKey}/comment`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function buildIssueUrl(issueKey: string): string {
  const { baseUrl } = getConfig();
  return `${baseUrl}/browse/${issueKey}`;
}
