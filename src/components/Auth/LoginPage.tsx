import React from 'react';
import { GlassCard } from '../UI/GlassCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://ec2-3-35-37-53.ap-northeast-2.compute.amazonaws.com';

const handleOAuthLogin = (provider: 'kakao' | 'naver' | 'google') => {
  window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
};

export const LoginPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-4 animate-fade-in-up w-full">
      <GlassCard className="w-full max-w-md p-10 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl border-white/80">

        {/* Logo/Icon */}
        <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-purple-500/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">로그인</h2>
        <p className="text-gray-500 mb-10">SNS 계정으로 간편하게 시작하세요</p>

        <div className="w-full space-y-4">
          {/* Kakao Login */}
          <button
            onClick={() => handleOAuthLogin('kakao')}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#FEE500] text-[#000000] font-bold text-base hover:bg-[#FDD835] transition-all shadow-sm group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C5.925 3 1 6.925 1 11.75C1 14.85 2.975 17.55 5.925 19.075L4.725 23.55C4.6 24.025 5.125 24.375 5.525 24.1L10.775 20.625C11.175 20.675 11.575 20.7 12 20.7C18.075 20.7 23 16.775 23 11.95C23 7.125 18.075 3 12 3Z" />
            </svg>
            카카오로 시작하기
          </button>

          {/* Naver Login */}
          <button
            onClick={() => handleOAuthLogin('naver')}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#03C75A] text-white font-bold text-base hover:bg-[#02b351] transition-all shadow-sm"
          >
            <span className="font-black text-lg">N</span>
            네이버로 시작하기
          </button>

          {/* Google Login */}
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google로 시작하기
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 w-full">
          <p className="text-xs text-gray-400">
            로그인 시 <span className="underline cursor-pointer hover:text-gray-600">이용약관</span> 및 <span className="underline cursor-pointer hover:text-gray-600">개인정보처리방침</span>에 동의하게 됩니다.
          </p>
        </div>

      </GlassCard>
    </div>
  );
};