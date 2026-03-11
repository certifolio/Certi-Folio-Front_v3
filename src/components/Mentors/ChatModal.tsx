import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../../api/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

const WS_BASE_URL = import.meta.env.VITE_API_URL || 'http://3.35.37.53';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId?: number;
  menteeUserId?: number;
  target: {
    name: string;
    role: string;
    avatar: string;
    company?: string;
  };
}

interface ChatMessage {
  id?: number;
  sender: 'me' | 'other' | 'system';
  senderName?: string;
  text: string;
  sentAt?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, mentorId, menteeUserId, target }) => {
  const { userProfile } = useAuth();
  const currentUserId = userProfile ? Number(userProfile.id) : null;
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const messageIdsRef = useRef<Set<number>>(new Set());

  // Quick Replies
  const quickReplies = [
    "안녕하세요! 👋",
    "멘토링 일정 문의드립니다.",
    "포트폴리오 첨삭 가능할까요?",
    "감사합니다!",
    "일정 변경 가능할까요?"
  ];

  // Map backend message to ChatMessage (senderId 비교로 me/other 판별)
  const mapMessage = useCallback((m: any): ChatMessage => ({
    id: m.id,
    sender: m.type === 'SYSTEM' ? 'system' : (m.senderId === currentUserId ? 'me' : 'other'),
    senderName: m.senderName,
    text: m.content,
    sentAt: m.sentAt,
  }), [currentUserId]);

  // Connect WebSocket STOMP
  const connectWebSocket = useCallback((roomId: number) => {
    // 이전 연결 정리
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        if (str.includes('ERROR')) console.error('[STOMP]', str);
      },
    });

    client.onConnect = () => {
      console.log('[WebSocket] 연결 성공, 채팅방 구독:', roomId);
      setWsConnected(true);

      // 채팅방 토픽 구독
      client.subscribe(`/topic/chat.${roomId}`, (msg: IMessage) => {
        try {
          const data = JSON.parse(msg.body);
          const newMsg = mapMessage(data);

          // 중복 방지: 이미 있는 메시지 ID는 무시
          if (newMsg.id && messageIdsRef.current.has(newMsg.id)) {
            return;
          }

          if (newMsg.id) {
            messageIdsRef.current.add(newMsg.id);
          }

          setHistory(prev => {
            // 내가 보낸 메시지: optimistic update (id 없는 'me' 메시지) 교체
            if (newMsg.sender === 'me') {
              const hasOptimistic = prev.some(m => !m.id && m.sender === 'me');
              if (hasOptimistic) {
                // 첫 번째 optimistic 메시지를 서버 확인 메시지로 교체
                let replaced = false;
                const updated = prev.map(m => {
                  if (!replaced && !m.id && m.sender === 'me') {
                    replaced = true;
                    return newMsg;
                  }
                  return m;
                });
                return updated;
              }
            }
            return [...prev, newMsg];
          });
        } catch (e) {
          console.error('[WebSocket] 메시지 파싱 에러:', e);
        }
      });
    };

    client.onDisconnect = () => {
      console.log('[WebSocket] 연결 해제');
      setWsConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('[WebSocket] STOMP 에러:', frame.headers['message']);
      setWsConnected(false);
    };

    client.activate();
    stompClientRef.current = client;
  }, [mapMessage]);

  // Initialize: create/get room, load history, connect WebSocket
  useEffect(() => {
    if (!isOpen || !mentorId) return;

    const initChat = async () => {
      setLoading(true);
      setError(null);
      setHistory([]);
      setChatRoomId(null);
      messageIdsRef.current = new Set();

      try {
        // 1. 채팅방 생성/조회
        const room = await chatApi.getOrCreateRoom(mentorId, menteeUserId);
        const roomId = room.chatRoomId;
        setChatRoomId(roomId);

        // 2. 기존 메시지 로드
        try {
          const historyRes = await chatApi.getRecentMessages(roomId);
          const messages = historyRes.messages || [];
          if (Array.isArray(messages) && messages.length > 0) {
            const mapped = messages.map((m: any) => mapMessage(m));
            mapped.forEach((m: ChatMessage) => {
              if (m.id) messageIdsRef.current.add(m.id);
            });
            setHistory(mapped);
          }
        } catch {
          // 메시지 없을 수 있음
        }

        // 3. WebSocket 연결
        connectWebSocket(roomId);
      } catch (err: any) {
        if (err?.status === 403) {
          setError('승인된 멘토링 관계가 있어야 채팅이 가능합니다.');
        } else {
          setError('채팅방을 불러오는데 실패했습니다.');
        }
        console.error('채팅 초기화 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      // 클린업: WebSocket 해제
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setWsConnected(false);
    };
  }, [isOpen, mentorId, connectWebSocket, mapMessage]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setChatRoomId(null);
      setHistory([]);
      setError(null);
      setWsConnected(false);
      messageIdsRef.current = new Set();
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Send message via REST API (server broadcasts to WebSocket subscribers)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatRoomId || sending) return;

    // Optimistic update (임시 메시지, WebSocket으로 실제 메시지 오면 교체됨)
    const tempMsg: ChatMessage = { sender: 'me', text, sentAt: new Date().toISOString() };
    setHistory(prev => [...prev, tempMsg]);
    setMessage('');
    setSending(true);

    try {
      await chatApi.sendMessage(chatRoomId, text);
      // REST 전송 성공 → 서버가 WebSocket으로 브로드캐스트 → onMessage에서 수신
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl w-full max-w-2xl h-[700px] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col border border-white/50">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={target.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-100" alt="profile" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">{target.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{target.company || 'Mentor'}</span>
              </div>
              <span className="text-xs text-gray-500 block mt-0.5">
                {target.role}
                {wsConnected && <span className="text-green-500 ml-2">● 실시간 연결</span>}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar" ref={scrollRef}>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-sm text-gray-400">채팅방 연결 중...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-red-50 rounded-2xl p-6 max-w-sm">
                <div className="text-3xl mb-3">🔒</div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}
          {!loading && !error && history.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-gray-400">첫 메시지를 보내보세요!</p>
              </div>
            </div>
          )}
          {!loading && !error && history.length > 0 && (
            <>
              <div className="text-center text-xs text-gray-400 my-4 bg-gray-100/50 py-1 px-3 rounded-full mx-auto w-fit">채팅 시작</div>
              {history.map((msg, idx) => (
                msg.sender === 'system' ? (
                  <div key={msg.id || idx} className="text-center text-xs text-gray-400 bg-gray-100/50 py-1 px-3 rounded-full mx-auto w-fit">
                    {msg.text}
                  </div>
                ) : (
                  <div key={msg.id || idx} className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex flex-col ${msg.sender === 'me' ? 'items-start' : 'items-end'} max-w-[70%]`}>
                      {msg.sender === 'other' && msg.senderName && (
                        <span className="text-[11px] text-gray-500 mb-1 px-1">{msg.senderName}</span>
                      )}
                      <div
                        className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'me'
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-tl-none'
                          : 'bg-white border border-gray-200 text-gray-700 rounded-tr-none'
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </>
          )}
        </div>

        {/* Input Area */}
        {!error && (
          <div className="p-5 bg-white border-t border-gray-100">
            {/* Quick Replies */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply)}
                  disabled={!chatRoomId || sending}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-50 text-gray-600 text-xs font-bold hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 border border-gray-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reply}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(message);
              }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={chatRoomId ? "메시지를 입력하세요..." : "연결 중..."}
                  disabled={!chatRoomId || sending}
                  className="w-full bg-gray-100 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm transition-all pr-12 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim() || !chatRoomId || sending}
                className="bg-cyan-600 text-white p-4 rounded-2xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center aspect-square"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};