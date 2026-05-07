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

export const JobCalendar: React.FC = () => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [jobPostings, setJobPostings] = useState<JobPostingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        jobPostingApi.getCalendar(year, month)
            .then(res => setJobPostings(res?.jobPostings ?? []))
            .catch(() => setJobPostings([]))
            .finally(() => setLoading(false));
    }, [year, month]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = new Date(year, month - 1, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const weeks = ['일', '월', '화', '수', '목', '금', '토'];

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else setMonth(m => m + 1);
    };

    const deadlineSorted = [...jobPostings]
        .map((job, i) => ({ ...job, color: COLORS[i % COLORS.length], dDay: calcDDay(job.endDate) }))
        .filter(j => j.dDay >= 0)
        .sort((a, b) => a.dDay - b.dDay)
        .slice(0, 6);

    return (
        <GlassCard className="p-8 h-full flex flex-col md:flex-row gap-8 min-h-[500px]">

            {/* Left: Calendar Grid */}
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            📅 채용 일정 캘린더
                        </h3>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500 font-bold">‹</button>
                            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md min-w-[60px] text-center">{year}.{String(month).padStart(2, '0')}</span>
                            <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500 font-bold">›</button>
                        </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div>시작</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div>마감</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
                ) : (
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-1">
                        {weeks.map(w => (
                            <div key={w} className="bg-gray-50 text-center py-2 text-xs font-bold text-gray-500">{w}</div>
                        ))}

                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-white min-h-[80px]" />
                        ))}

                        {days.map(day => {
                            const startingJobs = jobPostings.filter(j => parseLocalDate(j.startDate).getDate() === day && parseLocalDate(j.startDate).getMonth() + 1 === month);
                            const endingJobs = jobPostings.filter(j => parseLocalDate(j.endDate).getDate() === day && parseLocalDate(j.endDate).getMonth() + 1 === month);
                            const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

                            return (
                                <div key={day} className="bg-white min-h-[80px] p-1 flex flex-col gap-1 hover:bg-gray-50 transition-colors">
                                    <span className={`text-sm font-medium ml-1 ${isToday ? 'text-cyan-600 font-bold' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                    {startingJobs.map(job => (
                                        <div key={`s-${job.id}`} className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium truncate border border-green-200">
                                            {job.companyName}
                                        </div>
                                    ))}
                                    {endingJobs.map(job => (
                                        <div key={`e-${job.id}`} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium truncate border border-red-100">
                                            {job.companyName}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right: Deadline List */}
            <div className="w-full md:w-80 border-l border-gray-100 md:pl-8 flex flex-col">
                <h4 className="text-lg font-bold text-gray-900 mb-6">마감 임박 공고</h4>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
                ) : deadlineSorted.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">진행 중인 공고가 없습니다.</div>
                ) : (
                    <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                        {deadlineSorted.map(job => (
                            <a
                                key={job.id}
                                href={job.link || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block p-4 rounded-xl border border-gray-100 bg-white hover:border-cyan-200 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${job.dDay <= 3 ? 'bg-red-500' : 'bg-gray-400'}`}>
                                        {job.dDay === 0 ? 'D-Day' : `D-${job.dDay}`}
                                    </span>
                                </div>
                                <h5 className="font-bold text-gray-800 text-sm mb-1">{job.companyName}</h5>
                                <p className="text-xs text-gray-500 mb-3">{job.position}</p>

                                <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">시작일</span>
                                        <span className="font-medium text-gray-700">{job.startDate.replace(/-/g, '.')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">종료일</span>
                                        <span className="font-medium text-red-500">{job.endDate.replace(/-/g, '.')}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

        </GlassCard>
    );
};
