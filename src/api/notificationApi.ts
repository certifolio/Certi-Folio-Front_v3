/**
 * Notification API
 * 백엔드 엔드포인트: /api/notifications
 */
import { apiClient } from './client';

export const notificationApi = {
    /** 알림 목록 조회 (커서 기반 무한스크롤) - GET /api/notifications */
    getNotifications: (params?: { type?: string; cursorId?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.type) query.set('type', params.type);
        if (params?.cursorId) query.set('cursorId', String(params.cursorId));
        if (params?.limit) query.set('limit', String(params.limit));
        const qs = query.toString();
        return apiClient.get(`/api/notifications${qs ? `?${qs}` : ''}`);
    },

    /** 최신 알림 조회 (네비바 드롭다운용) - GET /api/notifications/recent */
    getRecentNotifications: () =>
        apiClient.get('/api/notifications/recent'),

    /** 단일 알림 읽음 처리 - PATCH /api/notifications/:id/read */
    markAsRead: (id: number) =>
        apiClient.patch(`/api/notifications/${id}/read`),

    /** 전체 알림 읽음 처리 - PATCH /api/notifications/read-all */
    markAllAsRead: () =>
        apiClient.patch('/api/notifications/read-all'),

    /** 단일 알림 삭제 - DELETE /api/notifications/:id */
    deleteNotification: (id: number) =>
        apiClient.delete(`/api/notifications/${id}`),

    /** 전체 알림 삭제 - DELETE /api/notifications/all */
    deleteAllNotifications: () =>
        apiClient.delete('/api/notifications/all'),
};
