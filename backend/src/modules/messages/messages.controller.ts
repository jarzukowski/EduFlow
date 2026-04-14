import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { requireParamId, requireUserOrThrow } from '../../common/http/authHttp';

import { messagesService } from './messages.service';
import {
    validateGetInboxQuery,
    validateSendMessageDto,
    validateStartAdminConversationDto,
    validateStartConversationDto,
} from './messages.validation';

export const getInboxHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireUserOrThrow(request);
        const query = validateGetInboxQuery(request.query);

        const inbox = await messagesService.getInbox(
            { id: authenticatedUser.id, role: authenticatedUser.role },
            query,
        );

        response.status(200).json(inbox);
    } catch (error) {
        next(error);
    }
};

export const getConversationHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireUserOrThrow(request);
        const conversationId = requireParamId(request.params.id, 'conversationId');

        const conversation = await messagesService.getConversation(
            conversationId,
            { id: authenticatedUser.id, role: authenticatedUser.role },
        );

        response.status(200).json(conversation);
    } catch (error) {
        next(error);
    }
};

export const sendMessageHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireUserOrThrow(request);
        const conversationId = requireParamId(request.params.id, 'conversationId');
        const dto = validateSendMessageDto(request.body);

        await messagesService.sendMessage(
            conversationId,
            { id: authenticatedUser.id, role: authenticatedUser.role },
            dto,
        );

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const markConversationReadHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireUserOrThrow(request);
        const conversationId = requireParamId(request.params.id, 'conversationId');

        await messagesService.markRead(
            conversationId,
            { id: authenticatedUser.id, role: authenticatedUser.role },
        );

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const startConversationHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireUserOrThrow(request);
        const dto = validateStartConversationDto(request.body);

        const result = await messagesService.startConversation(
            { id: authenticatedUser.id, role: authenticatedUser.role },
            dto,
        );

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const startAdminConversationHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireUserOrThrow(request);

        if (authenticatedUser.role !== 'ADMIN') {
            throw new AppError(
                'FORBIDDEN',
                403,
                'Only admin can start admin conversations',
            );
        }

        const dto = validateStartAdminConversationDto(request.body);

        const result = await messagesService.startAdminConversation(
            { id: authenticatedUser.id, role: authenticatedUser.role },
            dto,
        );

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};