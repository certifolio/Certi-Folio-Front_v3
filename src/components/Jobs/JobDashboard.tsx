import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { jobPostingApi, JobPostingItem } from '../../api/jobPostingApi';

const COLORS = [
    'bg-green-100 text-green-700 border-green-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-orange-100 text-orange-700 border-orange-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-pink-100 text-pink-700 border-pink-200',
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
    const [jobPostings, setJobPostings] = useState<JobPostingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        jobPostingApi.getCalendar(year, month)
            .then(res => setJobPostings(res?.jobPostings ?? []))
            .catch(() => { setJobPostings([]); setError('채용 정보를 불러오는 데 실패했습니다.'); })
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

    const enriched = jobPostings.map((job, i) => ({
        ...job,
        color: COLORS[i % COLORS.length],
        dDay: calcDDay(job.endDate),
        startDayNum: parseLocalDate(job.startDate).getMonth() + 1 === month ? parseLocalDate(job.startDate).getDate() : -1,
        endDayNum: parseLocalDate(job.endDate).getMonth() + 1 === month ? parseLocalDate(job.endDate).getDate() : -1,
    }));

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
                <div className="py-6 text-center text-red-400 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>
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
                                    const startingJobs = enriched.filter(j => j.startDayNum === day);
                                    const endingJobs = enriched.filter(j => j.endDayNum === day);
                                    const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

                                    return (
                                        <div key={day} className="bg-white min-h-[100px] p-1.5 flex flex-col gap-1 hover:bg-gray-50 transition-colors">
                                            <span className={`text-sm font-medium ml-1 ${isToday ? 'w-6 h-6 flex items-center justify-center bg-cyan-600 text-white rounded-full' : 'text-gray-700'}`}>
                                                {day}
                                            </span>

                                            <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                                                {startingJobs.map(job => (
                                                    <div key={`s-${job.id}`} className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-bold truncate border border-green-200">
                                                        [시작] {job.companyName}
                                                    </div>
                                                ))}
                                                {endingJobs.map(job => (
                                                    <div key={`e-${job.id}`} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold truncate border border-red-200">
                                                        [마감] {job.companyName}
                                                    </div>
                                                ))}
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
                                            {job.state && (
                                                <span className="inline-block mt-1 text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">{job.state}</span>
                                            )}
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
