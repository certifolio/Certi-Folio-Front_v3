/**
 * 포트폴리오 초안 API
 * 백엔드 REST API 연동
 */
import { apiClient } from './client';
import type { PortfolioDraftResponse, PortfolioDraftContent } from '../types/portfolio';

const BASE = '/api/portfolio/draft';

export const portfolioDraftApi = {
  /** AI 포트폴리오 초안 생성 */
  generate: (): Promise<PortfolioDraftResponse> =>
    apiClient.post(`${BASE}/generate`),

  /** 최신 초안 조회 */
  getLatest: (): Promise<PortfolioDraftResponse> =>
    apiClient.get(`${BASE}/latest`),

  /** 초안 수정 (인라인 편집 후 저장) */
  update: (draftId: number, content: PortfolioDraftContent): Promise<PortfolioDraftResponse> =>
    apiClient.patch(`${BASE}/${draftId}`, { content }),

  /** 초안 삭제 */
  delete: (draftId: number): Promise<void> =>
    apiClient.delete(`${BASE}/${draftId}`),

  /** 이미지 업로드 - multipart/form-data POST /api/portfolio/draft/{id}/image */
  uploadImage: async (draftId: number, file: File): Promise<string> => {
    const token = localStorage.getItem('access_token');
    const BASE_URL = import.meta.env.VITE_API_URL || '';
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}${BASE}/${draftId}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(`이미지 업로드 실패: ${res.status}`);
    const data = await res.json();
    // 백엔드가 ApiResponse 래퍼로 감싸면 result 추출, 아니면 data 자체
    return typeof data === 'string' ? data : (data.result ?? data);
  },
};
