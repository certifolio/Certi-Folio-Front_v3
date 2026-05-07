import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { adminMentorApi } from '../../api/mentoringApi';

interface Applicant {
    id: number;          // mentorId
    userId: number;
    name: string;
    email: string;
    company: string;
    role: string;        // title
    year: string;        // experience
    date: string;        // appliedAt
    status: string;
    bio: string;
    skills: string[];
    rejectReason: string | null;
}

const parsePreferredFormat = (format: string | null): string[] => {
    if (!format) return [];
    if (format === 'both') return ['online', 'offline'];
    return format.split(',').map(s => s.trim()).filter(Boolean);
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '-';
    return iso.slice(0, 10).replace(/-/g, '.');
};

export const AdminDashboard: React.FC = () => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('all');
    const [confirmAction, setConfirmAction] = useState<{ id: number; type: 'approved' | 'rejected'; name: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                setLoading(true);
                const res = await adminMentorApi.getApplications();
                const mentors: any[] = res?.mentors ?? [];
                setApplicants(mentors.map((m: any) => ({
                    id: m.mentorId,          // 백엔드: mentorId
                    userId: m.userId,
                    name: m.name ?? '-',
                    email: m.email ?? '',
                    company: m.company ?? '-',
                    role: m.title ?? '-',    // 백엔드: title
                    year: m.experience ?? '-',
                    date: formatDate(m.appliedAt), // 백엔드: appliedAt
                    status: (m.status ?? 'PENDING').toUpperCase(),
                    bio: m.bio ?? '',
                    skills: m.skills ?? [],
                    rejectReason: m.rejectReason ?? null,
                })));
            } catch (err) {
                setError('데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, []);

    const handleStatusClick = (id: number, type: 'approved' | 'rejected', name: string) => {
        setConfirmAction({ id, type, name });
        setRejectReason('');
    };

    const processStatusChange = async () => {
        if (!confirmAction) return;
        setProcessing(true);
        try {
            if (confirmAction.type === 'approved') {
                await adminMentorApi.approve(confirmAction.id);
            } else {
                await adminMentorApi.reject(confirmAction.id, rejectReason.trim() || undefined);
            }
            setApplicants(prev =>
                prev.map(app => app.id === confirmAction.id
                    ? { ...app, status: confirmAction.type === 'approved' ? 'APPROVED' : 'REJECTED' }
                    : app)
            );
        } catch {
            alert('처리 중 오류가 발생했습니다.');
        } finally {
            setProcessing(false);
            setConfirmAction(null);
            setRejectReason('');
        }
    };

    const filteredApplicants = applicants.filter(app => {
        if (filter === 'pending') return app.status === 'PENDING';
        if (filter === 'processed') return app.status !== 'PENDING';
        return true;
    });



    return (
        <div className="w-full max-w-6xl mx-auto pb-20 px-4 pt-36 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">관리자 대시보드</h2>
                    <p className="text-gray-500 mt-1">멘토 신청 현황을 상세 검토하고 승인 여부를 결정합니다.</p>
                </div>
                <div className="flex bg-white/50 p-1 rounded-xl border border-gray-200">
                    {(['all', 'pending', 'processed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f === 'all' ? '전체' : f === 'pending' ? '대기중' : '처리완료'}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="py-20 text-center text-gray-400 font-medium">불러오는 중...</div>
            )}

            {error && (
                <div className="py-20 text-center text-red-400 font-medium">{error}</div>
            )}

            {!loading && !error && (
                <div className="space-y-6">
                    {filteredApplicants.map(app => (
                        <GlassCard key={app.id} className="p-6 flex flex-col gap-6 border-l-4 border-l-gray-200 hover:border-l-cyan-500 transition-all">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{app.company}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{app.role} ({app.year})</span>
                                    </div>
                                    {app.bio && (
                                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded-lg leading-relaxed">"{app.bio}"</p>
                                    )}
                                    <div className="mt-4">
                                        <strong className="text-gray-400 text-xs uppercase block mb-1">전문 분야 (Skills)</strong>
                                        <div className="flex flex-wrap gap-1">
                                            {app.skills.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold border border-cyan-100">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                    <span className="text-xs text-gray-400 mb-2">신청일: {app.date}</span>
                                    {app.email && <span className="text-xs text-gray-400 truncate max-w-[140px]">{app.email}</span>}
                                    {app.status === 'PENDING' ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <button
                                                onClick={() => handleStatusClick(app.id, 'approved', app.name)}
                                                className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-bold text-sm shadow-md shadow-cyan-500/20 transition-colors w-full"
                                            >
                                                승인하기
                                            </button>
                                            <button
                                                onClick={() => handleStatusClick(app.id, 'rejected', app.name)}
                                                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-bold text-sm transition-colors w-full"
                                            >
                                                거절하기
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end gap-1 w-full">
                                            <span className={`px-4 py-2 rounded-xl text-sm font-bold border w-full text-center ${
                                                app.status === 'APPROVED'
                                                    ? 'bg-green-50 text-green-600 border-green-200'
                                                    : 'bg-gray-50 text-gray-400 border-gray-200'
                                            }`}>
                                                {app.status === 'APPROVED' ? '승인됨' : '거절됨'}
                                            </span>
                                            {app.rejectReason && (
                                                <span className="text-xs text-red-400 text-right leading-tight">{app.rejectReason}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    {filteredApplicants.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-dashed border-gray-200">
                            <div className="text-4xl mb-3 opacity-30">📭</div>
                            <p className="text-gray-400 font-medium">해당하는 신청 내역이 없습니다.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                    <div className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-fade-in-up border border-white/50">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto text-2xl ${confirmAction.type === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {confirmAction.type === 'approved' ? '✅' : '🚫'}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                            '{confirmAction.name}' 님을<br />
                            <span className={confirmAction.type === 'approved' ? 'text-green-600' : 'text-red-600'}>
                                {confirmAction.type === 'approved' ? '승인' : '거절'}
                            </span> 하시겠습니까?
                        </h3>
                        <p className="text-gray-500 text-xs mb-4 text-center leading-relaxed">
                            {confirmAction.type === 'approved'
                                ? '승인 시 해당 멘토는 멘티 목록에 노출되며 활동이 가능해집니다.'
                                : '거절 시 신청이 반려되며, 해당 멘토에게 알림이 전송됩니다.'}
                        </p>

                        {confirmAction.type === 'rejected' && (
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 block mb-1 ml-1">거절 사유 (필수)</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none placeholder-red-300 text-gray-700"
                                    placeholder="예: 경력 증빙 자료가 부족합니다."
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1 py-3" onClick={() => setConfirmAction(null)}>취소</Button>
                            <Button
                                variant="primary"
                                className={`flex-1 py-3 border-none ${confirmAction.type === 'approved' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'}`}
                                onClick={processStatusChange}
                                disabled={processing || (confirmAction.type === 'rejected' && !rejectReason.trim())}
                            >
                                {processing ? '처리 중...' : '확인'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
