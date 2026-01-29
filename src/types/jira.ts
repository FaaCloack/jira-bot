// Jira Cloud REST API Types

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    key: string;
    name: string;
  };
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | null;
    status: JiraStatus;
    issuetype: JiraIssueType;
    project: JiraProject;
    assignee?: JiraUser | null;
    reporter?: JiraUser | null;
    created: string;
    updated: string;
    priority?: {
      id: string;
      name: string;
    };
  };
}

export interface JiraSearchResult {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface CreateIssueRequest {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description?: {
      type: 'doc';
      version: 1;
      content: Array<{
        type: 'paragraph';
        content: Array<{
          type: 'text';
          text: string;
        }>;
      }>;
    };
    issuetype: {
      name: string;
    };
  };
}

export interface CreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

export interface AddCommentRequest {
  body: {
    type: 'doc';
    version: 1;
    content: Array<{
      type: 'paragraph';
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
}

export interface JiraComment {
  id: string;
  body: unknown;
  author: JiraUser;
  created: string;
  updated: string;
}

// Simplified issue for display
export interface SimpleIssue {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  description?: string | null;
}

export interface CreateIssueParams {
  projectKey: string;
  summary: string;
  description?: string;
  issueType?: string;
}

export interface UpdateIssueParams {
  issueKey: string;
  summary?: string;
  description?: string;
}

// Epic types
export interface SimpleEpic {
  key: string;
  name: string;
  status: string;
}

export interface CreateIssueWithEpicParams {
  epicKey: string;
  summary: string;
  description?: string;
  issueType?: string;
}