/**
 * Mentoring Session API
 * 백엔드 엔드포인트: /api/mentoring/sessions
 */
import { apiClient } from './client';

export interface SessionMentor {
    name: string;
    title: string;
    company: string;
    expertise: string[];
}

export interface SessionItem {
    id: number;
    mentorId: number;
    mentor: SessionMentor;
    status: string;
    topic: string;
    startDate: string | null;
}

export interface SessionsResponse {
    sessions: SessionItem[];
    total: number;
}

export interface UpdateSessionResponse {
    success: boolean;
    message: string;
}

export const mentoringSessionApi = {
    /** 내 멘토링 세션 목록 조회 - GET /api/mentoring/sessions */
    getMySessions: (): Promise<SessionsResponse> =>
        apiClient.get('/api/mentoring/sessions'),

    /** 세션 상세 조회 - GET /api/mentoring/sessions/:sessionId */
    getSession: (sessionId: number): Promise<SessionItem> =>
        apiClient.get(`/api/mentoring/sessions/${sessionId}`),

    /** 새 세션 생성 - POST /api/mentoring/sessions */
    createSession: (data: { mentorId: number; topic: string }): Promise<UpdateSessionResponse> =>
        apiClient.post('/api/mentoring/sessions', data),

    /** 세션 상태 업데이트 - PATCH /api/mentoring/sessions/:sessionId/status */
    updateSessionStatus: (sessionId: number, status: string): Promise<UpdateSessionResponse> =>
        apiClient.patch(`/api/mentoring/sessions/${sessionId}/status`, { status }),
};
