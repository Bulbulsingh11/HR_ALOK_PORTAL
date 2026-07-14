/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ShieldAlert, User as UserIcon, LogIn, ArrowRight, CheckCircle } from 'lucide-react';
import { User as AppUser } from '../types';
import { supabase } from '../lib/supabase';
import AlokLogo from './AlokLogo';
import { AVATAR_109_BASE64, AVATAR_121_BASE64 } from '../assets/base64Assets';


interface LoginProps {
  onLogin: (user: AppUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password");
      } else if (data.user) {
        // Fetch user role from hr_users table
        const { data: hrUser, error: hrUserError } = await supabase
          .from('hr_users')
          .select('role, full_name, email')
          .eq('id', data.user.id)
          .single();

        if (hrUserError || !hrUser || !hrUser.role) {
          await supabase.auth.signOut();
          setError("Access denied: User role not found in HR database.");
          setIsLoading(false);
          return;
        }

        const userRole = (hrUser.role === 'admin' || hrUser.role === 'senior_hr' || hrUser.role === 'HR_ADMIN') ? 'admin' : (hrUser.role === 'hr' ? 'hr' : null);
        if (!userRole) {
          await supabase.auth.signOut();
          setError("Access denied: Invalid role assigned in HR database.");
          setIsLoading(false);
          return;
        }

        const fullName = hrUser.full_name || data.user.email?.split('@')[0] || 'User';

        const appUser: AppUser = {
          id: data.user.id,
          name: fullName,
          email: hrUser.email || data.user.email || '',
          role: userRole as any,
          avatarUrl: userRole === 'admin' ? AVATAR_109_BASE64 : AVATAR_121_BASE64,
        };
        onLogin(appUser);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center mb-5">
          <AlokLogo showText={true} size="lg" theme="light" />
        </div>
        <h2 className="mt-2 text-center text-2xl font-bold text-slate-900">
          HR Portal Login
        </h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <form className="space-y-5" onSubmit={handleAuth}>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
