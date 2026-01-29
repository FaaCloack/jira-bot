import type { SimpleEpic, SimpleIssue } from './jira';

export type ConversationStep =
  | 'idle'
  | 'awaiting_epic'
  | 'processing'
  | 'awaiting_confirmation';

export interface ProposedAction {
  type: 'create' | 'update' | 'comment';
  issueKey?: string;
  summary?: string;
  description?: string;
  comment?: string;
}

export interface ConversationState {
  step: ConversationStep;
  forwardedMessage?: string;
  epic?: SimpleEpic;
  candidateIssues?: SimpleIssue[];
  proposedAction?: ProposedAction;
  lastActivity: Date;
}

export type AiDecision = {
  action: "create" | "update" | "comment" | "none";
  issueKey: string | null;
  summary: string;
  description: string;
};
