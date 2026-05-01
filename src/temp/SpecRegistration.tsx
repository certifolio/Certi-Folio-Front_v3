import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { DatePicker } from '../UI/DatePicker'; // Import DatePicker

// Internal Component: Month/Year Picker (Reused)
interface MonthYearPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ label, value, onChange, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [y] = value.split('.');
      if (y) setYear(parseInt(y));
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value]);

  const handleMonthSelect = (month: number) => {
    const monthStr = month.toString().padStart(2, '0');
    onChange(`${year}.${monthStr}`);
    setIsOpen(false);
  };

  const handleYearChange = (delta: number) => {
    setYear(prev => prev + delta);
  };

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={pickerRef}>
      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <input
          readOnly
          value={value}
          placeholder={placeholder}
          className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm cursor-pointer ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
              : 'border-gray-200 focus:border-cyan-500 focus:ring-cyan-500/10'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs ml-1">{error}</p>}

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in-up">
           <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <button onClick={(e) => { e.stopPropagation(); handleYearChange(-1); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="font-bold text-gray-800 text-lg">{year}년</span>
              <button onClick={(e) => { e.stopPropagation(); handleYearChange(1); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
           </div>
           <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <button key={m} onClick={(e) => { e.stopPropagation(); handleMonthSelect(m); }} className={`py-2 rounded-lg text-sm font-medium transition-colors ${value === `${year}.${m.toString().padStart(2, '0')}` ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'bg-gray-50 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600'}`}>
                  {m}월
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export const SpecRegistration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('education');
  const isClickingRef = useRef(false);

  // --- STATE DEFINITIONS ---
  
  // 1. Education State
  const [eduData, setEduData] = useState({
    schoolName: '', major: '', degree: 'bachelor', status: 'graduated',
    startDate: '', endDate: '', gpa: '', maxGpa: ''
  });

  // 2. Project State
  const [projectData, setProjectData] = useState({
    projectName: '', isTeam: 'individual', startDate: '', endDate: '',
    role: '', techStack: [] as string[], description: '',
    links: { github: '', demo: '' }, outcome: ''
  });
  const [techStackInput, setTechStackInput] = useState('');

  // 3. Activity State
  const [activityData, setActivityData] = useState({
    activityName: '', activityType: 'club', role: '',
    startDate: '', endDate: '', description: '', achievement: ''
  });

  // 4. Certificate State
  const [certData, setCertData] = useState({
    type: 'language', name: '', issuer: '',
    date: '', score: '', certId: ''
  });

  // 5. Career State
  const [careerData, setCareerData] = useState({
    type: 'intern', companyName: '', department: '', position: '',
    startDate: '', endDate: '', description: ''
  });

  // 6. Etc (Solved.ac) State
  const [solvedAcId, setSolvedAcId] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    { id: 'education', label: '대학교/학력', icon: '🎓' },
    { id: 'projects', label: '프로젝트', icon: '💻' },
    { id: 'activities', label: '대외활동', icon: '🤝' },
    { id: 'certificates', label: '자격증/어학', icon: '📜' },
    { id: 'career', label: '경력/인턴', icon: '💼' },
    { id: 'etc', label: '기타', description: 'GitHub, 프로그래머스 등 코딩 역량 연동', icon: '⚙️' },
  ];

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      if (isClickingRef.current) return;
      const triggerLine = 150; 
      let newActiveTab = activeTab;

      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        setActiveTab(categories[categories.length - 1].id);
        return;
      }

      categories.forEach((cat) => {
        const el = document.getElementById(cat.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerLine && rect.bottom > triggerLine) {
             newActiveTab = cat.id;
          }
        }
      });

      if (newActiveTab !== activeTab) {
        setActiveTab(newActiveTab);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, activeTab]);

  const scrollToSection = (id: string) => {
    isClickingRef.current = true;
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 140; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setTimeout(() => { isClickingRef.current = false; }, 1000);
    }
  };

  // --- HANDLERS ---
  const handleEduChange = (field: string, value: string) => setEduData(prev => ({ ...prev, [field]: value }));
  const handleProjectChange = (field: string, value: any) => setProjectData(prev => ({ ...prev, [field]: value }));
  const handleActivityChange = (field: string, value: string) => setActivityData(prev => ({ ...prev, [field]: value }));
  const handleCertChange = (field: string, value: string) => setCertData(prev => ({ ...prev, [field]: value }));
  const handleCareerChange = (field: string, value: string) => setCareerData(prev => ({ ...prev, [field]: value }));

  // Tech Stack Tag Logic
  const addTag = () => {
    if (techStackInput.trim() && !projectData.techStack.includes(techStackInput.trim())) {
      setProjectData(prev => ({ ...prev, techStack: [...prev.techStack, techStackInput.trim()] }));
      setTechStackInput('');
    }
  };
  const removeTag = (tag: string) => {
    setProjectData(prev => ({ ...prev, techStack: prev.techStack.filter(t => t !== tag) }));
  };

  const handleSave = () => {
    alert('모든 스펙 정보가 저장되었습니다! (데모)');
  };

  // --- CONTENT RENDERING ---
  const renderContent = (catId: string) => {
    switch (catId) {
      case 'education':
        return (
          <div className="space-y-8 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <Input label="학교명" placeholder="대학교 이름을 입력하세요" value={eduData.schoolName} onChange={(e) => handleEduChange('schoolName', e.target.value)} />
                </div>
                <div>
                  <Input label="전공" placeholder="주전공을 입력하세요" value={eduData.major} onChange={(e) => handleEduChange('major', e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">학위</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all shadow-sm appearance-none" value={eduData.degree} onChange={(e) => handleEduChange('degree', e.target.value)}>
                      <option value="bachelor">학사</option>
                      <option value="associate">전문학사</option>
                      <option value="master">석사</option>
                      <option value="doctor">박사</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full col-span-1 md:col-span-2">
                  <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">재학상태</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all shadow-sm appearance-none" value={eduData.status} onChange={(e) => handleEduChange('status', e.target.value)}>
                      <option value="graduated">졸업</option>
                      <option value="attending">재학 중</option>
                      <option value="leave">휴학</option>
                      <option value="pending">졸업 예정</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                  </div>
                </div>
                <MonthYearPicker label="입학일" value={eduData.startDate} onChange={(val) => handleEduChange('startDate', val)} placeholder="입학 년월 선택" />
                <MonthYearPicker label="졸업(예정)일" value={eduData.endDate} onChange={(val) => handleEduChange('endDate', val)} placeholder="졸업 년월 선택" />
                <div className="col-span-1 md:col-span-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1 block mb-2">학점</label>
                   <div className="flex gap-4 items-start">
                      <div className="flex-1"><Input type="number" placeholder="취득 학점 (예: 4.2)" step="0.01" value={eduData.gpa} onChange={(e) => handleEduChange('gpa', e.target.value)} className="mt-0 remove-spinner" /></div>
                      <span className="text-gray-400 font-bold text-xl mt-3">/</span>
                      <div className="flex-1 relative"><Input type="number" placeholder="만점 (예: 4.5)" step="0.1" value={eduData.maxGpa} onChange={(e) => handleEduChange('maxGpa', e.target.value)} className="mt-0 remove-spinner" /></div>
                   </div>
                </div>
             </div>
             <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="secondary" className="px-8" onClick={() => alert('학력 정보 임시 저장')}>학력 추가하기</Button>
             </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-8 animate-fade-in-up">
             <div className="grid grid-cols-1 gap-6">
                <Input label="프로젝트 명" placeholder="예: Certi-Folio 커리어 플랫폼" value={projectData.projectName} onChange={(e) => handleProjectChange('projectName', e.target.value)} />
                <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">팀/개인 구분</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${projectData.isTeam === 'individual' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                         <input type="radio" name="isTeam" className="hidden" checked={projectData.isTeam === 'individual'} onChange={() => handleProjectChange('isTeam', 'individual')} />
                         <span className="flex items-center justify-center gap-2 font-bold">👤 개인 프로젝트</span>
                      </label>
                      <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${projectData.isTeam === 'team' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                         <input type="radio" name="isTeam" className="hidden" checked={projectData.isTeam === 'team'} onChange={() => handleProjectChange('isTeam', 'team')} />
                         <span className="flex items-center justify-center gap-2 font-bold">👥 팀 프로젝트</span>
                      </label>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <MonthYearPicker label="시작일" value={projectData.startDate} onChange={(val) => handleProjectChange('startDate', val)} placeholder="시작 년월" />
                   <MonthYearPicker label="종료일" value={projectData.endDate} onChange={(val) => handleProjectChange('endDate', val)} placeholder="종료 년월" />
                </div>
                <Input label="역할" placeholder="예: 프론트엔드 리드, 백엔드 개발" value={projectData.role} onChange={(e) => handleProjectChange('role', e.target.value)} />
                
                {/* Tech Stack Input */}
                <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">사용 기술 스택</label>
                   <div className="relative">
                      <input type="text" value={techStackInput} onChange={(e) => setTechStackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} placeholder="예: React, TypeScript (Enter로 추가)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all pr-16" />
                      <button onClick={addTag} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-cyan-100 hover:text-cyan-700">추가</button>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-2">
                      {projectData.techStack.map(tag => (
                         <span key={tag} className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-bold border border-cyan-100 flex items-center gap-1">
                            {tag} <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                         </span>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">프로젝트 소개</label>
                   <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all h-24 resize-none" placeholder="프로젝트의 기획 의도와 주요 기능을 설명해주세요." value={projectData.description} onChange={(e) => handleProjectChange('description', e.target.value)} />
                </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">성과 및 결과</label>
                   <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all h-24 resize-none" placeholder="정량적 수치나 배운 점을 중심으로 작성해주세요." value={projectData.outcome} onChange={(e) => handleProjectChange('outcome', e.target.value)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="GitHub 링크 (선택)" placeholder="https://github.com/..." value={projectData.links.github} onChange={(e) => setProjectData(prev => ({...prev, links: {...prev.links, github: e.target.value}}))} />
                    <Input label="배포/데모 링크 (선택)" placeholder="https://..." value={projectData.links.demo} onChange={(e) => setProjectData(prev => ({...prev, links: {...prev.links, demo: e.target.value}}))} />
                </div>
             </div>
             <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="secondary" className="px-8" onClick={() => alert('프로젝트 임시 저장')}>프로젝트 추가하기</Button>
             </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 gap-6">
               <Input label="활동명" placeholder="예: 멋쟁이사자처럼 11기" value={activityData.activityName} onChange={(e) => handleActivityChange('activityName', e.target.value)} />
               <div className="flex flex-col gap-2">
                  <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">활동 유형</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500 transition-all appearance-none" value={activityData.activityType} onChange={(e) => handleActivityChange('activityType', e.target.value)}>
                       <option value="club">동아리/학회</option>
                       <option value="contest">해커톤/공모전</option>
                       <option value="education">교육/부트캠프</option>
                       <option value="volunteer">서포터즈/봉사</option>
                       <option value="other">기타</option>
                    </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                  </div>
               </div>
               <Input label="역할" placeholder="예: 기획 팀장, 총무" value={activityData.role} onChange={(e) => handleActivityChange('role', e.target.value)} />
               <div className="grid grid-cols-2 gap-4">
                   <MonthYearPicker label="시작일" value={activityData.startDate} onChange={(val) => handleActivityChange('startDate', val)} placeholder="시작 년월" />
                   <MonthYearPicker label="종료일" value={activityData.endDate} onChange={(val) => handleActivityChange('endDate', val)} placeholder="종료 년월" />
               </div>
               <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">활동 내용</label>
                   <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all h-24 resize-none" placeholder="어떤 활동을 했고, 무엇을 배웠나요?" value={activityData.description} onChange={(e) => handleActivityChange('description', e.target.value)} />
               </div>
               <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">수상 및 성과 (선택)</label>
                   <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all h-20 resize-none" placeholder="수상 내역이 있다면 입력해주세요." value={activityData.achievement} onChange={(e) => handleActivityChange('achievement', e.target.value)} />
               </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="secondary" className="px-8" onClick={() => alert('대외활동 임시 저장')}>활동 추가하기</Button>
             </div>
          </div>
        );

      case 'certificates':
        return (
          <div className="space-y-8 animate-fade-in-up">
             <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">자격증 종류</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${certData.type === 'language' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                         <input type="radio" name="certType" className="hidden" checked={certData.type === 'language'} onChange={() => handleCertChange('type', 'language')} />
                         <span className="flex items-center justify-center gap-2 font-bold">🗣️ 어학 자격증</span>
                      </label>
                      <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${certData.type === 'general' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                         <input type="radio" name="certType" className="hidden" checked={certData.type === 'general'} onChange={() => handleCertChange('type', 'general')} />
                         <span className="flex items-center justify-center gap-2 font-bold">📜 일반 자격증</span>
                      </label>
                   </div>
                </div>
                <Input label={certData.type === 'language' ? "시험명" : "자격증 명칭"} placeholder={certData.type === 'language' ? "예: TOEIC, OPIc" : "예: 정보처리기사"} value={certData.name} onChange={(e) => handleCertChange('name', e.target.value)} />
                {certData.type === 'general' && (
                   <Input label="발급 기관" placeholder="예: 한국산업인력공단" value={certData.issuer} onChange={(e) => handleCertChange('issuer', e.target.value)} />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DatePicker label="취득일" value={certData.date} onChange={(val) => handleCertChange('date', val)} placeholder="YYYY.MM.DD" />
                    <Input label="점수 / 등급" placeholder="예: 900점, IH, 1급" value={certData.score} onChange={(e) => handleCertChange('score', e.target.value)} />
                </div>
                 <Input label="자격증 번호 (선택)" placeholder="자격증 번호 입력" value={certData.certId} onChange={(e) => handleCertChange('certId', e.target.value)} />
             </div>
             <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="secondary" className="px-8" onClick={() => alert('자격증 임시 저장')}>자격증 추가하기</Button>
             </div>
          </div>
        );

      case 'career':
        return (
          <div className="space-y-8 animate-fade-in-up">
             <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">경력 형태</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${careerData.type === 'intern' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                         <input type="radio" name="careerType" className="hidden" checked={careerData.type === 'intern'} onChange={() => handleCareerChange('type', 'intern')} />
                         <span className="flex items-center justify-center gap-2 font-bold">🌱 인턴십</span>
                      </label>
                      <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${careerData.type === 'career' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                         <input type="radio" name="careerType" className="hidden" checked={careerData.type === 'career'} onChange={() => handleCareerChange('type', 'career')} />
                         <span className="flex items-center justify-center gap-2 font-bold">💼 정규/계약직</span>
                      </label>
                   </div>
                </div>
                <Input label="회사명" placeholder="예: 네온테크, 삼성전자" value={careerData.companyName} onChange={(e) => handleCareerChange('companyName', e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="부서/직무" placeholder="예: 마케팅팀" value={careerData.department} onChange={(e) => handleCareerChange('department', e.target.value)} />
                    {careerData.type === 'career' && <Input label="직급/직책" placeholder="예: 사원, 대리" value={careerData.position} onChange={(e) => handleCareerChange('position', e.target.value)} />}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <MonthYearPicker label="입사일" value={careerData.startDate} onChange={(val) => handleCareerChange('startDate', val)} placeholder="YYYY.MM" />
                   <MonthYearPicker label="퇴사일 (재직중 포함)" value={careerData.endDate} onChange={(val) => handleCareerChange('endDate', val)} placeholder="YYYY.MM" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">주요 업무 내용</label>
                   <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all h-32 resize-none" placeholder="담당했던 핵심 프로젝트나 성과 위주로 작성해주세요." value={careerData.description} onChange={(e) => handleCareerChange('description', e.target.value)} />
                </div>
             </div>
             <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="secondary" className="px-8" onClick={() => alert('경력 임시 저장')}>경력 추가하기</Button>
             </div>
          </div>
        );

      case 'etc':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col gap-6 items-center justify-center py-8">
               <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Solved.ac 연동</h3>
                  <p className="text-gray-500 text-sm">백준(Solved.ac) 아이디를 입력하여 알고리즘 문제 해결 역량을 증명하세요.</p>
               </div>
               <div className="w-full max-w-md">
                 <Input label="Solved.ac 아이디" placeholder="예: baekjoon_id" value={solvedAcId} onChange={(e) => setSolvedAcId(e.target.value)} className="text-center" />
               </div>
               <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center leading-relaxed border border-gray-100">
                  * Solved.ac 가입이 필요하며, 설정에서 정보 공개가 <span className="font-bold text-gray-600">'모두(Everyone)'</span>로 설정되어 있어야 연동이 가능합니다.
               </div>
            </div>
             <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="secondary" className="px-8" onClick={() => alert('설정 저장')}>연동하기</Button>
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
        .remove-spinner::-webkit-outer-spin-button, .remove-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .remove-spinner[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">상세 스펙 등록</h2>
          <p className="text-gray-500 text-lg">정확한 데이터 입력을 통해 AI가 더 정교한 분석 결과를 제공할 수 있습니다.<br className="hidden md:block"/>각 항목별로 상세 내용을 입력해주세요.</p>
      </div>

      {/* Main Grid */}
      <div className="w-full max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[16rem_1fr] xl:grid-cols-[1fr_800px_1fr] gap-8 relative items-start">
        
        {/* Sidebar */}
        <aside className="hidden lg:block sticky top-32 z-30 xl:col-start-1 xl:justify-self-end w-64 xl:pr-8">
           <GlassCard className="p-4 border border-white/60 shadow-lg shadow-gray-200/50">
              <nav className="relative flex flex-col space-y-3">
                 {categories.map((cat) => (
                    <button key={cat.id} onClick={() => scrollToSection(cat.id)} className={`relative z-10 flex items-center gap-3 px-4 h-14 w-full rounded-xl transition-all duration-200 text-left group overflow-hidden ${activeTab === cat.id ? 'bg-cyan-50 text-cyan-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-medium'}`}>
                       <div className={`transition-transform duration-300 text-2xl ${activeTab === cat.id ? 'scale-110' : ''}`}>{cat.icon}</div>
                       <span className="text-sm truncate">{cat.label}</span>
                    </button>
                 ))}
              </nav>
           </GlassCard>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden sticky top-[70px] z-40 w-full col-span-1">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg shadow-gray-200/40 rounded-3xl p-2 mx-auto">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar px-2 gap-2">
                    {categories.map((cat) => (
                    <button key={cat.id} onClick={() => scrollToSection(cat.id)} className={`flex flex-col items-center justify-center gap-1.5 min-w-[70px] py-2 rounded-2xl transition-all duration-300 ${activeTab === cat.id ? 'bg-cyan-50/80 text-cyan-600 scale-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                        <div className={`transition-transform duration-300 text-2xl ${activeTab === cat.id ? 'transform scale-110' : ''}`}>{cat.icon}</div>
                        <span className={`text-[10px] font-bold transition-colors ${activeTab === cat.id ? 'text-cyan-700' : 'text-gray-500'}`}>{cat.label.split(' ')[0]}</span>
                    </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="w-full xl:col-start-2 space-y-32 min-w-0">
            {categories.map((cat) => (
                <div key={cat.id} id={cat.id} className="scroll-mt-40 transition-all duration-500">
                    <GlassCard className="p-8 border border-white/60 hover:border-cyan-200/50 transition-colors">
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20 text-2xl">{cat.icon}</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{cat.label}</h3>
                                <p className="text-sm text-gray-400">{cat.id === 'etc' ? (cat as any).description : '상세 정보를 입력하여 포트폴리오를 완성하세요.'}</p>
                            </div>
                        </div>
                        {renderContent(cat.id)}
                    </GlassCard>
                </div>
            ))}
             <div className="flex justify-center pt-8">
                <Button variant="neon" className="w-full max-w-md py-4 text-xl font-bold shadow-cyan-500/30" onClick={handleSave}>전체 저장하기</Button>
            </div>
        </div>
        
        <div className="hidden xl:block col-start-3"></div>
      </div>
    </div>
  );
};