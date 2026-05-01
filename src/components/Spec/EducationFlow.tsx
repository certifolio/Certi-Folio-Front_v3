import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { MonthYearPicker } from '../UI/MonthYearPicker';

export interface EducationData {
  academicStatus: string;
  schoolName: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  maxGpa: string;
}

interface EducationFlowProps {
  initialData?: EducationData;
  onComplete: (data: EducationData) => void;
  onBack: () => void;
}

export const EducationFlow: React.FC<EducationFlowProps> = ({ initialData, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<EducationData>(initialData || {
    academicStatus: '',
    schoolName: '',
    major: '',
    degree: 'bachelor',
    startDate: '',
    endDate: '',
    gpa: '',
    maxGpa: '',
  });
  
  const [inputValue, setInputValue] = useState('');
  const [secondaryInput, setSecondaryInput] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Initialize inputs based on current step and saved data
  useEffect(() => {
    // Only pre-fill if we are navigating back/forward and data exists
    const currentStepObj = steps[currentStep];
    if (currentStepObj.inputType === 'dual_text_input') {
        if (data.schoolName) setInputValue(data.schoolName);
        if (data.major) setSecondaryInput(data.major);
    } else if (currentStepObj.inputType === 'date_range') {
        if (data.startDate) setInputValue(data.startDate);
        if (data.endDate) setSecondaryInput(data.endDate);
    } else if (currentStepObj.inputType === 'gpa_input') {
        if (data.gpa) setInputValue(data.gpa);
        if (data.maxGpa) setSecondaryInput(data.maxGpa);
    }
  }, [currentStep]);

  const steps = [
    {
      id: 'academicStatus',
      category: '학력 정보',
      inputType: 'selection',
      question: "현재 재학 상태를 알려주세요.",
      subtext: "현재 신분에 맞는 채용 공고를 추천해드립니다.",
      options: [
        { label: '재학 중', value: 'attending', icon: '🏫' },
        { label: '졸업 예정', value: 'pending', icon: '🎓' },
        { label: '졸업', value: 'graduated', icon: '🎉' },
        { label: '휴학', value: 'leave', icon: '☕' }
      ]
    },
    {
      id: 'school_info',
      category: '학력 정보',
      inputType: 'dual_text_input',
      question: "학교와 전공을 입력해주세요.",
      subtext: "대략적인 학교명과 주전공을 입력해주세요.",
      fields: ['schoolName', 'major'],
      placeholders: ['학교명 (예: 한국대학교)', '전공 (예: 경영학과)']
    },
    {
      id: 'degree',
      category: '학력 정보',
      inputType: 'selection',
      question: "취득(예정) 학위 과정을 선택해주세요.",
      subtext: "",
      options: [
        { label: '학사 (4년제)', value: 'bachelor', icon: '🎓' },
        { label: '전문학사 (2/3년제)', value: 'associate', icon: '📒' },
        { label: '석사', value: 'master', icon: '📜' },
        { label: '박사', value: 'doctor', icon: '👨‍🎓' }
      ]
    },
    {
      id: 'dates',
      category: '학력 정보',
      inputType: 'date_range',
      question: "입학 및 졸업(예정) 시기를 알려주세요.",
      subtext: "경력 기간 산정에 활용됩니다."
    },
    {
      id: 'gpa',
      category: '학력 정보',
      inputType: 'gpa_input',
      question: "학점을 입력해주세요.",
      subtext: "정확한 분석을 위해 입력을 권장합니다."
    }
  ];

  // Validation Effect for Dates
  useEffect(() => {
    const currentStepObj = steps[currentStep];
    if (currentStepObj.inputType === 'date_range') {
        if (inputValue && secondaryInput) {
            if (parseFloat(inputValue) > parseFloat(secondaryInput)) {
                setDateError("입학일이 졸업일보다 늦을 수 없습니다.");
            } else {
                setDateError(null);
            }
        } else {
            setDateError(null);
        }
    }
  }, [inputValue, secondaryInput, currentStep]);

  const handleNext = (value: any, isSkip: boolean = false) => {
    const currentStepObj = steps[currentStep];
    
    // Process Data
    let newData = { ...data };
    if (currentStepObj.inputType === 'dual_text_input') {
        newData.schoolName = value.first;
        newData.major = value.second;
    } else if (currentStepObj.inputType === 'date_range') {
        if (!value.start || !value.end) return; 
        if (parseFloat(value.start) > parseFloat(value.end)) {
            setDateError("입학일이 졸업일보다 늦을 수 없습니다.");
            return;
        }
        newData.startDate = value.start;
        newData.endDate = value.end;
    } else if (currentStepObj.inputType === 'gpa_input') {
        if (!isSkip) {
            newData.gpa = value.gpa;
            newData.maxGpa = value.maxGpa;
        }
    } else {
        newData = { ...newData, [currentStepObj.id]: value };
    }
    setData(newData);

    // Transition
    setInputValue('');
    setSecondaryInput('');
    setDateError(null);
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      } else {
        onComplete(newData);
      }
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const currentStepObj = steps[currentStep];
      if (currentStepObj.inputType === 'dual_text_input' && inputValue && secondaryInput) {
         handleNext({ first: inputValue, second: secondaryInput });
      }
    }
  };

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <style>{`
        .remove-spinner::-webkit-outer-spin-button,
        .remove-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .remove-spinner[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex justify-between items-end mb-3 px-1">
          <span className="text-sm font-bold text-cyan-600 uppercase tracking-wider">
            Step {currentStep + 1}
          </span>
          <span className="text-sm text-gray-500 font-bold bg-white/50 px-3 py-1 rounded-lg border border-white/60 shadow-sm">{currentStepData.category}</span>
        </div>
        <div className="w-full h-2 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <GlassCard className="w-full p-8 md:p-12 relative min-h-[600px] flex flex-col items-center justify-center shadow-2xl border-white/80">
        <div className={`w-full flex flex-col items-center transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
          <div className="text-center mb-10 w-full max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 whitespace-pre-line leading-tight tracking-tight">{currentStepData.question}</h2>
            <p className="text-gray-500 text-lg md:text-xl font-medium">{currentStepData.subtext}</p>
          </div>

          <div className="w-full max-w-2xl flex flex-col items-center">
            {currentStepData.inputType === 'selection' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fade-in-up">
                {currentStepData.options?.map((option) => (
                  <button key={option.value} onClick={() => handleNext(option.value)} className={`flex flex-col items-center justify-center p-8 border rounded-3xl transition-all duration-300 group active:scale-95 ${option.value === 'skip' ? 'md:col-span-2 bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400' : 'bg-white border-gray-100 hover:border-cyan-500 hover:shadow-xl hover:bg-cyan-50/50'}`}>
                    <span className={`text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 ${option.value === 'skip' ? 'grayscale opacity-50' : ''}`}>{option.icon}</span>
                    <span className={`font-bold text-xl md:text-2xl transition-colors ${option.value === 'skip' ? 'text-gray-400 group-hover:text-gray-600' : 'text-gray-600 group-hover:text-cyan-700'}`}>{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStepData.inputType === 'dual_text_input' && (
                <div className="w-full max-w-md animate-fade-in-up flex flex-col gap-6">
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={currentStepData.placeholders?.[0]} className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-cyan-500 outline-none text-xl bg-white shadow-sm transition-all" />
                    <input type="text" value={secondaryInput} onChange={(e) => setSecondaryInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={currentStepData.placeholders?.[1]} className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-cyan-500 outline-none text-xl bg-white shadow-sm transition-all" />
                    <Button variant="primary" onClick={() => handleNext({ first: inputValue, second: secondaryInput })} disabled={!inputValue.trim() || !secondaryInput.trim()} className="w-full py-5 text-xl font-bold rounded-2xl shadow-lg mt-4">다음</Button>
                </div>
            )}

            {currentStepData.inputType === 'date_range' && (
                <div className="w-full max-w-2xl animate-fade-in-up flex flex-col gap-8">
                     <div className="flex gap-6 justify-center w-full">
                        <div className="flex-1 max-w-[240px]"><MonthYearPicker label="입학 시기" value={inputValue} onChange={(val) => setInputValue(val)} placeholder="입학 년월" error={!!dateError} /></div>
                        <div className="flex-1 max-w-[240px]"><MonthYearPicker label="졸업(예정) 시기" value={secondaryInput} onChange={(val) => setSecondaryInput(val)} placeholder="졸업 년월" error={!!dateError} /></div>
                     </div>
                     {dateError && <div className="text-red-500 font-bold text-center bg-red-50 py-3 rounded-lg animate-pulse border border-red-100">⚠️ {dateError}</div>}
                    <Button variant="primary" onClick={() => handleNext({ start: inputValue, end: secondaryInput })} disabled={!inputValue || !secondaryInput || !!dateError} className="w-full py-5 text-xl font-bold rounded-2xl shadow-lg mt-4 max-w-md mx-auto">다음</Button>
                </div>
            )}

            {currentStepData.inputType === 'gpa_input' && (
                <div className="w-full max-w-md animate-fade-in-up flex flex-col gap-6 relative">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 mb-1 block pl-1">내 학점</label>
                            <input type="number" step="0.01" placeholder="예: 4.0" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-cyan-500 outline-none text-2xl text-center font-bold bg-white shadow-sm remove-spinner" />
                        </div>
                        <span className="text-3xl text-gray-300 font-light">/</span>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 mb-1 block pl-1">만점 기준</label>
                            <input type="number" step="0.1" placeholder="예: 4.5" value={secondaryInput} onChange={(e) => setSecondaryInput(e.target.value)} className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-cyan-500 outline-none text-2xl text-center font-bold bg-white shadow-sm remove-spinner" />
                        </div>
                    </div>
                    
                    <Button variant="primary" onClick={() => handleNext({ gpa: inputValue, maxGpa: secondaryInput })} disabled={!inputValue || !secondaryInput} className="w-full py-5 text-xl font-bold rounded-2xl shadow-lg mt-2">완료</Button>
                    <button onClick={() => setShowSkipWarning(true)} className="text-gray-400 text-sm font-medium hover:text-gray-600 underline decoration-gray-300 underline-offset-4">다음에 입력하기 (건너뛰기)</button>
                </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Navigation Hint */}
      {currentStep > 0 && (
          <button onClick={() => { setCurrentStep(prev => prev - 1); setInputValue(''); setSecondaryInput(''); setDateError(null); }} className="mt-8 text-base text-gray-400 hover:text-gray-800 flex items-center gap-2 transition-colors font-medium px-4 py-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            이전 단계로
          </button>
      )}

      {/* Navigation Back from Step 0 of Education Flow */}
      {currentStep === 0 && (
           <button onClick={onBack} className="mt-8 text-base text-gray-400 hover:text-gray-800 flex items-center gap-2 transition-colors font-medium px-4 py-2 hover:bg-white/50 rounded-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             기본 정보 수정하기
           </button>
      )}

      {/* Fixed Centered Warning Popup */}
      {showSkipWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" 
              onClick={() => setShowSkipWarning(false)}
            ></div>
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full animate-fade-in-up transform scale-100">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
                        ⚠️
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">정말 건너뛰시겠어요?</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        학점 정보를 입력하지 않으면<br/>
                        <span className="text-red-500 font-bold">합격 예측 정확도</span>가 떨어질 수 있습니다.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowSkipWarning(false)}
                            className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                        >
                            입력하기
                        </button>
                        <button 
                            onClick={() => handleNext({}, true)}
                            className="flex-1 py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors"
                        >
                            건너뛰기
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};