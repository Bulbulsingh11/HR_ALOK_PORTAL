/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Save, Shield, CheckCircle2, SlidersHorizontal, Lock, Mail, Bell, Database, Trash2 } from 'lucide-react';
import { SettingsConfig } from '../types';
import { useHRData } from '../lib/hrDataBridge';

interface SettingsViewProps {
  settings: SettingsConfig;
  onSaveSettings: (settings: SettingsConfig) => void;
}

export default function SettingsView({ settings, onSaveSettings }: SettingsViewProps) {
  const { data: hrData, setData: setHRData } = useHRData();
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  const handleClearHRData = () => {
    if (window.confirm("Are you sure you want to clear the imported HR dataset? This will delete all records stored locally in IndexedDB.")) {
      setHRData([]);
      setShowClearSuccess(true);
      setTimeout(() => setShowClearSuccess(false), 3000);
    }
  };

  const [compName, setCompName] = useState(settings.companyName);
  const [email, setEmail] = useState(settings.contactEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [graceMin, setGraceMin] = useState(settings.attendanceGraceMinutes);
  const [notif, setNotif] = useState(settings.enableNotifications);
  const [anon, setAnon] = useState(settings.enableAnonymousFeedback);

  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updated: SettingsConfig = {
      companyName: compName,
      contactEmail: email,
      currency,
      timezone,
      attendanceGraceMinutes: Number(graceMin) || 15,
      enableNotifications: notif,
      enableAnonymousFeedback: anon,
    };

    onSaveSettings(updated);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div>
        <p className="text-xs text-slate-500 font-medium font-mono uppercase">Portal Customization</p>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Configuration Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleFormSubmit} className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-6">
            
            {/* General parameters section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                General System Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">HR Admin Contact Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Base Operation Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                  >
                    <option value="USD ($)">USD ($) - US Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                    <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">System Base Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                  >
                    <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shift grace configuration */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-indigo-600" />
                Shift & Clock Access Controls
              </h3>

              <div className="max-w-sm">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Attendance Grace Period (Minutes)
                </label>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={graceMin}
                    onChange={(e) => setGraceMin(Number(e.target.value))}
                    className="block w-24 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-xs text-slate-500 font-medium">Minutes past shift schedule</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-normal block mt-1">
                  Arrivals clocked within this window will be flagged as "On Time" rather than "Late".
                </span>
              </div>
            </div>

            {/* Privacy and notification settings */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-indigo-600" />
                Operations Toggles
              </h3>

              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="notifToggle"
                    checked={notif}
                    onChange={(e) => setNotif(e.target.checked)}
                    className="rounded border-slate-250 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div className="text-xs">
                    <label htmlFor="notifToggle" className="font-semibold text-slate-700 cursor-pointer block">
                      Enable system email digests
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Dispatch daily summaries of clock grace violations, outstanding loan advances, and pending clearances.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="anonToggle"
                    checked={anon}
                    onChange={(e) => setAnon(e.target.checked)}
                    className="rounded border-slate-250 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div className="text-xs">
                    <label htmlFor="anonToggle" className="font-semibold text-slate-700 cursor-pointer block">
                      Allow Anonymous Culture Surveys
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Permit employee feedback boxes to check anonymous headers. Tracing coordination metrics will be hard blocked.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500 font-medium">
                Changes take effect globally on next page navigation.
              </span>
              
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Commit Parameters
              </button>
            </div>

          </form>
        </div>

        {/* Security & Audit Metadata Info Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-indigo-600" />
              LDAP Security Sync
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              This portal is locked under private company network rules. Directory information is synchronizing with central directory repositories.
            </p>

            <div className="bg-slate-50 border border-slate-100/70 p-3.5 rounded-xl space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">PORTAL BUILD TIER</span>
                <p className="font-bold text-slate-700 mt-0.5">SaaS Enterprise Local v1.2</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">SSL CERTIFICATE ENCRYPTION</span>
                <p className="font-bold text-emerald-600 mt-0.5 font-mono">TLS_AES_256_GCM_SHA384 (Active)</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">AUDIT SECURITY RULE</span>
                <p className="font-bold text-slate-700 mt-0.5">SOC2 Compliant Enforcer</p>
              </div>
            </div>
          </div>

          {/* Data Management Panel */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-indigo-600" />
              Data Catalog Management
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Manage the persisted HR dataset. Wiping the catalog deletes all imported candidate/employee information from IndexedDB.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearHRData}
                disabled={!hrData || hrData.length === 0}
                className="w-full px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 disabled:hover:bg-transparent rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Clear Imported HR Dataset
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {showSavedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="text-xs font-bold">System Settings Updated Successfully!</span>
          </motion.div>
        )}
        {showClearSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-lg border border-rose-500 flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="text-xs font-bold">HR Dataset Wiped from Storage</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
