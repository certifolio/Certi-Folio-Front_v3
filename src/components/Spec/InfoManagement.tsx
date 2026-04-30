import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { portfolioApi, userApi } from '../../api/userApi';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';

// Import Flow Components
import { ProjectFlow, ProjectData } from './ProjectFlow';
import { ActivityFlow, ActivityData } from './ActivityFlow';
import { CertificateFlow, CertificateData } from './CertificateFlow';
import { CareerFlow, CareerData } from './CareerFlow';

// Interfaces (matching SpecFlowTest data structure)
interface FullUserData {
  name: string;
  birthYear: string;
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
  solvedAcId: string;
}

const LOCAL_STORAGE_KEY = 'neon_spec_flow_data';

export const InfoManagement: React.FC = () => {
  const { userProfile } = useAuth();
  // Set default active tab to 'education' since 'basic' is removed
  const [activeTab, setActiveTab] = useState('education');

  // State to track if we are in "Adding Mode" and which type
  const [addingMode, setAddingMode] = useState<'projects' | 'activities' | 'certificates' | 'career' | null>(null);

  const [userData, setUserData] = useState<FullUserData>({
    name: userProfile?.name || '', birthYear: '',
    academicStatus: '', schoolName: '', major: '', degree: '', startDate: '', endDate: '', gpa: '', maxGpa: '',
    projects: [], activities: [], certificates: [], careers: [], solvedAcId: ''
  });

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch {
        // 파싱 실패 시 초기값 유지
      }
    }
  }, []);

  // Helper to save data to local storage instantly
  const saveToStorage = (newData: FullUserData) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    setUserData(newData);
  };

  // Manual Save Button Handler (for text inputs in Education/Etc)
  const handleManualSave = async () => {
    saveToStorage(userData);

    // Sync to Backend
    if (userData.name) {
      try {
        await userApi.saveOnboarding({
          name: userData.name,
          birthYear: parseInt(userData.birthYear) || 2000,
          companyType: '',
          jobRole: '',
        });
      } catch (e) {
        console.error("Failed to sync user info", e);
      }
    }

    alert('정보가 수정되었습니다.');
  };

  const handleChange = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  // Flow Completion Handlers
  const handleProjectAdd = (newProject: ProjectData) => {
    const updated = { ...userData, projects: [...userData.projects, newProject] };
    saveToStorage(updated);
    setAddingMode(null);
  };

  const handleActivityAdd = (newActivity: ActivityData) => {
    const updated = { ...userData, activities: [...userData.activities, newActivity] };
    saveToStorage(updated);
    setAddingMode(null);
  };

  const handleCertAdd = (newCert: CertificateData) => {
    const updated = { ...userData, certificates: [...userData.certificates, newCert] };
    saveToStorage(updated);
    setAddingMode(null);
  };

  const handleCareerAdd = (newCareer: CareerData) => {
    const updated = { ...userData, careers: [...userData.careers, newCareer] };
    saveToStorage(updated);
    setAddingMode(null);
  };


  const categories = [
    { id: 'education', label: '학력 정보', icon: '🎓' },
    { id: 'projects', label: '프로젝트', icon: '💻' },
    { id: 'activities', label: '대외활동', icon: '🤝' },
    { id: 'certificates', label: '자격증/어학', icon: '📜' },
    { id: 'career', label: '경력/인턴', icon: '💼' },
    { id: 'etc', label: '기타/설정', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
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
                <Input label="입학년월" placeholder="YYYY.MM" value={userData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="text-center" />
                <Input label="졸업년월" placeholder="YYYY.MM" value={userData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className="text-center" />
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
                        <button className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => {
                          const newProjects = userData.projects.filter((_, i) => i !== idx);
                          handleChange('projects', newProjects);
                          handleManualSave();
                        }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
                        <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => {
                          const newActs = userData.activities.filter((_, i) => i !== idx);
                          handleChange('activities', newActs);
                          handleManualSave();
                        }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
                      <button className="p-2 text-gray-300 hover:text-red-500 transition-colors" onClick={() => {
                        const newCerts = userData.certificates.filter((_, i) => i !== idx);
                        handleChange('certificates', newCerts);
                        handleManualSave();
                      }}>
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
                        <button className="text-xs text-gray-400 hover:text-green-600">수정</button>
                        <button className="text-xs text-gray-400 hover:text-red-500" onClick={() => {
                          const newCar = userData.careers.filter((_, i) => i !== idx);
                          handleChange('careers', newCar);
                          handleManualSave();
                        }}>삭제</button>
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

      case 'etc':
        return (
          <div className="max-w-xl mx-auto py-4 animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-gray-200">
                ⚙️
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">기타 설정</h3>
              <p className="text-gray-500 text-sm mt-1">외부 서비스 연동 및 계정 설정을 관리합니다.</p>
            </div>

            <div className="bg-white/60 p-8 rounded-3xl border border-white/60 shadow-sm space-y-8">
              <div className="bg-gradient-to-br from-[#2dce89]/10 to-[#2dce89]/5 p-6 rounded-2xl border border-[#2dce89]/20 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <img src="https://static.solved.ac/logo.svg" alt="solved.ac" className="w-8 h-8 opacity-80" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <h4 className="font-bold text-gray-800 text-lg">Solved.ac 연동</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    백준(BOJ) 계정을 연동하면 알고리즘 문제 해결 역량을<br />
                    AI가 자동으로 분석하여 포트폴리오에 반영합니다.
                  </p>
                  <Input
                    label="백준 아이디"
                    placeholder="아이디 입력 (예: neon_dev)"
                    value={userData.solvedAcId}
                    onChange={(e) => handleChange('solvedAcId', e.target.value)}
                    className="bg-white/80"
                  />
                </div>
                {/* Decorative circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2dce89] rounded-full opacity-10 blur-2xl"></div>
              </div>

              <div className="pt-4">
                <Button variant="primary" onClick={handleManualSave} className="w-full py-4 text-lg font-bold shadow-lg shadow-gray-200">설정 저장하기</Button>
              </div>
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
          {addingMode ? (
            <div className="animate-fade-in-up">
              {addingMode === 'projects' && <ProjectFlow onComplete={handleProjectAdd} onBack={() => setAddingMode(null)} />}
              {addingMode === 'activities' && <ActivityFlow onComplete={handleActivityAdd} onBack={() => setAddingMode(null)} />}
              {addingMode === 'certificates' && <CertificateFlow onComplete={handleCertAdd} onBack={() => setAddingMode(null)} />}
              {addingMode === 'career' && <CareerFlow onComplete={handleCareerAdd} onBack={() => setAddingMode(null)} />}
            </div>
          ) : (
            <GlassCard className="p-8 md:p-12 border border-white/60 min-h-[500px] shadow-xl shadow-gray-200/40">
              {renderContent()}
            </GlassCard>
          )}
        </div>

        <div className="hidden xl:block col-start-3"></div>

      </div>
    </div>
  );
};