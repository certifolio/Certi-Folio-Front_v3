/**
 * Analytics API
 * 백엔드 엔드포인트: /api/analytics
 */
import { apiClient } from './client';

export interface AnalyticsResult {
    id: number;
    overallScore: number;
    categoryScores: Record<string, number>;
    strengths: string[];
    improvements: string[];
    summary: string;
}

export const analyticsApi = {
    /** 최신 분석 결과 조회 - GET /api/analytics */
    getLatest: (): Promise<AnalyticsResult> =>
        apiClient.get('/api/analytics'),

    /** 분석 이력 전체 조회 - GET /api/analytics/history */
    getHistory: (): Promise<AnalyticsResult[]> =>
        apiClient.get('/api/analytics/history'),

    /** 포트폴리오 분석 요청 (새로 분석 트리거) - POST /api/analytics */
    analyzePortfolio: (): Promise<AnalyticsResult> =>
        apiClient.post('/api/analytics'),
};
