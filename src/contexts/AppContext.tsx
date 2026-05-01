import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ViewType =
  | 'home'
  | 'dashboard'
  | 'jobs'
  | 'login'
  | 'report'
  | 'flow-test'
  | 'info-management'
  | 'portfolio-draft'
  | 'mentoring'
  | 'notifications'
  | 'admin-dashboard'
  | 'auth-callback'
  | 'community'
  | 'community-post'
  | 'community-create';

type NavigateOptions = {
  postId?: string;
  replace?: boolean;
};

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType, options?: NavigateOptions) => void;
  navigate: (view: ViewType, options?: NavigateOptions) => void;
  showAdmin: boolean;
  setShowAdmin: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getViewFromPathname = (pathname: string): ViewType => {
  if (pathname === '/auth/callback') return 'auth-callback';
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/jobs') return 'jobs';
  if (pathname === '/login') return 'login';
  if (pathname === '/report') return 'report';
  if (pathname === '/spec/input') return 'flow-test';
  if (pathname === '/my-info') return 'info-management';
  if (pathname === '/portfolio/draft') return 'portfolio-draft';
  if (pathname === '/mentoring') return 'mentoring';
  if (pathname === '/notifications') return 'notifications';
  if (pathname === '/admin') return 'admin-dashboard';
  if (pathname === '/community') return 'community';
  if (pathname === '/community/create') return 'community-create';
  if (/^\/community\/[^/]+$/.test(pathname)) return 'community-post';
  return 'home';
};

const getPathFromView = (view: ViewType, options?: NavigateOptions): string => {
  switch (view) {
    case 'dashboard':
      return '/dashboard';
    case 'jobs':
      return '/jobs';
    case 'login':
      return '/login';
    case 'report':
      return '/report';
    case 'flow-test':
      return '/spec/input';
    case 'info-management':
      return '/my-info';
    case 'portfolio-draft':
      return '/portfolio/draft';
    case 'mentoring':
      return '/mentoring';
    case 'notifications':
      return '/notifications';
    case 'admin-dashboard':
      return '/admin';
    case 'auth-callback':
      return '/auth/callback';
    case 'community':
      return '/community';
    case 'community-create':
      return '/community/create';
    case 'community-post':
      return options?.postId ? `/community/${options.postId}` : '/community';
    case 'home':
    default:
      return '/';
  }
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [showAdmin, setShowAdmin] = useState(false);

  const currentView = useMemo(
    () => getViewFromPathname(location.pathname),
    [location.pathname],
  );

  const setCurrentView = useCallback((view: ViewType, options?: NavigateOptions) => {
    const path = getPathFromView(view, options);
    routerNavigate(path, { replace: options?.replace ?? false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [routerNavigate]);

  const navigate = setCurrentView;

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      navigate,
      showAdmin,
      setShowAdmin,
    }}
    >
      {children}
    </AppContext.Provider>
  );
};
