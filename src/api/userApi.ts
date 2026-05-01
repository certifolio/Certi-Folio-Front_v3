/**
 * User & Spec(Portfolio) API
 * 백엔드 엔드포인트: /api/users, /api/specs/*
 */
import { apiClient } from './client';

// ===== User =====

export const userApi = {
    /** 내 정보 조회 - GET /api/users/me */
    getMyProfile: () =>
        apiClient.get('/api/users/me'),

    /** 온보딩 정보 저장 - POST /api/users/me/onboarding */
    saveOnboarding: (data: {
        name: string;
        birthYear: number;
        companyType: string;
        jobRole: string;
    }) => apiClient.post('/api/users/me/onboarding', data),

    /** 내 정보 수정 - PATCH /api/users/me */
    updateMyInfo: (data: {
        name: string;
        birthYear: number;
        companyType: string;
        jobRole: string;
    }) => apiClient.patch('/api/users/me', data),
};

// ===== Spec (Portfolio) =====

export const portfolioApi = {
    /** 스펙 전체 일괄 조회 - GET /api/specs/all */
    getAllSpecs: () =>
        apiClient.get('/api/specs/all'),

    // ----- 자격증 -----
    getCertificates: () =>
        apiClient.get('/api/specs/certificates'),
    saveCertificates: (certificates: any[]) =>
        apiClient.post('/api/specs/certificates', certificates),
    addCertificate: (certificate: any) =>
        apiClient.post('/api/specs/certificates/add', certificate),
    modifyCertificate: (id: number, data: any) =>
        apiClient.patch(`/api/specs/certificates/${id}`, data),
    deleteCertificate: (id: number) =>
        apiClient.delete(`/api/specs/certificates/${id}`),

    // ----- 프로젝트 -----
    getProjects: () =>
        apiClient.get('/api/specs/projects'),
    saveProjects: (projects: any[]) =>
        apiClient.post('/api/specs/projects', projects),
    addProject: (project: any) =>
        apiClient.post('/api/specs/projects/add', project),
    modifyProject: (id: number, data: any) =>
        apiClient.patch(`/api/specs/projects/${id}`, data),
    deleteProject: (id: number) =>
        apiClient.delete(`/api/specs/projects/${id}`),

    // ----- 활동 -----
    getActivities: () =>
        apiClient.get('/api/specs/activities'),
    saveActivities: (activities: any[]) =>
        apiClient.post('/api/specs/activities', activities),
    addActivity: (activity: any) =>
        apiClient.post('/api/specs/activities/add', activity),
    modifyActivity: (id: number, data: any) =>
        apiClient.patch(`/api/specs/activities/${id}`, data),
    deleteActivity: (id: number) =>
        apiClient.delete(`/api/specs/activities/${id}`),

    // ----- 경력 -----
    getCareers: () =>
        apiClient.get('/api/specs/careers'),
    saveCareers: (careers: any[]) =>
        apiClient.post('/api/specs/careers', careers),
    addCareer: (career: any) =>
        apiClient.post('/api/specs/careers/add', career),
    modifyCareer: (id: number, data: any) =>
        apiClient.patch(`/api/specs/careers/${id}`, data),
    deleteCareer: (id: number) =>
        apiClient.delete(`/api/specs/careers/${id}`),

    // ----- 학력 -----
    getEducations: () =>
        apiClient.get('/api/specs/educations'),
    saveEducations: (educations: any[]) =>
        apiClient.post('/api/specs/educations', educations),
    addEducation: (education: any) =>
        apiClient.post('/api/specs/educations/add', education),
    modifyEducation: (id: number, data: any) =>
        apiClient.patch(`/api/specs/educations/${id}`, data),
    deleteEducation: (id: number) =>
        apiClient.delete(`/api/specs/educations/${id}`),

    // ----- 알고리즘 -----
    getAlgorithm: () =>
        apiClient.get('/api/specs/algorithm'),
    saveAlgorithm: (data: { bojHandle: string }) =>
        apiClient.post('/api/specs/algorithm', data),
    syncAlgorithm: () =>
        apiClient.patch('/api/specs/algorithm/sync'),
};
