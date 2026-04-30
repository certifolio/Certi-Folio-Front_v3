import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../UI/Button';
import { notificationApi } from '../../api/notificationApi';

export type ViewType = 'home' | 'dashboard' | 'jobs' | 'login' | 'report' | 'flow-test' | 'info-management' | 'mentoring' | 'notifications' | 'admin-dashboard' | 'auth-callback' | 'community' | 'community-post' | 'community-create';

interface NavbarProps {
    isLoggedIn: boolean;
    onLoginToggle: () => void;
    onNavigate: (view: ViewType) => void;
    currentView: ViewType;
    onOpenAdmin: () => void;
}

import { useAuth } from '../../contexts/AuthContext';

export const Navbar = ({ isLoggedIn, onLoginToggle, onNavigate, currentView, onOpenAdmin }: NavbarProps) => {
    const { userProfile } = useAuth();
    const [showNotif, setShowNotif] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // 최근 알림 불러오기
    const loadRecentNotifs = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const res = await notificationApi.getRecentNotifications();
            const items = Array.isArray(res) ? res : (res?.notifications || []);
            setRecentNotifs(items.slice(0, 5));
        } catch {
            setRecentNotifs([]);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn) loadRecentNotifs();
    }, [isLoggedIn, loadRecentNotifs]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotif(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { label: 'AI 진단', view: 'dashboard' as const },
        { label: '정보 입력', view: 'flow-test' as const },
        { label: '멘토링', view: 'mentoring' as const },
        { label: '채용 정보', view: 'jobs' as const },
        { label: '커뮤니티', view: 'community' as const },
    ];

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/50 transition-all duration-300 shadow-sm h-16">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <span
                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-purple-600 cursor-pointer"
                        onClick={() => onNavigate('home')}
                    >
                        Certi-Folio
                    </span>
                    <div className="hidden md:flex gap-1">
                        {navItems.map((item, idx) => (
                            <button
                                key={`${item.label}-${idx}`}
                                onClick={() => onNavigate(item.view)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${(currentView === item.view || (currentView === 'report' && item.view === 'dashboard'))
                                    ? 'text-cyan-600 bg-cyan-50'
                                    : 'text-gray-600 hover:text-cyan-600 hover:bg-white/50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">

                    {/* Admin Button - only visible for admins */}
                    {userProfile?.role === 'ADMIN' && (
                        <button
                            onClick={onOpenAdmin}
                            className="text-xs font-bold text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            ⚙️ 관리자
                        </button>
                    )}

                    {isLoggedIn ? (
                        <>
                            {/* Notification */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setShowNotif(!showNotif)}
                                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors relative rounded-full hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                </button>
                                {showNotif && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right z-50 flex flex-col max-h-96">
                                        <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
                                            <span className="text-xs font-bold text-gray-700">알림 센터</span>
                                            <span className="text-xs text-cyan-600 cursor-pointer hover:underline">모두 읽음</span>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {recentNotifs.length > 0 ? recentNotifs.map((n: any) => (
                                                <div key={n.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors group">
                                                    <p className="text-xs text-gray-800 font-bold mb-1 group-hover:text-cyan-700">{n.title}</p>
                                                    <p className="text-[10px] text-gray-500 leading-relaxed">{n.message || n.content || ''}</p>
                                                </div>
                                            )) : (
                                                <div className="p-6 text-center text-xs text-gray-400">새로운 알림이 없습니다.</div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-gray-100 bg-white flex-shrink-0 text-center">
                                            <button
                                                onClick={() => { setShowNotif(false); onNavigate('notifications'); }}
                                                className="text-xs font-bold text-gray-600 hover:text-cyan-600 py-1.5 w-full rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                                            >
                                                알림 전체 보기 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile */}
                            <div className="relative" ref={profileRef}>
                                <div
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-md"
                                >
                                    <img src="https://picsum.photos/50/50?random=99" className="rounded-full w-full h-full object-cover border-2 border-white" alt="Profile" />
                                </div>
                                {showProfileMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right z-50">
                                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                                            <img src={userProfile?.picture || "https://picsum.photos/50/50?random=99"} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{userProfile?.name || '사용자'}</p>
                                                <p className="text-[10px] text-gray-500">{userProfile?.email || ''}</p>
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            <button onClick={() => { onNavigate('info-management'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cyan-600 transition-colors flex items-center gap-2">
                                                <span className="text-lg">👤</span> 내 정보 관리
                                            </button>
                                        </div>
                                        <div className="border-t border-gray-50 py-1">
                                            <button onClick={() => { onLoginToggle(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                                                <span className="text-lg">🚪</span> 로그아웃
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Button variant="primary" onClick={() => onNavigate('login')} className="py-2 px-4 text-xs h-9">
                            로그인
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
};
