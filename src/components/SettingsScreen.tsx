import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight,
  Globe, 
  Moon, 
  Sun, 
  ShieldAlert, 
  User, 
  Lock, 
  CheckCircle,
  HelpCircle,
  Activity,
  Download,
  Upload,
  Database,
  AlertCircle,
  Folder,
  FolderOpen,
  HardDrive,
  Terminal,
  Link
} from 'lucide-react';
import { Language, Theme } from '../types';
import { dentalStorage, getDirectoryHandle, saveDirectoryHandle, triggerAutoBackup } from '../services/storage';

const settingsLocalT = {
  en: {
    title: "Windows PC Local Disk Storage",
    desc: "By setting a folder on your PC (e.g. C:\\Users\\Format Center\\Downloads\\my-secretary-photos), all scans and reports are stored directly on your computer. This bypasses web browser storage capacity limits.",
    pathLabel: "PC Folder Absolute Path",
    pathPlaceholder: "e.g. C:\\Users\\Format Center\\Downloads\\my-secretary-photos",
    savePath: "Save Folder Path",
    selectFolder: "Select Directory (Browser Sync)",
    granted: "Direct Connection Active",
    grantReq: "Click here to authorize folder access",
    syncBtn: "Automatically Create Folders for All Patients",
    syncSuccess: "Patient folders and subdirectories successfully created on your local drive!",
    batDesc: "Create folders using Windows Batch script:",
    batBtn: "Download Folder Maker Script (.bat)",
    batExpl: "Download this file, place it in your local folder, and double-click to instantly create all patient subdirectories offline.",
    imagingScans: "Imaging Scans",
    labReports: "Lab Reports",
    pathSaved: "Local folder path setting saved successfully."
  },
  ar: {
    title: "مسار تخزين المجلد المحلي بأجهزة الكمبيوتر",
    desc: "من خلال تحديد مجلد في جهاز الكمبيوتر الخاص بك (مثال: C:\\Users\\Format Center\\Downloads\\my-secretary-photos)، سيتم حفظ كافة الملفات داخله مباشرة مما يجنب عيادتك قيود متصفح الويب.",
    pathLabel: "المسار الكامل للمجلد على جهازك",
    pathPlaceholder: "الافتراضي: C:\\Users\\Format Center\\Downloads\\my-secretary-photos",
    savePath: "تأكيد وحفظ المسار",
    selectFolder: "اختر مجلد الكمبيوتر (مزامنة فورية)",
    granted: "الاتصال المباشر نشط وآمن",
    grantReq: "اضغط هنا لتفعيل المزامنة للمجلد المختار",
    syncBtn: "تحديث وإنشاء مجلدات المرضى تلقائياً",
    syncSuccess: "تم إنشاء وتحديث مجلدات جميع المرضى بنجاح في جهاز الكمبيوتر الخاص بك!",
    batDesc: "إنشاء مجلدات المرضى يدوياً عبر ملف دفعي بالكمبيوتر:",
    batBtn: "تحميل سكربت إنشاء المجلدات (.bat)",
    batExpl: "قم بتحميل هذا السكربت ووضعه في مجلدك الرئيسي بالكمبيوتر، ثم انقر عليه نقرتين وسيقوم بإنشاء كافة مجلدات المرضى والمجلدات الفرعية تلقائياً وبسرعة.",
    imagingScans: "مخططات وصور الأشعة والسونار",
    labReports: "تقارير وتقارير المختبر",
    pathSaved: "تم حفظ إعدادات مجلد الكمبيوتر بنجاح وتفعيل التخزين الخارجي."
  },
  ku: {
    title: "پاشەکەوتکردنی فایل لە کۆمپیوتەری ناوخۆیی",
    desc: "بە دانانی بوخچەیەک لەسەر کۆمپیوتەرەکەت (وەک: C:\\Users\\Format Center\\Downloads\\my-secretary-photos)، هەموو پشکنینەکان ڕاستەوخۆ لەسەر کۆمپیوتەرەکەت پاشەکەوت دەبن و سنووری وێبگەڕ تێدەپەڕێنرێت.",
    pathLabel: "ڕێڕەوی تەواوی بوخچەکە لەسەر کۆمپیوتەرەکەت",
    pathPlaceholder: "نموونە: C:\\Users\\Format Center\\Downloads\\my-secretary-photos",
    savePath: "پاشەکەوتکردنی ڕێڕەوی پۆشە",
    selectFolder: "دیاریکردنی بوخچە لە کۆمپیوتەر",
    granted: "پەیوەندی ڕاستەوخۆ چالاکە",
    grantReq: "لێرە کلیل بکە بۆ ڕێگەپێدانی مزامنة",
    syncBtn: "دروستکردنی خۆکاری بوخچەکان بۆ هەموو نەخۆشەکان",
    syncSuccess: "بوخچەکانی هەموو نەخۆشەکان بە سەرکەوتوویی لەسەر هارد دیسکەکەت دروستکران!",
    batDesc: "دروستکردنی بوخچەکان لەڕێگەی سکرێپتی ویندۆزەوە:",
    batBtn: "داگرتنی سکرێپتی دروستکەر (.bat)",
    batExpl: "ئەم فایلە دابگرە، بیخەرە ناو بوخچەکەتەوە و دووجار لێی بدە بۆ دروستکردنی سەرجەم بوخچەکانی نەخۆر بەشێوەی ئۆفلایین.",
    imagingScans: "Imaging Scans",
    labReports: "Lab Reports",
    pathSaved: "ڕێڕەوی بوخچەی کۆمپیوتەری ناوخۆیی بەسەرکەوتوویی پاشەکەوت کرا."
  }
};

