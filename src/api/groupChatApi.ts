/**
 * Group Chat API
 * 백엔드 엔드포인트: /api/group-chat
 *
 * [변경사항]
 * - 필드명: companyName → chattingroomName
 * - 메시지 조회: 커서 기반 페이지네이션
 * - 방 참여: joinRoom은 JoinResponse 반환 (시스템 메시지는 WebSocket으로 broadcast)
 */
import { apiClient } from './client';

export interface GroupChatRoom {
    roomId: number;
    chattingroomName: string;
    description: string | null;
    participantCount: number;
    joined: boolean;
    createdAt: string | null;
    lastMessageAt: string | null;
}

export interface GroupChatMessage {
    id: number;
    roomId: number;
    senderId: number;
    senderName: string;
    senderProfileImage: string | null;
    content: string;
    type: string; // 'CHAT' | 'SYSTEM'
    sentAt: string;
    isMine: boolean;
}

export const groupChatApi = {
    /** 채팅방 생성 - POST /api/group-chat/rooms */
    createRoom: (data: { chattingroomName: string; description?: string }) =>
        apiClient.post('/api/group-chat/rooms', data),

    /** 전체 채팅방 목록 - GET /api/group-chat/rooms */
    getAllRooms: (): Promise<{ rooms: GroupChatRoom[]; totalCount: number }> =>
        apiClient.get('/api/group-chat/rooms'),

    /** 내 채팅방 목록 - GET /api/group-chat/rooms/my */
    getMyRooms: (): Promise<{ rooms: GroupChatRoom[]; totalCount: number }> =>
        apiClient.get('/api/group-chat/rooms/my'),

    /** 채팅방 참여 - POST /api/group-chat/rooms/:id/join */
    joinRoom: (roomId: number) =>
        apiClient.post(`/api/group-chat/rooms/${roomId}/join`),

    /** 채팅방 나가기 - DELETE /api/group-chat/rooms/:id/leave */
    leaveRoom: (roomId: number) =>
        apiClient.delete(`/api/group-chat/rooms/${roomId}/leave`),

    /** 메시지 조회 (커서 기반) - GET /api/group-chat/rooms/:id/messages?cursor=&size= */
    getMessages: (roomId: number, cursor?: number, size: number = 50): Promise<{
        roomId: number;
        messages: GroupChatMessage[];
        size: number;
        nextCursor: number | null;
        hasNext: boolean;
    }> => {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', String(cursor));
        params.set('size', String(size));
        const qs = params.toString();
        return apiClient.get(`/api/group-chat/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`);
    },

    /** REST로 메시지 전송 - POST /api/group-chat/rooms/:id/send */
    sendMessage: (roomId: number, content: string) =>
        apiClient.post(`/api/group-chat/rooms/${roomId}/send`, { content }),
};
