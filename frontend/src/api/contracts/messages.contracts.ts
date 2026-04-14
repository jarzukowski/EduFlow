import type {
  ConversationDTO,
  InboxCourseDTO,
  InboxItemDTO,
  InboxResponseDTO,
  MessageDTO,
  ParticipantDTO,
  StartConversationResponseDTO,
} from '@/types/messages.types';

import {
  isFiniteNumber,
  isNonEmptyString,
  isNullableString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

export const isParticipantDTO = (value: unknown): value is ParticipantDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.username)
  );
};

export const isInboxCourseDTO = (value: unknown): value is InboxCourseDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.ownerId)
  );
};

export const isMessageDTO = (value: unknown): value is MessageDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.conversationId) &&
    isNonEmptyString(value.senderId) &&
    isNonEmptyString(value.body) &&
    isNonEmptyString(value.createdAt)
  );
};

export const isInboxItemDTO = (value: unknown): value is InboxItemDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.conversationId) &&
    isNonEmptyString(value.title) &&
    (value.course === null || isInboxCourseDTO(value.course)) &&
    Array.isArray(value.participants) &&
    value.participants.every(isParticipantDTO) &&
    isNullableString(value.lastMessageAt) &&
    isNullableString(value.lastMessagePreview) &&
    isFiniteNumber(value.unreadCount) &&
    value.unreadCount >= 0 &&
    isNonEmptyString(value.updatedAt)
  );
};

export const parseInboxResponseDTO = (value: unknown): InboxResponseDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid inbox response: expected object.');
  }

  const { items, unreadCount, nextCursor } = value;

  if (!Array.isArray(items) || !items.every(isInboxItemDTO)) {
    throw new Error('Invalid inbox response: invalid items.');
  }

  if (!isFiniteNumber(unreadCount) || unreadCount < 0) {
    throw new Error('Invalid inbox response: invalid unreadCount.');
  }

  if (nextCursor !== undefined && !isNullableString(nextCursor)) {
    throw new Error('Invalid inbox response: invalid nextCursor.');
  }

  return {
    items,
    unreadCount,
    ...(nextCursor === undefined ? {} : { nextCursor }),
  };
};

export const parseConversationDTO = (value: unknown): ConversationDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid conversation response: expected object.');
  }

  if (
    !isNonEmptyString(value.conversationId) ||
    !isNonEmptyString(value.title) ||
    !(value.course === null || isInboxCourseDTO(value.course)) ||
    !Array.isArray(value.participants) ||
    !value.participants.every(isParticipantDTO) ||
    !Array.isArray(value.messages) ||
    !value.messages.every(isMessageDTO) ||
    !isFiniteNumber(value.unreadCount) ||
    value.unreadCount < 0
  ) {
    throw new Error('Invalid conversation response: invalid payload.');
  }

  return {
    conversationId: value.conversationId,
    title: value.title,
    course: value.course,
    participants: value.participants,
    messages: value.messages,
    unreadCount: value.unreadCount,
  };
};

export const parseStartConversationResponseDTO = (
  value: unknown,
): StartConversationResponseDTO => {
  if (!isPlainObject(value) || !isNonEmptyString(value.conversationId)) {
    throw new Error('Invalid start conversation response: invalid conversationId.');
  }

  return {
    conversationId: value.conversationId,
  };
};