export const SettingsScreen: React.FC = () => {
  const { 
    language, 
    theme, 
    setLanguage, 
    setTheme, 
    t, 
    isRtl, 
    navigateTo, 
    updateCredentials,
    refreshPatientsList,
    folderHandle,
    setFolderHandle,
    dirAuthorized,
    setDirAuthorized
  } = useApp();

  const currentLocalT = settingsLocalT[language] || settingsLocalT.en;

  const creds = dentalStorage.getCredentials();
  
  const [username, setUsername] = useState(creds.username);
  const [password, setPassword] = useState(creds.passwordHash);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Local storage paths definitions
  const [photosPath, setPhotosPathState] = useState(() => dentalStorage.getPhotosRootPath());

  const handleSelectFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        setFolderHandle(handle);
        setDirAuthorized(true);
        await saveDirectoryHandle(handle);
        
        if (!photosPath) {
          const defaultPath = `C:\\Users\\Format Center\\Downloads\\my-secretary-photos`;
          setPhotosPathState(defaultPath);
          dentalStorage.setPhotosRootPath(defaultPath);
        }
        
        // Trigger immediate backup to newly chosen folder
        setTimeout(() => {
          triggerAutoBackup(handle).catch(err => console.warn("Initial auto-backup failed:", err));
        }, 100);

        setSavedMessage(isRtl ? "تم الاتصال بالمجلد بنجاح والنسخ الاحتياطي نشط!" : "Successfully connected local folder! Live auto-backup is active.");
        setTimeout(() => setSavedMessage(''), 3500);
      } else {
        setErrorMessage(isRtl 
          ? "متصفحك لا يدعم الوصول المباشر للمجلدات. يرجى استخدام متصفح Google Chrome أو Edge."
          : "Direct FileSystem API is not fully supported by your browser sandbox. Enter terminal paths below."
        );
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Folder picker failed.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  const handleGrantPermission = async () => {
    if (!folderHandle) return;
    try {
      const status = await (folderHandle as any).requestPermission({ mode: 'readwrite' });
      if (status === 'granted') {
        setDirAuthorized(true);
        
        // Trigger immediate backup
        setTimeout(() => {
          triggerAutoBackup(folderHandle).catch(err => console.warn("Auto-backup on grant failed:", err));
        }, 100);

        setSavedMessage(isRtl ? "تم منح صلاحية الوصول وصنع نسخة احتياطية فورية!" : "Access granted and instant auto-backup created!");
        setTimeout(() => setSavedMessage(''), 3500);
      } else {
        setDirAuthorized(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Permission request failed.');
      setTimeout(() => setErrorMessage(''), 3500);
    }
  };

  const handleSyncFolders = async () => {
    const handle = folderHandle;
    if (!handle) {
      setErrorMessage(isRtl ? "يرجى تحديد المجلد أولاً لتحديث وتزامن المرضى." : "Please authorize the Directory handle before running direct synchronization.");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    try {
      const status = await (handle as any).queryPermission({ mode: 'readwrite' });
      if (status !== 'granted') {
        const reqStat = await (handle as any).requestPermission({ mode: 'readwrite' });
        if (reqStat !== 'granted') {
          setErrorMessage(isRtl ? "الصلاحية مرفوضة! لا يمكن الكتابة." : "Write permission rejected.");
          setTimeout(() => setErrorMessage(''), 3000);
          return;
        }
      }
      
      setDirAuthorized(true);
      const patients = dentalStorage.getPatients();
      
      const sanitizeDirName = (name: string) => {
        return name.replace(/[\\/:*?"<>|]/g, '').trim();
      };
      
      for (const p of patients) {
        const patientFolderSlug = `${p.patientId} - ${sanitizeDirName(p.fullName)}`;
        await handle.getDirectoryHandle(patientFolderSlug, { create: true });
      }
      
      setSavedMessage(currentLocalT.syncSuccess);
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed directory synchronization.");
      setTimeout(() => setErrorMessage(''), 3500);
    }
  };

  const handleSavePathOnly = () => {
    if (!photosPath.trim()) {
      setErrorMessage(isRtl ? "يرجى كتابة مسار صحيح أولاً" : "Please provide a valid storage path.");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    dentalStorage.setPhotosRootPath(photosPath.trim());
    setSavedMessage(currentLocalT.pathSaved);
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const handleDownloadBat = () => {
    try {
      const patients = dentalStorage.getPatients();
      const sanitizeDirName = (name: string) => {
        return name.replace(/[\\/:*?"<>|]/g, '').trim();
      };
      
      const lines = [
        "@echo off",
        "echo ===========================================================",
        "echo      MY SECRETARY CLINICAL FILE AUTO-FOLDER CREATOR",
        "echo ===========================================================",
        "echo.",
        "echo This script will create patient folders",
        "echo inside your current workspace directory on your Windows PC.",
        "echo.",
        "CHCP 65001 > nul",
        "echo Working in: %CD%",
        "echo."
      ];
      
      for (const p of patients) {
        const folderName = `${p.patientId} - ${sanitizeDirName(p.fullName)}`;
        lines.push(`if not exist "${folderName}" mkdir "${folderName}"`);
      }
      
      lines.push("");
      lines.push("echo.");
      lines.push("echo ===========================================================");
      lines.push("echo SUCCESS: All patient directories configured successfully!");
      lines.push("echo ===========================================================");
      lines.push("pause");
      
      const batContent = lines.join("\r\n");
      const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", URL.createObjectURL(blob));
      downloadAnchor.setAttribute("download", "create_patient_folders.bat");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setSavedMessage(isRtl ? "تم تحميل ملف المجلدات (.bat) بنجاح!" : "Windows folder creator batch script downloaded.");
      setTimeout(() => setSavedMessage(''), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to make bat.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const [lastExportTime, setLastExportTime] = useState<string | null>(() => {
    return localStorage.getItem('my_secretary_last_export_time');
  });
  const [promptDismissed, setPromptDismissed] = useState(false);

  const daysSinceLastExport = React.useMemo(() => {
    if (!lastExportTime) return null;
    const lastDate = new Date(lastExportTime);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - lastDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [lastExportTime]);

  const handleUpdateCreds = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('');

    if (!username.trim() || !password.trim()) {
      return;
    }

    updateCredentials(username.trim(), password);
    setSavedMessage(t.credentialsUpdated);
    
    setTimeout(() => {
      setSavedMessage('');
    }, 2500);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setSavedMessage(isRtl ? "تم تغيير مظهر النظام بنجاح" : "Visual interface theme updated.");
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setSavedMessage(lang === 'en' ? "Language changed." : lang === 'ar' ? "تم تغيير لغة النظام" : "زمانى سیستەم گۆڕدرا");
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        app: "My Secretary Medical Records",
        version: "1.2",
        exportedAt: new Date().toISOString(),
        patients: JSON.parse(localStorage.getItem('my_secretary_patients') || '[]'),
        history: JSON.parse(localStorage.getItem('my_secretary_history') || '[]'),
        notes: JSON.parse(localStorage.getItem('my_secretary_notes') || '[]'),
        images: JSON.parse(localStorage.getItem('my_secretary_images') || '[]'),
        credentials: JSON.parse(localStorage.getItem('my_secretary_credentials') || 'null'),
        language: localStorage.getItem('my_secretary_language') || 'en',
        theme: localStorage.getItem('my_secretary_theme') || 'light'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `my_secretary_database_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      localStorage.setItem('my_secretary_last_export_time', new Date().toISOString());
      setLastExportTime(new Date().toISOString());

      setSavedMessage(isRtl ? "تم تصدير قاعدة البيانات بنجاح!" : "Database backup exported successfully!");
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setErrorMessage(isRtl ? "حدث خطأ أثناء التصدير" : "Error occurred during export.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setSavedMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        const data = JSON.parse(result);

        // Validation - must have a patients array, or the app metadata string
        if (data && (Array.isArray(data.patients) || data.app === "My Secretary Dental Records" || data.app === "My Secretary Medical Records")) {
          if (Array.isArray(data.patients)) {
            localStorage.setItem('my_secretary_patients', JSON.stringify(data.patients));
          }
          if (Array.isArray(data.history)) {
            localStorage.setItem('my_secretary_history', JSON.stringify(data.history));
          }
          if (Array.isArray(data.notes)) {
            localStorage.setItem('my_secretary_notes', JSON.stringify(data.notes));
          }
          if (Array.isArray(data.images)) {
            localStorage.setItem('my_secretary_images', JSON.stringify(data.images));
          }
          if (data.credentials && data.credentials.username && data.credentials.passwordHash) {
            localStorage.setItem('my_secretary_credentials', JSON.stringify(data.credentials));
          }
          if (data.language) {
            localStorage.setItem('my_secretary_language', data.language);
            setLanguage(data.language);
          }
          if (data.theme) {
            localStorage.setItem('my_secretary_theme', data.theme);
            setTheme(data.theme);
          }

          refreshPatientsList();
          setSavedMessage(t.importSuccess);
          setTimeout(() => setSavedMessage(''), 4000);
        } else {
          setErrorMessage(t.importError);
          setTimeout(() => setErrorMessage(''), 4000);
        }
      } catch (err) {
        setErrorMessage(t.importError);
        setTimeout(() => setErrorMessage(''), 4000);
      }
      // Reset input value
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings_container" className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            id="settings_btn_back"
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 font-bold transition-all cursor-pointer"
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span>{t.backToDashboard}</span>
          </button>

          <h1 id="settings_page_title" className="text-base font-bold text-slate-900 dark:text-white">
            {t.settings}
          </h1>

          <div className="w-16"></div> {/* spacer */}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Save/update confirmation toaster overlay inline */}
        <AnimatePresence>
          {savedMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-4 bg-teal-600 text-white rounded-xl shadow-md flex items-center gap-2.5 text-xs font-bold border border-teal-500"
            >
              <CheckCircle className="h-4 w-4 shrink-0 animate-bounce" />
              <span>{savedMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error notification toaster overlay inline */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-4 bg-rose-600 text-white rounded-xl shadow-md flex items-center gap-2.5 text-xs font-bold border border-rose-500"
            >
              <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Periodic Backup Export Reminder Prompt */}
        {!promptDismissed && (lastExportTime === null || (daysSinceLastExport !== null && daysSinceLastExport >= 7)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            id="backup_recommendation_prompt"
            className="p-5 border border-amber-200/60 dark:border-amber-905 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
          >
            <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {t.exportPromptTitle}
                </h3>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 font-medium leading-relaxed">
                  {lastExportTime === null 
                    ? t.exportPromptNever 
                    : t.exportPromptOld.replace('{days}', String(daysSinceLastExport))
                  }
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <button
                id="prompt_btn_dismiss"
                onClick={() => setPromptDismissed(true)}
                className="px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/30 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-200/30 dark:border-amber-900/30 rounded-lg transition-all cursor-pointer"
              >
                {isRtl ? "تجاهل" : "Dismiss"}
              </button>
              
              <button
                id="prompt_btn_export"
                onClick={handleExportBackup}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm shadow-amber-600/10 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.exportData}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 1. LANGUAGE SELECTOR CARD */}
        <div id="settings_card_lang" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {t.languageSelection}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { code: 'en', label: 'English', desc: 'United States' },
              { code: 'ar', label: 'العربية', desc: 'العراق والشرق الأوسط' },
              { code: 'ku', label: 'کوردی', desc: 'کوردستانی عێراق' }
            ].map((option) => (
              <button
                key={option.code}
                id={`lang_opt_${option.code}`}
                onClick={() => handleLanguageChange(option.code as Language)}
                className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  language === option.code
                    ? 'bg-teal-500/10 dark:bg-teal-950/20 border-teal-500 text-teal-700 dark:text-teal-400 ring-2 ring-teal-500/20 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span className="text-sm">{option.label}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. THEME SWITCHER CARD */}
        <div id="settings_card_theme" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Sun className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {t.themeToggle}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="theme_opt_light"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-teal-500/10 dark:bg-teal-950/20 border-teal-500 text-teal-700 dark:text-teal-400 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span className="text-xs font-bold">{t.lightMode}</span>
            </button>

            <button
              id="theme_opt_dark"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-teal-500/10 dark:bg-teal-950/20 border-teal-500 text-teal-700 dark:text-teal-450 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span className="text-xs font-bold">{t.darkMode}</span>
            </button>
          </div>
        </div>

        {/* 3. CLINICIAN CREDENTIALS MANAGEMENT */}
        <div id="settings_card_creds" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className={`flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <ShieldAlert className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight animate-pulse">
                {isRtl ? "تغيير بيانات تسجيل الدخول" : "Verify Account Access credentials"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                {isRtl ? "قم بتعيين اسم مستخدم وكلمة مرور جديدة محلياً" : "Specify your personalized credentials stored in secure local memory"}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateCreds} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username field */}
              <div className="space-y-1">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.currentUsername}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="sett_username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-all ${
                      isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3 text-left'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.newPassword}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="sett_password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-all ${
                      isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3 text-left'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              id="btn_update_creds"
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-teal-500/10 cursor-pointer"
            >
              {isRtl ? "حفظ وتعديل بيانات المرور" : "Save Credential Updates"}
            </button>
          </form>
        </div>

        {/* 3.1 LOCAL PATH & HARD DRIVE STORAGE CARD */}
        <div id="settings_card_local_storage" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className={`flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <HardDrive className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {currentLocalT.title}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                {currentLocalT.desc}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Folder selection with showDirectoryPicker if available */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className={`text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  {folderHandle ? <FolderOpen className="h-4 w-4 text-emerald-500" /> : <Folder className="h-4 w-4 text-slate-400" />}
                  <span>{folderHandle ? folderHandle.name : (isRtl ? "لم يتم ربط مجلد مباشر بعد" : "No live folder handle connected")}</span>
                  {folderHandle && dirAuthorized && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20">
                      {isRtl ? "نسخ احتياطي تلقائي نشط" : "Auto-Backup Active"}
                    </span>
                  )}
                </h4>
                <p className={`text-[10px] text-slate-400 font-semibold leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                  {folderHandle 
                    ? (dirAuthorized 
                        ? `${currentLocalT.granted} • ${isRtl ? "يتم حفظ نسخة احتياطية جديدة وتحديثها تلقائياً مع كل تغيير ومسح السابقة." : "A fresh backup is updated automatically in the background on any change, replacing the last one."}` 
                        : currentLocalT.grantReq) 
                    : (isRtl ? "اختر المجلد لتفعيل إنشاء ملفات المرضى ومزامنتها فورياً بالكمبيوتر." : "Select directory for true system access & auto patient folder creation.")
                  }
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {folderHandle && !dirAuthorized && (
                  <button
                    id="btn_grant_permissions"
                    onClick={handleGrantPermission}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    🔐 {isRtl ? "تفعيل الاذن" : "Grant Access"}
                  </button>
                )}
                <button
                  id="btn_picker_select_folder"
                  onClick={handleSelectFolder}
                  className="px-3 py-1.5 bg-teal-50 dark:bg-slate-850 hover:bg-teal-100 dark:hover:bg-slate-800 border border-teal-200/40 dark:border-slate-800 text-teal-800 dark:text-teal-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                >
                  <Folder className="h-3 w-3" />
                  <span>{currentLocalT.selectFolder}</span>
                </button>
              </div>
            </div>

            {/* Custom Path Text Input */}
            <div className="space-y-1">
              <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                {currentLocalT.pathLabel}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className={`absolute inset-y-0 flex items-center text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <Terminal className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="sett_local_path"
                    type="text"
                    value={photosPath}
                    onChange={(e) => setPhotosPathState(e.target.value)}
                    placeholder={currentLocalT.pathPlaceholder}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-all ${
                      isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3 text-left'
                    }`}
                  />
                </div>
                <button
                  id="btn_save_path_only"
                  onClick={handleSavePathOnly}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-all shadow-sm"
                >
                  {currentLocalT.savePath}
                </button>
              </div>
            </div>

            {/* Folder creation synchronization actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-0.5">
                  <h4 className={`text-[11px] font-bold text-slate-800 dark:text-slate-200 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {isRtl ? "مزامنة وإنشاء المجلدات الفرعية" : "Sync Folder Structures"}
                  </h4>
                  <p className={`text-[10px] text-slate-400 leading-relaxed max-w-md ${isRtl ? 'text-right' : 'text-left'}`}>
                    {currentLocalT.syncDesc}
                  </p>
                </div>
                <button
                  id="btn_run_folders_sync"
                  disabled={!folderHandle}
                  onClick={handleSyncFolders}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    folderHandle 
                      ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-850 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Folder className="h-3.5 w-3.5" />
                  <span>{currentLocalT.syncBtn}</span>
                </button>
              </div>

              {/* Windows manual batch script maker */}
              <div className="bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-2 text-left">
                <div className={`flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Terminal className="h-3.5 w-3.5 text-slate-500" />
                  <span>{currentLocalT.batDesc}</span>
                </div>
                <p className={`text-[10px] text-slate-400 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                  {currentLocalT.batExpl}
                </p>
                <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
                  <button
                    id="btn_download_bat"
                    onClick={handleDownloadBat}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>{currentLocalT.batBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DRUG REGISTRY QUICK PORTAL CARD */}
        <div id="settings_card_drugs" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className={`flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isRtl ? "دليل وسجل الأدوية الطبي" : "Medical Drug Registry"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                {isRtl 
                  ? "تسجيل الأدوية، تدوين أسماء التجارة والتركيب العلمي وجرعاتها القياسية لاستدعائها بسرعة أثناء كتابة الوصفات للمرضى."
                  : "Manage prescription templates, trade names, formulations, and baseline instructions for smart suggestions."}
              </p>
            </div>
          </div>

          <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} pt-2`}>
            <button
              id="btn_open_drug_registry"
              onClick={() => navigateTo('drugs-registry' as any)}
              className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center gap-2"
            >
              💊
              <span>{isRtl ? "فتح سجل الأدوية والوصفات" : "Open Drug Registry & Prescription Catalog"}</span>
            </button>
          </div>
        </div>

        {/* 4. DATABASE BACKUP / EXPORT & IMPORT */}
        <div id="settings_card_backup" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className={`flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Database className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {t.exportData} &amp; {t.importData}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                {t.exportDataDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {/* Export trigger button */}
            <button
              id="btn_export_database"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 hover:bg-teal-150 dark:bg-slate-850 dark:hover:bg-slate-800 text-teal-800 dark:text-teal-400 border border-teal-200/50 dark:border-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{t.exportData}</span>
            </button>

            {/* Import file input label and trigger */}
            <div className="relative">
              <input
                id="backup_import_input"
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <label
                htmlFor="backup_import_input"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-500/10 cursor-pointer text-center"
              >
                <Upload className="h-4 w-4" />
                <span>{t.importData}</span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. ABOUT SYSTEM / APP META */}
        <div className="p-5 border border-slate-200/50 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 transition-colors flex flex-col items-center text-center space-y-2">
          <HelpCircle className="h-5 w-5 text-teal-600/60 dark:text-teal-400/60" />
          <h3 className="text-xs font-bold text-slate-950 dark:text-white leading-tight">
            My Secretary Medical Records v1.2
          </h3>
          <p className="text-[10px] text-slate-400 max-w-sm">
            {isRtl 
              ? "صمم هذا النظام الطبي خصيصاً للمراكز والعيادات التخصصية المستقلة لضمان أمان عالي المستوى بموجب لوائح الخصوصية المحلية." 
              : "Locally hosted medical clipboard systems. Compliant with HIPAA-standard sandboxed architectures."}
          </p>
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-405 border-t border-slate-105 dark:border-slate-805 pt-2 mt-1 space-y-1">
            <p>
              {language === 'ar' 
                ? "تم تطوير التطبيق بواسطة: طه طارق (تلفون: 07832715181، إيميل: tahatariq20069@gmail.com)" 
                : language === 'ku'
                ? "ئەم ئەپە گەشەی پێدراوە لەلایەن: تەها تاریق (مۆبایل: 07832715181، ئیمەیڵ: tahatariq20069@gmail.com)"
                : "Developed by: Taha Tariq (Phone: 07832715181, Email: tahatariq20069@gmail.com)"}
            </p>
            <p className="text-teal-600 dark:text-teal-400 font-bold">
              {language === 'ar'
                ? "الشريك المؤسس: عبد الرحمن سعد (تلفون: 07730048236، إيميل: abdulrhmansaadmohammed@gmail.com)"
                : language === 'ku'
                ? "هاوبەشی دامەزرێنەر: عەبدولڕەحمان سەعد (مۆبایل: 07730048236، ئیمەیڵ: abdulrhmansaadmohammed@gmail.com)"
                : "Co-Founder: Abdul Rahman Saad (Phone: 07730048236, Email: abdulrhmansaadmohammed@gmail.com)"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-1.5 text-[10px] font-mono text-teal-600 dark:text-teal-400">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>{t.autoSaved}</span>
          </div>
        </div>
      </main>
    </div>
  );
};
