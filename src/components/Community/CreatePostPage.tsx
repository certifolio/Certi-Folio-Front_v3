import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { communityApi } from '../../api/communityApi';
import { LABEL_TO_POST_TYPE } from '../../types';

interface CreatePostPageProps {
  onBack: () => void;
  onSuccess: (newPostId: string) => void;
}

const CATEGORIES = ['자유', '기업', '스터디', '기타'];

export const CreatePostPage: React.FC<CreatePostPageProps> = ({ onBack, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('자유');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // 프론트 카테고리(자유/기업 등) → 백엔드 PostType(GENERAL/COMPANY 등) 변환
      const postType = LABEL_TO_POST_TYPE[category];
      const result = await communityApi.createPost({
        title,
        content,
        type: postType,
      });
      // 백엔드가 생성된 postId(Long)를 반환
      onSuccess(String(result));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-cyan-600 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        취소하고 돌아가기
      </button>

      <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900">새 게시글 작성</h1>
          <p className="text-sm text-gray-500 mt-1">커뮤니티에 공유할 주제를 선택하고 글을 작성해보세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    category === cat 
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-cyan-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none placeholder-gray-400"
              placeholder="게시글 제목을 입력해주세요"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none placeholder-gray-400 min-h-[300px] resize-y"
              placeholder="본문 내용을 입력해주세요. (텍스트만 작성 가능합니다)"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              variant="primary"
              className="px-8 py-3 text-base"
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? '등록 중...' : '게시글 등록하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
