import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { BasicInfoFlow } from './BasicInfoFlow';
import { EducationFlow, EducationData } from './EducationFlow';
import { ProjectFlow, ProjectData } from './ProjectFlow';
import { ActivityFlow, ActivityData } from './ActivityFlow';
import { CertificateFlow, CertificateData } from './CertificateFlow';
import { CareerFlow, CareerData } from './CareerFlow';
import { SpecReport } from './SpecReport';
import { portfolioApi, userApi } from '../../api/userApi';
import { analyticsApi, type AnalyticsResult } from '../../api/analyticsApi';
import { useAuth } from '../../contexts/AuthContext';

// Define the full structure of the data we are collecting
interface FullUserData {
  // Target Setting (Merged into Basic Info)
  targetCompanyType: string;
  targetJobRole: string;
  // Basic Info
  name: string;
  birthYear: string;
  // Education
  academicStatus: string;
  schoolName: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  maxGpa: string;
  // Projects (Array)
  projects: ProjectData[];
  // Activities (Array)
  activities: ActivityData[];
  // Certificates (Array)
  certificates: CertificateData[];
  // Career (Array)
  careers: CareerData[];
}

// Extended flow stages
type FlowStage =
  | 'intro'
  | 'basic'
  | 'prompt_edu'
  | 'education'
  | 'prompt_project'
  | 'project'
  | 'prompt_more_projects'
  | 'prompt_activity'
  | 'activity'
  | 'prompt_more_activities'
  | 'prompt_cert'
  | 'cert'
  | 'prompt_more_certs'
  | 'prompt_career'
  | 'career'
  | 'prompt_more_careers'
  | 'review'
  | 'finished'; // 'finished' now triggers the Report

interface SpecFlowTestProps {
  onAnalysisComplete?: (result: AnalyticsResult) => void;
}

// Top Main Navigation Categories
const mainCategories = [
  { id: 'basic', label: '개인정보' },
  { id: 'education', label: '학력' },
  { id: 'project', label: '프로젝트' },
  { id: 'activity', label: '대외활동' },
  { id: 'cert', label: '자격증' },
  { id: 'career', label: '경력' },
  { id: 'review', label: '검토' },
];

const mapProjectFromApi = (project: any): ProjectData => ({
  projectName: project.projectName || project.name || '',
  isTeam: project.isTeam || project.type || '',
  startDate: project.startDate || '',
  endDate: project.endDate || '',
  role: project.role || '',
  techStack: Array.isArray(project.techStack)
    ? project.techStack
    : String(project.techStack || '').split(',').map((stack) => stack.trim()).filter(Boolean),
  description: project.description || '',
  links: {
    github: project.links?.github || project.githubLink || '',
    demo: project.links?.demo || project.demoLink || '',
  },
  outcome: project.outcome || project.result || '',
});

const mapActivityFromApi = (activity: any): ActivityData => ({
  id: String(activity.id || ''),
  activityName: activity.activityName || activity.name || '',
  activityType: activity.activityType || activity.type || '',
  role: activity.role || '',
  startDate: activity.startDate || activity.startMonth || '',
  endDate: activity.endDate || activity.endMonth || '',
  description: activity.description || '',
  achievement: activity.achievement || activity.result || '',
});

const mapCertificateFromApi = (certificate: any): CertificateData => ({
  id: String(certificate.id || ''),
  type: ['language', 'lang'].includes(certificate.type) ? 'language' : 'general',
  name: certificate.name || certificate.certificateName || '',
  issuer: certificate.issuer || '',
  date: certificate.date || certificate.issueDate || '',
  score: certificate.score || '',
  certId: certificate.certId || certificate.certificateNumber || '',
});

const mapCareerFromApi = (career: any): CareerData => ({
  id: String(career.id || ''),
  type: career.type === 'career' ? 'career' : 'intern',
  companyName: career.companyName || career.company || '',
  department: career.department || career.position || '',
  position: career.position || '',
  startDate: career.startDate || '',
  endDate: career.endDate || '',
  description: career.description || '',
});

