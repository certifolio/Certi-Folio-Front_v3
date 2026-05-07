/**
 * Job Posting API
 * 백엔드 엔드포인트: /api/job-postings
 */
import { apiClient } from './client';

export interface JobPostingItem {
    id: number;
    companyName: string;
    state: string;
    content: string;
    position: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string;
    link: string;
}

export interface JobPostingCalendarResponse {
    year: number;
    month: number;
    jobPostings: JobPostingItem[];
}

export const jobPostingApi = {
    /** 채용공고 캘린더 조회 - GET /api/job-postings/calendar?year=&month= */
    getCalendar: (year?: number, month?: number): Promise<JobPostingCalendarResponse> => {
        const params = new URLSearchParams();
        if (year) params.set('year', String(year));
        if (month) params.set('month', String(month));
        const qs = params.toString();
        return apiClient.get(`/api/job-postings/calendar${qs ? `?${qs}` : ''}`);
    },
};
