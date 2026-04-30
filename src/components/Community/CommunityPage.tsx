import React, { useState, useEffect } from 'react';
import { CommunityPost, PostType, POST_TYPE_LABEL, LABEL_TO_POST_TYPE } from '../../types';
import { communityApi } from '../../api/communityApi';
import { Button } from '../UI/Button';

interface CommunityPageProps {
  onPostClick: (postId: string) => void;
  onCreatePostClick: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onPostClick, onCreatePostClick }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const CATEGORIES = ['전체', '자유', '기업', '스터디', '기타'];

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // 선택된 카테고리를 백엔드 PostType으로 변환하여 필터링
      const backendType = selectedCategory !== '전체' ? LABEL_TO_POST_TYPE[selectedCategory] : undefined;
      const data = await communityApi.getPosts(backendType);
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">커뮤니티</h1>
          <p className="text-gray-500 mt-2">포트폴리오, 취업 준비에 대한 고민과 질문을 나눠보세요.</p>
        </div>
        <Button variant="primary" onClick={onCreatePostClick}>
          글쓰기
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat 
                ? 'bg-cyan-600 text-white border-cyan-600' 
                : 'bg-white/60 text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200/50 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">
          <div className="col-span-8 text-left pl-2">제목</div>
          <div className="col-span-2">작성자</div>
          <div className="col-span-1">조회수</div>
          <div className="col-span-1">작성일</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">데이터를 불러오는 중입니다...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">해당 카테고리의 게시글이 없습니다.</div>
          ) : (
            posts.map(post => (
              <div 
                key={post.id} 
                onClick={() => onPostClick(String(post.id))}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 items-center hover:bg-white/80 cursor-pointer transition-colors group"
              >
                <div className="col-span-1 md:col-span-8 pl-2">
                  <div className="flex items-center gap-2 mb-1 md:mb-0">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-1">
                      {POST_TYPE_LABEL[post.type] || post.type}
                    </span>
                    <span className="font-medium text-gray-900 group-hover:text-cyan-700 transition-colors line-clamp-1">
                      {post.title}
                    </span>
                    {post.commentCount > 0 && (
                      <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-full">
                        {post.commentCount}
                      </span>
                    )}
                  </div>
                  {/* 모바일 뷰 용 추가 정보 */}
                  <div className="flex md:hidden items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span>{post.authorName}</span>
                    <span>•</span>
                    <span>조회 {post.viewCount}</span>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="hidden md:block col-span-2 text-center text-sm font-medium text-gray-700 truncate">
                  {post.authorName}
                </div>
                <div className="hidden md:block col-span-1 text-center text-sm text-gray-500">
                  {post.viewCount}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-gray-400">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
