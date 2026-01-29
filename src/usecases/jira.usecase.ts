import type { SimpleIssue, SimpleEpic, CreateIssueWithEpicParams, UpdateIssueParams } from '../types/jira';
import {
  findEpicByName,
  getIssuesUnderEpic,
  createIssueUnderEpic,
  updateIssue,
  addComment,
  getIssue,
} from '../services/jira.service';
import { formatIssueForDisplay, formatEpicForDisplay } from './jira.parsers';

export interface FindEpicResult {
  found: boolean;
  epic?: SimpleEpic;
}

export async function findEpic(epicName: string): Promise<FindEpicResult> {
  const epic = await findEpicByName(epicName);
  if (!epic) {
    return { found: false };
  }
  return { found: true, epic: formatEpicForDisplay(epic) };
}

export async function fetchIssuesUnderEpic(epicKey: string): Promise<SimpleIssue[]> {
  const result = await getIssuesUnderEpic(epicKey);
  return result.issues.map(formatIssueForDisplay);
}

export async function createTaskUnderEpic(params: CreateIssueWithEpicParams): Promise<SimpleIssue> {
  const response = await createIssueUnderEpic(
    params.epicKey,
    params.summary,
    params.description,
    params.issueType || 'Task'
  );
  const issue = await getIssue(response.key);
  return formatIssueForDisplay(issue);
}

export async function updateExistingIssue(params: UpdateIssueParams): Promise<SimpleIssue> {
  const fields: Record<string, unknown> = {};

  if (params.summary) {
    fields.summary = params.summary;
  }

  if (params.description) {
    fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: params.description }],
        },
      ],
    };
  }

  if (Object.keys(fields).length > 0) {
    await updateIssue(params.issueKey, fields);
  }

  const issue = await getIssue(params.issueKey);
  return formatIssueForDisplay(issue);
}

export async function addCommentToIssue(issueKey: string, comment: string): Promise<SimpleIssue> {
  await addComment(issueKey, comment);
  const issue = await getIssue(issueKey);
  return formatIssueForDisplay(issue);
}
