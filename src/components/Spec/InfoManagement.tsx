import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi, portfolioApi } from '../../api/userApi';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { MonthYearPicker } from '../UI/MonthYearPicker';
import { DatePicker } from '../UI/DatePicker';

// Import Flow Components
import { ProjectFlow, ProjectData } from './ProjectFlow';
import { ActivityFlow, ActivityData } from './ActivityFlow';
import { CertificateFlow, CertificateData } from './CertificateFlow';
import { CareerFlow, CareerData } from './CareerFlow';
import { analyticsApi } from '../../api/analyticsApi';

// Interfaces (matching SpecFlowTest data structure)
interface FullUserData {
  educationId?: string;
  name: string;
  targetCompanyType: string;
  targetJobRole: string;
  academicStatus: string;
  schoolName: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  maxGpa: string;
  projects: ProjectData[];
  activities: ActivityData[];
  certificates: CertificateData[];
  careers: CareerData[];
}

interface InfoManagementProps {
  onRerunAnalysis?: () => Promise<void> | void;
}

type EditableSection = 'projects' | 'activities' | 'certificates' | 'career';

type EditModalState =
  | { section: 'projects'; index: number; data: ProjectData }
  | { section: 'activities'; index: number; data: ActivityData }
  | { section: 'certificates'; index: number; data: CertificateData }
  | { section: 'career'; index: number; data: CareerData };

