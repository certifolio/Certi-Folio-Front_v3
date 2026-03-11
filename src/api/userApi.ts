/**
 * User & Portfolio API
 * 백엔드 엔드포인트: /api/user, /api/portfolio
 */
import { apiClient } from './client';

// ===== User =====

export const userApi = {
    /** 내 프로필 조회 - GET /api/user/me */
    getMyProfile: () =>
        apiClient.get('/api/user/me'),

    /** 닉네임 설정 - PUT /api/user/nickname */
    setNickname: (nickname: string) =>
        apiClient.put('/api/user/nickname', { nickname }),

    /** 닉네임 중복 확인 - GET /api/user/nickname/check */
    checkNickname: (nickname: string) =>
        apiClient.get(`/api/user/nickname/check?nickname=${encodeURIComponent(nickname)}`),

    /** 프로필 수정 - PATCH /api/user/profile */
    updateProfile: (data: {
        nickname?: string;
        phone?: string;
        location?: string;
        university?: string;
        major?: string;
        year?: string;
        company?: string;
        bio?: string;
    }) => apiClient.patch('/api/user/profile', data),

    /** 프로필 이미지 업로드 - POST /api/user/profile-image */
    uploadProfileImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        // 이미지 업로드는 Content-Type을 직접 설정하지 않음 (FormData가 자동 처리)
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/user/profile-image`, {
            method: 'POST',
            headers,
            body: formData,
        }).then(res => res.json());
    },

    /** 기본 정보 업데이트 (이름, 정보 입력 완료 여부) - PATCH /api/user/basic-info */
    updateBasicInfo: (data: { name: string; isInfoInputted?: boolean }) =>
        apiClient.patch('/api/user/basic-info', data),
};

// ===== Portfolio =====

export const portfolioApi = {
    /** 자격증 목록 조회 - GET /api/portfolio/certificates */
    getCertificates: () =>
        apiClient.get('/api/portfolio/certificates'),

    /** 자격증 저장 (전체 교체) - POST /api/portfolio/certificates */
    saveCertificates: (certificates: any[]) =>
        apiClient.post('/api/portfolio/certificates', certificates),

    /** 자격증 단건 추가 - POST /api/portfolio/certificates/add */
    addCertificate: (certificate: any) =>
        apiClient.post('/api/portfolio/certificates/add', certificate),

    /** 자격증 삭제 - DELETE /api/portfolio/certificates/:id */
    deleteCertificate: (id: number) =>
        apiClient.delete(`/api/portfolio/certificates/${id}`),

    /** 프로젝트 목록 조회 - GET /api/portfolio/projects */
    getProjects: () =>
        apiClient.get('/api/portfolio/projects'),

    /** 프로젝트 저장 - POST /api/portfolio/projects */
    saveProjects: (projects: any[]) =>
        apiClient.post('/api/portfolio/projects', projects),

    /** 프로젝트 삭제 - DELETE /api/portfolio/projects/:id */
    deleteProject: (id: number) =>
        apiClient.delete(`/api/portfolio/projects/${id}`),

    /** 활동 목록 조회 - GET /api/portfolio/activities */
    getActivities: () =>
        apiClient.get('/api/portfolio/activities'),

    /** 활동 저장 - POST /api/portfolio/activities */
    saveActivities: (activities: any[]) =>
        apiClient.post('/api/portfolio/activities', activities),

    /** 경력 목록 조회 - GET /api/portfolio/careers */
    getCareers: () =>
        apiClient.get('/api/portfolio/careers'),

    /** 경력 저장 - POST /api/portfolio/careers */
    saveCareers: (careers: any[]) =>
        apiClient.post('/api/portfolio/careers', careers),

    /** 학력 목록 조회 - GET /api/portfolio/educations */
    getEducations: () =>
        apiClient.get('/api/portfolio/educations'),

    /** 학력 저장 - POST /api/portfolio/educations */
    saveEducations: (educations: any[]) =>
        apiClient.post('/api/portfolio/educations', educations),
};
