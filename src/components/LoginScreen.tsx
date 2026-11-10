import React, { useState } from 'react';
import { useApp } from './AppContext';
import { motion } from 'motion/react';
import { Stethoscope, Lock, User, Globe, Activity, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

export const LoginScreen: React.FC = () => {
  const { login, t, language, setLanguage, isRtl, userRole, logout } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg(t.fieldRequired);
      return;
    }

    setIsLoading(true);

    // Simulate small professional authentic security delay
    setTimeout(() => {
      const success = login(username.trim(), password);
      setIsLoading(false);
      if (!success) {
        setErrorMsg(t.invalidCredentials);
      }
    }, 800);
  };

  const cycleLanguage = () => {
    const langs: Language[] = ['en', 'ar', 'ku'];
    const idx = langs.indexOf(language);
    const nextIdx = (idx + 1) % langs.length;
    setLanguage(langs[nextIdx]);
  };

  const getLangName = (l: Language) => {
    switch (l) {
      case 'en': return 'English';
      case 'ar': return 'العربية';
      case 'ku': return 'کوردی';
    }
  };

  return (
    <div id="login_container" className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300 font-sans">
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center dir-ltr">
        {/* Simple visual indicator, non-clutered */}
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-medium tracking-tight">
          <Activity className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-semibold">My Secretary v1.2</span>
        </div>
        
        {/* Quick Language & Back Controls */}
        <div className="flex items-center gap-2">
          {/* Back button to Switch Roles */}
          <button
            id="login_back_to_roles"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className={`h-3.5 w-3.5 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            <span>{t.back}</span>
          </button>

          {/* Quick Language Toggle */}
          <button 
            id="login_lang_toggle"
            onClick={cycleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs pr-4 cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{getLangName(language)}</span>
          </button>
        </div>
      </div>

      <motion.div 
        id="login_card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8 transition-colors duration-300"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 ring-8 ring-teal-500/5">
            <Stethoscope className="h-8 w-8" />
          </div>
          <h1 id="login_app_name" className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {t.appName}
          </h1>
          <p id="login_app_subtitle" className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1 uppercase tracking-wider">
            {t.appSubtitle}
          </p>
          <span className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            {t.loginTitle}
          </span>
        </div>

        {errorMsg && (
          <motion.div 
            id="login_error"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 p-4 rounded-xl border text-sm transition-all ${
              isRtl ? 'text-right' : 'text-left'
            } bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950`}
          >
            {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label id="label_username" className={`block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.username}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                <User className="h-4 w-4" />
              </span>
              <input 
                id="input_username"
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  userRole === 'secretary'
                    ? (isRtl ? "مثال: secretary" : "e.g. secretary")
                    : (isRtl ? "مثال: doctor" : "e.g. doctor")
                }
                className={`w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm ${
                  isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
                }`}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label id="label_password" className={`block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.password}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                <Lock className="h-4 w-4" />
              </span>
              <input 
                id="input_password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRtl ? "••••••••" : "••••••••"}
                className={`w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm ${
                  isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
                }`}
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            id="btn_login_submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold rounded-lg transition-all shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              t.loginButton
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
            {isRtl 
              ? "سجل محلي بالكامل. لا يتم إرسال أي سجلات مرضية أو صور تشخيصية عبر شبكة الإنترنت العامة." 
              : "Entirely local clinical data storage. Patient files and diagnostics never leave this localized sandbox."}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
