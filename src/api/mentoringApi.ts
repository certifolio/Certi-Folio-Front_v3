/**
 * Mentoring API
 * 백엔드 엔드포인트: /api/mentors, /api/mentoring-applications
 *
 * [변경사항]
 * - MentorController: ResponseEntity 직접 반환 (ApiResponse 래핑 없음)
 * - MentorApplicationRequest: preferredFormat이 enum(ONLINE/OFFLINE/BOTH), certificates 필수
 * - MentoringApplication CreateRequest: description 50자 이상 필수
 * - RejectRequest: reason 필드 @RequestBody로 필수
 */
import { apiClient } from './client';

// ===== Mentors =====

export const mentorApi = {
    /** 멘토 검색/목록 조회 - GET /api/mentors?skills=React,Node.js */
    searchMentors: (params?: { skills?: string }) => {
        const query = new URLSearchParams();
        if (params?.skills) query.set('skills', params.skills);
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
        company: string;
        experience: string;
        expertise: string[];
        bio: string;
        availability: { dayOfWeek: string; startTime: string; endTime: string; slotType: 'VIDEO' | 'CHAT' | 'IN_PERSON' }[];
        preferredFormat: 'ONLINE' | 'OFFLINE' | 'BOTH';
        certificates: string[];
    }) => apiClient.post('/api/mentors/apply', data),

    /** 내 멘토 프로필 조회 - GET /api/mentors/me */
    getMyMentorProfile: () =>
        apiClient.get('/api/mentors/me'),

    /** 내 멘토 프로필 수정 - PUT /api/mentors/me */
    updateMyMentorProfile: (data: {
        name: string;
        title: string;
        company: string;
        experience: string;
        expertise: string[];
        bio: string;
        availability: { dayOfWeek: string; startTime: string; endTime: string; slotType: 'VIDEO' | 'CHAT' | 'IN_PERSON' }[];
        preferredFormat: 'ONLINE' | 'OFFLINE' | 'BOTH';
        certificates: string[];
    }) => apiClient.put('/api/mentors/me', data),
};

// ===== Mentoring Applications =====

export const mentoringApplicationApi = {
    /** 멘토링 신청 - POST /api/mentoring-applications
     *  description은 50자 이상 필수 */
    createApplication: (data: {
        mentorId: number;
        topic: string;
        description: string;
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

    /** 신청 거절 - POST /api/mentoring-applications/:id/reject
     *  reason 필수 (RequestBody) */
    rejectApplication: (id: number, reason: string) =>
        apiClient.post(`/api/mentoring-applications/${id}/reject`, { reason }),
};

// ===== Admin =====

export const adminMentorApi = {
    /**
     * [어드민] 멘토 신청 목록 조회
     * GET /api/admin/mentors?status=PENDING|APPROVED|REJECTED (생략 시 전체)
     * 응답: { mentors: AdminMentorListItem[], total: number }
     */
    getApplications: (status?: 'PENDING' | 'APPROVED' | 'REJECTED') => {
        const qs = status ? `?status=${status}` : '';
        return apiClient.get(`/api/admin/mentors${qs}`);
    },

    /**
     * [어드민] 멘토 신청 승인
     * PATCH /api/admin/mentors/:mentorId/approve
     */
    approve: (mentorId: number) =>
        apiClient.patch(`/api/admin/mentors/${mentorId}/approve`),

    /**
     * [어드민] 멘토 신청 거절
     * PATCH /api/admin/mentors/:mentorId/reject
     * body: { reason?: string }
     */
    reject: (mentorId: number, reason?: string) =>
        apiClient.patch(`/api/admin/mentors/${mentorId}/reject`, { reason }),
};
