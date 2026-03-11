/**
 * Mentoring API
 * 백엔드 엔드포인트: /api/mentors, /api/mentoring-applications
 */
import { apiClient } from './client';

// ===== Mentors =====

export const mentorApi = {
    /** 멘토 검색/목록 조회 - GET /api/mentors */
    searchMentors: (params?: { skills?: string; location?: string }) => {
        const query = new URLSearchParams();
        if (params?.skills) query.set('skills', params.skills);
        if (params?.location) query.set('location', params.location);
        const qs = query.toString();
        return apiClient.get(`/api/mentors${qs ? `?${qs}` : ''}`);
    },

    /** 멘토 프로필 상세 조회 - GET /api/mentors/:id */
    getMentorProfile: (mentorId: number) =>
        apiClient.get(`/api/mentors/${mentorId}`),

    /** 멘토 신청 - POST /api/mentors/apply */
    applyMentor: (data: {
        name: string;
        title: string;
        company?: string;
        experience: string;
        expertise: string[];
        bio: string;
        availability: string[];
        preferredFormat: string;
        certificates?: string[];
    }) => apiClient.post('/api/mentors/apply', data),

    /** 내 멘토 프로필 조회 - GET /api/mentors/me */
    getMyMentorProfile: () =>
        apiClient.get('/api/mentors/me'),

    /** 내 멘토 프로필 수정 - PUT /api/mentors/me */
    updateMyMentorProfile: (data: any) =>
        apiClient.put('/api/mentors/me', data),
};

// ===== Mentoring Applications =====

export const mentoringApplicationApi = {
    /** 멘토링 신청 - POST /api/mentoring-applications */
    createApplication: (data: {
        mentorId: number;
        description?: string;
        topic?: string;
    }) => apiClient.post('/api/mentoring-applications', data),

    /** 받은 신청 목록 조회 (멘토용) - GET /api/mentoring-applications/received */
    getReceivedApplications: () =>
        apiClient.get('/api/mentoring-applications/received'),

    /** 보낸 신청 목록 조회 (멘티용) - GET /api/mentoring-applications/sent */
    getSentApplications: () =>
        apiClient.get('/api/mentoring-applications/sent'),

    /** 신청 승인 - POST /api/mentoring-applications/:id/approve */
    approveApplication: (id: number) =>
        apiClient.post(`/api/mentoring-applications/${id}/approve`),

    /** 신청 거절 - POST /api/mentoring-applications/:id/reject */
    rejectApplication: (id: number, reason?: string) =>
        apiClient.post(`/api/mentoring-applications/${id}/reject`, reason ? { reason } : undefined),
};

// ===== Chat =====

export const chatApi = {
    /** 채팅방 생성 또는 기존 채팅방 조회 - POST /api/chat/rooms */
    getOrCreateRoom: (mentorId: number) =>
        apiClient.post('/api/chat/rooms', { mentorId }),

    /** 내 채팅방 목록 조회 - GET /api/chat/rooms */
    getMyChatRooms: () =>
        apiClient.get('/api/chat/rooms'),

    /** 채팅 기록 조회 - GET /api/chat/rooms/:id/messages */
    getChatHistory: (chatRoomId: number) =>
        apiClient.get(`/api/chat/rooms/${chatRoomId}/messages`),

    /** 최근 메시지 조회 - GET /api/chat/rooms/:id/messages/recent */
    getRecentMessages: (chatRoomId: number) =>
        apiClient.get(`/api/chat/rooms/${chatRoomId}/messages/recent`),

    /** 메시지 전송 (REST) - POST /api/chat/rooms/:id/send */
    sendMessage: (chatRoomId: number, content: string) =>
        apiClient.post(`/api/chat/rooms/${chatRoomId}/send`, { content }),
};

