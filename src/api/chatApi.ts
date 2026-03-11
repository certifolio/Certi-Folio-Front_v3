/**
 * Chat API
 * 백엔드 엔드포인트: /api/chat
 */
import { apiClient } from './client';

export const chatApi = {
    /** 채팅방 생성/조회 - POST /api/chat/rooms */
    getOrCreateRoom: (mentorId: number, userId?: number) =>
        apiClient.post('/api/chat/rooms', { mentorId, userId }),

    /** 내 채팅방 목록 - GET /api/chat/rooms */
    getMyChatRooms: () =>
        apiClient.get('/api/chat/rooms'),

    /** 채팅 기록 조회 - GET /api/chat/rooms/:id/messages */
    getChatHistory: (chatRoomId: number) =>
        apiClient.get(`/api/chat/rooms/${chatRoomId}/messages`),

    /** 최근 메시지 조회 - GET /api/chat/rooms/:id/messages/recent */
    getRecentMessages: (chatRoomId: number) =>
        apiClient.get(`/api/chat/rooms/${chatRoomId}/messages/recent`),

    /** REST로 메시지 전송 - POST /api/chat/rooms/:id/send */
    sendMessage: (chatRoomId: number, content: string) =>
        apiClient.post(`/api/chat/rooms/${chatRoomId}/send`, { content }),
};
