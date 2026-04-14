import { Router } from 'express';

import {
    getConversationHandler,
    getInboxHandler,
    markConversationReadHandler,
    sendMessageHandler,
    startAdminConversationHandler,
    startConversationHandler,
} from './messages.controller';
import {
    conversationLimiter,
    inboxLimiter,
    markReadLimiter,
    sendMessageLimiter,
    startConversationLimiter,
} from './messages.rateLimit';

export const messagesRouter = Router();

messagesRouter.get('/inbox', inboxLimiter, getInboxHandler);
messagesRouter.get('/conversations/:id', conversationLimiter, getConversationHandler);

messagesRouter.post('/conversations/:id/messages', sendMessageLimiter, sendMessageHandler);
messagesRouter.post('/conversations/:id/read', markReadLimiter, markConversationReadHandler);

messagesRouter.post('/start', startConversationLimiter, startConversationHandler);
messagesRouter.post('/admin/start', startConversationLimiter, startAdminConversationHandler);