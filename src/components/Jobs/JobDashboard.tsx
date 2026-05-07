import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { jobPostingApi, JobPostingItem } from '../../api/jobPostingApi';

const COLORS = [
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-orange-100 text-orange-700',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-red-100 text-red-700',
    'bg-indigo-100 text-indigo-700',
    'bg-amber-100 text-amber-800',
    'bg-lime-100 text-lime-700',
    'bg-cyan-100 text-cyan-700',
];

const MOCK_DATA: JobPostingItem[] = [
    { id: 1,  companyName: '대구텍(유)',          state: '채용중', content: '대구텍 수시채용',                             position: '수시채용',   startDate: '2026-05-01', endDate: '2026-05-15', link: '' },
    { id: 2,  companyName: '공영홈쇼핑',           state: '채용중', content: '2026년 공영홈쇼핑 NCS기반 블라인드 채용',        position: '일반직',     startDate: '2026-05-01', endDate: '2026-05-16', link: '' },
    { id: 3,  companyName: '호텔신라',             state: '채용중', content: '2026년 호텔신라 4급 신입사원 채용',              position: '신입',       startDate: '2026-05-06', endDate: '2026-05-14', link: '' },
    { id: 4,  companyName: '삼성카드고객서비스',    state: '채용중', content: '삼성카드고객서비스 3급 신입사원 채용',            position: '신입 3급',   startDate: '2026-05-06', endDate: '2026-05-14', link: '' },
    { id: 5,  companyName: '케이에스엠',           state: '채용중', content: '국내탑티어 KSM 신입 및 경력사원 채용',           position: '신입/경력',  startDate: '2026-04-27', endDate: '2026-05-13', link: '' },
    { id: 6,  companyName: 'DB하이텍',             state: '채용중', content: '[DB하이텍] 경력사원 공개채용 (5월)',             position: '경력',       startDate: '2026-05-04', endDate: '2026-05-17', link: '' },
    { id: 7,  companyName: '현대위아',             state: '채용중', content: '2026 상반기 현대위아 신입사원 집중채용',          position: '신입',       startDate: '2026-04-30', endDate: '2026-05-19', link: '' },
    { id: 8,  companyName: '레드페이스',           state: '채용중', content: '2026 레드페이스 영업부/물류직 신입 및 경력 채용', position: '영업/물류',  startDate: '2026-05-06', endDate: '2026-06-06', link: '' },
    { id: 9,  companyName: '알레르망',             state: '채용중', content: '[알레르망] 2026년 상반기 수시 채용 모집',         position: '수시',       startDate: '2026-05-01', endDate: '2026-06-30', link: '' },
    { id: 10, companyName: '그랜드 하얏트 서울',   state: '채용중', content: '그랜드 하얏트 서울 호텔 부문별 신입 및 경력 모집', position: '신입/경력', startDate: '2026-04-13', endDate: '2026-05-31', link: '' },
    { id: 11, companyName: '해커스어학원',          state: '채용중', content: '2026년 해커스 교육그룹 수시 채용',               position: '수시',       startDate: '2026-04-01', endDate: '2026-05-31', link: '' },
    { id: 12, companyName: '국가과학기술인력개발원', state: '채용중', content: '2026년 제3회 정규직 및 위촉직 블라인드 채용',     position: '정규직',     startDate: '2026-04-29', endDate: '2026-05-14', link: '' },
];