export const InfoManagement: React.FC<InfoManagementProps> = ({ onRerunAnalysis }) => {
  const { isLoggedIn, token, userProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');

  // State to track if we are in "Adding Mode" and which type
  const [addingMode, setAddingMode] = useState<'projects' | 'activities' | 'certificates' | 'career' | null>(null);

  const [userData, setUserData] = useState<FullUserData>({
    educationId: '',
    name: userProfile?.name || '',
    targetCompanyType: userProfile?.companyType || '',
    targetJobRole: userProfile?.jobRole || '',
    academicStatus: 'attending', schoolName: '', major: '', degree: 'bachelor', startDate: '', endDate: '', gpa: '', maxGpa: '',
    projects: [], activities: [], certificates: [], careers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [addStatus, setAddStatus] = useState<{ kind: 'saving' | 'done'; message: string } | null>(null);
  const [isRerunningAnalysis, setIsRerunningAnalysis] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);

  const companyTypes = [
    '대기업',
    'IT 서비스 기업',
    '금융권',
    '공기업/공공기관',
    '스타트업',
    '기타/SI/SM',
  ];

  const jobRoles: Record<string, string[]> = {
    '대기업': ['백엔드 개발자', '프론트엔드 개발자', '모바일 앱 개발자', '데이터 엔지니어', 'AI/머신러닝 연구원', '임베디드/시스템 소프트웨어 개발자', '보안 엔지니어', '데브옵스/인프라 엔지니어'],
    'IT 서비스 기업': ['서버 개발자', '웹 프론트엔드 개발자', '안드로이드 개발자', 'iOS 개발자', '데이터 사이언티스트', '머신러닝 엔지니어', '사이트 신뢰성 엔지니어', 'QA/테스트 엔지니어'],
    '금융권': ['코어뱅킹 개발자', '계정계/정보계 개발자', '금융 플랫폼 프론트엔드 개발자', '금융 데이터 분석가', '블록체인/디지털 자산 개발자', '보안/정보보호 담당자', 'IT 기획/프로덕트 매니저'],
    '공기업/공공기관': ['전산직 개발/운영 담당자', '정보보안 담당자', '네트워크/시스템 관리자', '데이터베이스 관리자', 'IT 사업 관리 담당자'],
    '스타트업': ['풀스택 개발자', '프론트엔드 리드', '백엔드 개발자', '그로스 엔지니어', '데이터 분석가', '기술 리드/CTO', '블록체인 엔지니어'],
    '기타/SI/SM': ['SI 개발자', '시스템 운영 담당자', '솔루션 엔지니어', '웹 퍼블리셔', 'ERP 개발자', '임베디드 소프트웨어 개발자'],
  };

  const normalizeMonthYear = (value: string) => {
    if (!value) return '';
    const normalized = value.replace(/-/g, '.');
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1].padStart(2, '0')}`;
    }
    return normalized;
  };

  const normalizeDate = (value: string) => {
    if (!value) return '';
    const normalized = value.replace(/-/g, '.');
    const parts = normalized.split('.');
    if (parts.length >= 3) {
      return `${parts[0]}.${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`;
    }
    return normalized;
  };

  const mapProjectFromApi = (project: any): ProjectData => ({
    id: String(project.id || ''),
    projectName: project.projectName || project.name || '',
    isTeam: project.isTeam || project.type || '',
    startDate: normalizeMonthYear(project.startDate || ''),
    endDate: normalizeMonthYear(project.endDate || ''),
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
    startDate: normalizeMonthYear(activity.startDate || activity.startMonth || ''),
    endDate: normalizeMonthYear(activity.endDate || activity.endMonth || ''),
    description: activity.description || '',
    achievement: activity.achievement || activity.result || '',
  });

  const mapCertificateFromApi = (certificate: any): CertificateData => ({
    id: String(certificate.id || ''),
    type: ['language', 'lang'].includes(certificate.type) ? 'language' : 'general',
    name: certificate.name || certificate.certificateName || '',
    issuer: certificate.issuer || '',
    date: normalizeDate(certificate.date || certificate.issueDate || ''),
    score: certificate.score || '',
    certId: certificate.certId || certificate.certificateNumber || '',
  });

  const mapCareerFromApi = (career: any): CareerData => ({
    id: String(career.id || ''),
    type: career.type === 'career' ? 'career' : 'intern',
    companyName: career.companyName || career.company || '',
    department: career.department || career.position || '',
    position: career.position || '',
    startDate: normalizeMonthYear(career.startDate || ''),
    endDate: normalizeMonthYear(career.endDate || ''),
    description: career.description || '',
  });

  const showSavedNotice = (message: string) => {
    setSaveNotice(message);
    window.setTimeout(() => {
      setSaveNotice((current) => (current === message ? null : current));
    }, 2500);
  };

  const completeAddFlow = (message: string) => {
    setAddStatus({ kind: 'done', message });
    window.setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  // Load Data
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const loadFromBackend = async () => {
      setIsLoading(true);
      try {
        const [educations, projects, activities, certificates, careers] = await Promise.allSettled([
          portfolioApi.getEducations(),
          portfolioApi.getProjects(),
          portfolioApi.getActivities(),
          portfolioApi.getCertificates(),
          portfolioApi.getCareers(),
        ]);

        const education = educations.status === 'fulfilled' && Array.isArray(educations.value) ? educations.value[0] : null;
        const loadedData: FullUserData = {
          educationId: education?.id ? String(education.id) : '',
          name: userProfile?.name || '',
          targetCompanyType: userProfile?.companyType || '',
          targetJobRole: userProfile?.jobRole || '',
          academicStatus: education?.status || education?.academicStatus || 'attending',
          schoolName: education?.schoolName || '',
          major: education?.major || '',
          degree: education?.degree || 'bachelor',
          startDate: normalizeMonthYear(education?.startDate || ''),
          endDate: normalizeMonthYear(education?.endDate || ''),
          gpa: education?.gpa != null ? String(education.gpa) : '',
          maxGpa: education?.maxGpa != null ? String(education.maxGpa) : '',
          projects: projects.status === 'fulfilled' && Array.isArray(projects.value) ? projects.value.map(mapProjectFromApi) : [],
          activities: activities.status === 'fulfilled' && Array.isArray(activities.value) ? activities.value.map(mapActivityFromApi) : [],
          certificates: certificates.status === 'fulfilled' && Array.isArray(certificates.value) ? certificates.value.map(mapCertificateFromApi) : [],
          careers: careers.status === 'fulfilled' && Array.isArray(careers.value) ? careers.value.map(mapCareerFromApi) : [],
        };

        setUserData(loadedData);
      } catch (e) {
        console.error("Failed to load user info from backend", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromBackend();
  }, [isLoggedIn, token, userProfile?.name]);

  useEffect(() => {
    setUserData((prev) => ({
      ...prev,
      name: userProfile?.name || prev.name,
      targetCompanyType: userProfile?.companyType || prev.targetCompanyType,
      targetJobRole: userProfile?.jobRole || prev.targetJobRole,
    }));
  }, [userProfile?.name, userProfile?.companyType, userProfile?.jobRole]);

  const handlePreferenceSave = async () => {
    if (!userData.targetCompanyType) {
      alert('희망 기업 유형을 선택해주세요.');
      return;
    }

    if (!userData.targetJobRole) {
      alert('희망 직무를 선택해주세요.');
      return;
    }

    try {
      await userApi.updateMyInfo({
        name: userData.name || userProfile?.name || '',
        companyType: userData.targetCompanyType,
        jobRole: userData.targetJobRole,
      });
      await refreshProfile();
      showSavedNotice('희망 기업과 직무가 저장되었습니다.');
    } catch (e) {
      console.error('Failed to update target preferences', e);
      alert('희망 기업/직무 저장 중 오류가 발생했습니다.');
    }
  };

  // Manual Save Button Handler (for text inputs in Education/Etc)
  const handleManualSave = async () => {
    try {
      const requiredFields = [
        { key: 'schoolName', label: '학교명', value: userData.schoolName },
        { key: 'major', label: '전공', value: userData.major },
        { key: 'degree', label: '학위', value: userData.degree },
        { key: 'academicStatus', label: '상태', value: userData.academicStatus },
        { key: 'startDate', label: '입학년월', value: userData.startDate },
        { key: 'endDate', label: '졸업년월', value: userData.endDate },
      ];

      const missingField = requiredFields.find((field) => !String(field.value || '').trim());
      if (missingField) {
        alert(`${missingField.label}을(를) 입력해주세요.`);
        return;
      }

      const datePattern = /^\d{4}([.-])\d{2}(\1\d{2})?$/;
      if (!datePattern.test(userData.startDate.trim())) {
        alert('입학년월은 YYYY.MM 또는 YYYY-MM 형식으로 입력해주세요.');
        return;
      }

      if (!datePattern.test(userData.endDate.trim())) {
        alert('졸업년월은 YYYY.MM 또는 YYYY-MM 형식으로 입력해주세요.');
        return;
      }

      const educationPayload = {
        schoolName: userData.schoolName.trim(),
        major: userData.major.trim(),
        degree: userData.degree,
        status: userData.academicStatus,
        startDate: userData.startDate.trim(),
        endDate: userData.endDate.trim(),
        gpa: userData.gpa ? parseFloat(userData.gpa) : null,
        maxGpa: userData.maxGpa ? parseFloat(userData.maxGpa) : null,
      };

      if (userData.schoolName) {
        const educationResult = userData.educationId
          ? await portfolioApi.modifyEducation(Number(userData.educationId), educationPayload)
          : await portfolioApi.addEducation(educationPayload);

        if (!userData.educationId && educationResult?.id) {
          setUserData((prev) => ({ ...prev, educationId: String(educationResult.id) }));
        }
      }

      showSavedNotice('학력 정보가 저장되었습니다.');
    } catch (e) {
      console.error("Failed to sync user info", e);
      alert('정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  // Flow Completion Handlers
  const handleProjectAdd = async (newProject: ProjectData) => {
    try {
      setAddStatus({ kind: 'saving', message: '프로젝트를 저장하고 있습니다...' });
      const created = await portfolioApi.addProject({
        name: newProject.projectName,
        type: newProject.isTeam,
        role: newProject.role,
        techStack: Array.isArray(newProject.techStack) ? newProject.techStack.join(', ') : newProject.techStack,
        description: newProject.description,
        githubLink: newProject.links?.github || '',
        demoLink: newProject.links?.demo || '',
        result: newProject.outcome,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
      });
      setUserData((prev) => ({
        ...prev,
        projects: [...prev.projects, mapProjectFromApi(created ?? newProject)],
      }));
      completeAddFlow('프로젝트가 저장되었습니다. 목록을 새로고침하고 있습니다...');
    } catch (e) {
      setAddStatus(null);
      console.error('Failed to add project', e);
      alert('프로젝트 추가 중 오류가 발생했습니다.');
    }
  };

  const handleActivityAdd = async (newActivity: ActivityData) => {
    try {
      setAddStatus({ kind: 'saving', message: '대외활동을 저장하고 있습니다...' });
      const created = await portfolioApi.addActivity({
        name: newActivity.activityName,
        type: newActivity.activityType,
        role: newActivity.role,
        startMonth: newActivity.startDate,
        endMonth: newActivity.endDate,
        description: newActivity.description,
        result: newActivity.achievement,
      });
      setUserData((prev) => ({
        ...prev,
        activities: [...prev.activities, mapActivityFromApi(created ?? newActivity)],
      }));
      completeAddFlow('대외활동이 저장되었습니다. 목록을 새로고침하고 있습니다...');
    } catch (e) {
      setAddStatus(null);
      console.error('Failed to add activity', e);
      alert('대외활동 추가 중 오류가 발생했습니다.');
    }
  };

  const handleCertAdd = async (newCert: CertificateData) => {
    try {
      setAddStatus({ kind: 'saving', message: '자격증/어학 정보를 저장하고 있습니다...' });
      const created = await portfolioApi.addCertificate({
        name: newCert.name,
        type: newCert.type,
        issuer: newCert.issuer || '',
        issueDate: newCert.date,
        score: newCert.score,
        certificateNumber: newCert.certId || '',
      });
      setUserData((prev) => ({
        ...prev,
        certificates: [...prev.certificates, mapCertificateFromApi(created ?? newCert)],
      }));
      completeAddFlow('자격증/어학 정보가 저장되었습니다. 목록을 새로고침하고 있습니다...');
    } catch (e) {
      setAddStatus(null);
      console.error('Failed to add certificate', e);
      alert('자격증 추가 중 오류가 발생했습니다.');
    }
  };

  const handleCareerAdd = async (newCareer: CareerData) => {
    try {
      setAddStatus({ kind: 'saving', message: '경력 정보를 저장하고 있습니다...' });
      const created = await portfolioApi.addCareer({
        type: newCareer.type,
        company: newCareer.companyName,
        position: newCareer.position || newCareer.department,
        startDate: newCareer.startDate,
        endDate: newCareer.endDate,
        description: newCareer.description,
      });
      setUserData((prev) => ({
        ...prev,
        careers: [...prev.careers, mapCareerFromApi(created ?? newCareer)],
      }));
      completeAddFlow('경력 정보가 저장되었습니다. 목록을 새로고침하고 있습니다...');
    } catch (e) {
      setAddStatus(null);
      console.error('Failed to add career', e);
      alert('경력 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteProject = async (idx: number) => {
    const target = userData.projects[idx];
    if (!target) return;

    try {
      if (target.id) {
        await portfolioApi.deleteProject(Number(target.id));
        setUserData((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }));
        return;
      }

      setUserData((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }));
    } catch (e) {
      console.error('Failed to delete project', e);
      alert('프로젝트 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteActivity = async (idx: number) => {
    const target = userData.activities[idx];
    if (!target) return;

    try {
      if (target.id) {
        await portfolioApi.deleteActivity(Number(target.id));
        setUserData((prev) => ({ ...prev, activities: prev.activities.filter((_, i) => i !== idx) }));
        return;
      }

      setUserData((prev) => ({ ...prev, activities: prev.activities.filter((_, i) => i !== idx) }));
    } catch (e) {
      console.error('Failed to delete activity', e);
      alert('대외활동 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCertificate = async (idx: number) => {
    const target = userData.certificates[idx];
    if (!target) return;

    try {
      if (target.id) {
        await portfolioApi.deleteCertificate(Number(target.id));
        setUserData((prev) => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== idx) }));
        return;
      }

      setUserData((prev) => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== idx) }));
    } catch (e) {
      console.error('Failed to delete certificate', e);
      alert('자격증 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCareer = async (idx: number) => {
    const target = userData.careers[idx];
    if (!target) return;

    try {
      if (target.id) {
        await portfolioApi.deleteCareer(Number(target.id));
        setUserData((prev) => ({ ...prev, careers: prev.careers.filter((_, i) => i !== idx) }));
        return;
      }

      setUserData((prev) => ({ ...prev, careers: prev.careers.filter((_, i) => i !== idx) }));
    } catch (e) {
      console.error('Failed to delete career', e);
      alert('경력 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (section: EditableSection, index: number) => {
    if (section === 'projects') {
      setEditModal({ section, index, data: { ...userData.projects[index] } });
      return;
    }
    if (section === 'activities') {
      setEditModal({ section, index, data: { ...userData.activities[index] } });
      return;
    }
    if (section === 'certificates') {
      setEditModal({ section, index, data: { ...userData.certificates[index] } });
      return;
    }
    setEditModal({ section: 'career', index, data: { ...userData.careers[index] } });
  };

  const updateEditModal = (patch: any) => {
    setEditModal((prev) => prev ? { ...prev, data: { ...prev.data, ...patch } } as EditModalState : prev);
  };

  const handleEditSave = async () => {
    if (!editModal) return;

    try {
      if (editModal.section === 'projects') {
        const target = editModal.data;
        await portfolioApi.modifyProject(Number(target.id), {
          name: target.projectName,
          type: target.isTeam,
          role: target.role,
          techStack: Array.isArray(target.techStack) ? target.techStack.join(', ') : target.techStack,
          description: target.description,
          githubLink: target.links?.github || '',
          demoLink: target.links?.demo || '',
          result: target.outcome,
          startDate: target.startDate,
          endDate: target.endDate,
        });
        setUserData((prev) => ({
          ...prev,
          projects: prev.projects.map((item, idx) => idx === editModal.index ? target : item),
        }));
        setEditModal(null);
        showSavedNotice('프로젝트 정보가 수정되었습니다.');
        return;
      }

      if (editModal.section === 'activities') {
        const target = editModal.data;
        await portfolioApi.modifyActivity(Number(target.id), {
          name: target.activityName,
          type: target.activityType,
          role: target.role,
          startMonth: target.startDate,
          endMonth: target.endDate,
          description: target.description,
          result: target.achievement,
        });
        setUserData((prev) => ({
          ...prev,
          activities: prev.activities.map((item, idx) => idx === editModal.index ? target : item),
        }));
        setEditModal(null);
        showSavedNotice('대외활동 정보가 수정되었습니다.');
        return;
      }

      if (editModal.section === 'certificates') {
        const target = editModal.data;
        await portfolioApi.modifyCertificate(Number(target.id), {
          name: target.name,
          type: target.type,
          issuer: target.issuer || '',
          issueDate: target.date,
          score: target.score,
          certificateNumber: target.certId || '',
        });
        setUserData((prev) => ({
          ...prev,
          certificates: prev.certificates.map((item, idx) => idx === editModal.index ? target : item),
        }));
        setEditModal(null);
        showSavedNotice('자격증/어학 정보가 수정되었습니다.');
        return;
      }

      const target = editModal.data;
      await portfolioApi.modifyCareer(Number(target.id), {
        type: target.type,
        company: target.companyName,
        position: target.position || target.department,
        startDate: target.startDate,
        endDate: target.endDate,
        description: target.description,
      });
      setUserData((prev) => ({
        ...prev,
        careers: prev.careers.map((item, idx) => idx === editModal.index ? target : item),
      }));
      setEditModal(null);
      showSavedNotice('경력 정보가 수정되었습니다.');
    } catch (e) {
      console.error('Failed to update item', e);
      alert('정보 수정 중 오류가 발생했습니다.');
    }
  };

  const handleRerunAnalysis = async () => {
    setIsRerunningAnalysis(true);
    try {
      if (onRerunAnalysis) {
        await onRerunAnalysis();
      } else {
        await analyticsApi.analyzePortfolio();
      }
    } catch (e) {
      console.error('Failed to rerun analysis', e);
      alert('AI 재진단 중 오류가 발생했습니다.');
    } finally {
      setIsRerunningAnalysis(false);
    }
  };


  const categories = [
    { id: 'preferences', label: '희망 기업/직무', icon: '🎯' },
    { id: 'education', label: '학력 정보', icon: '🎓' },
    { id: 'projects', label: '프로젝트', icon: '💻' },
    { id: 'activities', label: '대외활동', icon: '🤝' },
    { id: 'certificates', label: '자격증/어학', icon: '📜' },
    { id: 'career', label: '경력/인턴', icon: '💼' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'preferences':
        return (
          <div className="max-w-2xl mx-auto py-4 animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-cyan-100">
                🎯
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">희망 기업/직무</h3>
              <p className="text-gray-500 text-sm mt-1">재진단 기준이 되는 목표 기업 유형과 직무를 관리하세요.</p>
            </div>

            <div className="bg-white/50 p-8 rounded-3xl border border-white/60 shadow-sm space-y-8">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">희망 기업 유형</label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 shadow-sm"
                  value={userData.targetCompanyType}
                  onChange={(e) => {
                    const nextCompanyType = e.target.value;
                    const nextRoles = jobRoles[nextCompanyType] || [];
                    setUserData((prev) => ({
                      ...prev,
                      targetCompanyType: nextCompanyType,
                      targetJobRole: nextRoles.includes(prev.targetJobRole) ? prev.targetJobRole : '',
                    }));
                  }}
                >
                  <option value="">희망 기업 유형을 선택해주세요</option>
                  {companyTypes.map((companyType) => (
                    <option key={companyType} value={companyType}>{companyType}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">희망 직무</label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                  value={userData.targetJobRole}
                  onChange={(e) => handleChange('targetJobRole', e.target.value)}
                  disabled={!userData.targetCompanyType}
                >
                  <option value="">{userData.targetCompanyType ? '희망 직무를 선택해주세요' : '먼저 희망 기업 유형을 선택해주세요'}</option>
                  {(jobRoles[userData.targetCompanyType] || []).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-5 py-4">
                <p className="text-sm font-semibold text-cyan-900">이곳에서 바꾼 목표는 아래 `다시 진단 돌리기` 버튼과 바로 이어집니다.</p>
                <p className="text-sm text-cyan-700 mt-1">원하는 기업 유형과 직무를 먼저 맞춘 뒤 재진단하면 리포트 방향이 더 자연스럽게 바뀝니다.</p>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button variant="primary" onClick={handlePreferenceSave} className="w-full max-w-sm py-4 rounded-xl shadow-lg shadow-gray-200">저장하기</Button>
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="max-w-2xl mx-auto py-4 animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-blue-100">
                🎓
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">학력 정보</h3>
              <p className="text-gray-500 text-sm mt-1">재학 기간과 전공 정보를 관리하세요.</p>
            </div>

            <div className="bg-white/50 p-8 rounded-3xl border border-white/60 shadow-sm space-y-8">
              <div className="space-y-4">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">학교 및 전공</label>
                <Input placeholder="학교명 (예: 한국대학교)" value={userData.schoolName} onChange={(e) => handleChange('schoolName', e.target.value)} className="text-lg font-bold" />
                <Input placeholder="전공 (예: 컴퓨터공학과)" value={userData.major} onChange={(e) => handleChange('major', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">학위</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 shadow-sm" value={userData.degree} onChange={(e) => handleChange('degree', e.target.value)}>
                    <option value="bachelor">학사</option>
                    <option value="associate">전문학사</option>
                    <option value="master">석사</option>
                    <option value="doctor">박사</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">상태</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 shadow-sm" value={userData.academicStatus} onChange={(e) => handleChange('academicStatus', e.target.value)}>
                    <option value="attending">재학 중</option>
                    <option value="graduated">졸업</option>
                    <option value="leave">휴학</option>
                    <option value="pending">졸업 예정</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MonthYearPicker label="입학년월" value={userData.startDate} onChange={(value) => handleChange('startDate', value)} placeholder="YYYY.MM" />
                <MonthYearPicker label="졸업년월" value={userData.endDate} onChange={(value) => handleChange('endDate', value)} placeholder="YYYY.MM" />
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 mb-2 block text-center">전체 평점 (GPA)</label>
                <div className="flex items-center justify-center gap-3">
                  <input type="number" step="0.01" value={userData.gpa} onChange={(e) => handleChange('gpa', e.target.value)} className="w-24 text-center bg-white border border-gray-200 rounded-lg py-2 font-bold text-gray-900 text-xl focus:border-cyan-500 outline-none" placeholder="0.0" />
                  <span className="text-2xl text-gray-300">/</span>
                  <input type="number" step="0.1" value={userData.maxGpa} onChange={(e) => handleChange('maxGpa', e.target.value)} className="w-24 text-center bg-white border border-gray-200 rounded-lg py-2 font-bold text-gray-900 text-xl focus:border-cyan-500 outline-none" placeholder="4.5" />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button variant="primary" onClick={handleManualSave} className="w-full max-w-sm py-4 rounded-xl shadow-lg shadow-gray-200">저장하기</Button>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="max-w-3xl mx-auto py-4 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  💻 프로젝트
                  <span className="bg-cyan-100 text-cyan-700 text-xs px-2 py-1 rounded-full">{userData.projects?.length || 0}</span>
                </h3>
                <p className="text-gray-500 text-sm mt-1">주요 프로젝트 경험을 상세히 기록하세요.</p>
              </div>
              <Button
                variant="secondary"
                className="px-4 py-2 text-sm bg-white hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-all shadow-sm"
                onClick={() => setAddingMode('projects')}
              >
                + 프로젝트 추가
              </Button>
            </div>

            <div className="space-y-6">
              {userData.projects && userData.projects.length > 0 ? (
                userData.projects.map((proj, idx) => (
                  <div key={idx} className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg text-gray-800 group-hover:text-cyan-700 transition-colors">{proj.projectName || '프로젝트명 없음'}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">{proj.role}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" onClick={() => openEditModal('projects', idx)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDeleteProject(idx)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(Array.isArray(proj.techStack) ? proj.techStack : (proj.techStack ? String(proj.techStack).split(',').map(s => s.trim()) : [])).map((stack, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md bg-cyan-50 text-cyan-700 font-medium border border-cyan-100">{stack}</span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300">
                  <span className="text-4xl block mb-2">💾</span>
                  <p className="text-gray-400 font-medium">등록된 프로젝트가 없습니다.</p>
                  <button onClick={() => setAddingMode('projects')} className="mt-4 text-cyan-600 font-bold hover:underline text-sm">프로젝트 추가하기</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="max-w-3xl mx-auto py-4 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  🤝 대외활동
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{userData.activities?.length || 0}</span>
                </h3>
                <p className="text-gray-500 text-sm mt-1">동아리, 봉사활동 등 다양한 경험을 기록하세요.</p>
              </div>
              <Button
                variant="secondary"
                className="px-4 py-2 text-sm bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"
                onClick={() => setAddingMode('activities')}
              >
                + 활동 추가
              </Button>
            </div>

            <div className="space-y-6">
              {userData.activities && userData.activities.length > 0 ? (
                userData.activities.map((act, idx) => (
                  <div key={idx} className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 group-hover:text-purple-700 transition-colors">{act.activityName || '활동명 없음'}</h4>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block">{act.role}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" onClick={() => openEditModal('activities', idx)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDeleteActivity(idx)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed border-t border-gray-50 pt-3">{act.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300">
                  <span className="text-4xl block mb-2">🌱</span>
                  <p className="text-gray-400 font-medium">등록된 대외활동이 없습니다.</p>
                  <button onClick={() => setAddingMode('activities')} className="mt-4 text-purple-600 font-bold hover:underline text-sm">활동 추가하기</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'certificates':
        return (
          <div className="max-w-3xl mx-auto py-4 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  📜 자격증/어학
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{userData.certificates?.length || 0}</span>
                </h3>
                <p className="text-gray-500 text-sm mt-1">취득한 자격증과 어학 점수를 관리하세요.</p>
              </div>
              <Button
                variant="secondary"
                className="px-4 py-2 text-sm bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all shadow-sm"
                onClick={() => setAddingMode('certificates')}
              >
                + 자격증 추가
              </Button>
            </div>

            <div className="space-y-4">
              {userData.certificates && userData.certificates.length > 0 ? (
                userData.certificates.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-orange-300 transition-all hover:translate-x-1 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${idx % 2 === 0 ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                        {idx % 2 === 0 ? '📄' : '🗣️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{cert.name}</h4>
                        <div className="flex items-center gap-2 text-sm mt-0.5">
                          <span className="font-bold text-gray-900">{cert.score}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-gray-500">{cert.date} 취득</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-300 hover:text-cyan-600 transition-colors" onClick={() => openEditModal('certificates', idx)}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button className="p-2 text-gray-300 hover:text-red-500 transition-colors" onClick={() => handleDeleteCertificate(idx)}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300">
                  <span className="text-4xl block mb-2">🎫</span>
                  <p className="text-gray-400 font-medium">등록된 자격증이 없습니다.</p>
                  <button onClick={() => setAddingMode('certificates')} className="mt-4 text-orange-600 font-bold hover:underline text-sm">자격증 추가하기</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'career':
        return (
          <div className="max-w-3xl mx-auto py-4 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  💼 경력/인턴
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{userData.careers?.length || 0}</span>
                </h3>
                <p className="text-gray-500 text-sm mt-1">인턴, 정규직 등 실무 경험을 정리하세요.</p>
              </div>
              <Button
                variant="secondary"
                className="px-4 py-2 text-sm bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all shadow-sm"
                onClick={() => setAddingMode('career')}
              >
                + 경력 추가
              </Button>
            </div>

            <div className="space-y-6">
              {userData.careers && userData.careers.length > 0 ? (
                userData.careers.map((career, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center pt-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100"></div>
                      <div className="w-0.5 flex-1 bg-gray-200 my-2 group-last:hidden"></div>
                    </div>

                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-lg hover:shadow-green-500/5 transition-all mb-4 relative">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button className="text-xs text-gray-400 hover:text-green-600" onClick={() => openEditModal('career', idx)}>수정</button>
                        <button className="text-xs text-gray-400 hover:text-red-500" onClick={() => handleDeleteCareer(idx)}>삭제</button>
                      </div>

                      <div className="mb-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{career.startDate} ~ {career.endDate}</span>
                      </div>
                      <h4 className="font-bold text-xl text-gray-900 mb-0.5">{career.companyName}</h4>
                      <p className="text-sm font-bold text-green-700 mb-3">{career.position}</p>

                      {/* Placeholder for description if needed, currently hidden in list view for cleaner look, or can be added */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300">
                  <span className="text-4xl block mb-2">🏢</span>
                  <p className="text-gray-400 font-medium">등록된 경력이 없습니다.</p>
                  <button onClick={() => setAddingMode('career')} className="mt-4 text-green-600 font-bold hover:underline text-sm">경력 추가하기</button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full pb-32 relative">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">내 정보 관리</h2>
        <p className="text-gray-500 text-lg">저장된 스펙 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      {isLoading && (
        <div className="max-w-3xl mx-auto px-6 pb-8">
          <GlassCard className="p-6 text-center text-gray-500 font-bold">
            DB에서 저장된 정보를 불러오는 중입니다...
          </GlassCard>
        </div>
      )}

      {saveNotice && (
        <div className="max-w-3xl mx-auto px-6 pb-6">
          <GlassCard className="p-4 text-center text-sm font-bold text-emerald-700 border border-emerald-100 bg-emerald-50/80">
            {saveNotice}
          </GlassCard>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditModal(null)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <GlassCard className="p-8 border border-white/60 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900">정보 수정</h3>
                <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {editModal.section === 'projects' && (
                <div className="space-y-5">
                  <Input label="프로젝트명" value={editModal.data.projectName} onChange={(e) => updateEditModal({ projectName: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">프로젝트 유형</label>
                      <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.isTeam} onChange={(e) => updateEditModal({ isTeam: e.target.value })}>
                        <option value="individual">개인 프로젝트</option>
                        <option value="team">팀 프로젝트</option>
                      </select>
                    </div>
                    <Input label="역할" value={editModal.data.role} onChange={(e) => updateEditModal({ role: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <MonthYearPicker label="시작일" value={editModal.data.startDate} onChange={(value) => updateEditModal({ startDate: value })} placeholder="YYYY.MM" />
                    <MonthYearPicker label="종료일" value={editModal.data.endDate} onChange={(value) => updateEditModal({ endDate: value })} placeholder="YYYY.MM" />
                  </div>
                  <Input label="기술 스택" value={Array.isArray(editModal.data.techStack) ? editModal.data.techStack.join(', ') : ''} onChange={(e) => updateEditModal({ techStack: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="React, TypeScript, Spring" />
                  <Input label="GitHub 링크" value={editModal.data.links?.github || ''} onChange={(e) => updateEditModal({ links: { ...editModal.data.links, github: e.target.value } })} />
                  <Input label="데모 링크" value={editModal.data.links?.demo || ''} onChange={(e) => updateEditModal({ links: { ...editModal.data.links, demo: e.target.value } })} />
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">설명</label>
                    <textarea className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.description} onChange={(e) => updateEditModal({ description: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">성과</label>
                    <textarea className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.outcome} onChange={(e) => updateEditModal({ outcome: e.target.value })} />
                  </div>
                </div>
              )}

              {editModal.section === 'activities' && (
                <div className="space-y-5">
                  <Input label="활동명" value={editModal.data.activityName} onChange={(e) => updateEditModal({ activityName: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">활동 유형</label>
                      <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.activityType} onChange={(e) => updateEditModal({ activityType: e.target.value })}>
                        <option value="club">동아리/학회</option>
                        <option value="contest">해커톤/공모전</option>
                        <option value="education">교육/부트캠프</option>
                        <option value="volunteer">서포터즈/봉사</option>
                        <option value="other">기타</option>
                      </select>
                    </div>
                    <Input label="역할" value={editModal.data.role} onChange={(e) => updateEditModal({ role: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <MonthYearPicker label="시작일" value={editModal.data.startDate} onChange={(value) => updateEditModal({ startDate: value })} placeholder="YYYY.MM" />
                    <MonthYearPicker label="종료일" value={editModal.data.endDate} onChange={(value) => updateEditModal({ endDate: value })} placeholder="YYYY.MM" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">설명</label>
                    <textarea className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.description} onChange={(e) => updateEditModal({ description: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">성과</label>
                    <textarea className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.achievement} onChange={(e) => updateEditModal({ achievement: e.target.value })} />
                  </div>
                </div>
              )}

              {editModal.section === 'certificates' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">유형</label>
                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.type} onChange={(e) => updateEditModal({ type: e.target.value })}>
                      <option value="language">어학 자격증</option>
                      <option value="general">일반 자격증</option>
                    </select>
                  </div>
                  <Input label="명칭" value={editModal.data.name} onChange={(e) => updateEditModal({ name: e.target.value })} />
                  <Input label="발급 기관" value={editModal.data.issuer || ''} onChange={(e) => updateEditModal({ issuer: e.target.value })} />
                  <DatePicker label="취득일" value={editModal.data.date} onChange={(value) => updateEditModal({ date: value })} placeholder="YYYY.MM.DD" />
                  <Input label="점수/등급" value={editModal.data.score} onChange={(e) => updateEditModal({ score: e.target.value })} />
                  <Input label="자격증 번호" value={editModal.data.certId || ''} onChange={(e) => updateEditModal({ certId: e.target.value })} />
                </div>
              )}

              {editModal.section === 'career' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">경력 유형</label>
                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.type} onChange={(e) => updateEditModal({ type: e.target.value })}>
                      <option value="intern">인턴십</option>
                      <option value="career">정규직/계약직 경력</option>
                    </select>
                  </div>
                  <Input label="회사명" value={editModal.data.companyName} onChange={(e) => updateEditModal({ companyName: e.target.value })} />
                  <Input label="부서/직무" value={editModal.data.department} onChange={(e) => updateEditModal({ department: e.target.value })} />
                  <Input label="직급/직책" value={editModal.data.position || ''} onChange={(e) => updateEditModal({ position: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <MonthYearPicker label="입사 년월" value={editModal.data.startDate} onChange={(value) => updateEditModal({ startDate: value })} placeholder="YYYY.MM" />
                    <MonthYearPicker label="퇴사 년월" value={editModal.data.endDate} onChange={(value) => updateEditModal({ endDate: value })} placeholder="YYYY.MM" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">설명</label>
                    <textarea className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl px-4 py-3" value={editModal.data.description} onChange={(e) => updateEditModal({ description: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setEditModal(null)} className="px-5 py-3 text-sm font-bold">취소</Button>
                <Button variant="primary" onClick={handleEditSave} className="px-5 py-3 text-sm font-bold">저장</Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[16rem_1fr] xl:grid-cols-[1fr_800px_1fr] gap-8 relative items-start">

        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block sticky top-32 z-30 xl:col-start-1 xl:justify-self-end w-64 xl:pr-8">
          <GlassCard className="p-4 border border-white/60 shadow-lg shadow-gray-200/50">
            <nav className="flex flex-col space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveTab(cat.id); setAddingMode(null); }}
                  className={`flex items-center gap-3 px-4 h-12 w-full rounded-xl transition-all duration-200 text-left ${activeTab === cat.id
                    ? 'bg-cyan-50 text-cyan-700 font-bold shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </nav>
          </GlassCard>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden sticky top-[70px] z-40 w-full col-span-1">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg rounded-2xl p-2 mx-auto">
            <div className="flex overflow-x-auto no-scrollbar gap-2 px-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveTab(cat.id); setAddingMode(null); }}
                  className={`flex items-center justify-center px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${activeTab === cat.id ? 'bg-cyan-500 text-white shadow-md' : 'bg-gray-50 text-gray-500'
                    }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full xl:col-start-2 min-w-0">
          {addingMode && addStatus ? (
            <GlassCard className="p-8 md:p-12 border border-white/60 min-h-[500px] shadow-xl shadow-gray-200/40 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className={`w-16 h-16 rounded-full mb-6 flex items-center justify-center text-2xl ${addStatus.kind === 'saving' ? 'border-4 border-cyan-500 border-t-transparent animate-spin' : 'bg-emerald-100 text-emerald-600'}`}>
                {addStatus.kind === 'done' ? '✓' : ''}
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
                {addStatus.kind === 'saving' ? '저장 중입니다' : '저장이 완료되었습니다'}
              </h3>
              <p className="text-gray-500 text-base leading-relaxed">{addStatus.message}</p>
            </GlassCard>
          ) : addingMode ? (
            <div className="animate-fade-in-up">
              {addingMode === 'projects' && <ProjectFlow onComplete={handleProjectAdd} onBack={() => setAddingMode(null)} />}
              {addingMode === 'activities' && <ActivityFlow onComplete={handleActivityAdd} onBack={() => setAddingMode(null)} />}
              {addingMode === 'certificates' && <CertificateFlow onComplete={handleCertAdd} onBack={() => setAddingMode(null)} />}
              {addingMode === 'career' && <CareerFlow onComplete={handleCareerAdd} onBack={() => setAddingMode(null)} />}
            </div>
          ) : (
            <div className="space-y-6">
              <GlassCard className="p-8 md:p-12 border border-white/60 min-h-[500px] shadow-xl shadow-gray-200/40">
                {renderContent()}
              </GlassCard>
              <GlassCard className="p-6 border border-white/60 shadow-lg shadow-gray-200/30">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">정보 수정 후 다시 진단</h3>
                    <p className="text-sm text-gray-500 mt-1">최신 정보 기준으로 AI 커리어 분석 리포트를 다시 생성합니다.</p>
                  </div>
                  <Button
                    variant="neon"
                    onClick={handleRerunAnalysis}
                    className="px-6 py-3 text-sm font-bold"
                    disabled={isRerunningAnalysis}
                  >
                    {isRerunningAnalysis ? '재진단 중...' : '다시 진단 돌리기'}
                  </Button>
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        <div className="hidden xl:block col-start-3"></div>

      </div>
    </div>
  );
};
