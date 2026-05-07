import React from 'react';
import { Button } from './Button';

interface FullPageLockOverlayProps {
    onLogin: () => void;
    message?: string;
    description?: string;
}

export const FullPageLockOverlay = ({ onLogin, message = '로그인이 필요한 서비스입니다', description = '개인 맞춤형 커리어 분석 리포트와\n로드맵 서비스를 이용하시려면 로그인해주세요.' }: FullPageLockOverlayProps) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50 text-center max-w-md transform transition-transform duration-300 pointer-events-auto shadow-cyan-500/10">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 text-white">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{message}</h3>
            <p className="text-gray-500 mb-8 leading-relaxed whitespace-pre-line">
                {description}
            </p>
            <Button variant="neon" onClick={onLogin} className="w-full py-4 text-base font-bold shadow-cyan-500/25">
                로그인하고 시작하기
            </Button>
            <p className="mt-4 text-xs text-gray-400">
                3초 만에 간편 로그인
            </p>
        </div>
    </div>
);
