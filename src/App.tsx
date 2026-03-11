import React, { useState, useEffect } from 'react';
import { MentorGrid } from './components/Mentors/MentorGrid';
import { MentoringPage } from './components/Mentors/MentoringPage';
import { Button } from './components/UI/Button';
import { SpecScore } from './components/Dashboard/SpecScore';
import { SpecFlowTest } from './components/Spec/SpecFlowTest';
import { InfoManagement } from './components/Spec/InfoManagement';
import { LoginPage } from './components/Auth/LoginPage';
import { AuthCallback } from './components/Auth/AuthCallback';
import { SpecReport } from './components/Spec/SpecReport';
import { JobDashboard } from './components/Jobs/JobDashboard';
import { NotificationPage } from './components/Notifications/NotificationPage';
import { AdminDashboard } from './components/Admin/AdminDashboard';

// Extracted components
import { TypingEffect } from './components/UI/TypingEffect';
import { FullPageLockOverlay } from './components/UI/FullPageLockOverlay';
import { AdminControlModal } from './components/Admin/AdminControlModal';
import { Navbar } from './components/Layout/Navbar';

// Contexts
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';
import { portfolioApi } from './api/userApi';
import { dashboardApi } from './api/analyticsApi';

export const App: React.FC = () => {
  const {
    isLoggedIn,
    userProfile,
    handleLogout,
  } = useAuth();

  const {
    currentView, setCurrentView, navigate,
    showAdmin, setShowAdmin,
  } = useApp();

  const [line1Done, setLine1Done] = useState(false);

  const [certificates, setCertificates] = useState<{ name: string, date: string, expiry: string, type: string, score: string }[]>([]);
  const [dashboardScore, setDashboardScore] = useState({ score: 78, percentile: 15 });

  // 백엔드에서 대시보드 데이터 로드
  useEffect(() => {
    if (!isLoggedIn) return;
    const loadDashboardData = async () => {
      try {
        const [certsRes, dashRes] = await Promise.allSettled([
          portfolioApi.getCertificates(),
          dashboardApi.getDashboard(),
        ]);
        if (certsRes.status === 'fulfilled' && Array.isArray(certsRes.value) && certsRes.value.length > 0) {
          setCertificates(certsRes.value.map((c: any) => ({
            name: c.name || c.certificateName || '',
            date: c.acquiredDate || c.date || '',
            expiry: c.expiryDate || c.expiry || '영구',
            type: c.type || 'cert',
            score: c.score || c.grade || '합격',
          })));
        }
        if (dashRes.status === 'fulfilled' && dashRes.value) {
          const d = dashRes.value;
          if (d.score !== undefined) setDashboardScore({ score: d.score, percentile: d.percentile || 15 });
        }
      } catch (err) {
        console.warn('대시보드 데이터 로드 실패:', err);
      }
    };
    loadDashboardData();
  }, [isLoggedIn]);

  // Enhanced Skills Data
  const skills = [
    { name: 'React', icon: '⚛️' },
    { name: 'TypeScript', icon: '📘' },
    { name: 'Node.js', icon: '🟢' },
    { name: 'Figma', icon: '🎨' },
    { name: 'Next.js', icon: '▲' },
    { name: 'TailwindCSS', icon: '🌬️' },
    { name: 'Git', icon: '🐱' },
    { name: 'Vercel', icon: '▲' },
  ];



  const onLogout = () => {
    handleLogout();
    setCurrentView('home');
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 text-gray-900 font-inter selection:bg-cyan-100 selection:text-cyan-900 relative">

      {/* Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[20%] w-[600px] h-[600px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <Navbar
        isLoggedIn={isLoggedIn}
        onLoginToggle={onLogout}
        onNavigate={navigate}
        currentView={currentView}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      <AdminControlModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        onNavigateToAdmin={() => navigate('admin-dashboard')}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col flex-grow">

        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <section className="relative w-full pt-32 pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/50 backdrop-blur-sm mb-8 shadow-sm animate-fade-in-down">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-semibold text-gray-600 tracking-wide uppercase">AI-Powered Career Roadmap</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-8 text-gray-900 drop-shadow-sm min-h-[160px] md:min-h-[180px]">
                <TypingEffect
                  text="커리어의 미래를"
                  speed={150}
                  showCursor={!line1Done}
                  onComplete={() => setLine1Done(true)}
                />
                <br />
                <TypingEffect
                  text="AI와 함께 설계하세요"
                  delay={1800}
                  speed={150}
                  showCursor={line1Done}
                  cursorClassName="bg-gray-800"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 animate-gradient-x"
                />
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-2000">
                내 스펙의 현재 위치를 데이터로 확인하고,<br />
                업계 최고의 멘토들에게 직접 조언을 구해보세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-4000">
                <Button variant="primary" onClick={() => setCurrentView(isLoggedIn ? 'dashboard' : 'login')} className="px-8 py-4 text-lg rounded-full shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-1">
                  시작하기
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 2: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="relative w-full min-h-screen">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}

            <div className={`w-full pt-36 pb-12 transition-all duration-500 ${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>

              <section className="w-full text-center mb-12">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  반가워요, <span className="text-cyan-600">{isLoggedIn ? (userProfile?.name || userProfile?.nickname || '사용자') : '게스트'}</span>님 👋
                </h1>
                <p className="text-gray-500 mt-2">오늘도 목표 달성을 위해 한 걸음 더 나아가 볼까요?</p>
              </section>

              <main className="max-w-7xl mx-auto w-full px-6 space-y-12">
                <section id="personal-dashboard" className="relative rounded-3xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">나의 커리어 분석</h2>
                      <p className="text-gray-500 text-sm mt-1">AI가 분석한 내 경쟁력과 활동 내역입니다.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-8">
                    <div className="w-full">
                      <SpecScore
                        score={userProfile?.isInfoInputted ? dashboardScore.score : 0}
                        percentile={userProfile?.isInfoInputted ? dashboardScore.percentile : 0}
                        isInfoInputted={userProfile?.isInfoInputted}
                        onDiagnose={() => setCurrentView('flow-test')}
                        onShowReport={() => navigate('report')}
                      />
                    </div>
                    {userProfile?.isInfoInputted && (
                      <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-gray-900">역량 포트폴리오</h3>
                          <button className="text-xs text-cyan-600 font-bold hover:underline" onClick={() => setCurrentView('info-management')}>관리하기</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/50">
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">자격증 및 어학</h4>
                            </div>
                            <div className="space-y-3">
                              {certificates.map((cert, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/50 border border-white hover:border-cyan-200 transition-colors">
                                  <div className="flex items-center gap-3 w-full">
                                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${cert.type === 'lang' ? 'bg-indigo-400' : 'bg-green-400'}`}></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-gray-800">{cert.name}</p>
                                        <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{cert.score}</span>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-400">{cert.date} 취득</span>
                                        <span className={`text-[10px] ${cert.expiry === '영구' ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                          {cert.expiry === '영구' ? '영구 유효' : `${cert.expiry} 만료`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/50">
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">보유 스킬</h4>
                            </div>
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 flex-1">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {skills.map((skill, i) => (
                                  <div key={i} className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
                                    <span className="text-2xl mb-1">{skill.icon}</span>
                                    <span className="text-xs font-bold text-gray-700">{skill.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {userProfile?.isInfoInputted && (
                  <>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
                    <section id="mentors">
                      <MentorGrid />
                    </section>
                  </>
                )}
              </main>
            </div>
          </div>
        )}

        {/* VIEW 3: JOBS DASHBOARD */}
        {currentView === 'jobs' && (
          <div className="relative w-full">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}
            <div className={`w-full max-w-7xl mx-auto px-6 pt-36 pb-20 transition-all duration-500 ${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
              <JobDashboard />
            </div>
          </div>
        )}

        {/* VIEW 4: AI FLOW TEST */}
        {currentView === 'flow-test' && (
          <div className="relative w-full pt-36 pb-20">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}
            <div className={`${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
              <SpecFlowTest />
            </div>
          </div>
        )}

        {/* VIEW 5: INFO MANAGEMENT */}
        {currentView === 'info-management' && (
          <div className="relative w-full pt-36 pb-20">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}
            <div className={`${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
              <InfoManagement />
            </div>
          </div>
        )}

        {/* VIEW 6: MENTORING PAGE */}
        {currentView === 'mentoring' && (
          <div className="relative w-full max-w-7xl mx-auto px-6 pt-36 pb-20">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}
            <div className={`${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
              <MentoringPage />
            </div>
          </div>
        )}

        {/* VIEW 7: LOGIN PAGE */}
        {currentView === 'login' && (
          <div className="pt-20 flex-grow flex items-center justify-center">
            <LoginPage />
          </div>
        )}

        {/* VIEW: AUTH CALLBACK (OAuth 처리) */}
        {currentView === 'auth-callback' && (
          <div className="pt-20 flex-grow flex items-center justify-center">
            <AuthCallback />
          </div>
        )}

        {/* VIEW 8: SPEC REPORT */}
        {currentView === 'report' && (
          <div className="relative w-full flex-grow">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}
            <div className={`pt-36 pb-12 transition-all duration-500 ${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
              <SpecReport
                onGoToDashboard={() => setCurrentView('dashboard')}
                onDiagnose={() => setCurrentView('flow-test')}
              />
            </div>
          </div>
        )}

        {/* VIEW 9: NOTIFICATIONS */}
        {currentView === 'notifications' && (
          <div className="relative w-full pt-36 pb-20">
            {!isLoggedIn && <FullPageLockOverlay onLogin={() => setCurrentView('login')} />}
            <div className={`${!isLoggedIn ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
              <NotificationPage />
            </div>
          </div>
        )}

        {/* VIEW 10: ADMIN DASHBOARD */}
        {currentView === 'admin-dashboard' && (
          <div className="relative w-full">
            <AdminDashboard />
          </div>
        )}

        <footer className="py-12 text-center text-gray-500 text-sm border-t border-gray-200/30 bg-transparent">
          <p>© 2025 Certi-Folio Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};