import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, ApiError } from '../api/client';

// 백엔드 UserResponseDTO 기준
interface UserProfile {
    id: number;
    name: string | null;
    email: string | null;
    picture: string | null;
    role: string; // 'USER' | 'ADMIN'
    provider: string;
    birthYear: number | null;
}

interface AuthContextType {
    isLoggedIn: boolean;
    setIsLoggedIn: (value: boolean) => void;
    userProfile: UserProfile | null;
    handleLogin: () => void;
    handleLogout: () => void;
    handleOAuthCallback: (token: string) => Promise<void>;
    token: string | null;
    refreshProfile: () => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const fetchUserProfile = async () => {
        try {
            // client.ts의 handleResponse가 ApiResponse.result를 자동 추출함
            const profile: UserProfile = await apiClient.get('/api/users/me');
            setUserProfile(profile);
            setIsLoggedIn(true);
            console.log('[Auth] 유저 프로필 로드:', profile);
            return profile;
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                handleLogout();
            }
            throw err;
        }
    };

    const handleOAuthCallback = async (newToken: string) => {
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
        await fetchUserProfile();
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('neon_spec_flow_data');
        setToken(null);
        setUserProfile(null);
        setIsLoggedIn(false);
    };

    // 앱 시작 시: localStorage에 토큰이 있으면 서버에 유효성 검증
    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        if (savedToken) {
            fetchUserProfile().catch(() => {
                // 토큰이 유효하지 않으면 자동 로그아웃
                console.warn('[Auth] 저장된 토큰이 유효하지 않아 로그아웃합니다.');
                handleLogout();
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            setIsLoggedIn,
            userProfile,
            handleLogin,
            handleLogout,
            handleOAuthCallback,
            token,
            refreshProfile: fetchUserProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
