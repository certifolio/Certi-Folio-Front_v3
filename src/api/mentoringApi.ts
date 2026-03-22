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

// ===== Admin =====

export const adminMentorApi = {
    /** [어드민] 전체 멘토 신청 목록 조회 - GET /api/mentors/admin/applications */
    getApplications: () =>
        apiClient.get('/api/mentors/admin/applications'),

    /** [어드민] 멘토 승인 - POST /api/mentors/admin/:id/approve */
    approve: (id: number) =>
        apiClient.post(`/api/mentors/admin/${id}/approve`),

    /** [어드민] 멘토 거절 - POST /api/mentors/admin/:id/reject */
    reject: (id: number) =>
        apiClient.post(`/api/mentors/admin/${id}/reject`),
};
