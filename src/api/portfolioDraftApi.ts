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
};
