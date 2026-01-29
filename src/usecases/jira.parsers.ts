import type { JiraIssue, SimpleIssue, SimpleEpic } from '../types/jira';
import { buildIssueUrl } from '../services/jira.service';

export function formatIssueForDisplay(issue: JiraIssue): SimpleIssue {
  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    assignee: issue.fields.assignee?.displayName,
    url: buildIssueUrl(issue.key),
  };
}

export function formatEpicForDisplay(epic: JiraIssue): SimpleEpic {
  return {
    key: epic.key,
    name: epic.fields.summary,
    status: epic.fields.status.name,
  };
}

export function formatIssueListForWhatsApp(issues: SimpleIssue[]): string {
  if (issues.length === 0) {
    return 'No issues found under this epic.';
  }

  const lines = issues.map(
    (issue, index) =>
      `${index + 1}. *${issue.key}*: ${issue.summary}\n   Status: ${issue.status}${issue.assignee ? ` | Assignee: ${issue.assignee}` : ''}`
  );

  return lines.join('\n\n');
}

export function formatIssueConfirmation(
  issue: SimpleIssue,
  action: 'created' | 'updated' | 'commented'
): string {
  const actionText = {
    created: 'Created new task',
    updated: 'Updated task',
    commented: 'Added comment to',
  };

  return `${actionText[action]}: *${issue.key}*\n${issue.summary}\nStatus: ${issue.status}\n\n${issue.url}`;
}
