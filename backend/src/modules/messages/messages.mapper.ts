import type { Conversation, Message, User } from '../../../generated/client';

import type {
    ConversationDTO,
    InboxItemDTO,
    MessageDTO,
    ParticipantDTO,
} from './messages.types';

export type CourseShape = {
    id: string;
    title: string;
    ownerId: string;
};

export type ConversationWithIncludes = Conversation & {
    course: CourseShape | null;
    participants: Array<{
        user: Pick<User, 'id' | 'email' | 'username'>;
    }>;
};

type InboxRow = {
    conversation: ConversationWithIncludes;
    lastMessage: Message | null;
    unreadCount: number;
    viewerUserId: string;
};

const safeTrim = (value: string): string => value.trim();

const pickFirstNonEmpty = (
    ...candidates: Array<string | null | undefined>
): string | null => {
    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }

        const trimmedCandidate = safeTrim(candidate);

        if (trimmedCandidate.length > 0) {
            return trimmedCandidate;
        }
    }

    return null;
};

export const mapMessageToDTO = (message: Message): MessageDTO => ({
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
});

export const mapParticipants = (
    conversation: ConversationWithIncludes,
): ParticipantDTO[] =>
    conversation.participants.map((participant) => ({
        id: participant.user.id,
        email: participant.user.email,
        username: participant.user.username,
    }));

export const resolveConversationTitle = (
    conversation: ConversationWithIncludes,
    viewerUserId: string,
): string => {
    const courseTitle = conversation.course?.title
        ? pickFirstNonEmpty(conversation.course.title)
        : null;

    if (courseTitle) {
        return courseTitle;
    }

    const otherUser = conversation.participants
        .map((participant) => participant.user)
        .find((participantUser) => participantUser.id !== viewerUserId);

    if (!otherUser) {
        return 'Rozmowa';
    }

    const preferredTitle = pickFirstNonEmpty(
        otherUser.username,
        otherUser.email,
    );

    return preferredTitle ?? 'Rozmowa';
};

export const mapInboxRowToDTO = (row: InboxRow): InboxItemDTO => {
    const lastMessagePreview = row.lastMessage
        ? row.lastMessage.body.slice(0, 90)
        : null;

    return {
        conversationId: row.conversation.id,
        title: resolveConversationTitle(row.conversation, row.viewerUserId),
        course: row.conversation.course
            ? {
                id: row.conversation.course.id,
                title: row.conversation.course.title,
                ownerId: row.conversation.course.ownerId,
            }
            : null,
        participants: mapParticipants(row.conversation),
        lastMessageAt: row.lastMessage
            ? row.lastMessage.createdAt.toISOString()
            : null,
        lastMessagePreview,
        unreadCount: row.unreadCount,
        updatedAt: row.conversation.updatedAt.toISOString(),
    };
};

export const mapConversationToDTO = (
    conversation: ConversationWithIncludes,
    messages: Message[],
    viewerUserId: string,
): ConversationDTO => ({
    conversationId: conversation.id,
    title: resolveConversationTitle(conversation, viewerUserId),
    course: conversation.course
        ? {
            id: conversation.course.id,
            title: conversation.course.title,
            ownerId: conversation.course.ownerId,
        }
        : null,
    participants: mapParticipants(conversation),
    messages: messages.map(mapMessageToDTO),
    unreadCount: 0,
});