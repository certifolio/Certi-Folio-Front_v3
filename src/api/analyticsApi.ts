/**
 * Analytics & Dashboard API
 * 백엔드 엔드포인트: /api/analytics, /api/dashboard
 */
import { apiClient } from './client';

// ===== Dashboard =====

export const dashboardApi = {
    /** 대시보드 데이터 조회 - GET /api/dashboard */
    getDashboard: () =>
        apiClient.get('/api/dashboard'),

    /** 대시보드 새로고침 - POST /api/dashboard/refresh */
    refreshDashboard: () =>
        apiClient.post('/api/dashboard/refresh'),
};

// ===== Analytics =====

export const analyticsApi = {
    /** 커리어 선호도 조회 - GET /api/analytics/preferences */
    getPreferences: () =>
        apiClient.get('/api/analytics/preferences'),

    /** 커리어 선호도 저장 - POST /api/analytics/preferences */
    savePreferences: (data: {
        targetJobRole?: string;
        targetCompanyType?: string;
        preferredLocation?: string;
        salaryRange?: string;
    }) => apiClient.post('/api/analytics/preferences', data),

    /** 스킬 분석 조회 - GET /api/analytics/skill-analysis */
    getSkillAnalysis: () =>
        apiClient.get('/api/analytics/skill-analysis'),

    /** 스킬 분석 새로고침 - POST /api/analytics/skill-analysis/refresh */
    refreshSkillAnalysis: () =>
        apiClient.post('/api/analytics/skill-analysis/refresh'),
};
