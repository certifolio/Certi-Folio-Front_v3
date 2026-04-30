import React, { useState, useEffect } from 'react';
import { CommunityPost, CommunityComment, POST_TYPE_LABEL } from '../../types';
import { communityApi } from '../../api/communityApi';
import { Button } from '../UI/Button';

interface PostDetailProps {
  postId: string;
  onBack: () => void;
}

export const PostDetail: React.FC<PostDetailProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        // 백엔드 상세 조회에서 댓글까지 포함해서 내려줌
        const postData = await communityApi.getPostById(postId);
        setPost(postData);
        setComments(postData?.comments || []);
      } catch (err) {
        console.error('Failed to load post data', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (postId) fetchPostData();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await communityApi.createComment({
        postId: Number(postId),
        content: newComment,
      });
      // 댓글 작성 후 게시글 다시 로드 (댓글 목록 갱신)
      const updatedPost = await communityApi.getPostById(postId);
      setPost(updatedPost);
      setComments(updatedPost?.comments || []);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-20 text-center animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 text-center py-20">
        <h2 className="text-2xl font-bold mb-4">게시글을 찾을 수 없습니다.</h2>
        <Button onClick={onBack} variant="outline">목록으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-cyan-600 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        목록으로
      </button>

      {/* Post Body */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-gray-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-gray-700">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 p-[1px] flex-shrink-0">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[10px] text-gray-900 font-bold">
                  {post.authorName.charAt(0)}
                </div>
              </div>
              {post.authorName}
            </span>
            <span>•</span>
            <span className="text-gray-400">{formatDate(post.createdAt)}</span>
            <span>•</span>
            <span className="text-gray-400">조회 {post.viewCount}</span>
          </div>
        </div>
        <div className="p-6 md:p-8 min-h-[200px]">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          댓글 <span className="text-cyan-600">{comments.length}</span>
        </h3>
        
        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mb-8 relative">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="w-full px-4 py-4 pr-24 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm outline-none placeholder-gray-400 resize-none h-24"
            placeholder="댓글을 남겨주세요."
            disabled={isSubmitting}
          />
          <div className="absolute right-3 bottom-3">
            <Button 
              type="submit" 
              variant="primary" 
              className="py-1.5 px-4 text-xs rounded-lg"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white/40 border border-white rounded-xl p-4 md:p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs text-gray-600 font-bold">
                    {comment.authorName.charAt(0)}
                  </div>
                  <span className="font-bold text-sm text-gray-800">{comment.authorName}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 pl-8 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              처음으로 댓글을 남겨보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
