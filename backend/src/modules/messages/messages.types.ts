export type MessageDTO = {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    createdAt: string;
};

export type ParticipantDTO = {
    id: string;
    email: string;
    username: string;
};

export type InboxCourseDTO = {
    id: string;
    title: string;
    ownerId: string;
};

export type InboxItemDTO = {
    conversationId: string;
    title: string;
    course: InboxCourseDTO | null;
    participants: ParticipantDTO[];
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    unreadCount: number;
    updatedAt: string;
};

export type InboxResponseDTO = {
    items: InboxItemDTO[];
    unreadCount: number;
    nextCursor: string | null;
};

export type ConversationDTO = {
    conversationId: string;
    title: string;
    course: InboxCourseDTO | null;
    participants: ParticipantDTO[];
    messages: MessageDTO[];
    unreadCount: number;
};

export type SendMessageDto = {
    body: string;
};

export type StartConversationDto = {
    courseId: string;
    studentId?: string;
};

export type StartAdminConversationDto = {
    userId: string;
};

export type StartConversationResponseDTO = {
    conversationId: string;
};

export type GetInboxQuery = {
    limit: number;
    unreadOnly: boolean;
    cursor: string | null;
};