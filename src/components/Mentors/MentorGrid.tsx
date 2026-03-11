import React, { useState, useEffect } from 'react';
import { Mentor } from '../../types';
import { MentorCard } from './MentorCard';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { ChatModal } from './ChatModal';
import { mentorApi, mentoringApplicationApi } from '../../api/mentoringApi';
import { useAuth } from '../../contexts/AuthContext';


interface MentorGridProps {
    limit?: number;
    showAll?: boolean;
    filterCategory?: string;
}

export const MentorGrid: React.FC<MentorGridProps> = ({ limit, showAll, filterCategory }) => {
    const { isLoggedIn, token } = useAuth();
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [activeModal, setActiveModal] = useState<'none' | 'detail' | 'apply'>('none');
    const [applyTopic, setApplyTopic] = useState('');
    const [applyMessage, setApplyMessage] = useState('');
    const [isApplying, setIsApplying] = useState(false);

    // Chat Modal States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState<{ name: string, role: string, avatar: string, company: string } | null>(null);
    const [chatMentorId, setChatMentorId] = useState<number>(0);

    // 백엔드에서 멘토 목록 불러오기
    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const res = await mentorApi.searchMentors();
                const items = res.mentors || res;
                if (Array.isArray(items) && items.length > 0) {
                    setMentors(items.map((m: any) => ({
                        id: String(m.id),
                        name: m.name || m.nickname || '멘토',
                        role: m.expertise || m.role || '',
                        company: m.company || '',
                        imageUrl: m.profileImageUrl || `https://picsum.photos/100/100?random=${m.id}`,
                        bio: m.introduction || m.bio || '',
                        skills: m.skills || [],
                        available: m.available ?? true,
                    })));
                }
            } catch (err) {
                console.warn('멘토 API 호출 실패:', err);
            }
        };
        fetchMentors();
    }, []);

    // Handlers
    const handleViewDetail = (mentor: Mentor) => {
        setSelectedMentor(mentor);
        setActiveModal('detail');
    };

    const handleApply = (mentor: Mentor) => {
        setSelectedMentor(mentor);
        setApplyTopic('');
        setApplyMessage('');
        setActiveModal('apply');
    };

    const handleSubmitApplication = async () => {
        if (!selectedMentor || !isLoggedIn) return;
        setIsApplying(true);
        try {
            await mentoringApplicationApi.createApplication({
                mentorId: Number(selectedMentor.id),
                topic: applyTopic,
                description: applyMessage,
            });
            alert('멘토링 신청이 완료되었습니다!');
            closeModal();
        } catch (err) {
            console.error('신청 API 실패:', err);
            alert('멘토링 신청에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleOpenChat = (mentor: Mentor) => {
        setChatMentorId(Number(mentor.id));
        setChatTarget({
            name: mentor.name,
            role: mentor.role,
            avatar: mentor.imageUrl,
            company: mentor.company
        });
        setIsChatOpen(true);
    };

    const closeModal = () => {
        setActiveModal('none');
    };

    // Filter Logic
    let displayMentors = mentors;
    if (filterCategory && filterCategory !== '전체') {
        displayMentors = displayMentors.filter(m =>
            m.role.includes(filterCategory) || m.skills.some(s => s.includes(filterCategory))
        );
    }

    if (limit && !showAll) {
        displayMentors = displayMentors.slice(0, limit);
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {displayMentors.map(mentor => (
                    <MentorCard
                        key={mentor.id}
                        mentor={mentor}
                        onViewDetail={handleViewDetail}
                        onApply={handleApply}
                        onChat={handleOpenChat}
                    />
                ))}
            </div>

            {/* --- MODALS --- */}

            {/* 1. Detail Modal */}
            {activeModal === 'detail' && selectedMentor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

                        {/* Header Image Background */}
                        <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative">
                            <button onClick={closeModal} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="px-8 pb-8 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                            {/* Profile Image & Info */}
                            <div className="relative -mt-12 mb-4 flex justify-between items-end">
                                <img src={selectedMentor.imageUrl} alt={selectedMentor.name} className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover bg-white" />
                                <div className="flex gap-2 mb-2">
                                    <Button variant="secondary" className="py-2 px-4 text-xs h-9 flex items-center gap-1" onClick={() => handleOpenChat(selectedMentor)}>
                                        💬 채팅
                                    </Button>
                                    <Button variant="primary" className="py-2 px-4 text-xs h-9 bg-cyan-600 hover:bg-cyan-700 border-none shadow-cyan-500/30" onClick={() => setActiveModal('apply')}>
                                        신청하기
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{selectedMentor.name}</h3>
                                <p className="text-gray-500 font-medium">{selectedMentor.role} @ {selectedMentor.company}</p>
                            </div>

                            <div className="mt-6 space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">멘토 소개</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedMentor.bio}
                                        <br /><br />
                                        안녕하세요! {selectedMentor.company}에서 {selectedMentor.role}로 일하고 있는 {selectedMentor.name}입니다.
                                        주니어 개발자들의 성장통을 누구보다 잘 이해하고 있습니다.
                                        코드 리뷰부터 커리어 패스 설계까지, 현실적이고 구체적인 조언을 드립니다.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">전문 분야</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMentor.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">멘토링 후기 (4.9/5.0)</h4>
                                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 border border-gray-100">
                                        <div className="flex items-center mb-2">
                                            <span className="font-bold text-gray-800 mr-2">김*수 님</span>
                                            <div className="flex text-yellow-400 text-xs">★★★★★</div>
                                        </div>
                                        "현업에서 겪는 고민들을 명쾌하게 해결해주셨습니다. 특히 시스템 설계 관련 조언이 정말 큰 도움이 되었어요!"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Chat Modal (Unified) */}
            {chatTarget && (
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    mentorId={chatMentorId}
                    target={chatTarget}
                />
            )}

            {/* 3. Apply Modal */}
            {activeModal === 'apply' && selectedMentor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fade-in-up border border-white/50">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-cyan-100 p-1">
                                <img src={selectedMentor.imageUrl} className="w-full h-full rounded-full object-cover" alt="profile" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900">1:1 멘토링 신청</h3>
                            <p className="text-gray-500 text-sm mt-1">{selectedMentor.name} 멘토님에게 신청합니다.</p>
                        </div>

                        <div className="space-y-4">
                            <Input label="신청 주제" placeholder="예: 이력서 첨삭, 커리어 상담" value={applyTopic} onChange={(e) => setApplyTopic(e.target.value)} />
                            <div>
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1 mb-1 block">희망 일정</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-2 rounded-xl border border-cyan-500 bg-cyan-50 text-cyan-700 text-sm font-bold">2/25 (화) 20:00</button>
                                    <button className="py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-cyan-300 hover:bg-cyan-50">2/27 (목) 19:00</button>
                                    <button className="py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-cyan-300 hover:bg-cyan-50">3/01 (토) 14:00</button>
                                    <button className="py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-cyan-300 hover:bg-cyan-50">직접 입력</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1 mb-1 block">사전 질문 내용</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 resize-none h-24"
                                    placeholder="멘토님에게 궁금한 점을 미리 남겨주세요."
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button variant="secondary" className="flex-1" onClick={closeModal}>취소</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSubmitApplication} disabled={isApplying}>
                                {isApplying ? '신청 중...' : '신청 완료'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};