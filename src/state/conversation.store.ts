import type { ConversationState } from '../types/conversation';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const conversations = new Map<string, ConversationState>();

export function getConversation(chatId: string): ConversationState | null {
  const state = conversations.get(chatId);
  if (!state) return null;

  if (Date.now() - state.lastActivity.getTime() > STATE_TTL_MS) {
    conversations.delete(chatId);
    return null;
  }

  return state;
}

export function setConversation(chatId: string, state: ConversationState): void {
  conversations.set(chatId, { ...state, lastActivity: new Date() });
}

export function updateConversation(
  chatId: string,
  updates: Partial<Omit<ConversationState, 'lastActivity'>>
): ConversationState | null {
  const current = getConversation(chatId);
  if (!current) return null;

  const updated = { ...current, ...updates, lastActivity: new Date() };
  conversations.set(chatId, updated);
  return updated;
}

export function clearConversation(chatId: string): void {
  conversations.delete(chatId);
}

export function createInitialState(forwardedMessage: string): ConversationState {
  return {
    step: 'awaiting_epic',
    forwardedMessage,
    lastActivity: new Date(),
  };
}
