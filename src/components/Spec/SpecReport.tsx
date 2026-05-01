import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { AnalyticsResult } from '../../api/analyticsApi';

interface SpecReportProps {
    onGoToDashboard: () => void;
    onDiagnose?: () => void;
    analyticsData?: AnalyticsResult | null;
    onGoToInfoManagement?: () => void;
    onRetargetAndReanalyze?: (payload: { targetCompanyType: string; targetJobRole: string }) => Promise<void> | void;
    isLoading?: boolean;
}

export const SpecReport: React.FC<SpecReportProps> = ({ onGoToDashboard, onDiagnose, analyticsData, onGoToInfoManagement, onRetargetAndReanalyze, isLoading = false }) => {
    const { userProfile } = useAuth();
    const [loadingStep, setLoadingStep] = useState(0);
    const [isTargetEditOpen, setIsTargetEditOpen] = useState(false);
    const [selectedCompanyType, setSelectedCompanyType] = useState('big_corp');
    const [selectedJobRole, setSelectedJobRole] = useState('');
    const [isReanalyzing, setIsReanalyzing] = useState(false);

    const companyTypes = [
        { id: '대기업', label: '대기업' },
        { id: 'IT 서비스 기업', label: 'IT 서비스 기업' },
        { id: '금융권', label: '금융권' },
        { id: '공기업/공공기관', label: '공기업/공공기관' },
        { id: '스타트업', label: '스타트업' },
        { id: '기타/SI/SM', label: '기타/SI/SM' },
    ];

    const jobRoles: Record<string, string[]> = {
        '대기업': ['백엔드 개발자', '프론트엔드 개발자', '모바일 앱 개발자', '데이터 엔지니어', 'AI/머신러닝 연구원', '임베디드/시스템 소프트웨어 개발자', '보안 엔지니어', '데브옵스/인프라 엔지니어'],
        'IT 서비스 기업': ['서버 개발자', '웹 프론트엔드 개발자', '안드로이드 개발자', 'iOS 개발자', '데이터 사이언티스트', '머신러닝 엔지니어', '사이트 신뢰성 엔지니어', 'QA/테스트 엔지니어'],
        '금융권': ['코어뱅킹 개발자', '계정계/정보계 개발자', '금융 플랫폼 프론트엔드 개발자', '금융 데이터 분석가', '블록체인/디지털 자산 개발자', '보안/정보보호 담당자', 'IT 기획/프로덕트 매니저'],
        '공기업/공공기관': ['전산직 개발/운영 담당자', '정보보안 담당자', '네트워크/시스템 관리자', '데이터베이스 관리자', 'IT 사업 관리 담당자'],
        '스타트업': ['풀스택 개발자', '프론트엔드 리드', '백엔드 개발자', '그로스 엔지니어', '데이터 분석가', '기술 리드/CTO', '블록체인 엔지니어'],
        '기타/SI/SM': ['SI 개발자', '시스템 운영 담당자', '솔루션 엔지니어', '웹 퍼블리셔', 'ERP 개발자', '임베디드 소프트웨어 개발자'],
    };

    useEffect(() => {
        if (userProfile?.companyType && jobRoles[userProfile.companyType]) {
            setSelectedCompanyType(userProfile.companyType);
        }
        if (userProfile?.jobRole) {
            setSelectedJobRole(userProfile.jobRole);
        }
    }, [userProfile?.companyType, userProfile?.jobRole]);

    useEffect(() => {
        const roles = jobRoles[selectedCompanyType] || [];
        if (!roles.includes(selectedJobRole)) {
            setSelectedJobRole(roles[0] || '');
        }
    }, [selectedCompanyType, selectedJobRole]);

    const loadingMessages = [
        "희망 회사와 직무를 반영하고 있습니다",
        "저장된 스펙을 다시 정리하고 있습니다",
        "강점과 보완점을 다시 계산하고 있습니다",
        "리포트를 더 정확하게 다듬고 있습니다",
    ];

    useEffect(() => {
        if (!isLoading) {
            setLoadingStep(0);
            return;
        }

        if (loadingStep < loadingMessages.length - 1) {
            const timer = setTimeout(() => {
                setLoadingStep(prev => prev + 1);
            }, 1600);
            return () => clearTimeout(timer);
        }

        const loopTimer = setTimeout(() => {
            setLoadingStep(0);
        }, 1600);
        return () => clearTimeout(loopTimer);
    }, [isLoading, loadingMessages.length, loadingStep]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-4xl mx-auto">
                <style>{`
                    @keyframes gentle-bounce {
                        0%, 100% {
                            transform: translateY(0);
                            opacity: 0.7;
                        }
                        50% {
                            transform: translateY(-8px);
                            opacity: 1;
                        }
                    }
                `}</style>
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 rounded-3xl bg-cyan-50 animate-pulse" style={{ animationDuration: '2.6s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-cyan-500" style={{ animation: 'gentle-bounce 1.8s ease-in-out infinite', animationDelay: '0ms' }} />
                            <div className="w-3 h-3 rounded-full bg-blue-500" style={{ animation: 'gentle-bounce 1.8s ease-in-out infinite', animationDelay: '220ms' }} />
                            <div className="w-3 h-3 rounded-full bg-purple-500" style={{ animation: 'gentle-bounce 1.8s ease-in-out infinite', animationDelay: '440ms' }} />
                        </div>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 transition-all duration-300 text-center">
                    {loadingMessages[loadingStep]}
                </h2>
                <p className="text-sm text-gray-500 text-center leading-relaxed mb-8">
                    최신 희망 회사와 직무 기준으로<br />
                    커리어 분석 리포트를 다시 생성하고 있습니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                    {[
                        "희망 조건 반영",
                        "스펙 재분석",
                        "리포트 재구성",
                    ].map((item, index) => (
                        <div
                            key={item}
                            className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition-all duration-300 ${
                                index === loadingStep % 3
                                    ? 'bg-white border-cyan-200 text-cyan-700 shadow-md'
                                    : 'bg-gray-50/80 border-gray-200 text-gray-400'
                            }`}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 분석 데이터가 없으면 정보 입력 유도 화면
    if (!analyticsData) {
        return (
            <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center animate-fade-in-up">
                <GlassCard className="p-12 text-center max-w-lg mx-auto shadow-2xl">
                    <div className="text-6xl mb-6">📝</div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">분석할 데이터가 없습니다</h2>
                    <p className="text-gray-500 mb-8 text-lg">
                        정확한 커리어 리포트를 생성하기 위해<br />
                        먼저 기본 정보와 스펙을 입력해주세요.
                    </p>
                    <Button variant="neon" onClick={onDiagnose} className="px-10 py-4 text-lg font-bold shadow-cyan-500/30">
                        정보 입력하러 가기
                    </Button>
                    <button onClick={onGoToDashboard} className="block mt-6 text-gray-400 hover:text-gray-600 underline text-sm mx-auto">
                        대시보드로 돌아가기
                    </button>
                </GlassCard>
            </div>
        );
    }

    // 실제 API 데이터 or 폴백
    const scores = analyticsData?.categoryScores;
    const getCategoryScore = (key: string) => scores?.[key] ?? 50;

    const stats = {
        gpa: getCategoryScore('학점전공'),
        language: getCategoryScore('어학'),
        project: getCategoryScore('프로젝트경험'),
        career: getCategoryScore('실무경력'),
        activity: getCategoryScore('대외활동'),
        certificate: getCategoryScore('자격증'),
    };

    const totalScore = analyticsData?.overallScore ?? Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 6);
    const strengths = analyticsData?.strengths ?? [];
    const improvements = analyticsData?.improvements ?? [];
    const summary = analyticsData?.summary ?? '';

    let grade = 'C';
    if (totalScore >= 90) grade = 'S';
    else if (totalScore >= 80) grade = 'A+';
    else if (totalScore >= 70) grade = 'A';
    else if (totalScore >= 60) grade = 'B+';
    else if (totalScore >= 50) grade = 'B';

    const radius = 80;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - totalScore / 100);

    const getRadarPath = (s: typeof stats) => {
        const scale = 0.8;
        const center = 100;
        const v = [s.gpa, s.language, s.project, s.career, s.activity, s.certificate];
        const angles = [-90, -30, 30, 90, 150, 210].map(a => a * (Math.PI / 180));
        const points = v.map((val, i) => {
            const r = val * scale;
            const x = center + r * Math.cos(angles[i]);
            const y = center + r * Math.sin(angles[i]);
            return `${x},${y}`;
        });
        return points.join(' ');
    };

    const handleRetargetSubmit = async () => {
        if (!selectedCompanyType || !selectedJobRole) return;
        setIsReanalyzing(true);
        try {
            await onRetargetAndReanalyze?.({
                targetCompanyType: selectedCompanyType,
                targetJobRole: selectedJobRole,
            });
            setIsTargetEditOpen(false);
        } finally {
            setIsReanalyzing(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-20 animate-fade-in-up px-4">

            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-block px-4 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-bold mb-4 border border-cyan-200">
                    AI DIAGNOSIS COMPLETE
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">{userProfile?.name || '사용자'}</span>님의 커리어 분석 리포트
                </h1>
                <p className="text-gray-500 text-lg">목표하신 직무 적합도를 분석했습니다.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="primary"
                        onClick={() => setIsTargetEditOpen((prev) => !prev)}
                        className="px-6 py-3 text-sm font-bold"
                    >
                        희망 회사와 직무만 변경
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onGoToInfoManagement}
                        className="px-6 py-3 text-sm font-bold"
                    >
                        정보 수정하기
                    </Button>
                </div>
                {isTargetEditOpen && (
                    <GlassCard className="mt-6 p-6 max-w-2xl mx-auto text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">희망 회사 유형</label>
                                <select
                                    value={selectedCompanyType}
                                    onChange={(e) => setSelectedCompanyType(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500"
                                >
                                    {companyTypes.map((company) => (
                                        <option key={company.id} value={company.id}>{company.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">희망 직무</label>
                                <select
                                    value={selectedJobRole}
                                    onChange={(e) => setSelectedJobRole(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-cyan-500"
                                >
                                    {(jobRoles[selectedCompanyType] || []).map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <Button
                                variant="neon"
                                onClick={handleRetargetSubmit}
                                className="px-6 py-3 text-sm font-bold"
                                disabled={isReanalyzing || !selectedJobRole}
                            >
                                {isReanalyzing ? '다시 진단 중...' : '다시 진단 돌리기'}
                            </Button>
                        </div>
                    </GlassCard>
                )}
            </div>

            {/* Score & Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <GlassCard className="lg:col-span-1 p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:border-cyan-300 transition-all">
                    <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8">Total Competency</h3>
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r={radius} stroke="#f3f4f6" strokeWidth={strokeWidth} fill="none" />
                            <circle
                                cx="100" cy="100" r={radius}
                                stroke="url(#scoreGradient)"
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="drop-shadow-md transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-7xl font-black text-gray-900 tracking-tighter">{grade}</span>
                            <span className="text-base font-bold text-cyan-600 mt-2">{totalScore}점</span>
                        </div>
                    </div>
                    {summary && (
                        <p className="mt-8 text-center text-sm text-gray-600 leading-relaxed px-2">{summary}</p>
                    )}
                </GlassCard>

                <GlassCard className="lg:col-span-2 p-8 flex flex-col md:flex-row items-center gap-8 bg-white/60">
                    <div className="flex-1 w-full max-w-[320px] aspect-square relative p-4">
                        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                            {[20, 40, 60, 80].map(r => (
                                <polygon key={r} points={getRadarPath({ gpa: r / 0.8, language: r / 0.8, project: r / 0.8, career: r / 0.8, activity: r / 0.8, certificate: r / 0.8 })} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                            ))}
                            <line x1="100" y1="100" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="100" y1="100" x2="169" y2="60" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="100" y1="100" x2="169" y2="140" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="100" y1="100" x2="100" y2="180" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="100" y1="100" x2="31" y2="140" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="100" y1="100" x2="31" y2="60" stroke="#e5e7eb" strokeWidth="1" />
                            <polygon
                                points={getRadarPath(stats)}
                                fill="rgba(6, 182, 212, 0.2)"
                                stroke="#06b6d4"
                                strokeWidth="2"
                                className="animate-pulse"
                            />
                            <text x="100" y="10" textAnchor="middle" className="text-[11px] fill-gray-500 font-bold">학점/전공</text>
                            <text x="190" y="55" textAnchor="middle" className="text-[11px] fill-gray-500 font-bold">어학</text>
                            <text x="190" y="150" textAnchor="middle" className="text-[11px] fill-gray-500 font-bold">프로젝트</text>
                            <text x="100" y="195" textAnchor="middle" className="text-[11px] fill-gray-500 font-bold">실무경력</text>
                            <text x="10" y="150" textAnchor="middle" className="text-[11px] fill-gray-500 font-bold">대외활동</text>
                            <text x="10" y="55" textAnchor="middle" className="text-[11px] fill-gray-500 font-bold">자격증</text>
                        </svg>
                    </div>

                    <div className="flex-1 space-y-4 w-full h-full flex flex-col justify-center">
                        <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-2 flex justify-between items-center">
                            항목별 상세 점수
                            <span className="text-xs font-normal text-gray-400">100점 만점 기준</span>
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: '실무 경력', score: stats.career, color: 'bg-cyan-500' },
                                { label: '프로젝트 경험', score: stats.project, color: 'bg-indigo-500' },
                                { label: '자격증', score: stats.certificate, color: 'bg-purple-500' },
                                { label: '학점/전공', score: stats.gpa, color: 'bg-blue-500' },
                                { label: '대외활동', score: stats.activity, color: 'bg-green-500' },
                                { label: '어학', score: stats.language, color: 'bg-orange-400' },
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs mb-1.5 font-bold text-gray-700">
                                        <span>{item.label}</span>
                                        <span className="text-gray-900">{Math.round(item.score)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${item.color} transition-all duration-1000`}
                                            style={{ width: `${item.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* AI Insight Box */}
            <div className="mb-12 animate-fade-in-up animation-delay-500">
                <GlassCard className="p-8 border-l-4 border-l-cyan-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-xl shadow-sm">🤖</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">AI 정밀 분석 요약</h3>
                            <p className="text-sm text-gray-500">지원자님의 데이터를 기반으로 강점과 보완점을 분석했습니다.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 p-1 rounded-md text-xs">👍 강점 (Strength)</span>
                            </h4>
                            <ul className="space-y-3">
                                {strengths.length > 0 ? strengths.map((s, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                                        <span className="text-blue-500 font-bold flex-shrink-0">✓</span>
                                        <span>{s}</span>
                                    </li>
                                )) : (
                                    <li className="text-sm text-gray-400">분석 데이터가 없습니다.</li>
                                )}
                            </ul>
                        </div>

                        <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
                            <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                                <span className="bg-orange-100 p-1 rounded-md text-xs">⚡ 보완점 (Improvement)</span>
                            </h4>
                            <ul className="space-y-3">
                                {improvements.length > 0 ? improvements.map((imp, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                                        <span className="text-orange-500 font-bold flex-shrink-0">!</span>
                                        <span>{imp}</span>
                                    </li>
                                )) : (
                                    <li className="text-sm text-gray-400">분석 데이터가 없습니다.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Roadmap Section */}
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                🚀 AI 추천 커리어 로드맵
                <span className="text-xs font-normal text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg">Next 6 Months</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                {[
                    { title: '기술 면접 대비', desc: '직무별 핵심 질문 정리', status: 'urgent', icon: '🔥' },
                    { title: 'CS 지식 보완', desc: '네트워크/OS 핵심 정리', status: 'normal', icon: '📚' },
                    { title: '팀 프로젝트 고도화', desc: '배포 및 성능 최적화 경험', status: 'recommended', icon: '💻' },
                    { title: '현직자 멘토링', desc: '이력서/포트폴리오 첨삭', status: 'normal', icon: '🤝' },
                ].map((item, idx) => (
                    <GlassCard key={idx} className={`p-5 flex flex-col gap-3 border-l-4 ${item.status === 'urgent' ? 'border-l-red-400' : item.status === 'recommended' ? 'border-l-cyan-400' : 'border-l-gray-300'}`}>
                        <div className="text-2xl">{item.icon}</div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                        {item.status === 'urgent' && <span className="self-start px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">우선순위 높음</span>}
                    </GlassCard>
                ))}
            </div>

        </div>
    );
};
