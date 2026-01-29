import { JiraProject } from "./jira";

export type ConversationStep =
  | 'idle'
  | 'awaiting_project_selection'
  | 'awaiting_confirmation';

export interface ProposedAction {
  type: 'create' | 'update' | 'comment';
  issueKey?: string;        // For update/comment
  summary?: string;         // For create
  description?: string;     // For create/update
  comment?: string;         // For comment
}

export interface ConversationState {
  step: ConversationStep;
  projects?: JiraProject[];
  selectedProject?: string;
  originalMessage?: string;
  proposedAction?: ProposedAction;
  lastActivity: Date;
}