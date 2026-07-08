/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  ExternalLink, 
  UserPlus, 
  Smile, 
  LogOut, 
  HelpCircle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  whenUsed: string;
  url: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function FeedbackFormsView() {
  const forms: FeedbackForm[] = [
    {
      id: 'onboarding',
      title: 'Onboarding Feedback (6 Weeks)',
      description: 'Collect initial impressions from new joinees within their first 6 weeks of joining. This helps evaluate our recruitment, induction, and team transition process.',
      whenUsed: 'Triggered automatically exactly 6 weeks after an employee\'s Date of Joining.',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSfTWLKTir5kTVfK-aAGG7FIniCnJkKpo5ht_uBfcP-QR1qroQ/viewform?embedded=true',
      icon: UserPlus,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    {
      id: 'experience',
      title: 'Employee Experience Feedback (6 Months)',
      description: 'Check in on work-life balance, management alignment, role clarity, and cultural satisfaction of employees around their 6-month work anniversary.',
      whenUsed: 'Sent to all active employees on reaching 6 months of continuous tenure, before the probation evaluation.',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLScUad1roMCwiIiQD8GgMtcQrcqJJjAO1mP_7fhkOPHu-duitw/viewform?embedded=true',
      icon: Smile,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      id: 'exit',
      title: 'Exit Interview Form',
      description: 'Systematically gather critical feedback from departing employees to identify reasons for attrition, assess organizational culture, and gather improvement inputs.',
      whenUsed: 'Mandatory completion step during the notice clearance period for all voluntary resignations.',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLScM3x_tP-RU9WBtcTKVFO1oQcbmvG0rohZ-GUBooRly_5Fcjg/viewform?embedded=true',
      icon: LogOut,
      color: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    {
      id: 'triggers',
      title: 'Auto-Trigger Status',
      description: 'Monitor automated form dispatches based on employee lifecycle events.',
      whenUsed: 'Dashboard view of automated triggers and system logs.',
      url: '',
      icon: Activity,
      color: 'bg-blue-50 text-blue-700 border-blue-100'
    }
  ];

  const [activeFormId, setActiveFormId] = useState<string>('onboarding');
  const activeForm = forms.find(f => f.id === activeFormId) || forms[0];
  const IconComponent = activeForm.icon;

  const [triggerLogs, setTriggerLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeFormId === 'triggers') {
      const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const { data, error } = await supabase.from('employee_triggers').select('*').order('created_at', { ascending: false });
          if (!error && data) {
            setTriggerLogs(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [activeFormId]);

  const [trackerName, setTrackerName] = useState('');
  const [trackerEmail, setTrackerEmail] = useState('');
  const [trackerDOJ, setTrackerDOJ] = useState('');
  const [trackedEmployees, setTrackedEmployees] = useState<any[]>([]);

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('alok_feedback_employees') || '[]');
    setTrackedEmployees(existing);
  }, []);

  const handleAddTrackedEmployee = () => {
    if (!trackerName || !trackerEmail || !trackerDOJ) return;
    const newEmp = {
      id: Date.now().toString(),
      name: trackerName,
      email: trackerEmail,
      dateOfJoining: trackerDOJ,
      addedOn: new Date().toISOString().split('T')[0],
      onboardingFormSent: false,
      experienceFormSent: false
    };
    const updated = [...trackedEmployees, newEmp];
    setTrackedEmployees(updated);
    localStorage.setItem('alok_feedback_employees', JSON.stringify(updated));
    setTrackerName('');
    setTrackerEmail('');
    setTrackerDOJ('');
  };

  const removeTrackedEmployee = (id: string) => {
    const updated = trackedEmployees.filter(e => e.id !== id);
    setTrackedEmployees(updated);
    localStorage.setItem('alok_feedback_employees', JSON.stringify(updated));
  };

  const markFormSent = (id: string, formType: 'onboarding' | 'experience') => {
    const updated = trackedEmployees.map(e => {
      if (e.id === id) {
        if (formType === 'onboarding') e.onboardingFormSent = true;
        if (formType === 'experience') e.experienceFormSent = true;
      }
      return e;
    });
    setTrackedEmployees(updated);
    localStorage.setItem('alok_feedback_employees', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-5">
        <p className="text-xs text-indigo-600 font-bold font-mono uppercase tracking-wider">Surveys & Sentiment</p>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Corporate Feedback Forms</h2>
      </div>

      {/* FEEDBACK DUE TRACKER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Feedback Due Tracker</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manually track and dispatch 6-Week & 6-Month forms without relying on demo data.</p>
        </div>
        
        <div className="p-4 flex flex-col md:flex-row gap-3 items-end border-b border-slate-100">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee Name</label>
            <input type="text" value={trackerName} onChange={e => setTrackerName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="e.g. Rahul Verma" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee Email</label>
            <input type="email" value={trackerEmail} onChange={e => setTrackerEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="rahul@example.com" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Joining</label>
            <input type="date" value={trackerDOJ} onChange={e => setTrackerDOJ(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
          <button onClick={handleAddTrackedEmployee} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap h-[34px] flex items-center cursor-pointer">
            Add Employee
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date of Joining</th>
                <th className="px-4 py-3 text-center">Days Completed</th>
                <th className="px-4 py-3 text-center">6-Week Form</th>
                <th className="px-4 py-3 text-center">6-Month Form</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trackedEmployees.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-slate-400">No employees tracked yet. Add one above.</td></tr>
              ) : trackedEmployees.map(emp => {
                const doj = new Date(emp.dateOfJoining);
                const today = new Date();
                const daysSinceJoining = Math.floor((today.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24));
                
                // 6 Week Logic
                let w6Badge = null;
                if (emp.onboardingFormSent) {
                  w6Badge = <span className="text-[10px] md:text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">Sent ✓</span>;
                } else if (daysSinceJoining < 42) {
                  w6Badge = <span className="text-[10px] md:text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full whitespace-nowrap">Not due yet ({42 - daysSinceJoining} days remaining)</span>;
                } else if (daysSinceJoining >= 42 && daysSinceJoining < 49) {
                  w6Badge = <span className="text-[10px] md:text-xs text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-full animate-pulse border border-red-200 whitespace-nowrap">Due Now!</span>;
                } else {
                  w6Badge = <span className="text-[10px] md:text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">Overdue by {daysSinceJoining - 42} days</span>;
                }

                // 6 Month Logic
                let m6Badge = null;
                if (emp.experienceFormSent) {
                  m6Badge = <span className="text-[10px] md:text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">Sent ✓</span>;
                } else if (daysSinceJoining < 180) {
                  m6Badge = <span className="text-[10px] md:text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full whitespace-nowrap">{180 - daysSinceJoining} days remaining</span>;
                } else {
                  m6Badge = <span className="text-[10px] md:text-xs text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-full animate-pulse border border-red-200 whitespace-nowrap">Due Now!</span>;
                }

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[10px] text-slate-500">{emp.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{emp.dateOfJoining}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{daysSinceJoining} days</td>
                    <td className="px-4 py-3 text-center">{w6Badge}</td>
                    <td className="px-4 py-3 text-center">{m6Badge}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => {
                            window.open(`mailto:${emp.email}?subject=Onboarding Feedback Form | ALOK Masterbatches&body=Please fill out your 6-week onboarding feedback: https://docs.google.com/forms/d/e/1FAIpQLSfTWLKTir5kTVfK-aAGG7FIniCnJkKpo5ht_uBfcP-QR1qroQ/viewform?embedded=true`, '_blank');
                            markFormSent(emp.id, 'onboarding');
                          }}
                          className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Send 6W Form
                        </button>
                        <button 
                          onClick={() => {
                            window.open(`mailto:${emp.email}?subject=Employee Experience Feedback | ALOK Masterbatches&body=Please fill out your 6-month experience feedback: https://docs.google.com/forms/d/e/1FAIpQLScUad1roMCwiIiQD8GgMtcQrcqJJjAO1mP_7fhkOPHu-duitw/viewform?embedded=true`, '_blank');
                            markFormSent(emp.id, 'experience');
                          }}
                          className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Send 6M Form
                        </button>
                        <button 
                          onClick={() => removeTrackedEmployee(emp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SURVEY CATEGORY SELECTOR TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60">
        {forms.map((form) => {
          const FormIcon = form.icon;
          const isActive = form.id === activeFormId;
          return (
            <button
              key={form.id}
              onClick={() => setActiveFormId(form.id)}
              className={`flex items-center justify-center gap-2.5 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <FormIcon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate">{form.title.split(' (')[0]}</span>
            </button>
          );
        })}
      </div>

      {activeFormId === 'triggers' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Automated Trigger Logs
            </h3>
            <p className="text-xs text-slate-500 mt-1">Real-time status of lifecycle forms dispatched to employees.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Joining Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Onboarding (6W)</th>
                  <th className="px-5 py-3 text-center">Review (6M)</th>
                  <th className="px-5 py-3 text-center">Exit Form</th>
                  <th className="px-5 py-3">Last Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingLogs ? (
                  <tr><td colSpan={7} className="p-8 text-center text-xs text-slate-400">Loading trigger logs...</td></tr>
                ) : triggerLogs.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-xs text-slate-400">No trigger records found. Generate a letter to start tracking.</td></tr>
                ) : (
                  triggerLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {log.employee_name}
                        <div className="text-[10px] text-slate-400 font-normal">{log.employee_email}</div>
                      </td>
                      <td className="px-5 py-3 font-mono">{log.date_of_joining}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          log.employment_status === 'resigned' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {log.employment_status === 'resigned' ? 'Resigned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {log.onboarding_form_sent ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <Clock className="h-4 w-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {(log.six_month_form_sent || log.experience_form_sent) ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <Clock className="h-4 w-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {log.exit_form_sent ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <Clock className="h-4 w-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="px-5 py-3 font-mono text-[10px] text-slate-500">
                        {(() => {
                          const sentDate = log.date_sent || log.onboarding_form_sent_at || log.experience_form_sent_at || log.exit_form_sent_at;
                          return sentDate ? new Date(sentDate).toLocaleDateString() : 'N/A';
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* METADATA INFO CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Active survey info summary */}
        <div className="lg:col-span-4 flex flex-col justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="space-y-3.5">
            <div className={`p-2 w-fit rounded-lg ${activeForm.color} border`}>
              <IconComponent className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">{activeForm.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{activeForm.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">When to deploy</span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                {activeForm.whenUsed}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <a
              href={activeForm.url.replace('?embedded=true', '')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Form in New Tab
            </a>
          </div>
        </div>

        {/* EMBEDDED IFRAME VIEW */}
        <div className="lg:col-span-8 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[550px]">
          
          {/* Iframe simulated browser header */}
          <div className="bg-white border-b border-slate-150 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="ml-3 bg-slate-50 border border-slate-200/60 rounded-md px-3 py-0.5 text-[10px] text-slate-400 font-mono select-none w-56 sm:w-80 truncate">
                {activeForm.url}
              </div>
            </div>

            <a 
              href={activeForm.url.replace('?embedded=true', '')} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Open full survey form"
              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Actual Google Forms Embed Frame */}
          <div className="flex-1 bg-white relative">
            <iframe
              id={`iframe-${activeForm.id}`}
              src={activeForm.url}
              width="100%"
              height="800px"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title={activeForm.title}
              className="w-full"
            >
              Loading survey content...
            </iframe>
          </div>
        </div>

      </div>
      </>
      )}

    </div>
  );
}
