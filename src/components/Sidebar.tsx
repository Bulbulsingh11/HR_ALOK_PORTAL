/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Clock, 
  CreditCard, 
  HandCoins, 
  MessageSquare, 
  LogOut, 
  PieChart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import { PageId } from '../types';
import AlokLogo from './AlokLogo';

interface SidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  theme: 'day' | 'dark' | 'night';
  pendingLettersCount?: number;
}

const navItems: { id: PageId; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'offer-letter', label: 'Offer Letter Generation', icon: FileText },
  { id: 'feedback-forms', label: 'Feedback Forms', icon: MessageSquare },
  { id: 'reports', label: 'HR Reports', icon: PieChart },
  { id: 'guide', label: 'Portal Guide', icon: HelpCircle }
];

export default function Sidebar({
  activePage,
  onPageChange,
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
  onLogout,
  userName,
  userRole,
  theme,
  pendingLettersCount,
}: SidebarProps) {

  const renderNavLinks = () => (
    <nav className="space-y-1 px-4 py-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              onPageChange(item.id);
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer group relative ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                isActive ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-700'
              } ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
            
            {/* Pending Badge - ONLY for Admin */}
            {!isCollapsed && item.id === 'offer-letter' && userRole === 'admin' && pendingLettersCount ? (
              <span className="ml-auto bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {pendingLettersCount}
              </span>
            ) : null}
            {isCollapsed && item.id === 'offer-letter' && userRole === 'admin' && pendingLettersCount ? (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 shadow-sm border border-white"></span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex flex-col justify-center overflow-hidden">
            <AlokLogo showText={!isCollapsed} size="sm" theme={theme === 'day' ? 'light' : 'dark'} />
            {!isCollapsed && (
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                HR Portal
              </span>
            )}
          </div>

          {/* Collapse button - Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-6 w-6 rounded-md border border-slate-200 hover:bg-slate-50 items-center justify-center text-slate-500 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          {/* Close button - Mobile */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderNavLinks()}
        </div>

        {/* Quick User Bio & Logout Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                  <img 
                    src="/src/assets/images/regenerated_image_1783498422121.jpg" 
                    alt={userName} 
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate uppercase">
                    {userRole === 'admin' ? 'ADMIN' : 'HR'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-1.5 px-3 border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-100 rounded-lg text-xs font-semibold text-slate-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
