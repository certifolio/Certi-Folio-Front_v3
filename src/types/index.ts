export interface Skill {
  id: string;
  name: string;
  category: 'tech' | 'soft' | 'tool';
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  imageUrl: string;
  skills: string[];
  bio: string;
  available: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  skills: Skill[];
  certificates: string[];
}

// 백엔드 PostType enum: GENERAL, COMPANY, STUDY, ETC
export type PostType = 'GENERAL' | 'COMPANY' | 'STUDY' | 'ETC';

// 프론트 카테고리 라벨 ↔ 백엔드 PostType 매핑 유틸
export const POST_TYPE_LABEL: Record<PostType, string> = {
  GENERAL: '자유',
  COMPANY: '기업',
  STUDY: '스터디',
  ETC: '기타',
};

export const LABEL_TO_POST_TYPE: Record<string, PostType> = {
  '자유': 'GENERAL',
  '기업': 'COMPANY',
  '스터디': 'STUDY',
  '기타': 'ETC',
};

export interface CommunityComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: number;
  type: PostType;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  comments?: CommunityComment[];
}