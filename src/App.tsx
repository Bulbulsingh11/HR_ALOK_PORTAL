/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Components & Views
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import EmployeesView from './components/EmployeesView';
import OfferLetterView from './components/OfferLetterView';
import FeedbackFormsView from './components/FeedbackFormsView';
import ReportsView from './components/ReportsView';
import PortalGuideView from './components/PortalGuideView';
import { HRDataProvider } from './lib/hrDataBridge';
import defaultAvatar from './assets/images/regenerated_image_1783498425109.jpg';

// Types & Mock Data
import {
  User,
  PageId,
  Employee
} from './types';

export default function App() {
  // Auth state (starts null to show Login page first, simulation-ready)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto trigger checker
  const checkAndSendTriggers = async () => {
    try {
      const { data: triggers, error } = await supabase.from('employee_triggers').select('*');
      if (error) throw error;
      if (!triggers) return;

      const now = new Date();
      for (const trigger of triggers) {
        const doj = new Date(trigger.date_of_joining);
        const daysSinceJoin = Math.floor((now.getTime() - doj.getTime()) / (1000 * 3600 * 24));

        let shouldUpdate = false;
        let updateData: any = {};
        let formName = '';

        const onboarding_sent = trigger.onboarding_form_sent;
        const six_month_sent = trigger.six_month_form_sent !== undefined ? trigger.six_month_form_sent : trigger.experience_form_sent;
        const exit_sent = trigger.exit_form_sent;

        // 1. Onboarding Form (6 weeks / 42 days)
        if (daysSinceJoin >= 42 && !onboarding_sent) {
          shouldUpdate = true;
          updateData.onboarding_form_sent = true;
          if ('onboarding_form_sent_at' in trigger) {
            updateData.onboarding_form_sent_at = new Date().toISOString();
          } else {
            updateData.date_sent = new Date().toISOString();
          }
          formName = 'Onboarding';
        } 
        // 2. 6 Month Review Form (180 days)
        else if (daysSinceJoin >= 180 && !six_month_sent && trigger.employment_status === 'active') {
          shouldUpdate = true;
          if ('experience_form_sent' in trigger) {
            updateData.experience_form_sent = true;
            updateData.experience_form_sent_at = new Date().toISOString();
          } else {
            updateData.six_month_form_sent = true;
            updateData.date_sent = new Date().toISOString();
          }
          formName = '6 Month Review';
        }
        // 3. Exit Form
        else if (trigger.employment_status === 'resigned' && !exit_sent) {
          shouldUpdate = true;
          updateData.exit_form_sent = true;
          if ('exit_form_sent_at' in trigger) {
            updateData.exit_form_sent_at = new Date().toISOString();
          } else {
            updateData.date_sent = new Date().toISOString();
          }
          formName = 'Exit';
        }

        if (shouldUpdate) {
          const { error: updateError } = await supabase.from('employee_triggers')
            .update(updateData)
            .eq('id', trigger.id);
          
          if (!updateError) {
            setToastMessage(`System Auto-Trigger: Sent ${formName} form to ${trigger.employee_name}`);
            // Auto hide toast
            setTimeout(() => setToastMessage(null), 5000);
          }
        }
      }
    } catch (err) {
      console.error('Trigger check failed:', err);
    }
  };

  useEffect(() => {
    if (currentUser && isSupabaseConfigured) {
      checkAndSendTriggers();
    }
  }, [currentUser]);

  // Check and sync Supabase auth session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      return;
    }

    // Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch role from hr_users
        const { data: userData, error: userError } = await supabase
          .from('hr_users')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData || !userData.role) {
          console.error("Access denied: User role not found in HR database.");
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthLoading(false);
          return;
        }

        const userRole = (userData.role === 'admin' || userData.role === 'senior_hr' || userData.role === 'HR_ADMIN') ? 'admin' : (userData.role === 'hr' ? 'hr' : null);
        if (!userRole) {
          console.error("Access denied: Invalid role assigned in HR database.");
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthLoading(false);
          return;
        }

        const metadata = session.user.user_metadata || {};
        const appUser: User = {
          id: session.user.id,
          name: userData.full_name || metadata.name || session.user.email?.split('@')[0] || 'User',
          email: userData.email || session.user.email || '',
          role: userRole as any,
          avatarUrl: metadata.avatarUrl || defaultAvatar,
        };
        setCurrentUser(appUser);
        setActivePage('dashboard');
      }
      setIsAuthLoading(false);
    });

    // Listen to real-time auth state events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('hr_users')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData || !userData.role) {
          console.error("Access denied: User role not found in HR database.");
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthLoading(false);
          return;
        }

        const userRole = (userData.role === 'admin' || userData.role === 'senior_hr' || userData.role === 'HR_ADMIN') ? 'admin' : (userData.role === 'hr' ? 'hr' : null);
        if (!userRole) {
          console.error("Access denied: Invalid role assigned in HR database.");
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthLoading(false);
          return;
        }

        const metadata = session.user.user_metadata || {};
        const appUser: User = {
          id: session.user.id,
          name: userData.full_name || metadata.name || session.user.email?.split('@')[0] || 'User',
          email: userData.email || session.user.email || '',
          role: userRole as any,
          avatarUrl: metadata.avatarUrl || defaultAvatar,
        };
        setCurrentUser(appUser);
        setActivePage('dashboard');
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Layout navigation state
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Theme state: 'day' | 'dark' | 'night'
  const [theme, setTheme] = useState<'day' | 'dark' | 'night'>(() => {
    return (localStorage.getItem('alok-theme') as 'day' | 'dark' | 'night') || 'day';
  });

  useEffect(() => {
    localStorage.setItem('alok-theme', theme);
    const root = document.documentElement;
    root.classList.remove('theme-day', 'theme-dark', 'theme-night', 'dark');
    if (theme === 'dark') {
      root.classList.add('theme-dark', 'dark');
    } else if (theme === 'night') {
      root.classList.add('theme-night', 'dark');
    } else {
      root.classList.add('theme-day');
    }
  }, [theme]);

  // Centralized Application State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingLettersCount, setPendingLettersCount] = useState(0);

  // Auth/Role change handler for pending count
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setPendingLettersCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('generated_letters')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (!error && count !== null) {
          setPendingLettersCount(count);
        }
      } catch (err) {
        console.error('Error fetching pending letters count:', err);
      }
    };

    fetchPendingCount();

    const subscription = supabase
      .channel('public:generated_letters:app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_letters' }, fetchPendingCount)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  // Authentication Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActivePage('dashboard');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  // State Mutators: Employees Directory
  const addEmployee = (emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
  };

  const removeEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const changeEmployeeStatus = (id: string, status: Employee['status']) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  // Render Page Selection View
  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView
            employees={employees}
            onPageChange={setActivePage}
          />
        );
      case 'employees':
        return (
          <EmployeesView
            employees={employees}
            onAddEmployee={addEmployee}
            onRemoveEmployee={removeEmployee}
            onStatusChange={changeEmployeeStatus}
            onPageChange={setActivePage}
          />
        );
      case 'offer-letter':
        return (
          <OfferLetterView
            currentUser={currentUser}
          />
        );
      case 'feedback-forms':
        return (
          <FeedbackFormsView />
        );
      case 'reports':
        return <ReportsView currentUser={currentUser} />;
      case 'guide':
        return <PortalGuideView />;
      default:
        return (
          <div className="p-8 text-center text-slate-500 font-sans">
            Page under active construction.
          </div>
        );
    }
  };

  // Protected Routes Render Controller
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <span className="text-lg font-bold font-mono">HR</span>
          </div>
          <p className="text-xs text-slate-500 font-medium animate-pulse">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <HRDataProvider>
        <Login onLogin={handleLogin} />
      </HRDataProvider>
    );
  }

  const themeClass = theme === 'dark' ? 'theme-dark' : theme === 'night' ? 'theme-night' : 'theme-day';

  return (
    <HRDataProvider>
    <div className={`min-h-screen bg-slate-50/50 flex text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans ${themeClass}`}>
      {/* Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        onLogout={handleLogout}
        userName={currentUser.name}
        userRole={currentUser.role}
        theme={theme}
        pendingLettersCount={pendingLettersCount}
      />

      {/* Main Container Wrapper */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header Navigation utility */}
        <Header 
          activePage={activePage} 
          currentUser={currentUser} 
          setIsOpenMobile={setIsMobileSidebarOpen} 
          theme={theme}
          setTheme={setTheme}
        />

        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 flex items-center justify-center gap-2 text-amber-800 text-xs font-semibold select-none shadow-sm z-30">
            <span>⚡</span>
            <span>Demo Mode — Running with simulated data. Connect Supabase to enable live database.</span>
          </div>
        )}

        {/* Dynamic Canvas Container with Page Transitions */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="h-full"
            >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999]"
            >
              <div className="h-8 w-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">⚡</span>
              </div>
              <p className="text-sm font-medium">{toastMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HRDataProvider>
    );
  }
