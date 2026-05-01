import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ViewType } from '../components/Layout/Navbar';

interface AppContextType {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    navigate: (view: ViewType) => void;
    showAdmin: boolean;
    setShowAdmin: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const HISTORY_VIEW_KEY = 'certiFolioView';

const viewTypes = new Set<ViewType>([
    'home',
    'dashboard',
    'jobs',
    'login',
    'report',
    'flow-test',
    'info-management',
    'portfolio-draft',
    'mentoring',
    'notifications',
    'admin-dashboard',
    'auth-callback',
    'community',
    'community-post',
    'community-create',
]);

type AppHistoryState = {
    [HISTORY_VIEW_KEY]?: ViewType;
};

const getViewFromHistoryState = (state: unknown): ViewType | null => {
    if (!state || typeof state !== 'object') return null;

    const view = (state as AppHistoryState)[HISTORY_VIEW_KEY];
    return view && viewTypes.has(view) ? view : null;
};

const createHistoryState = (state: unknown, view: ViewType): AppHistoryState => ({
    ...(state && typeof state === 'object' ? state : {}),
    [HISTORY_VIEW_KEY]: view,
});

const getInitialView = (): ViewType => {
    if (window.location.pathname === '/auth/callback') {
        return 'auth-callback';
    }
    return 'home';
};

const getNextHistoryUrl = (view: ViewType) => {
    if (window.location.pathname === '/auth/callback' && view !== 'auth-callback') {
        return window.location.origin + '/';
    }

    return window.location.href;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [currentView, updateCurrentView] = useState<ViewType>(() => (
        getViewFromHistoryState(window.history.state) ?? getInitialView()
    ));
    const currentViewRef = useRef(currentView);
    const [showAdmin, setShowAdmin] = useState(false);

    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    useEffect(() => {
        const historyView = getViewFromHistoryState(window.history.state);
        if (historyView !== currentView) {
            window.history.replaceState(
                createHistoryState(window.history.state, currentView),
                document.title,
                getNextHistoryUrl(currentView),
            );
        }
    }, []);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const nextView = getViewFromHistoryState(event.state) ?? getInitialView();
            currentViewRef.current = nextView;
            updateCurrentView(nextView);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const setCurrentView = useCallback((view: ViewType) => {
        if (currentViewRef.current !== view) {
            window.history.pushState(
                createHistoryState(window.history.state, view),
                document.title,
                getNextHistoryUrl(view),
            );

            currentViewRef.current = view;
            updateCurrentView(view);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const navigate = setCurrentView;

    return (
        <AppContext.Provider value={{
            currentView,
            setCurrentView,
            navigate,
            showAdmin,
            setShowAdmin,
        }}>
            {children}
        </AppContext.Provider>
    );
};
