/**
 * API Client - 공통 fetch 래퍼
 * 백엔드 REST API 호출 시 사용합니다.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://ec2-3-35-37-53.ap-northeast-2.compute.amazonaws.com';

// 토큰 가져오기 (추후 인증 연동 시 구현)
const getToken = (): string | null => {
    return localStorage.getItem('access_token');
};

// 공통 헤더
const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// 에러 핸들링
class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// 응답 처리
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }
        throw new ApiError(
            data?.message || `API Error: ${response.status}`,
            response.status,
            data
        );
    }
    return response.json();
};

// HTTP 메서드별 래퍼
export const apiClient = {
    get: (endpoint: string) =>
        fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
        }).then(handleResponse),

    post: (endpoint: string, body?: any) =>
        fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse),

    put: (endpoint: string, body?: any) =>
        fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse),

    patch: (endpoint: string, body?: any) =>
        fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(handleResponse),

    delete: (endpoint: string) =>
        fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),
};

export { ApiError };
