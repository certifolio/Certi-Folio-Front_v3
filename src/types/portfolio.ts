/** 포트폴리오 초안 — 백엔드 API 응답 기준 타입 정의 */

// ── 공통 서브 타입 ──

export interface AchievementCard {
  title: string;
  problem: string;
  solution: string;
  result: string;
}

export interface IntroductionItem {
  title: string;
  content: string;
}

export interface DraftCareer {
  companyName: string;
  period: string;
  type: string;
  position: string;
  description: string;
  achievements: AchievementCard[];
}

export interface DraftProject {
  projectName: string;
  period: string;
  subtitle: string;
  description: string;
  techStack: string[];
  teamSize: string;
  links: { github?: string; demo?: string };
  achievements: AchievementCard[];
}

export interface DraftEducation {
  school: string;
  major: string;
  period: string;
  status: string;
  gpa: string;
  maxGpa: string;
}

export interface DraftLanguage {
  name: string;
  score: string;
  date: string;
}

export interface DraftActivity {
  name: string;
  period: string;
  bullets: string[];
}

export interface DraftAward {
  name: string;
  organization: string;
  date: string;
  description?: string;
}

export interface DraftCertificate {
  name: string;
  date: string;
}

// ── content 내부 구조 (백엔드 draftContent JSON) ──

export interface PortfolioDraftContent {
  // Header
  name: string;
  englishName: string;
  targetRole: string;
  birthDate: string;
  phone: string;
  email: string;
  github: string;
  profileImage: string;

  // Sections
  introductions: IntroductionItem[];
  skills: string[];
  careers: DraftCareer[];
  projects: DraftProject[];
  education: DraftEducation;
  languages: DraftLanguage[];
  activities: DraftActivity[];
  awards: DraftAward[];
  certificates: DraftCertificate[];
}

// ── API 응답 DTO (PortfolioDraftResponse) ──

export interface PortfolioDraftResponse {
  id: number;
  status: 'GENERATING' | 'COMPLETED' | 'EDITED';
  createdAt: string;
  updatedAt: string;
  content: PortfolioDraftContent;
}
