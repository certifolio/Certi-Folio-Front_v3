import React, { useState, useEffect } from 'react';
import { groupChatApi, type GroupChatRoom as GroupChatRoomType } from '../../api/groupChatApi';
import { GroupChatRoom } from './GroupChatRoom';
import { Button } from '../UI/Button';
import { useAuth } from '../../contexts/AuthContext';

export const GroupChatTab: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const [viewMode, setViewMode] = useState<'list' | 'room'>('list');
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [rooms, setRooms] = useState<GroupChatRoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<GroupChatRoomType | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createCompany, setCreateCompany] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState<number | null>(null);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = activeTab === 'my'
                ? await groupChatApi.getMyRooms()
                : await groupChatApi.getAllRooms();
            setRooms(res.rooms || []);
        } catch (err) {
            console.warn('채팅방 목록 로드 실패:', err);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) fetchRooms();
    }, [activeTab, isLoggedIn]);

    const handleCreateRoom = async () => {
        if (!createCompany.trim()) return;
        setCreating(true);
        try {
            await groupChatApi.createRoom({
                chattingroomName: createCompany.trim(),
                description: createDesc.trim() || undefined,
            });
            setShowCreateModal(false);
            setCreateCompany('');
            setCreateDesc('');
            fetchRooms();
        } catch (err) {
            console.error('채팅방 생성 실패:', err);
            alert('채팅방 생성에 실패했습니다.');
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = async (room: GroupChatRoomType) => {
        if (room.joined) {
            setSelectedRoom(room);
            setViewMode('room');
            return;
        }
        setJoining(room.roomId);
        try {
            await groupChatApi.joinRoom(room.roomId);
            setSelectedRoom({ ...room, joined: true });
            setViewMode('room');
        } catch (err) {
            console.error('채팅방 참여 실패:', err);
            alert('채팅방 참여에 실패했습니다.');
        } finally {
            setJoining(null);
        }
    };

    const handleLeaveRoom = async (roomId: number) => {
        if (!window.confirm('정말 이 채팅방을 나가시겠습니까?')) return;
        try {
            await groupChatApi.leaveRoom(roomId);
            fetchRooms();
        } catch (err) {
            console.error('채팅방 나가기 실패:', err);
        }
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    // 채팅방 내부 뷰
    if (viewMode === 'room' && selectedRoom) {
        return (
            <GroupChatRoom
                roomId={selectedRoom.roomId}
                roomName={selectedRoom.chattingroomName}
                onBack={() => { setViewMode('list'); fetchRooms(); }}
            />
        );
    }

    // 채팅방 목록 뷰
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'all'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        전체 채팅방
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'my'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        내 채팅방
                    </button>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm py-2 px-4">
                    + 채팅방 만들기
                </Button>
            </div>

            {/* Room List */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        채팅방을 불러오는 중...
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-3">🏢</div>
                        <p className="text-gray-400 text-sm">
                            {activeTab === 'my' ? '참여 중인 채팅방이 없습니다.' : '아직 만들어진 채팅방이 없습니다.'}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 text-sm text-cyan-600 font-bold hover:underline"
                        >
                            첫 채팅방을 만들어보세요!
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {rooms.map(room => (
                            <div
                                key={room.roomId}
                                className="p-4 hover:bg-white/80 transition-colors flex items-center gap-4 group"
                            >
                                {/* Company Avatar */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md shadow-blue-500/20">
                                    {room.chattingroomName.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleJoinRoom(room)}>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 truncate group-hover:text-cyan-700 transition-colors">
                                            {room.chattingroomName}
                                        </h4>
                                        {room.joined && (
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">참여중</span>
                                        )}
                                    </div>
                                    {room.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{room.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {room.participantCount}명
                                        </span>
                                        {room.lastMessageAt && (
                                            <span>최근 활동 {formatTime(room.lastMessageAt)}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {room.joined ? (
                                        <>
                                            <button
                                                onClick={() => handleJoinRoom(room)}
                                                className="px-4 py-2 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-xl border border-cyan-100 hover:bg-cyan-100 transition-colors"
                                            >
                                                입장
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLeaveRoom(room.roomId); }}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                title="나가기"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleJoinRoom(room)}
                                            disabled={joining === room.roomId}
                                            className="px-4 py-2 bg-white text-gray-600 text-xs font-bold rounded-xl border border-gray-200 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 transition-all disabled:opacity-50"
                                        >
                                            {joining === room.roomId ? '참여 중...' : '참여하기'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fade-in-up border border-white/50">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-blue-500/30">
                                🏢
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900">기업 채팅방 만들기</h3>
                            <p className="text-gray-500 text-sm mt-1">같은 기업에 관심 있는 사람들과 대화하세요.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1 mb-1 block">채팅방 이름 *</label>
                                <input
                                    type="text"
                                    value={createCompany}
                                    onChange={(e) => setCreateCompany(e.target.value)}
                                    placeholder="예: 삼성전자, 네이버, 카카오"
                                    maxLength={100}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                                />
                            </div>
                            <div>
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1 mb-1 block">설명 (선택)</label>
                                <textarea
                                    value={createDesc}
                                    onChange={(e) => setCreateDesc(e.target.value)}
                                    placeholder="이 채팅방에 대한 간단한 소개를 작성해주세요."
                                    maxLength={500}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 resize-none h-24"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>취소</Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleCreateRoom}
                                disabled={!createCompany.trim() || creating}
                            >
                                {creating ? '생성 중...' : '채팅방 만들기'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
