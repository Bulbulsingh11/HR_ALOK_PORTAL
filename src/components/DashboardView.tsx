/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  PieChart,
  ArrowUpRight, 
  CheckCircle2, 
  TrendingUp,
  UserCheck,
  Calendar,
  AlertCircle,
  MapPin,
  LogOut
} from 'lucide-react';
import { Employee } from '../types';
import { useHRData } from '../lib/hrDataBridge';

interface DashboardViewProps {
  employees: Employee[];
  onPageChange: (page: any) => void;
}

export default function DashboardView({
  employees,
  onPageChange,
}: DashboardViewProps) {

  const { data: hrData, isHydrating, error, retry } = useHRData();

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-full">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Hydration Failed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            We encountered an issue restoring your local HR dataset.
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-mono mt-2">{error}</p>
        </div>
        <button
          onClick={retry}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <LogOut className="h-4 w-4 rotate-180" />
          Retry Hydration
        </button>
      </div>
    );
  }

  if (isHydrating) {
    return (
      <div className="space-y-6 text-left animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl h-28 space-y-3">
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-8 w-20 bg-slate-300 dark:bg-slate-650 rounded"></div>
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Two-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-xl h-96">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-750 rounded-lg"></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-xl h-96">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-750 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

// Data now comes from HRDataProvider context; localStorage loading removed.
  let displayTotal = '—';
  let displayActive = '—';
  let displayNewJoinees = '—';
  let displayPendingFeedback = '—';
  let displayAttrition = '—';

  let deptBreakdown: any[] = [];
  let plantBreakdown: any[] = [];
  let dynamicActionTasks: any[] = [];

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (hrData) {
    displayTotal = hrData.length.toString();
    const activeCount = hrData.filter((e: any) => e.employment_status === 'Active').length;
    displayActive = activeCount.toString();
    
    displayNewJoinees = hrData.filter((e: any) => {
      if (!e.date_of_joining) return false;
      const doj = new Date(e.date_of_joining);
      return doj >= thirtyDaysAgo && doj <= today;
    }).length.toString();

    displayPendingFeedback = hrData.filter((e: any) => {
      if (!e.date_of_joining) return false;
      const doj = new Date(e.date_of_joining);
      const days = Math.floor((today.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24));
      return (days >= 42 || days >= 180) && e.employment_status === 'Active';
    }).length.toString();

    displayAttrition = hrData.filter((e: any) => {
      if (!e.exit_date) return false;
      const exitDate = new Date(e.exit_date);
      return exitDate >= thirtyDaysAgo && exitDate <= today;
    }).length.toString();

    // Department Breakdown
    const deptCount = hrData.reduce((acc: any, emp: any) => {
      if (emp.employment_status === 'Active') {
        const d = emp.department || 'Unspecified';
        acc[d] = (acc[d] || 0) + 1;
      }
      return acc;
    }, {});
    
    const totalActive = activeCount || 1;
    deptBreakdown = Object.entries(deptCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round(((count as number) / totalActive) * 100)
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));

    // Plant Location Breakdown
    const locationCount = hrData.reduce((acc: any, emp: any) => {
      if (emp.employment_status === 'Active') {
        const p = emp.plant_location || 'Unspecified';
        acc[p] = (acc[p] || 0) + 1;
      }
      return acc;
    }, {});
    
    plantBreakdown = Object.entries(locationCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));

    // Pending Actions
    hrData.forEach((emp: any) => {
      if (emp.employment_status === 'Active' && emp.date_of_joining) {
        const doj = new Date(emp.date_of_joining);
        const daysSinceJoining = Math.floor((today.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceJoining >= 42 && daysSinceJoining < 49) {
          dynamicActionTasks.push({ id: `w6-${emp.employee_id}`, text: `Send 6-week feedback form to ${emp.name} — due today`, priority: 'High', page: 'feedback-forms' });
        }
        if (daysSinceJoining >= 180 && daysSinceJoining < 187) {
          dynamicActionTasks.push({ id: `m6-${emp.employee_id}`, text: `Send 6-month experience form to ${emp.name} — due today`, priority: 'High', page: 'feedback-forms' });
        }
      }
      
      if (emp.exit_date) {
         const exitDate = new Date(emp.exit_date);
         const daysToExit = Math.floor((exitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
         if (daysToExit >= 0 && daysToExit <= 7) {
           dynamicActionTasks.push({ id: `exit-${emp.employee_id}`, text: `Exit interview pending for ${emp.name}`, priority: 'Medium', page: 'feedback-forms' });
         }
      }
    });
    dynamicActionTasks = dynamicActionTasks.slice(0, 5); // Max 5 actions
  }

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-left font-sans"
    >
      
      {/* HEADER SECTION */}
      <div>
        <p className="text-xs text-indigo-600 font-bold font-mono uppercase tracking-wider">Operational Summary</p>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Enterprise HR Dashboard</h2>
      </div>

      {/* DATA SOURCE INDICATOR */}
      {hrData ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-900 text-sm">Showing live data from imported HR dataset</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-mono text-[10px] ml-1">
              {hrData.length} records
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-600 font-medium">Data loaded</span>
            <button onClick={() => onPageChange('reports')} className="font-bold underline cursor-pointer hover:text-emerald-900 transition-colors">
              Refresh Data
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-900 text-sm">No data imported yet.</span>
            <span className="text-amber-700 ml-1">Go to HR Reports &rarr; Import Data to see real company statistics.</span>
          </div>
          <button onClick={() => onPageChange('reports')} className="bg-amber-600 text-white px-4 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-amber-700 transition-colors whitespace-nowrap shadow-sm">
            Import Data &rarr;
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative">
        
        {!hrData && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl border border-dashed border-slate-300">
            <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-slate-200 text-sm font-bold text-slate-700">
              Import your HR data in the HR Reports tab to see real statistics here
            </div>
          </div>
        )}

        {/* Total Employees */}
        <motion.div 
          variants={itemVariants}
          onClick={() => hrData && onPageChange('employees')}
          className="bg-white p-3 md:p-5 rounded-2xl border border-slate-250 hover:border-indigo-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col xs:flex-row xs:items-center justify-between gap-2 group"
        >
          <div className="min-w-0">
            <span className="text-[9px] md:text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block truncate">Total Employees</span>
            <div className="flex flex-wrap items-baseline gap-1 md:gap-2 mt-0.5 md:mt-1">
              <span className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{displayTotal}</span>
              {hrData && (
                <span className="text-[9px] md:text-xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span>{displayActive} Active</span>
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0 self-end xs:self-center">
            <Users className="h-4.5 w-4.5 md:h-6 md:w-6" />
          </div>
        </motion.div>

        {/* New Joinees This Month */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-3 md:p-5 rounded-2xl border border-slate-250 hover:border-indigo-200 shadow-2xs hover:shadow-xs transition-all flex flex-col xs:flex-row xs:items-center justify-between gap-2 group"
        >
          <div className="min-w-0">
            <span className="text-[9px] md:text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block truncate">New Joinees</span>
            <div className="flex flex-wrap items-baseline gap-1 md:gap-2 mt-0.5 md:mt-1">
              <span className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{displayNewJoinees}</span>
              {hrData && (
                <span className="text-[9px] md:text-xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full truncate">
                  This Month
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0 self-end xs:self-center">
            <Calendar className="h-4.5 w-4.5 md:h-6 md:w-6" />
          </div>
        </motion.div>

        {/* Pending Feedback Forms */}
        <motion.div 
          variants={itemVariants}
          onClick={() => hrData && onPageChange('feedback-forms')}
          className="bg-white p-3 md:p-5 rounded-2xl border border-slate-250 hover:border-indigo-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col xs:flex-row xs:items-center justify-between gap-2 group"
        >
          <div className="min-w-0">
            <span className="text-[9px] md:text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block truncate">Pending Surveys</span>
            <div className="flex flex-wrap items-baseline gap-1 md:gap-2 mt-0.5 md:mt-1">
              <span className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{displayPendingFeedback}</span>
              {hrData && (
                <span className="text-[9px] md:text-xs text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-full truncate">
                  Due
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0 self-end xs:self-center">
            <MessageSquare className="h-4.5 w-4.5 md:h-6 md:w-6" />
          </div>
        </motion.div>

        {/* Attrition This Month */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-3 md:p-5 rounded-2xl border border-slate-250 hover:border-indigo-200 shadow-2xs hover:shadow-xs transition-all flex flex-col xs:flex-row xs:items-center justify-between gap-2 group"
        >
          <div className="min-w-0">
            <span className="text-[9px] md:text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block truncate">Attrition This Month</span>
            <div className="flex flex-wrap items-baseline gap-1 md:gap-2 mt-0.5 md:mt-1">
              <span className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{displayAttrition}</span>
              {hrData && (
                <span className="text-[9px] md:text-xs text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-full truncate">
                  Exits
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0 self-end xs:self-center">
            <LogOut className="h-4.5 w-4.5 md:h-6 md:w-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Content Area: Left & Right split */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 ${!hrData ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Left column: Action Tasks & Headcount Distribution */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* Action Tasks checklist */}
          <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 border border-slate-200 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-slate-800">Pending Actions Checklist</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">High priority action items awaiting execution.</p>
              </div>
              <span className="text-[8px] md:text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full shrink-0">
                Action Items
              </span>
            </div>
            <div className="space-y-2 md:space-y-3">
              {dynamicActionTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  No pending high-priority actions. You're all caught up!
                </div>
              ) : (
                dynamicActionTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-2.5 md:p-3 border border-slate-100 hover:border-indigo-50 hover:bg-indigo-50/10 rounded-xl flex items-start gap-2.5 md:gap-3 transition-colors"
                  >
                    <button className="mt-0.5 text-slate-300 hover:text-indigo-600 cursor-pointer transition-colors shrink-0">
                      <CheckCircle2 className="h-4 md:h-5 md:w-5 w-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-normal md:leading-relaxed truncate md:whitespace-normal">{task.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          task.priority === 'High' 
                            ? 'bg-red-50 text-red-600' 
                            : task.priority === 'Medium' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <button 
                          onClick={() => onPageChange(task.page)}
                          className="text-[9px] md:text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Launch &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Department Distribution Bars */}
          <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 border border-slate-200 rounded-2xl shadow-2xs">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 mb-0.5">Active Headcount by Department</h3>
            <p className="text-[11px] text-slate-500 mb-4">Current company headcount mapping across divisions.</p>
            
            <div className="space-y-3 md:space-y-4">
              {deptBreakdown.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  No active employee data available.
                </div>
              ) : (
                deptBreakdown.map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] md:text-xs font-semibold">
                      <span className="text-slate-700 truncate">{dept.name}</span>
                      <span className="text-slate-500 font-mono shrink-0">{dept.count} ({dept.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right column: Plant Distribution & Status */}
        <div className="space-y-4 md:space-y-6">
          <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 border border-slate-200 rounded-2xl shadow-2xs h-full flex flex-col">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 mb-0.5">Plant / Location Distribution</h3>
            <p className="text-[11px] text-slate-500 mb-4">Active employees across facilities.</p>
            
            <div className="space-y-3.5 flex-1">
              <div className="grid grid-cols-2 gap-3">
                {plantBreakdown.map(plant => (
                  <div key={plant.name} className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center flex flex-col items-center justify-center">
                    <MapPin className="h-5 w-5 text-indigo-500 mb-2" />
                    <span className="text-xl font-bold text-slate-800">{plant.count}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate w-full">{plant.name}</span>
                  </div>
                ))}
                {plantBreakdown.length === 0 && (
                  <div className="col-span-2 p-6 text-center text-slate-400 text-sm">
                    No plant location data found.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-800 leading-none">System Status</p>
                  <p className="text-[9px] text-emerald-600 mt-1 font-medium tracking-wide uppercase">Operational & Active</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
