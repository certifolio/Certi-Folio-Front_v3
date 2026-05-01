import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { MonthYearPicker } from '../UI/MonthYearPicker';
import { DatePicker } from '../UI/DatePicker';
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
import { useApp } from '../../contexts/AppContext';

// Define the full structure of the data we are collecting
interface FullUserData {
  // Target Setting (Merged into Basic Info)
  targetCompanyType: string;
  targetJobRole: string;
  // Basic Info
  name: string;
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

const LabeledTextarea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">{label}</label>}
    <textarea {...props} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all duration-300 shadow-sm min-h-[100px] resize-y leading-relaxed" />
  </div>
);

const LabeledSelect = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">{label}</label>}
    <select {...props} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all duration-300 shadow-sm" />
  </div>
);

export const SpecFlowTest: React.FC<SpecFlowTestProps> = ({ onAnalysisComplete }) => {
  const { isLoggedIn, token, userProfile, refreshProfile } = useAuth();
  const { navigate } = useApp();
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
      <SpecReport analyticsData={analyticsResult} onGoToDashboard={() => navigate('dashboard')} />
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
      {stage === 'basic' && <BasicInfoFlow initialData={{ name: userData.name, targetCompanyType: userData.targetCompanyType, targetJobRole: userData.targetJobRole }} onComplete={handleBasicInfoComplete} />}

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
          <GlassCard className="w-full p-8 md:p-12 shadow-2xl border-white/80">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-cyan-500/40">
                🔍
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">입력 내용 검토</h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">AI 분석을 시작하기 전에 입력하신 모든 정보를 확인해주세요.<br/>수정이 필요한 부분은 바로 편집할 수 있습니다.</p>
            </div>

            <div className="space-y-8">
              {/* 기본 정보 */}
              <section className="bg-white/80 border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-500 rounded-xl flex items-center justify-center text-xl shadow-inner">👤</div>
                    <h3 className="text-2xl font-extrabold text-gray-900">기본 정보</h3>
                  </div>
                  <button onClick={() => setStage('basic')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-cyan-600 transition-all">다시 입력</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="이름" value={userData.name} onChange={(e) => updateReviewField('name', e.target.value)} placeholder="홍길동" />
                  <LabeledSelect label="희망 회사 유형" value={userData.targetCompanyType} onChange={(e: any) => updateReviewField('targetCompanyType', e.target.value)}>
                    <option value="">유형 선택</option>
                    <option value="대기업">대기업</option>
                    <option value="중견기업">중견기업</option>
                    <option value="스타트업">스타트업</option>
                    <option value="공기업/공공기관">공기업/공공기관</option>
                    <option value="외국계">외국계</option>
                    <option value="기타">기타</option>
                  </LabeledSelect>
                  <LabeledSelect label="희망 직무" value={userData.targetJobRole} onChange={(e: any) => updateReviewField('targetJobRole', e.target.value)}>
                    <option value="">직무 선택</option>
                    <option value="프론트엔드 개발">프론트엔드 개발</option>
                    <option value="백엔드 개발">백엔드 개발</option>
                    <option value="풀스택 개발">풀스택 개발</option>
                    <option value="모바일 앱 개발">모바일 앱 개발</option>
                    <option value="인프라/서버">인프라/서버</option>
                    <option value="데이터/AI">데이터/AI</option>
                    <option value="기획/PM">기획/PM</option>
                    <option value="디자인">디자인</option>
                    <option value="기타">기타</option>
                  </LabeledSelect>
                </div>
              </section>

              {/* 학력 정보 */}
              <section className="bg-white/80 border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl shadow-inner">🎓</div>
                    <h3 className="text-2xl font-extrabold text-gray-900">학력 정보</h3>
                  </div>
                  <button onClick={() => setStage('education')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all">다시 입력</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="학교명" value={userData.schoolName} onChange={(e) => updateReviewField('schoolName', e.target.value)} placeholder="한국대학교" />
                  <Input label="전공" value={userData.major} onChange={(e) => updateReviewField('major', e.target.value)} placeholder="컴퓨터공학과" />
                  <LabeledSelect label="학위" value={userData.degree} onChange={(e: any) => updateReviewField('degree', e.target.value)}>
                    <option value="bachelor">학사</option>
                    <option value="associate">전문학사</option>
                    <option value="master">석사</option>
                    <option value="doctor">박사</option>
                  </LabeledSelect>
                  <LabeledSelect label="상태" value={userData.academicStatus} onChange={(e: any) => updateReviewField('academicStatus', e.target.value)}>
                    <option value="">상태 선택</option>
                    <option value="attending">재학 중</option>
                    <option value="graduated">졸업</option>
                    <option value="pending">졸업 예정</option>
                    <option value="leave">휴학</option>
                  </LabeledSelect>
                  <MonthYearPicker label="입학년월" value={userData.startDate} onChange={(val) => updateReviewField('startDate', val)} placeholder="YYYY.MM" />
                  <MonthYearPicker label="졸업년월" value={userData.endDate} onChange={(val) => updateReviewField('endDate', val)} placeholder="YYYY.MM" />
                  
                  <div className="md:col-span-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block text-center mb-3">전체 평점 (GPA)</label>
                    <div className="flex items-center justify-center gap-4">
                      <input value={userData.gpa} onChange={(e) => updateReviewField('gpa', e.target.value)} placeholder="0.0" className="text-center text-xl font-bold w-32 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 shadow-sm" />
                      <span className="text-3xl text-gray-300">/</span>
                      <input value={userData.maxGpa} onChange={(e) => updateReviewField('maxGpa', e.target.value)} placeholder="4.5" className="text-center text-xl font-bold w-32 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 shadow-sm" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 프로젝트 */}
              <section className="bg-white/80 border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center text-xl shadow-inner">💻</div>
                    <h3 className="text-2xl font-extrabold text-gray-900">프로젝트</h3>
                  </div>
                  <button onClick={() => setStage('project')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-purple-600 transition-all">+ 추가 입력</button>
                </div>
                <div className="space-y-6">
                  {userData.projects.length > 0 ? userData.projects.map((project, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 transition-colors relative group">
                      <button onClick={() => removeReviewListItem('projects', index)} className="absolute top-6 right-6 text-sm text-red-400 font-bold hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                        프로젝트 {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <Input label="프로젝트명" value={project.projectName} onChange={(e) => updateReviewListItem('projects', index, { projectName: e.target.value })} placeholder="프로젝트명" />
                        <LabeledSelect label="개인/팀" value={project.isTeam} onChange={(e: any) => updateReviewListItem('projects', index, { isTeam: e.target.value })}>
                          <option value="">선택</option>
                          <option value="individual">개인 프로젝트</option>
                          <option value="team">팀 프로젝트</option>
                        </LabeledSelect>
                        <MonthYearPicker label="시작일" value={project.startDate} onChange={(val) => updateReviewListItem('projects', index, { startDate: val })} placeholder="YYYY.MM" />
                        <MonthYearPicker label="종료일" value={project.endDate} onChange={(val) => updateReviewListItem('projects', index, { endDate: val })} placeholder="YYYY.MM" />
                        <Input label="역할" value={project.role} onChange={(e) => updateReviewListItem('projects', index, { role: e.target.value })} placeholder="프론트엔드, 백엔드 등" />
                        <Input label="기술 스택 (쉼표로 구분)" value={project.techStack.join(', ')} onChange={(e) => updateReviewListItem('projects', index, { techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="React, Node.js 등" />
                      </div>
                      <div className="space-y-5">
                        <LabeledTextarea label="프로젝트 설명" value={project.description} onChange={(e: any) => updateReviewListItem('projects', index, { description: e.target.value })} placeholder="어떤 문제를 해결하기 위한 프로젝트인지 설명해주세요." />
                        <LabeledTextarea label="주요 성과 및 결과" value={project.outcome} onChange={(e: any) => updateReviewListItem('projects', index, { outcome: e.target.value })} placeholder="프로젝트를 통해 얻은 성과나 배운 점을 작성해주세요." />
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                      <p className="text-gray-400 font-medium">입력된 프로젝트가 없습니다.</p>
                      <button onClick={() => setStage('project')} className="mt-4 text-purple-600 font-bold hover:underline">프로젝트 추가하기</button>
                    </div>
                  )}
                </div>
              </section>

              {/* 대외활동 */}
              <section className="bg-white/80 border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-xl shadow-inner">🤝</div>
                    <h3 className="text-2xl font-extrabold text-gray-900">대외활동</h3>
                  </div>
                  <button onClick={() => setStage('activity')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-all">+ 추가 입력</button>
                </div>
                <div className="space-y-6">
                  {userData.activities.length > 0 ? userData.activities.map((activity, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-300 transition-colors relative group">
                      <button onClick={() => removeReviewListItem('activities', index)} className="absolute top-6 right-6 text-sm text-red-400 font-bold hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                        대외활동 {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <Input label="활동명" value={activity.activityName} onChange={(e) => updateReviewListItem('activities', index, { activityName: e.target.value })} placeholder="OO 서포터즈, 동아리 등" />
                        <LabeledSelect label="활동 유형" value={activity.activityType} onChange={(e: any) => updateReviewListItem('activities', index, { activityType: e.target.value })}>
                          <option value="">유형 선택</option>
                          <option value="동아리">동아리</option>
                          <option value="대외활동/서포터즈">대외활동/서포터즈</option>
                          <option value="봉사활동">봉사활동</option>
                          <option value="교육/부트캠프">교육/부트캠프</option>
                          <option value="공모전/해커톤">공모전/해커톤</option>
                          <option value="기타">기타</option>
                        </LabeledSelect>
                        <Input label="역할" value={activity.role} onChange={(e) => updateReviewListItem('activities', index, { role: e.target.value })} placeholder="팀장, 부원 등" />
                        <div className="grid grid-cols-2 gap-3">
                          <MonthYearPicker label="시작일" value={activity.startDate} onChange={(val) => updateReviewListItem('activities', index, { startDate: val })} placeholder="YYYY.MM" />
                          <MonthYearPicker label="종료일" value={activity.endDate} onChange={(val) => updateReviewListItem('activities', index, { endDate: val })} placeholder="YYYY.MM" />
                        </div>
                      </div>
                      <div className="space-y-5">
                        <LabeledTextarea label="활동 설명" value={activity.description} onChange={(e: any) => updateReviewListItem('activities', index, { description: e.target.value })} placeholder="주요 활동 내용을 설명해주세요." />
                        <LabeledTextarea label="활동 성과" value={activity.achievement} onChange={(e: any) => updateReviewListItem('activities', index, { achievement: e.target.value })} placeholder="활동을 통해 얻은 성과나 배운 점을 작성해주세요." />
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                      <p className="text-gray-400 font-medium">입력된 대외활동이 없습니다.</p>
                      <button onClick={() => setStage('activity')} className="mt-4 text-indigo-600 font-bold hover:underline">대외활동 추가하기</button>
                    </div>
                  )}
                </div>
              </section>

              {/* 자격증 및 어학 */}
              <section className="bg-white/80 border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center text-xl shadow-inner">📜</div>
                    <h3 className="text-2xl font-extrabold text-gray-900">자격증 및 어학</h3>
                  </div>
                  <button onClick={() => setStage('cert')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-green-600 transition-all">+ 추가 입력</button>
                </div>
                <div className="space-y-4">
                  {userData.certificates.length > 0 ? userData.certificates.map((cert, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-green-300 transition-colors relative group flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                        <LabeledSelect label="종류" value={cert.type || ''} onChange={(e: any) => updateReviewListItem('certificates', index, { type: e.target.value as 'language' | 'general' })}>
                          <option value="">선택</option>
                          <option value="language">어학</option>
                          <option value="general">자격증</option>
                        </LabeledSelect>
                        <Input label="자격증/어학명" value={cert.name} onChange={(e) => updateReviewListItem('certificates', index, { name: e.target.value })} placeholder="TOEIC, 정보처리기사 등" />
                        <Input label="점수/등급" value={cert.score} onChange={(e) => updateReviewListItem('certificates', index, { score: e.target.value })} placeholder="900점, 1급 등" />
                        <DatePicker label="취득일" value={cert.date} onChange={(val) => updateReviewListItem('certificates', index, { date: val })} placeholder="YYYY.MM.DD" />
                      </div>
                      <button onClick={() => removeReviewListItem('certificates', index)} className="md:mb-1 w-full md:w-auto text-sm text-red-500 font-bold hover:text-white hover:bg-red-500 border border-red-200 px-4 py-3 rounded-xl transition-colors">삭제</button>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                      <p className="text-gray-400 font-medium">입력된 자격증/어학 정보가 없습니다.</p>
                      <button onClick={() => setStage('cert')} className="mt-4 text-green-600 font-bold hover:underline">자격증 추가하기</button>
                    </div>
                  )}
                </div>
              </section>

              {/* 경력/인턴 */}
              <section className="bg-white/80 border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center text-xl shadow-inner">💼</div>
                    <h3 className="text-2xl font-extrabold text-gray-900">경력 및 인턴</h3>
                  </div>
                  <button onClick={() => setStage('career')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-orange-600 transition-all">+ 추가 입력</button>
                </div>
                <div className="space-y-6">
                  {userData.careers.length > 0 ? userData.careers.map((career, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-orange-300 transition-colors relative group">
                      <button onClick={() => removeReviewListItem('careers', index)} className="absolute top-6 right-6 text-sm text-red-400 font-bold hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                        경력 {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <Input label="회사명" value={career.companyName} onChange={(e) => updateReviewListItem('careers', index, { companyName: e.target.value })} placeholder="회사명" />
                        <LabeledSelect label="유형" value={career.type} onChange={(e: any) => updateReviewListItem('careers', index, { type: e.target.value as CareerData['type'] })}>
                          <option value="intern">인턴</option>
                          <option value="career">경력(정규직)</option>
                        </LabeledSelect>
                        <Input label="부서/직무" value={career.department} onChange={(e) => updateReviewListItem('careers', index, { department: e.target.value })} placeholder="개발팀, 마케팅팀 등" />
                        <Input label="직급/직책" value={career.position || ''} onChange={(e) => updateReviewListItem('careers', index, { position: e.target.value })} placeholder="사원, 연구원 등" />
                        <MonthYearPicker label="시작일" value={career.startDate} onChange={(val) => updateReviewListItem('careers', index, { startDate: val })} placeholder="YYYY.MM" />
                        <MonthYearPicker label="종료일" value={career.endDate} onChange={(val) => updateReviewListItem('careers', index, { endDate: val })} placeholder="YYYY.MM" />
                      </div>
                      <LabeledTextarea label="주요 업무 및 성과" value={career.description} onChange={(e: any) => updateReviewListItem('careers', index, { description: e.target.value })} placeholder="수행하신 주요 업무와 성과를 구체적으로 작성해주세요." />
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                      <p className="text-gray-400 font-medium">입력된 경력/인턴 정보가 없습니다.</p>
                      <button onClick={() => setStage('career')} className="mt-4 text-orange-600 font-bold hover:underline">경력 추가하기</button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="sticky bottom-4 mt-12 flex flex-col sm:flex-row justify-center gap-4 bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl">
              <Button variant="secondary" onClick={() => setStage('prompt_career')} className="px-10 py-5 rounded-2xl text-lg font-bold border-gray-200">이전 단계로</Button>
              <Button variant="primary" onClick={() => completeAndAnalyze(userData)} className="px-12 py-5 rounded-2xl text-lg font-extrabold shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 bg-gradient-to-r from-cyan-500 to-blue-600 transform hover:-translate-y-1 transition-all flex items-center gap-3">
                <span className="text-2xl">✨</span>
                이대로 AI 분석 시작하기
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
