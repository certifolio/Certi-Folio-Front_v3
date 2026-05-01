import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mentorApi } from '../../api/mentoringApi';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';


interface AvailabilitySlot {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;  // "10:00:00"
  endTime: string;    // "11:00:00"
  slotType: 'VIDEO' | 'CHAT' | 'IN_PERSON';
}

interface MentorRegistrationData {
  name: string;
  company: string;
  role: string;
  years: string;
  bio: string;
  skills: string[];
  certificates: string;
  availability: AvailabilitySlot[];
  preferredFormat: 'ONLINE' | 'OFFLINE' | 'BOTH' | '';
}

interface MentorRegistrationFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const MentorRegistrationFlow: React.FC<MentorRegistrationFlowProps> = ({ onComplete, onCancel }) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 새 슬롯 추가용 임시 state
  const [newSlotDay, setNewSlotDay] = useState<string>('');
  const [newSlotStart, setNewSlotStart] = useState('10:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');
  const [newSlotType, setNewSlotType] = useState<'VIDEO' | 'CHAT' | 'IN_PERSON'>('VIDEO');

  const [data, setData] = useState<MentorRegistrationData>({
    name: userProfile?.name || '',
    company: '',
    role: '',
    years: '',
    bio: '',
    skills: [],
    certificates: '',
    availability: [],
    preferredFormat: ''
  });

  const handleChange = (field: keyof MentorRegistrationData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(prev => prev + 1);
      setIsAnimating(false);
    }, 400);
  };

  const handleBack = () => {
    if (step === 0) onCancel();
    else setStep(prev => prev - 1);
  };

  // Tag Handling for Skills
  const addTag = () => {
    if (tagInput.trim() && !data.skills.includes(tagInput.trim())) {
      handleChange('skills', [...data.skills, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => {
    handleChange('skills', data.skills.filter(t => t !== tag));
  };

  // 슬롯 추가
  const addSlot = () => {
    if (!newSlotDay || !newSlotStart || !newSlotEnd) return;
    const startFormatted = newSlotStart.length === 5 ? `${newSlotStart}:00` : newSlotStart;
    const endFormatted = newSlotEnd.length === 5 ? `${newSlotEnd}:00` : newSlotEnd;
    if (startFormatted >= endFormatted) {
      alert('종료 시간은 시작 시간 이후여야 합니다.');
      return;
    }
    const exists = data.availability.some(
      s => s.dayOfWeek === newSlotDay && s.startTime === startFormatted && s.endTime === endFormatted
    );
    if (exists) return;
    handleChange('availability', [
      ...data.availability,
      { dayOfWeek: newSlotDay, startTime: startFormatted, endTime: endFormatted, slotType: newSlotType },
    ]);
  };

  // 슬롯 삭제
  const removeSlot = (idx: number) => {
    handleChange('availability', data.availability.filter((_: AvailabilitySlot, i: number) => i !== idx));
  };

  // 요일 순서대로 정렬
  const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const sortedSlots = [...data.availability].sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const slotTypeLabel = (t: string) => {
    switch (t) {
      case 'VIDEO': return '💻 화상';
      case 'CHAT': return '💬 채팅';
      case 'IN_PERSON': return '☕ 대면';
      default: return t;
    }
  };

  const dayLabel = (d: string) => {
    const labels: Record<string, string> = {
      MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목',
      FRIDAY: '금', SATURDAY: '토', SUNDAY: '일'
    };
    return labels[d] || d;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: data.name,
        title: data.role,
        company: data.company,
        experience: data.years,
        expertise: data.skills,
        bio: data.bio,
        availability: data.availability,
        preferredFormat: (data.preferredFormat || 'ONLINE') as 'ONLINE' | 'OFFLINE' | 'BOTH',
        certificates: data.certificates
          ? data.certificates.split(',').map(c => c.trim()).filter(Boolean)
          : [],
      };
      await mentorApi.applyMentor(payload);
      onComplete();
    } catch (err: any) {
      setSubmitError(err?.data?.message || err?.message || '멘토 신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 6;
  const progress = ((step + 1) / totalSteps) * 100;


  // Render Step Content
  const renderStep = () => {
    switch (step) {
      // Step 0: Name Confirm
      case 0:
        return (
          <div className="flex flex-col items-center w-full max-w-md gap-6 animate-fade-in-up">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center leading-tight">
              멘토 등록을 시작합니다.<br />
              성함이 <span className="text-cyan-600">{data.name}</span>님이 맞으신가요?
            </h2>
            <Input
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="text-center text-xl font-bold"
            />
            <Button variant="primary" onClick={handleNext} className="w-full py-4 text-lg">네, 맞습니다</Button>
          </div>
        );

      // Step 1: Career Info
      case 1:
        return (
          <div className="flex flex-col w-full max-w-md gap-6 animate-fade-in-up">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">현재 재직 정보를 알려주세요.</h2>
              <p className="text-gray-500">멘티들에게 신뢰를 줄 수 있는 중요한 정보입니다.</p>
            </div>
            <Input label="재직 중인 회사" placeholder="예: Google Korea" value={data.company} onChange={(e) => handleChange('company', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="직무 / 직책" placeholder="예: Senior Engineer" value={data.role} onChange={(e) => handleChange('role', e.target.value)} />
              <Input label="총 경력 (연차)" placeholder="예: 5년차" value={data.years} onChange={(e) => handleChange('years', e.target.value)} />
            </div>
            <Button variant="primary" onClick={handleNext} disabled={!data.company || !data.role} className="w-full py-4 text-lg mt-4">다음</Button>
          </div>
        );

      // Step 2: Bio
      case 2:
        return (
          <div className="flex flex-col w-full max-w-md gap-6 animate-fade-in-up">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">멘토님을 소개해주세요.</h2>
              <p className="text-gray-500">어떤 경험을 나누고 싶으신가요?</p>
            </div>
            <textarea
              className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:border-cyan-500 outline-none text-gray-800 resize-none bg-white/80 shadow-inner text-lg"
              placeholder="안녕하세요, 주니어 개발자들의 성장통을 해결해드리고 싶은..."
              value={data.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
            />
            <Button variant="primary" onClick={handleNext} disabled={data.bio.length < 10} className="w-full py-4 text-lg mt-4">다음</Button>
          </div>
        );

      // Step 3: Skills
      case 3:
        return (
          <div className="flex flex-col w-full max-w-md gap-6 animate-fade-in-up">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">전문 분야를 입력해주세요.</h2>
              <p className="text-gray-500">자신있는 기술 스택이나 상담 주제를 태그로 추가하세요.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="예: React, 이력서첨삭, 커리어상담 (Enter)"
                className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-cyan-500 outline-none text-lg bg-white shadow-sm"
              />
              <button onClick={addTag} className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-cyan-100 hover:text-cyan-700">추가</button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[100px] content-start bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              {data.skills.map(tag => (
                <span key={tag} className="px-4 py-2 bg-white text-cyan-700 rounded-full font-bold text-sm flex items-center gap-2 border border-cyan-100 shadow-sm">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 text-gray-400">×</button>
                </span>
              ))}
              {data.skills.length === 0 && <span className="text-gray-400 text-sm">태그가 없습니다.</span>}
            </div>

            <Button variant="primary" onClick={handleNext} disabled={data.skills.length === 0} className="w-full py-4 text-lg mt-4">다음</Button>
          </div>
        );

      // Step 4: Certificates (Optional)
      case 4:
        return (
          <div className="flex flex-col w-full max-w-md gap-6 animate-fade-in-up">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">보유 자격증이 있으신가요?</h2>
              <p className="text-gray-500">선택 사항입니다. 없으시면 건너뛰세요.</p>
            </div>

            <Input
              placeholder="자격증 명을 입력해주세요 (콤마로 구분)"
              value={data.certificates}
              onChange={(e) => handleChange('certificates', e.target.value)}
            />

            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={handleNext} className="flex-1 py-4 text-lg">건너뛰기</Button>
              <Button variant="primary" onClick={handleNext} disabled={!data.certificates} className="flex-1 py-4 text-lg">입력 완료</Button>
            </div>
          </div>
        );

      // Step 5: 가능 시간대 & 선호 방식
      case 5:
        return (
          <div className="flex flex-col w-full max-w-lg gap-6 animate-fade-in-up">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">멘토링 선호 방식</h2>
              <p className="text-gray-500">가능한 시간대와 방식을 설정해주세요.</p>
            </div>

            {/* 선호 방식 (preferredFormat) */}
            <div className="space-y-2">
              <label className="text-gray-500 text-xs font-bold uppercase ml-1">선호 방식</label>
              <div className="flex gap-3">
                {(['ONLINE', 'OFFLINE', 'BOTH'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => handleChange('preferredFormat', fmt)}
                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${data.preferredFormat === fmt
                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {fmt === 'ONLINE' ? '💻 온라인' : fmt === 'OFFLINE' ? '☕ 오프라인' : '🔄 모두'}
                  </button>
                ))}
              </div>
            </div>

            {/* 가능 시간대 추가 - 달력 스타일 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-purple-50 to-cyan-50 px-5 py-3 border-b border-gray-100">
                <label className="text-gray-700 text-sm font-bold">📅 가능 시간대 추가</label>
              </div>

              <div className="p-5 space-y-5">
                {/* 요일 선택 - 달력 느낌 원형 버튼 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider ml-1">요일 선택</label>
                  <div className="flex justify-between gap-2">
                    {([
                      { key: 'MONDAY', label: '월' },
                      { key: 'TUESDAY', label: '화' },
                      { key: 'WEDNESDAY', label: '수' },
                      { key: 'THURSDAY', label: '목' },
                      { key: 'FRIDAY', label: '금' },
                      { key: 'SATURDAY', label: '토' },
                      { key: 'SUNDAY', label: '일' },
                    ]).map(day => (
                      <button
                        key={day.key}
                        onClick={() => setNewSlotDay(day.key)}
                        className={`w-11 h-11 rounded-full border-2 font-bold text-sm flex items-center justify-center transition-all ${
                          newSlotDay === day.key
                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 시간 범위 선택 - 스피너 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider ml-1">시간 범위</label>
                  <div className="flex items-center gap-2">
                    {/* 시작 시간 */}
                    <div className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 px-2 py-1.5">
                      <svg className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {/* 시 스피너 */}
                      <div className="flex flex-col items-center">
                        <button onClick={() => { const h = (parseInt(newSlotStart.split(':')[0]) + 1) % 24; setNewSlotStart(`${String(h).padStart(2,'0')}:${newSlotStart.split(':')[1] || '00'}`); }} className="text-gray-400 hover:text-cyan-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <span className="text-lg font-extrabold text-gray-800 w-7 text-center select-none">{newSlotStart.split(':')[0]}</span>
                        <button onClick={() => { const h = (parseInt(newSlotStart.split(':')[0]) - 1 + 24) % 24; setNewSlotStart(`${String(h).padStart(2,'0')}:${newSlotStart.split(':')[1] || '00'}`); }} className="text-gray-400 hover:text-cyan-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      <span className="text-lg font-extrabold text-gray-300">:</span>
                      {/* 분 스피너 */}
                      <div className="flex flex-col items-center">
                        <button onClick={() => { const m = newSlotStart.split(':')[1] === '00' ? '30' : '00'; setNewSlotStart(`${newSlotStart.split(':')[0]}:${m}`); }} className="text-gray-400 hover:text-cyan-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <span className="text-lg font-extrabold text-gray-800 w-7 text-center select-none">{newSlotStart.split(':')[1] || '00'}</span>
                        <button onClick={() => { const m = newSlotStart.split(':')[1] === '00' ? '30' : '00'; setNewSlotStart(`${newSlotStart.split(':')[0]}:${m}`); }} className="text-gray-400 hover:text-cyan-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* 화살표 */}
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>

                    {/* 종료 시간 */}
                    <div className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 px-2 py-1.5">
                      <svg className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {/* 시 스피너 */}
                      <div className="flex flex-col items-center">
                        <button onClick={() => { const h = (parseInt(newSlotEnd.split(':')[0]) + 1) % 24; setNewSlotEnd(`${String(h).padStart(2,'0')}:${newSlotEnd.split(':')[1] || '00'}`); }} className="text-gray-400 hover:text-purple-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <span className="text-lg font-extrabold text-gray-800 w-7 text-center select-none">{newSlotEnd.split(':')[0]}</span>
                        <button onClick={() => { const h = (parseInt(newSlotEnd.split(':')[0]) - 1 + 24) % 24; setNewSlotEnd(`${String(h).padStart(2,'0')}:${newSlotEnd.split(':')[1] || '00'}`); }} className="text-gray-400 hover:text-purple-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      <span className="text-lg font-extrabold text-gray-300">:</span>
                      {/* 분 스피너 */}
                      <div className="flex flex-col items-center">
                        <button onClick={() => { const m = newSlotEnd.split(':')[1] === '00' ? '30' : '00'; setNewSlotEnd(`${newSlotEnd.split(':')[0]}:${m}`); }} className="text-gray-400 hover:text-purple-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <span className="text-lg font-extrabold text-gray-800 w-7 text-center select-none">{newSlotEnd.split(':')[1] || '00'}</span>
                        <button onClick={() => { const m = newSlotEnd.split(':')[1] === '00' ? '30' : '00'; setNewSlotEnd(`${newSlotEnd.split(':')[0]}:${m}`); }} className="text-gray-400 hover:text-purple-600 transition-colors leading-none p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 방식 선택 - 칩 버튼 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider ml-1">진행 방식</label>
                  <div className="flex gap-2">
                    {([
                      { key: 'VIDEO' as const, icon: '💻', label: '화상' },
                      { key: 'CHAT' as const, icon: '💬', label: '채팅' },
                      { key: 'IN_PERSON' as const, icon: '☕', label: '대면' },
                    ]).map(type => (
                      <button
                        key={type.key}
                        onClick={() => setNewSlotType(type.key)}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          newSlotType === type.key
                            ? type.key === 'VIDEO' ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                            : type.key === 'CHAT' ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                            : 'bg-orange-50 border-orange-400 text-orange-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 추가 버튼 */}
                <button
                  onClick={addSlot}
                  disabled={!newSlotDay || !newSlotStart || !newSlotEnd}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-sm hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 disabled:shadow-none"
                >
                  + 시간대 추가
                </button>
              </div>
            </div>

            {/* 추가된 슬롯 목록 */}
            <div className="space-y-2">
              <label className="text-gray-500 text-xs font-bold uppercase ml-1">
                등록된 시간대 ({data.availability.length}개)
              </label>
              {sortedSlots.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
                  <div className="text-3xl mb-2">🕐</div>
                  <p className="text-sm text-gray-400">아직 시간대가 없습니다.<br />위에서 요일, 시간, 방식을 선택 후 추가해주세요.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 max-h-[200px] overflow-y-auto custom-scrollbar shadow-sm">
                  {sortedSlots.map((slot, idx) => {
                    const realIdx = data.availability.findIndex(
                      s => s.dayOfWeek === slot.dayOfWeek && s.startTime === slot.startTime && s.endTime === slot.endTime && s.slotType === slot.slotType
                    );
                    return (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">{dayLabel(slot.dayOfWeek)}</span>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-800 font-bold">{slot.startTime.substring(0, 5)} ~ {slot.endTime.substring(0, 5)}</span>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            slot.slotType === 'VIDEO' ? 'text-blue-600 bg-blue-50 border-blue-100'
                            : slot.slotType === 'CHAT' ? 'text-green-600 bg-green-50 border-green-100'
                            : 'text-orange-600 bg-orange-50 border-orange-100'
                          }`}>
                            {slotTypeLabel(slot.slotType)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSlot(realIdx)}
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {submitError && (
              <div className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center animate-fade-in-up">
                {submitError}
              </div>
            )}

            <Button
              variant="neon"
              onClick={handleSubmit}
              disabled={!data.preferredFormat || data.availability.length === 0 || isSubmitting}
              className="w-full py-4 text-lg mt-6 shadow-cyan-500/30"
            >
              {isSubmitting ? '신청 중...' : '등록 신청 완료 🚀'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full py-10 px-4">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mx-auto mb-12">
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider px-1">
          <span>Step {step + 1}</span>
          <span>{step === 5 ? 'Final' : 'Mentor Registration'}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Main Content Card */}
      <GlassCard className="w-full max-w-3xl mx-auto p-8 md:p-16 min-h-[550px] flex flex-col items-center justify-center shadow-2xl border-white/70 relative">

        <button onClick={handleBack} className="absolute top-8 left-8 text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-2 font-medium">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {step === 0 ? '취소' : '이전'}
        </button>

        <div className={`transition-all duration-500 w-full flex justify-center ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          {renderStep()}
        </div>

      </GlassCard>
    </div>
  );
};