export const SpecFlowTest: React.FC<SpecFlowTestProps> = ({ onAnalysisComplete }) => {
  const { isLoggedIn, token, userProfile, refreshProfile } = useAuth();
  // State
  const [stage, setStage] = useState<FlowStage>('intro');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult | null>(null);

  // 추후 isInfoInputted 대신 다른 로직으로 교체 예정
  // useEffect(() => {
  //   if (stage === 'intro') setStage('finished');
  // }, [stage]);

  // Initialize Data
  const [userData, setUserData] = useState<FullUserData>({
    targetCompanyType: '',
    targetJobRole: '',
    name: userProfile?.name || '사용자',
    birthYear: '',
    academicStatus: '',
    schoolName: '',
    major: '',
    degree: 'bachelor',
    startDate: '',
    endDate: '',
    gpa: '',
    maxGpa: '',
    projects: [],
    activities: [],
    certificates: [],
    careers: [],
  });

  // 백엔드에서 포트폴리오 데이터 로드
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const loadFromBackend = async () => {
      try {
        const [certs, projects, activities, careers, educations] = await Promise.allSettled([
          portfolioApi.getCertificates(),
          portfolioApi.getProjects(),
          portfolioApi.getActivities(),
          portfolioApi.getCareers(),
          portfolioApi.getEducations(),
        ]);
        setUserData(prev => {
          const updated = { ...prev };
          if (certs.status === 'fulfilled' && Array.isArray(certs.value) && certs.value.length > 0) {
            updated.certificates = certs.value.map(mapCertificateFromApi);
          }
          if (projects.status === 'fulfilled' && Array.isArray(projects.value) && projects.value.length > 0) {
            updated.projects = projects.value.map(mapProjectFromApi);
          }
          if (activities.status === 'fulfilled' && Array.isArray(activities.value) && activities.value.length > 0) {
            updated.activities = activities.value.map(mapActivityFromApi);
          }
          if (careers.status === 'fulfilled' && Array.isArray(careers.value) && careers.value.length > 0) {
            updated.careers = careers.value.map(mapCareerFromApi);
          }
          if (educations.status === 'fulfilled' && Array.isArray(educations.value) && educations.value.length > 0) {
            const edu = educations.value[0];
            updated.academicStatus = edu.status || edu.academicStatus || prev.academicStatus;
            updated.schoolName = edu.schoolName || prev.schoolName;
            updated.major = edu.major || prev.major;
            updated.degree = edu.degree || prev.degree;
            updated.startDate = edu.startDate || prev.startDate;
            updated.endDate = edu.endDate || prev.endDate;
            updated.gpa = edu.gpa != null ? String(edu.gpa) : prev.gpa;
            updated.maxGpa = edu.maxGpa != null ? String(edu.maxGpa) : prev.maxGpa;
          }
          return updated;
        });
      } catch (err) {
        console.warn('포트폴리오 데이터 로드 실패:', err);
      }
    };
    loadFromBackend();
  }, [isLoggedIn, token]);

  // 백엔드에 포트폴리오 데이터 동기화 (프론트 필드명 → 백엔드 DTO 필드명 변환)
  const syncToBackend = useCallback(async (data: FullUserData) => {
    if (!isLoggedIn || !token) return;
    try {
      await Promise.allSettled([
        // 자격증 → CertificateRequestDTO: name, type, issuer, issueDate, score, certificateNumber
        data.certificates.length > 0 ? portfolioApi.saveCertificates(data.certificates.map(c => ({
          name: (c as any).name || (c as any).certificateName || '',
          type: (c as any).type || 'cert',
          issuer: (c as any).issuer || '',
          issueDate: (c as any).date || (c as any).issueDate || '',
          score: (c as any).score || '',
          certificateNumber: (c as any).certId || (c as any).certificateNumber || '',
        }))) : Promise.resolve(),

        // 프로젝트 → ProjectRequestDTO: name, type, role, techStack, description, githubLink, demoLink, result, startDate, endDate
        data.projects.length > 0 ? portfolioApi.saveProjects(data.projects.map(p => ({
          name: p.projectName,
          type: p.isTeam,
          role: p.role,
          techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack,
          description: p.description,
          githubLink: p.links?.github || '',
          demoLink: p.links?.demo || '',
          result: p.outcome,
          startDate: p.startDate,
          endDate: p.endDate,
        }))) : Promise.resolve(),

        // 대외활동 → ActivityRequestDTO: name, type, role, startMonth, endMonth, description, result
        data.activities.length > 0 ? portfolioApi.saveActivities(data.activities.map(a => ({
          name: a.activityName,
          type: a.activityType,
          role: a.role,
          startMonth: a.startDate,
          endMonth: a.endDate,
          description: a.description,
          result: a.achievement,
        }))) : Promise.resolve(),

        // 경력 → CareerRequestDTO: type, company, position, startDate, endDate, description
        data.careers.length > 0 ? portfolioApi.saveCareers(data.careers.map(c => ({
          type: c.type,
          company: c.companyName,
          position: c.position || c.department,
          startDate: c.startDate,
          endDate: c.endDate,
          description: c.description,
        }))) : Promise.resolve(),

        // 학력 → EducationRequestDTO: schoolName, major, degree, status, startDate, endDate, gpa, maxGpa
        data.schoolName ? portfolioApi.saveEducations([{
          schoolName: data.schoolName,
          major: data.major,
          degree: data.degree,
          status: data.academicStatus,
          startDate: data.startDate,
          endDate: data.endDate,
          gpa: data.gpa ? parseFloat(data.gpa) : null,
          maxGpa: data.maxGpa ? parseFloat(data.maxGpa) : null,
        }]) : Promise.resolve(),
      ]);
      console.log('포트폴리오 데이터 백엔드 동기화 완료');
    } catch (err) {
      console.warn('포트폴리오 백엔드 동기화 실패:', err);
    }
  }, [isLoggedIn, token]);

  // Helper to determine active/completed state of main nav
  const getNavStatus = (catId: string) => {
    if (stage === 'intro') return 'pending';
    if (stage === 'finished') return 'completed';
    if (stage === 'review') return catId === 'review' ? 'active' : 'completed';

    switch (catId) {
      case 'basic':
        if (stage === 'basic') return 'active';
        return 'completed';
      case 'education':
        if (['basic'].includes(stage)) return 'pending';
        if (['prompt_edu', 'education'].includes(stage)) return 'active';
        return 'completed';
      case 'project':
        if (['basic', 'prompt_edu', 'education'].includes(stage)) return 'pending';
        if (['prompt_project', 'project', 'prompt_more_projects'].includes(stage)) return 'active';
        return 'completed';
      case 'activity':
        if (['basic', 'prompt_edu', 'education', 'prompt_project', 'project', 'prompt_more_projects'].includes(stage)) return 'pending';
        if (['prompt_activity', 'activity', 'prompt_more_activities'].includes(stage)) return 'active';
        return 'completed';
      case 'cert':
        if (['prompt_cert', 'cert', 'prompt_more_certs'].includes(stage)) return 'active';
        if (['career', 'prompt_career', 'prompt_more_careers'].some(s => stage.includes(s))) return 'completed';
        if (['target_setting', 'basic', 'education', 'project', 'activity'].some(s => stage.includes(s) || ['prompt_edu', 'prompt_project', 'prompt_activity'].includes(stage))) return 'pending';
        return 'completed';
      case 'career':
        if (['prompt_career', 'career', 'prompt_more_careers'].includes(stage)) return 'active';
        if (['basic', 'prompt_edu', 'education', 'prompt_project', 'project', 'prompt_more_projects', 'prompt_activity', 'activity', 'prompt_more_activities', 'prompt_cert', 'cert', 'prompt_more_certs'].includes(stage)) return 'pending';
        return 'completed';
      case 'review':
        return 'pending';
      default: return 'pending';
    }
  };

  const handleIntroStart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStage('basic');
      setIsAnimating(false);
    }, 500);
  };

  const handleBasicInfoComplete = async (data: any) => {
    setUserData(prev => ({ ...prev, ...data }));

    // 온보딩 정보 저장
    if (isLoggedIn && data.name) {
      try {
        await userApi.saveOnboarding({
          name: data.name,
          birthYear: parseInt(data.birthYear) || 2000,
          companyType: data.targetCompanyType || '',
          jobRole: data.targetJobRole || '',
        });
      } catch (e) {
        console.error("Failed to save onboarding", e);
      }
    }

    setStage('prompt_edu');
  };

  // 모든 데이터 저장 완료
  const completeInfoInput = async (data: FullUserData) => {
    await syncToBackend(data);
    if (isLoggedIn) {
      try {
        await refreshProfile();
      } catch (e) {
        console.error("Failed to refresh profile", e);
      }
    }
  };

  // 데이터 저장 + AI 분석을 순서대로 실행
  const completeAndAnalyze = async (data: FullUserData) => {
    setIsAnalyzing(true);
    try {
      await completeInfoInput(data);
      const result = await analyticsApi.analyzePortfolio().catch(() => null);
      setAnalyticsResult(result);
      if (result) {
        onAnalysisComplete?.(result);
      }
    } finally {
      setIsAnalyzing(false);
      setStage('finished');
    }
  };

  const handleEduPromptSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('education');
    else setStage('prompt_project');
  };

  const handleEducationComplete = (data: EducationData) => {
    setUserData(prev => ({ ...prev, ...data }));
    setStage('prompt_project');
  };

  const handleProjectPromptSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('project');
    else setStage('prompt_activity');
  };

  const handleProjectComplete = (data: ProjectData) => {
    setUserData(prev => ({ ...prev, projects: [...prev.projects, data] }));
    setStage('prompt_more_projects');
  };

  const handleMoreProjectsSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('project');
    else setStage('prompt_activity');
  };

  const handleActivityPromptSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('activity');
    else setStage('prompt_cert');
  };

  const handleActivityComplete = (data: ActivityData) => {
    setUserData(prev => ({ ...prev, activities: [...prev.activities, data] }));
    setStage('prompt_more_activities');
  };

  const handleMoreActivitiesSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('activity');
    else setStage('prompt_cert');
  };

  const handleCertPromptSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('cert');
    else setStage('prompt_career');
  };

  const handleCertComplete = (data: CertificateData) => {
    setUserData(prev => ({ ...prev, certificates: [...prev.certificates, data] }));
    setStage('prompt_more_certs');
  };

  const handleMoreCertsSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('cert');
    else setStage('prompt_career');
  };

  const handleCareerPromptSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('career');
    else setStage('review');
  };

  const handleCareerComplete = (data: CareerData) => {
    setUserData(prev => ({ ...prev, careers: [...prev.careers, data] }));
    setStage('prompt_more_careers');
  };

  const handleMoreCareersSelection = (choice: 'yes' | 'no') => {
    if (choice === 'yes') setStage('career');
    else setStage('review');
  };

  const updateReviewField = <K extends keyof FullUserData>(field: K, value: FullUserData[K]) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const updateReviewListItem = <
    K extends 'projects' | 'activities' | 'certificates' | 'careers'
  >(section: K, index: number, patch: Partial<FullUserData[K][number]>) => {
    setUserData(prev => ({
      ...prev,
      [section]: prev[section].map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    }));
  };

  const removeReviewListItem = <K extends 'projects' | 'activities' | 'certificates' | 'careers'>(section: K, index: number) => {
    setUserData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const reviewInputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-cyan-500";
  const reviewTextAreaClass = `${reviewInputClass} min-h-24 resize-y leading-relaxed`;

  const handleReset = () => {
    window.location.href = '/';
  };

  // AI 분석 로딩 화면
  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-4 w-full max-w-5xl mx-auto">
        <GlassCard className="w-full p-16 flex flex-col items-center justify-center shadow-2xl border-white/80 min-h-[500px]">
          <div className="w-20 h-20 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-8" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">AI가 포트폴리오를 분석 중입니다</h2>
          <p className="text-gray-500 text-lg text-center">데이터를 저장하고 분석 결과를 생성하고 있어요.<br />잠시만 기다려주세요...</p>
        </GlassCard>
      </div>
    );
  }

  // Render logic for success screen -> Now SpecReport
  if (stage === 'finished') {
    return (
      <SpecReport analyticsData={analyticsResult} onGoToDashboard={() => window.location.href = '/'} />
    );
  }

  // Intro Screen
  if (stage === 'intro') {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-160px)] px-4 w-full max-w-5xl mx-auto pb-32 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <GlassCard className="w-full p-12 md:p-16 relative min-h-[600px] flex flex-col items-center justify-center shadow-2xl border-white/80">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
            <div className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/40 text-white text-4xl relative z-10 transform hover:scale-105 transition-transform duration-500">✨</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 text-center leading-tight tracking-tight">
            Certi-Folio AI<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">커리어 진단 시작하기</span>
          </h1>
          <p className="text-lg text-gray-500 text-center max-w-2xl mb-12 leading-relaxed">
            환영합니다! 더 정확한 분석을 위해<br className="hidden md:block" />
            회원님의 <span className="font-bold text-gray-800">희망 진로</span>를 먼저 확인하고 로드맵을 설계해 드립니다.
          </p>
          <Button variant="primary" onClick={handleIntroStart} className="px-12 py-5 text-xl font-bold rounded-2xl shadow-xl shadow-gray-900/10 hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300">진로 선택하고 시작하기</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 w-full max-w-5xl mx-auto pb-32 transition-opacity duration-500`}>

      {/* Updated Nav Bar */}
      <div className="w-full max-w-5xl mb-8 overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center justify-between min-w-[700px] relative px-4">
          {mainCategories.map((cat, index) => {
            const status = getNavStatus(cat.id);
            return (
              <div key={cat.id} className="flex flex-col items-center gap-2 relative px-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${status === 'completed' ? 'bg-cyan-500 border-cyan-500 text-white shadow-md' :
                  status === 'active' ? 'bg-white border-cyan-500 text-cyan-600 scale-110 shadow-lg shadow-cyan-500/30' :
                    'bg-gray-50 border-gray-200 text-gray-300'
                  }`}>
                  {status === 'completed' ? '✓' : index + 1}
                </div>
                <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${status === 'active' ? 'text-cyan-700 font-bold' :
                  status === 'completed' ? 'text-gray-800' : 'text-gray-300'
                  }`}>
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Basic Info Flow (Includes Target Setting now) */}
      {stage === 'basic' && <BasicInfoFlow initialData={{ name: userData.name, birthYear: userData.birthYear, targetCompanyType: userData.targetCompanyType, targetJobRole: userData.targetJobRole }} onComplete={handleBasicInfoComplete} />}

      {/* Prompt: Add Education? */}
      {stage === 'prompt_edu' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {userData.name ? <>기본 정보 설정이 완료되었습니다.<br /></> : null}
              추가로 <span className="text-cyan-600">학력 정보</span>를 입력하시겠습니까?
            </h2>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleEduPromptSelection('yes')} className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/40 hover:scale-105 transition-all w-48">네</button>
              <button onClick={() => handleEduPromptSelection('no')} className="px-12 py-5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all w-48">아니요</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Education Flow */}
      {stage === 'education' && <EducationFlow initialData={userData} onComplete={handleEducationComplete} onBack={() => setStage('basic')} />}

      {/* Prompt: Add Project? */}
      {stage === 'prompt_project' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {userData.schoolName ? <>학력 정보가 저장되었습니다.<br /></> : null}
              이어서 <span className="text-purple-600">프로젝트 경험</span>을 입력하시겠습니까?
            </h2>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleProjectPromptSelection('yes')} className="px-12 py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-105 transition-all w-48">네</button>
              <button onClick={() => handleProjectPromptSelection('no')} className="px-12 py-5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all w-48">아니요</button>
            </div>
          </GlassCard>
        </div>
      )}

      {stage === 'project' && <ProjectFlow key={`project-${userData.projects.length}`} onComplete={handleProjectComplete} onBack={() => setStage('prompt_project')} />}

      {stage === 'prompt_more_projects' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">프로젝트가 저장되었습니다.<br /><span className="text-purple-600">다른 프로젝트</span>도 추가하시겠습니까?</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => handleMoreProjectsSelection('yes')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-105 transition-all">하나 더 추가</button>
              <button onClick={() => handleMoreProjectsSelection('no')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all">다음으로</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Prompt: Add Activity? */}
      {stage === 'prompt_activity' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {userData.projects.length > 0 ? <>프로젝트 입력이 완료되었습니다.<br /></> : null}
              이어서 <span className="text-blue-600">대외활동</span> 경험을 입력하시겠습니까?
            </h2>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleActivityPromptSelection('yes')} className="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all w-48">네</button>
              <button onClick={() => handleActivityPromptSelection('no')} className="px-12 py-5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all w-48">아니요</button>
            </div>
          </GlassCard>
        </div>
      )}

      {stage === 'activity' && <ActivityFlow key={`activity-${userData.activities.length}`} onComplete={handleActivityComplete} onBack={() => setStage('prompt_activity')} />}

      {stage === 'prompt_more_activities' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">활동이 저장되었습니다.<br /><span className="text-blue-600">다른 대외활동</span>도 추가하시겠습니까?</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => handleMoreActivitiesSelection('yes')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all">하나 더 추가</button>
              <button onClick={() => handleMoreActivitiesSelection('no')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all">다음으로</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Prompt: Add Certificates? */}
      {stage === 'prompt_cert' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {userData.activities.length > 0 ? <>대외활동 입력이 완료되었습니다.<br /></> : null}
              이어서 <span className="text-green-600">자격증 및 어학</span> 정보를 입력하시겠습니까?
            </h2>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleCertPromptSelection('yes')} className="px-12 py-5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 transition-all w-48">네</button>
              <button onClick={() => handleCertPromptSelection('no')} className="px-12 py-5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all w-48">아니요</button>
            </div>
          </GlassCard>
        </div>
      )}

      {stage === 'cert' && <CertificateFlow key={`cert-${userData.certificates.length}`} onComplete={handleCertComplete} onBack={() => setStage('prompt_cert')} />}

      {stage === 'prompt_more_certs' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">자격증이 저장되었습니다.<br /><span className="text-green-600">다른 자격증</span>도 추가하시겠습니까?</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => handleMoreCertsSelection('yes')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 transition-all">하나 더 추가</button>
              <button onClick={() => handleMoreCertsSelection('no')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all">다음으로</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Prompt: Add Career? */}
      {stage === 'prompt_career' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {userData.certificates.length > 0 ? <>자격증 입력이 완료되었습니다.<br /></> : null}
              이어서 <span className="text-orange-600">인턴/경력</span> 사항을 입력하시겠습니까?
            </h2>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleCareerPromptSelection('yes')} className="px-12 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:scale-105 transition-all w-48">네</button>
              <button onClick={() => handleCareerPromptSelection('no')} className="px-12 py-5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all w-48">아니요</button>
            </div>
          </GlassCard>
        </div>
      )}

      {stage === 'career' && <CareerFlow key={`career-${userData.careers.length}`} onComplete={handleCareerComplete} onBack={() => setStage('prompt_career')} />}

      {stage === 'prompt_more_careers' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-16 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-white/80">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">경력이 저장되었습니다.<br /><span className="text-orange-600">다른 경력</span>도 추가하시겠습니까?</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => handleMoreCareersSelection('yes')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:scale-105 transition-all">하나 더 추가</button>
              <button onClick={() => handleMoreCareersSelection('no')} className="px-8 py-5 min-w-[140px] whitespace-nowrap bg-white border border-gray-200 text-gray-600 rounded-2xl text-xl font-bold shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all">다음으로</button>
            </div>
          </GlassCard>
        </div>
      )}

      {stage === 'review' && (
        <div className="w-full animate-fade-in-up">
          <GlassCard className="w-full p-8 md:p-10 shadow-2xl border-white/80">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">입력 내용 검토</h2>
              <p className="text-gray-500">AI 분석 전에 입력한 내용을 확인하고 필요한 부분을 수정해주세요.</p>
            </div>

            <div className="space-y-8">
              <section className="bg-white/70 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">기본 정보</h3>
                  <button onClick={() => setStage('basic')} className="text-xs font-bold text-cyan-600 hover:underline">다시 입력</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className={reviewInputClass} value={userData.name} onChange={(e) => updateReviewField('name', e.target.value)} placeholder="이름" />
                  <input className={reviewInputClass} value={userData.targetCompanyType} onChange={(e) => updateReviewField('targetCompanyType', e.target.value)} placeholder="희망 회사 유형" />
                  <input className={reviewInputClass} value={userData.targetJobRole} onChange={(e) => updateReviewField('targetJobRole', e.target.value)} placeholder="희망 직무" />
                </div>
              </section>

              <section className="bg-white/70 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">학력</h3>
                  <button onClick={() => setStage('education')} className="text-xs font-bold text-cyan-600 hover:underline">다시 입력</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className={reviewInputClass} value={userData.schoolName} onChange={(e) => updateReviewField('schoolName', e.target.value)} placeholder="학교명" />
                  <input className={reviewInputClass} value={userData.major} onChange={(e) => updateReviewField('major', e.target.value)} placeholder="전공" />
                  <select className={reviewInputClass} value={userData.degree} onChange={(e) => updateReviewField('degree', e.target.value)}>
                    <option value="bachelor">학사</option>
                    <option value="associate">전문학사</option>
                    <option value="master">석사</option>
                    <option value="doctor">박사</option>
                  </select>
                  <select className={reviewInputClass} value={userData.academicStatus} onChange={(e) => updateReviewField('academicStatus', e.target.value)}>
                    <option value="">상태 선택</option>
                    <option value="attending">재학</option>
                    <option value="graduated">졸업</option>
                    <option value="pending">졸업 예정</option>
                    <option value="leave">휴학</option>
                  </select>
                  <input className={reviewInputClass} value={userData.startDate} onChange={(e) => updateReviewField('startDate', e.target.value)} placeholder="입학년월" />
                  <input className={reviewInputClass} value={userData.endDate} onChange={(e) => updateReviewField('endDate', e.target.value)} placeholder="졸업년월" />
                  <input className={reviewInputClass} value={userData.gpa} onChange={(e) => updateReviewField('gpa', e.target.value)} placeholder="평점" />
                  <input className={reviewInputClass} value={userData.maxGpa} onChange={(e) => updateReviewField('maxGpa', e.target.value)} placeholder="만점" />
                </div>
              </section>

              <section className="bg-white/70 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">프로젝트</h3>
                  <button onClick={() => setStage('project')} className="text-xs font-bold text-cyan-600 hover:underline">추가 입력</button>
                </div>
                <div className="space-y-4">
                  {userData.projects.length > 0 ? userData.projects.map((project, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                      <div className="flex justify-between gap-3">
                        <input className={reviewInputClass} value={project.projectName} onChange={(e) => updateReviewListItem('projects', index, { projectName: e.target.value })} placeholder="프로젝트명" />
                        <button onClick={() => removeReviewListItem('projects', index)} className="text-xs text-red-500 font-bold px-2">삭제</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className={reviewInputClass} value={project.startDate} onChange={(e) => updateReviewListItem('projects', index, { startDate: e.target.value })} placeholder="시작일" />
                        <input className={reviewInputClass} value={project.endDate} onChange={(e) => updateReviewListItem('projects', index, { endDate: e.target.value })} placeholder="종료일" />
                        <input className={reviewInputClass} value={project.role} onChange={(e) => updateReviewListItem('projects', index, { role: e.target.value })} placeholder="역할" />
                        <input className={reviewInputClass} value={project.isTeam} onChange={(e) => updateReviewListItem('projects', index, { isTeam: e.target.value })} placeholder="개인/팀" />
                        <input className={reviewInputClass} value={project.techStack.join(', ')} onChange={(e) => updateReviewListItem('projects', index, { techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="기술스택, 쉼표로 구분" />
                        <input className={reviewInputClass} value={project.outcome} onChange={(e) => updateReviewListItem('projects', index, { outcome: e.target.value })} placeholder="성과" />
                      </div>
                      <textarea className={reviewTextAreaClass} value={project.description} onChange={(e) => updateReviewListItem('projects', index, { description: e.target.value })} placeholder="프로젝트 설명" />
                    </div>
                  )) : <p className="text-sm text-gray-400">입력된 프로젝트가 없습니다.</p>}
                </div>
              </section>

              <section className="bg-white/70 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">대외활동</h3>
                  <button onClick={() => setStage('activity')} className="text-xs font-bold text-cyan-600 hover:underline">추가 입력</button>
                </div>
                <div className="space-y-4">
                  {userData.activities.length > 0 ? userData.activities.map((activity, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                      <div className="flex justify-between gap-3">
                        <input className={reviewInputClass} value={activity.activityName} onChange={(e) => updateReviewListItem('activities', index, { activityName: e.target.value })} placeholder="활동명" />
                        <button onClick={() => removeReviewListItem('activities', index)} className="text-xs text-red-500 font-bold px-2">삭제</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className={reviewInputClass} value={activity.role} onChange={(e) => updateReviewListItem('activities', index, { role: e.target.value })} placeholder="역할" />
                        <input className={reviewInputClass} value={activity.activityType} onChange={(e) => updateReviewListItem('activities', index, { activityType: e.target.value })} placeholder="활동 유형" />
                        <input className={reviewInputClass} value={activity.startDate} onChange={(e) => updateReviewListItem('activities', index, { startDate: e.target.value })} placeholder="시작일" />
                        <input className={reviewInputClass} value={activity.endDate} onChange={(e) => updateReviewListItem('activities', index, { endDate: e.target.value })} placeholder="종료일" />
                      </div>
                      <textarea className={reviewTextAreaClass} value={activity.description} onChange={(e) => updateReviewListItem('activities', index, { description: e.target.value })} placeholder="활동 설명" />
                      <textarea className={reviewTextAreaClass} value={activity.achievement} onChange={(e) => updateReviewListItem('activities', index, { achievement: e.target.value })} placeholder="성과" />
                    </div>
                  )) : <p className="text-sm text-gray-400">입력된 대외활동이 없습니다.</p>}
                </div>
              </section>

              <section className="bg-white/70 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">자격증 및 어학</h3>
                  <button onClick={() => setStage('cert')} className="text-xs font-bold text-cyan-600 hover:underline">추가 입력</button>
                </div>
                <div className="space-y-4">
                  {userData.certificates.length > 0 ? userData.certificates.map((cert, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3">
                        <input className={reviewInputClass} value={cert.name} onChange={(e) => updateReviewListItem('certificates', index, { name: e.target.value })} placeholder="이름" />
                        <input className={reviewInputClass} value={cert.score} onChange={(e) => updateReviewListItem('certificates', index, { score: e.target.value })} placeholder="점수/등급" />
                        <input className={reviewInputClass} value={cert.date} onChange={(e) => updateReviewListItem('certificates', index, { date: e.target.value })} placeholder="취득일" />
                        <button onClick={() => removeReviewListItem('certificates', index)} className="text-xs text-red-500 font-bold px-2">삭제</button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-400">입력된 자격증/어학이 없습니다.</p>}
                </div>
              </section>

              <section className="bg-white/70 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">경력/인턴</h3>
                  <button onClick={() => setStage('career')} className="text-xs font-bold text-cyan-600 hover:underline">추가 입력</button>
                </div>
                <div className="space-y-4">
                  {userData.careers.length > 0 ? userData.careers.map((career, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                      <div className="flex justify-between gap-3">
                        <input className={reviewInputClass} value={career.companyName} onChange={(e) => updateReviewListItem('careers', index, { companyName: e.target.value })} placeholder="회사명" />
                        <button onClick={() => removeReviewListItem('careers', index)} className="text-xs text-red-500 font-bold px-2">삭제</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select className={reviewInputClass} value={career.type} onChange={(e) => updateReviewListItem('careers', index, { type: e.target.value as CareerData['type'] })}>
                          <option value="intern">인턴</option>
                          <option value="career">경력</option>
                        </select>
                        <input className={reviewInputClass} value={career.department} onChange={(e) => updateReviewListItem('careers', index, { department: e.target.value })} placeholder="부서/직무" />
                        <input className={reviewInputClass} value={career.position || ''} onChange={(e) => updateReviewListItem('careers', index, { position: e.target.value })} placeholder="직급/직책" />
                        <input className={reviewInputClass} value={career.startDate} onChange={(e) => updateReviewListItem('careers', index, { startDate: e.target.value })} placeholder="시작일" />
                        <input className={reviewInputClass} value={career.endDate} onChange={(e) => updateReviewListItem('careers', index, { endDate: e.target.value })} placeholder="종료일" />
                      </div>
                      <textarea className={reviewTextAreaClass} value={career.description} onChange={(e) => updateReviewListItem('careers', index, { description: e.target.value })} placeholder="업무 설명" />
                    </div>
                  )) : <p className="text-sm text-gray-400">입력된 경력/인턴이 없습니다.</p>}
                </div>
              </section>
            </div>

            <div className="sticky bottom-4 mt-10 flex flex-col sm:flex-row justify-center gap-3 bg-white/80 backdrop-blur-xl border border-white rounded-2xl p-4 shadow-lg">
              <Button variant="secondary" onClick={() => setStage('prompt_career')} className="px-8 py-4 rounded-xl">이전 단계로</Button>
              <Button variant="primary" onClick={() => completeAndAnalyze(userData)} className="px-10 py-4 rounded-xl font-bold shadow-lg">AI 분석 시작하기</Button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
