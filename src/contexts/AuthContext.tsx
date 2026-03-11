import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiClient, ApiError } from '../api/client';

interface UserProfile {
    id: string;
    name: string | null;
    nickname: string | null;
    email: string | null;
    profileImage: string | null;
    provider: string;
    phone: string | null;
    location: string | null;
    university: string | null;
    major: string | null;
    year: string | null;
    company: string | null;
    bio: string | null;
    isInfoInputted: boolean;
    isAdmin: boolean;
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
            const response = await apiClient.get('/api/user/me');
            const profile: UserProfile = response.data || response;
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
        setToken(null);
        setUserProfile(null);
        setIsLoggedIn(false);
    };

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
