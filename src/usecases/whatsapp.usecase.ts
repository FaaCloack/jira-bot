import type { ParsedMessage } from "../types/whatsapp";
import type { ProposedAction } from "../types/conversation";
import { sendTextMessage, markAsRead } from "../services/whatsapp.service";
import {
  getConversation,
  setConversation,
  updateConversation,
  clearConversation,
  createInitialState,
} from "../state/conversation.store";
import {
  findEpic,
  fetchIssuesUnderEpic,
  createTaskUnderEpic,
  updateExistingIssue,
  addCommentToIssue,
} from "./jira.usecase";
import { formatIssueConfirmation, formatProposedAction, truncate } from "./jira.parsers";
import { logger } from "../utils/logger";

const MESSAGES = {
  ASK_EPIC: "Please specify the Project name this should be related to.",
  EPIC_NOT_FOUND: (name: string) =>
    `Project "${name}" not found. Please try again with a valid Project name.`,
  PROCESSING: "Processing your request...",
  ERROR: "Something went wrong. Please try again.",
  CANCELLED: "Action cancelled.",
  CONFIRM_PROMPT: "Reply *yes* to confirm or *no* to cancel.",
};

const CONFIRM_YES = ["yes", "y", "si", "confirm", "ok"];
const CONFIRM_NO = ["no", "n", "cancel", "cancelar"];

export async function handleIncomingMessage(
  message: ParsedMessage
): Promise<void> {
  logger.info({ from: message.from, text: message.text }, "Received message");

  try {
    await markAsRead(message.messageId);
  } catch (err) {
    logger.error({ err }, "Failed to mark message as read");
  }

  const chatId = message.from;

  try {
    const state = getConversation(chatId);

    if (!state) {
      await handleNewConversation(chatId, message);
    } else if (state.step === "awaiting_epic") {
      await handleEpicSelection(chatId, message);
    } else if (state.step === "awaiting_confirmation") {
      await handleConfirmation(chatId, message);
    } else {
      await sendTextMessage(chatId, MESSAGES.ERROR);
      clearConversation(chatId);
    }
  } catch (err) {
    logger.error({ err }, "Error handling message");
    await sendTextMessage(chatId, MESSAGES.ERROR);
    clearConversation(chatId);
  }
}

async function handleNewConversation(
  chatId: string,
  message: ParsedMessage
): Promise<void> {
  logger.info({ chatId }, "Starting new conversation");

  setConversation(chatId, createInitialState(message.text));
  await sendTextMessage(chatId, MESSAGES.ASK_EPIC);
}

async function handleEpicSelection(
  chatId: string,
  message: ParsedMessage
): Promise<void> {
  const epicName = message.text.trim();
  logger.info({ chatId, epicName }, "User provided Project name");

  const result = await findEpic(epicName);

  if (!result.found || !result.epic) {
    await sendTextMessage(chatId, MESSAGES.EPIC_NOT_FOUND(epicName));
    return;
  }

  const state = getConversation(chatId);
  if (!state) {
    await sendTextMessage(chatId, MESSAGES.ERROR);
    return;
  }

  updateConversation(chatId, { step: "processing", epic: result.epic });

  await sendTextMessage(chatId, MESSAGES.PROCESSING);

  const issues = await fetchIssuesUnderEpic(result.epic.key);

  logger.info(
    { chatId, epicKey: result.epic.key, issueCount: issues.length },
    "Fetched issues under Project"
  );

  // TODO: Call AI to decide action based on:
  // - state.forwardedMessage (original message)
  // - result.epic (selected epic)
  // - issues (candidate issues)
  //
  // For now, always propose creating a new task

  const proposedAction: ProposedAction = {
    type: "create",
    summary: truncate(state.forwardedMessage || "New task", 100),
    description: state.forwardedMessage,
  };

  updateConversation(chatId, {
    step: "awaiting_confirmation",
    proposedAction,
  });

  const confirmationMessage = formatProposedAction(proposedAction, result.epic.name) + MESSAGES.CONFIRM_PROMPT;
  await sendTextMessage(chatId, confirmationMessage);
}

async function handleConfirmation(
  chatId: string,
  message: ParsedMessage
): Promise<void> {
  const response = message.text.trim().toLowerCase();

  const state = getConversation(chatId);
  if (!state || !state.proposedAction || !state.epic) {
    await sendTextMessage(chatId, MESSAGES.ERROR);
    clearConversation(chatId);
    return;
  }

  if (CONFIRM_NO.includes(response)) {
    logger.info({ chatId }, "User cancelled action");
    await sendTextMessage(chatId, MESSAGES.CANCELLED);
    clearConversation(chatId);
    return;
  }

  if (!CONFIRM_YES.includes(response)) {
    await sendTextMessage(chatId, MESSAGES.CONFIRM_PROMPT);
  }

  logger.info({ chatId, action: state.proposedAction }, "User confirmed action");

  const { proposedAction, epic } = state;

  const resultMessage = await processJiraBotAction(proposedAction, epic.key);

  if (resultMessage) {
    await sendTextMessage(chatId, resultMessage);
  } else {
    await sendTextMessage(chatId, MESSAGES.ERROR);
  }

  clearConversation(chatId);
}

async function processJiraBotAction(
  action: ProposedAction,
  epicKey: string
): Promise<string | null> {
  try {
    if (action.type === "create") {
      const newIssue = await createTaskUnderEpic({
        epicKey,
        summary: action.summary || "New task",
        description: action.description,
      });
      logger.info({ issueKey: newIssue.key }, "Created new issue");
      return formatIssueConfirmation(newIssue, "created");
    }

    if (action.type === "update" && action.issueKey) {
      const updatedIssue = await updateExistingIssue({
        issueKey: action.issueKey,
        summary: action.summary,
        description: action.description,
      });
      logger.info({ issueKey: updatedIssue.key }, "Updated issue");
      return formatIssueConfirmation(updatedIssue, "updated");
    }

    if (action.type === "comment" && action.issueKey && action.comment) {
      const commentedIssue = await addCommentToIssue(action.issueKey, action.comment);
      logger.info({ issueKey: commentedIssue.key }, "Added comment");
      return formatIssueConfirmation(commentedIssue, "commented");
    }

    return null;
  } catch (err) {
    logger.error({ err }, "Failed to execute Jira action");
    return null;
  }
}

export function verifyWebhook(mode: string, token: string): boolean {
  return mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN;
}
