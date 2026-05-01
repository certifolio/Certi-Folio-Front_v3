import React, { useState, useEffect, useRef, useCallback } from 'react';
import { groupChatApi, type GroupChatMessage } from '../../api/groupChatApi';
import { useAuth } from '../../contexts/AuthContext';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

const WS_BASE_URL = import.meta.env.VITE_API_URL || 'http://ec2-3-35-37-53.ap-northeast-2.compute.amazonaws.com';

interface GroupChatRoomProps {
    roomId: number;
    roomName: string;
    onBack: () => void;
}

interface DisplayMessage {
    id?: number;
    sender: 'me' | 'other' | 'system';
    senderName?: string;
    senderProfileImage?: string | null;
    text: string;
    sentAt?: string;
}

export const GroupChatRoom: React.FC<GroupChatRoomProps> = ({ roomId, roomName, onBack }) => {
    const { userProfile } = useAuth();
    const currentUserId = userProfile ? Number(userProfile.id) : null;

    const [message, setMessage] = useState('');
    const [history, setHistory] = useState<DisplayMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const stompClientRef = useRef<Client | null>(null);
    const messageIdsRef = useRef<Set<number>>(new Set());

    const mapMessage = useCallback((m: any): DisplayMessage => ({
        id: m.id,
        sender: m.type === 'SYSTEM' ? 'system' : (m.senderId === currentUserId || m.isMine ? 'me' : 'other'),
        senderName: m.senderName,
        senderProfileImage: m.senderProfileImage,
        text: m.content,
        sentAt: m.sentAt,
    }), [currentUserId]);

    // WebSocket 연결
    const connectWebSocket = useCallback((rId: number) => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (str) => {
                if (str.includes('ERROR')) console.error('[GroupChat STOMP]', str);
            },
        });

        client.onConnect = () => {
            setWsConnected(true);
            client.subscribe(`/topic/group-chat.${rId}`, (msg: IMessage) => {
                try {
                    const data = JSON.parse(msg.body);
                    const newMsg = mapMessage(data);

                    if (newMsg.id && messageIdsRef.current.has(newMsg.id)) return;
                    if (newMsg.id) messageIdsRef.current.add(newMsg.id);

                    setHistory(prev => {
                        if (newMsg.sender === 'me') {
                            const hasOptimistic = prev.some(m => !m.id && m.sender === 'me');
                            if (hasOptimistic) {
                                let replaced = false;
                                return prev.map(m => {
                                    if (!replaced && !m.id && m.sender === 'me') {
                                        replaced = true;
                                        return newMsg;
                                    }
                                    return m;
                                });
                            }
                        }
                        return [...prev, newMsg];
                    });
                } catch (e) {
                    console.error('[GroupChat] 메시지 파싱 에러:', e);
                }
            });
        };

        client.onDisconnect = () => setWsConnected(false);
        client.onStompError = () => setWsConnected(false);
        client.activate();
        stompClientRef.current = client;
    }, [mapMessage]);

    // 초기화: 메시지 로드 + WebSocket 연결
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setHistory([]);
            messageIdsRef.current = new Set();

            try {
                const res = await groupChatApi.getMessages(roomId);
                const msgs = (res.messages || []).map(mapMessage);
                msgs.forEach((m: DisplayMessage) => { if (m.id) messageIdsRef.current.add(m.id); });
                setHistory(msgs);
                setHasMore(res.hasNext);
                setNextCursor(res.nextCursor);
                connectWebSocket(roomId);
            } catch (err) {
                console.error('그룹 채팅 초기화 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        init();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            setWsConnected(false);
        };
    }, [roomId, connectWebSocket, mapMessage]);

    // 이전 메시지 로드
    const loadOlderMessages = async () => {
        if (!hasMore || !nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await groupChatApi.getMessages(roomId, nextCursor);
            const msgs = (res.messages || []).map(mapMessage);
            msgs.forEach((m: DisplayMessage) => { if (m.id) messageIdsRef.current.add(m.id); });
            setHistory(prev => [...msgs, ...prev]);
            setHasMore(res.hasNext);
            setNextCursor(res.nextCursor);
        } catch (err) {
            console.error('이전 메시지 로드 실패:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // 자동 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    // 메시지 전송
    const handleSend = async (text: string) => {
        if (!text.trim() || sending) return;

        const tempMsg: DisplayMessage = { sender: 'me', text, senderName: userProfile?.name || '', sentAt: new Date().toISOString() };
        setHistory(prev => [...prev, tempMsg]);
        setMessage('');
        setSending(true);

        try {
            await groupChatApi.sendMessage(roomId, text);
        } catch (err) {
            console.error('메시지 전송 실패:', err);
            setHistory(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && !updated[lastIdx].id) {
                    updated[lastIdx] = { ...updated[lastIdx], text: text + ' (전송 실패)' };
                }
                return updated;
            });
        } finally {
            setSending(false);
        }
    };

    const formatTime = (sentAt?: string) => {
        if (!sentAt) return '';
        return new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white/90 backdrop-blur-md flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {roomName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{roomName}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-xs text-gray-500">{wsConnected ? '실시간 연결' : '연결 중...'}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 custom-scrollbar" ref={scrollRef}>
                {hasMore && (
                    <div className="text-center">
                        <button
                            onClick={loadOlderMessages}
                            disabled={loadingMore}
                            className="text-xs text-cyan-600 font-bold hover:underline disabled:text-gray-400"
                        >
                            {loadingMore ? '불러오는 중...' : '이전 메시지 보기'}
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-gray-400">메시지 불러오는 중...</p>
                        </div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-4xl mb-3">🏢</div>
                            <p className="text-sm text-gray-400">첫 메시지를 보내보세요!</p>
                        </div>
                    </div>
                ) : (
                    history.map((msg, idx) => (
                        msg.sender === 'system' ? (
                            <div key={msg.id || idx} className="text-center text-xs text-gray-400 bg-gray-100/50 py-1 px-3 rounded-full mx-auto w-fit">
                                {msg.text}
                            </div>
                        ) : (
                            <div key={msg.id || idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'other' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 mr-2 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500">
                                        {msg.senderProfileImage ? (
                                            <img src={msg.senderProfileImage} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            msg.senderName?.charAt(0) || '?'
                                        )}
                                    </div>
                                )}
                                <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                    {msg.sender === 'other' && msg.senderName && (
                                        <span className="text-[11px] text-gray-500 mb-1 px-1 font-medium">{msg.senderName}</span>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.sender === 'me'
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-tr-none'
                                            : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.sentAt)}</span>
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(message); }} className="flex gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        disabled={sending}
                        className="flex-1 bg-gray-100 border-none rounded-2xl px-5 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-sm transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || sending}
                        className="bg-cyan-600 text-white p-3 rounded-2xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};
