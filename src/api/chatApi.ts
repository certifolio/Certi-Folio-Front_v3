/**
 * Chat API
 * 백엔드 엔드포인트: /api/chat
 *
 * [변경사항]
 * - 메시지 조회: 커서 기반 페이지네이션 (/messages?cursor=&size=)
 * - 채팅방 생성: mentorId만 전송 (userId는 서버에서 @AuthenticationPrincipal로 주입)
 */
import { apiClient } from './client';

export const chatApi = {
    /** 채팅방 생성/조회 - POST /api/chat/rooms */
    getOrCreateRoom: (mentorId: number, menteeUserId?: number) =>
        apiClient.post('/api/chat/rooms', { mentorId, menteeUserId }),

    /** 내 채팅방 목록 - GET /api/chat/rooms */
    getMyChatRooms: () =>
        apiClient.get('/api/chat/rooms'),

    /** 커서 기반 메시지 조회 - GET /api/chat/rooms/:id/messages?cursor=&size= */
    getMessages: (chatRoomId: number, cursor?: number, size: number = 50) => {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', String(cursor));
        params.set('size', String(size));
        const qs = params.toString();
        return apiClient.get(`/api/chat/rooms/${chatRoomId}/messages${qs ? `?${qs}` : ''}`);
    },

    /** REST로 메시지 전송 - POST /api/chat/rooms/:id/send */
    sendMessage: (chatRoomId: number, content: string) =>
        apiClient.post(`/api/chat/rooms/${chatRoomId}/send`, { content }),
};
