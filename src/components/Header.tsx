/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Bell, Menu, Search, UserCheck, LogOut, MessageSquare, Calendar, Sun, Moon, Sparkles } from 'lucide-react';
import { PageId, User } from '../types';
import { useHRData } from '../lib/hrDataBridge';

interface HeaderProps {
  activePage: PageId;
  currentUser: User | null;
  setIsOpenMobile: (open: boolean) => void;
  theme: 'day' | 'dark' | 'night';
  setTheme: (theme: 'day' | 'dark' | 'night') => void;
}

interface Alert {
  id: string;
  type: 'exit' | 'feedback';
  title: string;
  message: string;
  time: string;
}

const generateAlerts = (hrData: any[]): Alert[] => {
  if (!hrData || hrData.length === 0) return [];

  const today = new Date();
  const alerts: Alert[] = [];

  // Recent exits — employees who exited in last 7 days
  hrData.forEach((emp: any) => {
    if (emp.exit_date) {
      const exitDate = new Date(emp.exit_date);
      const daysDiff = Math.floor(
        (today.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= 0 && daysDiff <= 7) {
        const displayDate = exitDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        alerts.push({
          id: String(emp.employee_id),
          type: 'exit',
          title: 'Resignation Recorded',
          message: `${emp.name} (${emp.department || 'N/A'}) — exit recorded on ${displayDate}`,
          time: daysDiff === 0 ? 'Today' : `${daysDiff}d ago`,
        });
      }
    }
  });

  // Feedback due — employees where 6-week form is due this week (days 42-48)
  hrData.forEach((emp: any) => {
    if (emp.employment_status === 'Active' && emp.date_of_joining) {
      const doj = new Date(emp.date_of_joining);
      const days = Math.floor(
        (today.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days >= 42 && days < 49) {
        alerts.push({
          id: String(emp.employee_id) + '_6w',
          type: 'feedback',
          title: '6-Week Feedback Due',
          message: `${emp.name} (${emp.department || 'N/A'}) — onboarding feedback form pending`,
          time: 'Due now',
        });
      }
    }
  });

  // Return max 5 alerts
  return alerts.slice(0, 5);
};

export default function Header({ 
  activePage, 
  currentUser, 
  setIsOpenMobile,
  theme,
  setTheme
}: HeaderProps) {
  const { data: hrData, isHydrating } = useHRData();
  const [showNotifications, setShowNotifications] = useState(false);

  // Recompute alerts whenever the panel is opened
  const alerts = useMemo(() => {
    if (isHydrating) return [];
    return generateAlerts(hrData || []);
  }, [showNotifications, hrData, isHydrating]);
  const unreadCount = alerts.length;

  // Format Page Name
  const formatPageTitle = (page: PageId) => {
    return page
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTodayString = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer flex-shrink-0"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 text-[9px] md:text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider truncate">
            <span className="hidden xs:inline">ALOK</span>
            <span className="hidden xs:inline">/</span>
            <span className="text-indigo-600 font-sans tracking-normal font-bold md:font-semibold">{currentUser?.role.replace('_', ' ')}</span>
          </div>
          <h1 className="text-sm md:text-lg font-bold text-slate-800 tracking-tight leading-none mt-0.5 truncate">
            {formatPageTitle(activePage)}
          </h1>
        </div>
      </div>

      {/* Right section: Global utilities */}
      <div className="flex items-center gap-1.5 xs:gap-2.5 md:gap-5 flex-shrink-0">
        {/* Current Date Widget */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{getTodayString()}</span>
        </div>

        {/* 3-Way Theme Switcher Segmented Pills */}
        <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 md:p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTheme('day')}
            className={`px-1.5 md:px-2.5 py-1 rounded-lg flex items-center gap-1 md:gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              theme === 'day'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Day Theme (Light)"
          >
            <Sun className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline text-[11px]">Day</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-1.5 md:px-2.5 py-1 rounded-lg flex items-center gap-1 md:gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Dark Theme (Slate)"
          >
            <Moon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline text-[11px]">Dark</span>
          </button>
          <button
            onClick={() => setTheme('night')}
            className={`px-1.5 md:px-2.5 py-1 rounded-lg flex items-center gap-1 md:gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              theme === 'night'
                ? 'bg-black text-violet-400 shadow-sm border border-violet-500/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Night Theme (Amoled Black)"
          >
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline text-[11px]">Night</span>
          </button>
        </div>

        {/* Mock Search (SaaS aesthetic) */}
        <div className="hidden sm:relative sm:block max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="search"
            placeholder="Search employees, files..."
            className="block w-48 lg:w-64 pl-9 pr-3 py-1.5 border border-slate-200/85 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Notifications Dropdown Container */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 relative cursor-pointer"
            disabled={isHydrating}
            title={isHydrating ? "Loading alerts..." : "HR Alerts"}
          >
            <Bell className={`h-4.5 w-4.5 md:h-5 md:w-5 ${isHydrating ? 'animate-pulse text-indigo-400' : ''}`} />
            {isHydrating ? (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            ) : unreadCount > 0 ? (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-600 border border-white" />
            ) : null}
          </button>

          {showNotifications && (
            <>
              {/* Backdrop to close on outside click */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-2">
                <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">HR Alerts</span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      All Clear
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs leading-relaxed">
                      <span className="text-lg block mb-2">✓</span>
                      No new alerts. All clear!
                      <p className="mt-1 text-[10px] text-slate-300">Import HR data to see real-time alerts.</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="p-3.5 hover:bg-slate-50/70 transition-colors text-left flex gap-2.5 items-start bg-slate-50/40"
                      >
                        <div className="mt-0.5 shrink-0">
                          {alert.type === 'exit' ? (
                            <LogOut className="h-4 w-4 text-rose-500" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-indigo-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{alert.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{alert.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">{alert.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-50 text-center">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 w-full cursor-pointer"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Mini Profile */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="h-7 w-7 md:h-8.5 md:w-8.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
            <img 
              src={currentUser?.avatarUrl || "/images/regenerated_image_1783498425109.jpg"} 
              alt={currentUser?.name} 
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">
              {currentUser?.role === 'HR_ADMIN' ? 'Owner / Admin' : 'Staff Manager'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