function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function calcDDay(endDateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = parseLocalDate(endDateStr);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const JobDashboard: React.FC = () => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [jobPostings, setJobPostings] = useState<JobPostingItem[]>(MOCK_DATA);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        jobPostingApi.getCalendar(year, month)
            .then(res => {
                const data = res?.jobPostings ?? [];
                setJobPostings(data.length > 0 ? data : MOCK_DATA);
            })
            .catch(() => {
                setJobPostings(MOCK_DATA);
            })
            .finally(() => setLoading(false));
    }, [year, month]);

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else setMonth(m => m + 1);
    };

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = new Date(year, month - 1, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const weeks = ['일', '월', '화', '수', '목', '금', '토'];

    // Compute effective start/end day within this month for each job
    const enriched = jobPostings.map((job, i) => {
        const start = parseLocalDate(job.startDate);
        const end = parseLocalDate(job.endDate);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month - 1, daysInMonth);

        if (end < monthStart || start > monthEnd) return null; // not in this month

        const effectiveStart = start < monthStart ? 1 : start.getDate();
        const effectiveEnd = end > monthEnd ? daysInMonth : end.getDate();

        return {
            ...job,
            color: COLORS[i % COLORS.length],
            dDay: calcDDay(job.endDate),
            effectiveStart,
            effectiveEnd,
        };
    }).filter(Boolean) as (JobPostingItem & { color: string; dDay: number; effectiveStart: number; effectiveEnd: number })[];

    const deadlineSorted = [...enriched].filter(j => j.dDay >= 0).sort((a, b) => a.dDay - b.dDay);

    return (
        <div className="w-full pb-20 space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">채용 정보 대시보드</h2>
                    <p className="text-gray-500 mt-1">기업의 채용 일정을 한눈에 확인하세요.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 font-bold text-lg">‹</button>
                    <span className="text-base font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-xl min-w-[100px] text-center">
                        {year}년 {month}월
                    </span>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 font-bold text-lg">›</button>
                </div>
            </div>

            {error && (
                <div className="py-4 text-center text-amber-600 font-medium bg-amber-50 rounded-xl border border-amber-100 text-sm">{error}</div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Calendar */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                📅 {month}월 채용 캘린더
                            </h3>
                            <div className="flex gap-3 text-xs font-medium">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div>시작</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div>마감</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400">불러오는 중...</div>
                        ) : (
                            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-1">
                                {weeks.map(w => (
                                    <div key={w} className="bg-gray-50 text-center py-3 text-xs font-bold text-gray-500">{w}</div>
                                ))}

                                {Array.from({ length: startDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
                                ))}

                                {days.map(day => {
                                    const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

                                    const startingJobs = enriched.filter(j => j.effectiveStart === day);
                                    const endingJobs = enriched.filter(j => j.effectiveEnd === day);

                                    const markers = [
                                        ...startingJobs.map(job => ({ type: 'start' as const, job })),
                                        ...endingJobs.map(job => ({ type: 'end' as const, job })),
                                    ];

                                    return (
                                        <div key={day} className={`bg-white min-h-[100px] flex flex-col hover:bg-gray-50/80 transition-colors ${isToday ? 'ring-1 ring-inset ring-cyan-400/40 bg-cyan-50/30' : ''}`}>
                                            <div className="px-1.5 pt-1.5 pb-1">
                                                <span className={`text-sm font-medium ${isToday ? 'w-6 h-6 inline-flex items-center justify-center bg-cyan-600 text-white rounded-full text-xs' : 'text-gray-700'}`}>
                                                    {day}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-[3px] px-1 pb-1 overflow-hidden">
                                                {markers.slice(0, 5).map(({ type, job }) => {
                                                    const isStart = type === 'start';
                                                    return (
                                                        <div
                                                            key={`${type}-${job.id}`}
                                                            className="flex items-center gap-1 cursor-default"
                                                            title={`${job.content} (${isStart ? '시작' : '마감'})`}
                                                        >
                                                            <div className={`w-[6px] h-[6px] rounded-full shrink-0 ${isStart ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                            <span className={`text-[9px] font-semibold truncate leading-none ${isStart ? 'text-emerald-700' : 'text-red-600'}`}>
                                                                {job.companyName}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {markers.length > 5 && (
                                                    <span className="text-[8px] text-gray-400 font-medium pl-0.5">+{markers.length - 5}건</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Right: Deadline List */}
                <div className="flex flex-col gap-6">
                    <GlassCard className="p-6 flex-1 flex flex-col">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                            📌 마감 임박 공고
                            <span className="text-xs text-gray-400 font-normal">D-Day 순</span>
                        </h4>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
                        ) : deadlineSorted.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">진행 중인 공고가 없습니다.</div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[600px] pr-2">
                                {deadlineSorted.map(job => (
                                    <a
                                        key={job.id}
                                        href={job.link || undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block p-4 rounded-xl border border-gray-100 bg-white hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${job.dDay <= 3 ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                        <div className="pl-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${job.dDay <= 3 ? 'bg-red-500' : 'bg-gray-400'}`}>
                                                    {job.dDay === 0 ? 'D-Day' : `D-${job.dDay}`}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{job.endDate.slice(5).replace('-', '.')} 마감</span>
                                            </div>
                                            <h5 className="font-bold text-gray-800 text-sm mb-0.5">{job.companyName}</h5>
                                            <p className="text-xs text-gray-500 line-clamp-1">{job.position}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
