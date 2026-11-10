import React from 'react';
import { AppProvider, useApp } from './components/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { AddPatientScreen } from './components/AddPatientScreen';
import { PatientProfileScreen } from './components/PatientProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ConsultationHistoryScreen } from './components/ConsultationHistoryScreen';
import { RoleSelectionScreen } from './components/RoleSelectionScreen';
import { DrugsRegistryScreen } from './components/DrugsRegistryScreen';
import { SendReportScreen } from './components/SendReportScreen';
import { OperationsPageScreen } from './components/OperationsPageScreen';
import { OfflineSyncScreen } from './components/OfflineSyncScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Settings, LogOut, Activity, Wifi } from 'lucide-react';

const ClinicalRouter: React.FC = () => {
  const { currentScreen, isRtl, navigateTo, logout, t } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'role-selection':
        return <RoleSelectionScreen key="role-selection" />;
      case 'login':
        return <LoginScreen key="login" />;
      case 'dashboard':
        return <DashboardScreen key="dashboard" />;
      case 'add-patient':
      case 'edit-patient':
        return <AddPatientScreen key="add-edit-patient" />;
      case 'profile':
        return <PatientProfileScreen key="patient-profile" />;
      case 'consultation-history':
        return <ConsultationHistoryScreen key="consultation-history" />;
      case 'settings':
        return <SettingsScreen key="settings" />;
      case 'drugs-registry':
        return <DrugsRegistryScreen key="drugs-registry" />;
      case 'send-report':
        return <SendReportScreen key="send-report" />;
      case 'operations-page':
        return <OperationsPageScreen key="operations-page" />;
      case 'offline-sync':
        return <OfflineSyncScreen key="offline-sync" />;
      default:
        return <RoleSelectionScreen key="role-selection-fallback" />;
    }
  };

  if (currentScreen === 'role-selection' || currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="min-h-screen"
          >
            {currentScreen === 'role-selection' ? <RoleSelectionScreen /> : <LoginScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* High Density Desktop Aside Sidebar */}
      <aside className={`w-20 shrink-0 bg-teal-950 dark:bg-slate-900 border-${isRtl ? 'l' : 'r'} border-teal-900/35 dark:border-slate-800 flex flex-col items-center py-6 gap-8 justify-between h-screen sticky top-0 hidden sm:flex z-20 select-none shadow-xl shadow-teal-950/20`}>
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Clinic emblem */}
          <button 
            id="nav_emblem"
            onClick={() => navigateTo('dashboard')}
            className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 font-extrabold text-lg shadow-lg shadow-teal-950/20 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer"
            title={t.appName}
          >
            MS
          </button>

          {/* Nav links */}
          <nav className="flex flex-col gap-4 w-full px-2">
            {/* Dashboard / Directory */}
            <button
              id="sidebar_nav_dashboard"
              onClick={() => navigateTo('dashboard')}
              title={t.patientList}
              className={`p-3 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                currentScreen === 'dashboard' || currentScreen === 'profile' || currentScreen === 'consultation-history'
                  ? 'bg-teal-850 dark:bg-slate-800 text-white shadow-md shadow-teal-950/10 font-bold'
                  : 'text-teal-300/80 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-teal-900/40 dark:hover:bg-slate-800/80'
              }`}
            >
              <Users className="h-5.5 w-5.5" />
            </button>

            {/* Add Patient */}
            <button
              id="sidebar_nav_add"
              onClick={() => navigateTo('add-patient')}
              title={t.addNewPatient}
              className={`p-3 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                currentScreen === 'add-patient' || currentScreen === 'edit-patient'
                  ? 'bg-teal-855 dark:bg-slate-800 text-white shadow-md shadow-teal-950/10 font-bold'
                  : 'text-teal-300/80 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-teal-900/40 dark:hover:bg-slate-800/80'
              }`}
            >
              <UserPlus className="h-5.5 w-5.5" />
            </button>

            {/* Operations */}
            <button
              id="sidebar_nav_operations"
              onClick={() => navigateTo('operations-page')}
              title={isRtl ? "جدول العمليات الجراحية" : "Surgery & Operations Schedule"}
              className={`p-3 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                currentScreen === 'operations-page'
                  ? 'bg-teal-855 dark:bg-slate-800 text-white shadow-md shadow-teal-950/10 font-bold'
                  : 'text-teal-300/80 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-teal-900/40 dark:hover:bg-slate-800/80'
              }`}
            >
              <Activity className="h-5.5 w-5.5" />
            </button>

            {/* Offline Sync */}
            <button
              id="sidebar_nav_sync"
              onClick={() => navigateTo('offline-sync')}
              title={isRtl ? "مزامنة الهاتف السريعة" : "Hotspot Co-Sync Engine"}
              className={`p-3 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                currentScreen === 'offline-sync'
                  ? 'bg-teal-855 dark:bg-slate-800 text-white shadow-md shadow-teal-950/10 font-bold'
                  : 'text-teal-300/80 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-teal-900/40 dark:hover:bg-slate-800/80'
              }`}
            >
              <Wifi className="h-5.5 w-5.5" />
            </button>

            {/* Settings */}
            <button
              id="sidebar_nav_settings"
              onClick={() => navigateTo('settings')}
              title={t.settings}
              className={`p-3 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                currentScreen === 'settings'
                  ? 'bg-teal-855 dark:bg-slate-800 text-white shadow-md shadow-teal-950/10 font-bold'
                  : 'text-teal-300/80 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-teal-900/40 dark:hover:bg-slate-800/80'
              }`}
            >
              <Settings className="h-5.5 w-5.5" />
            </button>
          </nav>
        </div>

        {/* Logout at bottom */}
        <button
          id="sidebar_nav_logout"
          onClick={logout}
          title={t.logout}
          className="p-3 text-teal-300/70 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <LogOut className="h-5.5 w-5.5" />
        </button>
      </aside>

      {/* Main workspace scroll area */}
      <main className="flex-1 min-w-0 flex flex-col pb-14 sm:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex-1"
          >
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Navigation Drawer (only visible when tiny viewport width) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around h-14 px-2 z-30 select-none shadow-lg">
        <button
          onClick={() => navigateTo('dashboard')}
          className={`px-4 py-1.5 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentScreen === 'dashboard' || currentScreen === 'profile' || currentScreen === 'consultation-history'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold mt-0.5">{t.patientList || 'Patients'}</span>
        </button>

        <button
          onClick={() => navigateTo('add-patient')}
          className={`px-4 py-1.5 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentScreen === 'add-patient' || currentScreen === 'edit-patient'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold mt-0.5">{t.addNewPatient || 'Add'}</span>
        </button>

        <button
          onClick={() => navigateTo('offline-sync')}
          className={`px-4 py-1.5 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentScreen === 'offline-sync'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wifi className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold mt-0.5">{isRtl ? 'المزامنة' : 'Sync'}</span>
        </button>

        <button
          onClick={() => navigateTo('settings')}
          className={`px-4 py-1.5 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentScreen === 'settings'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold mt-0.5">{t.settings}</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ClinicalRouter />
    </AppProvider>
  );
}
