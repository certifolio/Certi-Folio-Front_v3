/**
 * Community API
 * 백엔드 엔드포인트: /api/posts, /api/comments
 */
import { apiClient } from './client';

export const communityApi = {
  // 게시글 목록 조회
  // 백엔드: GET /api/posts?type=(GENERAL|COMPANY|STUDY|ETC)
  getPosts: async (type?: string) => {
    const endpoint = type ? `/api/posts?type=${type}` : '/api/posts';
    return apiClient.get(endpoint);
  },

  // 게시글 상세 조회 (댓글 리스트 포함됨)
  // 백엔드: GET /api/posts/{postId}
  getPostById: async (id: string | number) => {
    return apiClient.get(`/api/posts/${id}`);
  },

  // 게시글 생성
  // 백엔드: POST /api/posts/create (PostRequestDTO: title, content, type)
  createPost: async (postData: { title: string; content: string; type: string }) => {
    return apiClient.post('/api/posts/create', postData);
  },

  // 게시글 수정
  // 백엔드: PATCH /api/posts/{postId} (PostRequestDTO: title, content, type)
  modifyPost: async (id: string | number, postData: { title: string; content: string; type: string }) => {
    return apiClient.patch(`/api/posts/${id}`, postData);
  },

  // 게시글 삭제
  // 백엔드: DELETE /api/posts/{postId}
  deletePost: async (id: string | number) => {
    return apiClient.delete(`/api/posts/${id}`);
  },

  // 댓글 생성
  // 백엔드: POST /api/comments/create (CommentCreateRequestDTO: postId, content)
  createComment: async (commentData: { postId: number; content: string }) => {
    return apiClient.post('/api/comments/create', commentData);
  },

  // 댓글 수정
  // 백엔드: PATCH /api/comments/{commentId} (CommentModifyRequestDTO: content)
  modifyComment: async (commentId: string | number, commentData: { content: string }) => {
    return apiClient.patch(`/api/comments/${commentId}`, commentData);
  },

  // 댓글 삭제
  // 백엔드: DELETE /api/comments/{commentId}
  deleteComment: async (commentId: string | number) => {
    return apiClient.delete(`/api/comments/${commentId}`);
  }
};
