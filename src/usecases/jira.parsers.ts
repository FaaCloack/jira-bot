import type { JiraIssue, SimpleIssue, SimpleEpic } from '../types/jira';
import { buildIssueUrl } from '../services/jira.service';
import { ProposedAction } from '../types/conversation';

export function formatIssueForDisplay(issue: JiraIssue): SimpleIssue {
  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    assignee: issue.fields.assignee?.displayName,
    description: issue.fields.description,
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

  return `${actionText[action]}: *${issue.key}*\n${issue.summary}\nStatus: ${issue.status}\n\n${buildIssueUrl(issue.key)}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function formatProposedAction(action: ProposedAction, epicName: string): string {
  const lines: string[] = [];

  if (action.type === "create") {
    lines.push(`*Create new task* under Epic "${epicName}":`);
    lines.push("");
    lines.push(`*Summary:* ${action.summary}`);
    if (action.description) {
      lines.push(`*Description:* ${truncate(action.description, 200)}`);
    }
  } else if (action.type === "update") {
    lines.push(`*Update task* ${action.issueKey}:`);
    if (action.summary) {
      lines.push(`*New summary:* ${action.summary}`);
    }
    if (action.description) {
      lines.push(`*New description:* ${truncate(action.description, 200)}`);
    }
  } else if (action.type === "comment") {
    lines.push(`*Add comment* to ${action.issueKey}:`);
    lines.push(`"${truncate(action.comment || "", 200)}"`);
  }

  lines.push("");

  return lines.join("\n");
}
