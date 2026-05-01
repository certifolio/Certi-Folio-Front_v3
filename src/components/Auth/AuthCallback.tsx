import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

/**
 * OAuth 콜백 처리 컴포넌트
 * 백엔드가 /auth/callback?token=xxx 로 리다이렉트하면
 * 토큰을 저장하고 유저 프로필을 불러옵니다.
 *
 * [주의] React.StrictMode에서 useEffect가 2번 실행되므로
 * ref를 사용해 중복 실행을 방지합니다.
 */

// 토큰을 컴포넌트 바깥에서 한 번만 추출 (StrictMode 재마운트에도 안전)
const extractedToken = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
})();

export const AuthCallback: React.FC = () => {
    const { handleOAuthCallback } = useAuth();
    const { navigate } = useApp();
    const processedRef = useRef(false);

    useEffect(() => {
        // StrictMode 이중 실행 방지
        if (processedRef.current) return;
        processedRef.current = true;

        if (extractedToken) {
            // URL에서 토큰 제거 (주소창 노출 방지)
            window.history.replaceState({}, document.title, window.location.pathname);

            handleOAuthCallback(extractedToken).then(() => {
                navigate('dashboard');
            }).catch((err) => {
                console.error('OAuth callback failed:', err);
                navigate('login');
            });
        } else {
            // 토큰이 없으면 (잘못된 접근) 로그인 페이지로
            navigate('login');
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-160px)] animate-fade-in-up">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">로그인 처리 중...</p>
            </div>
        </div>
    );
};
