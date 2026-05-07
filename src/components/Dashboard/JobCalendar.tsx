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
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday

    // Job Data (마감일 기준 유효한 공고, 5월 기준)
    const jobPostings = [
        { id: 1, company: '대구텍(유)', role: '대구텍 수시채용', startDate: '2026.05.01', endDate: '2026.05.15', startDay: 1, endDay: 15, dDay: 8, color: 'bg-green-100 text-green-700 border-green-200' },
        { id: 2, company: '㈜공영홈쇼핑', role: '2026년 공영홈쇼핑 NCS기반 블라인드 채용', startDate: '2026.05.01', endDate: '2026.05.16', startDay: 1, endDay: 16, dDay: 9, color: 'bg-blue-100 text-blue-700 border-blue-200' },
        { id: 3, company: '㈜호텔신라', role: '2026년 호텔신라 4급 신입사원 채용', startDate: '2026.05.06', endDate: '2026.05.14', startDay: 6, endDay: 14, dDay: 7, color: 'bg-orange-100 text-orange-700 border-orange-200' },
        { id: 4, company: '삼성카드고객서비스', role: '삼성카드고객서비스 3급 신입사원 채용', startDate: '2026.05.06', endDate: '2026.05.14', startDay: 6, endDay: 14, dDay: 7, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { id: 5, company: '㈜케이에스엠', role: '국내탑티어 KSM 신입 및 경력사원 채용', startDate: '2026.04.27', endDate: '2026.05.13', startDay: 0, endDay: 13, dDay: 6, color: 'bg-purple-100 text-purple-700 border-purple-200' },
        { id: 6, company: '㈜디비하이텍', role: '[DB하이텍] 경력사원 공개채용 (5월)', startDate: '2026.05.04', endDate: '2026.05.17', startDay: 4, endDay: 17, dDay: 10, color: 'bg-pink-100 text-pink-700 border-pink-200' },
        { id: 7, company: '현대위아㈜', role: '2026 상반기 현대위아 신입사원 집중채용', startDate: '2026.04.30', endDate: '2026.05.19', startDay: 0, endDay: 19, dDay: 12, color: 'bg-teal-100 text-teal-700 border-teal-200' },
        { id: 8, company: '㈜레드페이스', role: '2026 레드페이스 영업부 / 물류직 신입 및 경력사원 채용', startDate: '2026.05.06', endDate: '2026.06.06', startDay: 6, endDay: 37, dDay: 30, color: 'bg-red-100 text-red-700 border-red-200' },
        { id: 9, company: '㈜알레르망', role: '[알레르망] 2026년 상반기 수시 채용 모집', startDate: '2026.05.01', endDate: '2026.06.30', startDay: 1, endDay: 42, dDay: 54, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        { id: 10, company: '그랜드 하얏트 서울', role: '그랜드 하얏트 서울 호텔 부문별 신입 및 경력 모집', startDate: '2026.04.13', endDate: '2026.05.31', startDay: 0, endDay: 31, dDay: 24, color: 'bg-amber-100 text-amber-800 border-amber-200' },
        { id: 11, company: '㈜해커스어학원', role: '2026년 해커스 교육그룹 수시 채용', startDate: '2026.04.01', endDate: '2026.05.31', startDay: 0, endDay: 31, dDay: 24, color: 'bg-lime-100 text-lime-700 border-lime-200' },
        { id: 12, company: '국가과학기술인력개발원', role: '2026년 제3회 정규직 및 위촉직 블라인드 채용', startDate: '2026.04.29', endDate: '2026.05.14', startDay: 0, endDay: 14, dDay: 7, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    ];

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const weeks = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <GlassCard className="p-8 h-full flex flex-col md:flex-row gap-8 min-h-[500px]">

            {/* Left: Large Calendar Grid */}
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        📅 채용 일정 캘린더
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{currentMonth}월</span>
                    </h3>
                    <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div>시작</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div>마감</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-1">
                    {weeks.map(w => (
                        <div key={w} className="bg-gray-50 text-center py-2 text-xs font-bold text-gray-500">{w}</div>
                    ))}

                    {/* Empty cells */}
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white min-h-[80px]" />
                    ))}

                    {/* Date cells */}
                    {days.map(day => {
                        const colPos = (startDay + day - 1) % 7;
                        const isToday = day === new Date().getDate();
                        const activeJobs = jobPostings
                            .map(job => ({
                                ...job,
                                effectiveStart: Math.max(1, job.startDay),
                                effectiveEnd: Math.min(job.endDay, daysInMonth),
                            }))
                            .filter(job => job.effectiveStart <= day && day <= job.effectiveEnd);

                        return (
                            <div key={day} className="bg-white min-h-[80px] flex flex-col hover:bg-gray-50 transition-colors">
                                <div className="px-1.5 pt-1 pb-0.5">
                                    <span className={`text-xs font-medium ${isToday ? 'w-5 h-5 inline-flex items-center justify-center bg-cyan-600 text-white rounded-full' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-px">
                                    {activeJobs.map(job => {
                                        const isFirstVisible = day === job.effectiveStart;
                                        const isEnd = day === job.effectiveEnd;
                                        const isFirstOfWeek = colPos === 0;
                                        const isLastOfWeek = colPos === 6;
                                        const roundLeft = isFirstVisible || isFirstOfWeek;
                                        const roundRight = isEnd || isLastOfWeek;
                                        const showName = isFirstVisible || isFirstOfWeek;
                                        return (
                                            <div
                                                key={job.id}
                                                className={`h-[18px] flex items-center overflow-hidden ${job.color} ${roundLeft ? 'rounded-l-full ml-0.5' : ''} ${roundRight ? 'rounded-r-full mr-0.5' : ''}`}
                                            >
                                                <span className="text-[9px] font-bold px-1.5 truncate leading-none w-full">
                                                    {showName
                                                        ? job.company.replace('㈜', '').replace('(유)', '').trim()
                                                        : isEnd ? '마감' : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Detailed Job List with Start/End Dates */}
            <div className="w-full md:w-80 border-l border-gray-100 md:pl-8 flex flex-col">
                <h4 className="text-lg font-bold text-gray-900 mb-6">마감 임박 공고</h4>

                <div className="space-y-4 overflow-y-auto custom-scrollbar max-h-[460px] pr-2">
                    {jobPostings.map(job => (
                        <div key={job.id} className="group p-4 rounded-xl border border-gray-100 bg-white hover:border-cyan-200 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${job.dDay <= 3 ? 'bg-red-500' : 'bg-gray-400'}`}>
                                    D-{job.dDay}
                                </span>
                                <button className="text-gray-300 hover:text-yellow-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </button>
                            </div>
                            <h5 className="font-bold text-gray-800 text-sm mb-1">{job.company}</h5>
                            <p className="text-xs text-gray-500 mb-3">{job.role}</p>

                            <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">시작일</span>
                                    <span className="font-medium text-gray-700">{job.startDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">종료일</span>
                                    <span className="font-medium text-red-500">{job.endDate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="mt-4 w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    전체 일정 보기
                </button>
            </div>

        </GlassCard>
    );
};
