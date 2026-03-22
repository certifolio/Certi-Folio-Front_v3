/**
 * Analytics & Dashboard API
 * 백엔드 엔드포인트: /api/analytics, /api/dashboard
 */
import { apiClient } from './client';

export interface AnalyticsResult {
    overallScore: number;
    categoryScores: {
        실무경력: number;
        프로젝트경험: number;
        자격증어학: number;
        학점전공: number;
        대외활동: number;
        어학역량: number;
    };
    strengths: string[];
    improvements: string[];
    summary: string;
}

export const analyticsApi = {
    /** 포트폴리오 AI 분석 - GET /api/analytics/portfolio */
    analyzePortfolio: (): Promise<AnalyticsResult> =>
        apiClient.get('/api/analytics/portfolio').then((res: any) => res.data),
};
