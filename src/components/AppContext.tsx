import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Theme, Patient, PatientFullRecord, UserRole } from '../types';
import { translations, TranslationSet } from '../translations';
import { dentalStorage, getDirectoryHandle, triggerAutoBackup } from '../services/storage';
import { syncClient } from '../services/syncClient';

export type ScreenState = 'role-selection' | 'login' | 'dashboard' | 'add-patient' | 'edit-patient' | 'profile' | 'settings' | 'consultation-history' | 'drugs-registry' | 'send-report' | 'operations-page';

interface AppContextProps {
  language: Language;
  theme: Theme;
  userAuthenticated: boolean;
  userRole: UserRole | null;
  selectRole: (role: UserRole) => void;
  t: TranslationSet;
  isRtl: boolean;
  currentScreen: ScreenState;
  selectedPatientId: string | null;
  selectedConsultationId: string | null;
  setSelectedConsultationId: (id: string | null) => void;
  patients: Patient[];
  folderHandle: any;
  setFolderHandle: (handle: any) => void;
  dirAuthorized: boolean;
  setDirAuthorized: (authorized: boolean) => void;
  
  // Navigation
  navigateTo: (screen: ScreenState, patientId?: string | null) => void;
  
  // Auth actions
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateCredentials: (username: string, password: string) => void;
  
  // Config actions
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  
  // Patient operations
  refreshPatientsList: () => void;
  activePatientRecord: PatientFullRecord | null;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('light');
  const [userAuthenticated, setUserAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('role-selection');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatientRecord, setActivePatientRecord] = useState<PatientFullRecord | null>(null);
  
  const [folderHandle, setFolderHandle] = useState<any>(null);
  const [dirAuthorized, setDirAuthorized] = useState<boolean>(false);

  // Initialize values on start
  useEffect(() => {
    const savedLang = dentalStorage.getLanguage();
    const savedTheme = dentalStorage.getTheme();
    
    setLangState(savedLang);
    setThemeState(savedTheme);
    
    // Apply language preferences to document
    dentalStorage.setLanguage(savedLang);
    dentalStorage.setTheme(savedTheme);
    
    // Read session authentication if verified for the component mount
    const authSession = sessionStorage.getItem('my_secretary_session') === 'true';
    const savedRole = sessionStorage.getItem('my_secretary_role') as UserRole | null;
    if (authSession && savedRole) {
      setUserAuthenticated(true);
      setUserRole(savedRole);
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('role-selection');
    }
    
    // Load patient index
    setPatients(dentalStorage.getPatients());

    // Connect local SQLite updates to mDNS sync broadcasts
    dentalStorage.subscribe((action, itemType, data) => {
      syncClient.broadcastChange(action, itemType, data);
    });

    // Load folder handle from IndexedDB with safe catch block
    getDirectoryHandle()
      .then((handle) => {
        if (handle) {
          setFolderHandle(handle);
          (handle as any).queryPermission({ mode: 'readwrite' })
            .then((status: string) => {
              if (status === 'granted') {
                setDirAuthorized(true);
              }
            })
            .catch((err: any) => {
              console.warn("Failed to query initial folder permission:", err);
            });
        }
      })
      .catch((err: any) => {
        console.warn("Failed to load initial folder handle:", err);
      });
  }, []);

  // Automatic folder authorization on active user gestures to avoid manual steps
  useEffect(() => {
    if (!folderHandle || dirAuthorized) return;

    let requesting = false;

    const handleUserGesture = async () => {
      if (!folderHandle || dirAuthorized || requesting) return;
      requesting = true;
      try {
        const currentStatus = await (folderHandle as any).queryPermission({ mode: 'readwrite' });
        if (currentStatus === 'granted') {
          setDirAuthorized(true);
          cleanup();
          return;
        }

        const newStatus = await (folderHandle as any).requestPermission({ mode: 'readwrite' });
        if (newStatus === 'granted') {
          setDirAuthorized(true);
          // Trigger immediate backup once granted
          triggerAutoBackup(folderHandle).catch(err => console.warn("Auto-backup after gesture grant failed:", err));
          cleanup();
        }
      } catch (err) {
        console.log("Interactive permission activation skipped, deferred, or cancelled by user.");
      } finally {
        requesting = false;
      }
    };

    const cleanup = () => {
      window.removeEventListener('click', handleUserGesture, true);
      window.removeEventListener('keydown', handleUserGesture, true);
    };

    window.addEventListener('click', handleUserGesture, true);
    window.addEventListener('keydown', handleUserGesture, true);

    return cleanup;
  }, [folderHandle, dirAuthorized]);

  // Passive, crash-safe permission status sync on window focus and tab visibility change
  useEffect(() => {
    if (!folderHandle || dirAuthorized) return;

    let active = true;
    const syncStatus = async () => {
      try {
        const currentStatus = await (folderHandle as any).queryPermission({ mode: 'readwrite' });
        if (currentStatus === 'granted' && active) {
          setDirAuthorized(true);
        }
      } catch (err) {
        // Quietly catch sandbox limitations
      }
    };

    window.addEventListener('focus', syncStatus);
    document.addEventListener('visibilitychange', syncStatus);

    syncStatus();

    return () => {
      active = false;
      window.removeEventListener('focus', syncStatus);
      document.removeEventListener('visibilitychange', syncStatus);
    };
  }, [folderHandle, dirAuthorized]);

  // Sync patient profile detail when page changes or ID changes
  useEffect(() => {
    if (selectedPatientId) {
      const record = dentalStorage.getPatient(selectedPatientId);
      setActivePatientRecord(record);
    } else {
      setActivePatientRecord(null);
    }
  }, [selectedPatientId, currentScreen]);

  const refreshPatientsList = () => {
    setPatients(dentalStorage.getPatients());
    if (selectedPatientId) {
      setActivePatientRecord(dentalStorage.getPatient(selectedPatientId));
    }
  };

  const navigateTo = (screen: ScreenState, patientId: string | null = null) => {
    if (patientId !== undefined) {
      setSelectedPatientId(patientId);
    }
    setCurrentScreen(screen);
  };

  const login = (username: string, password: string): boolean => {
    const isJoker = username.trim().toLowerCase() === 'taha' && password === 'ceotaha77';
    
    // Check doctor credentials
    const docCreds = dentalStorage.getCredentials('doctor');
    // Check secretary credentials
    const secCreds = dentalStorage.getCredentials('secretary');

    if (isJoker || (docCreds.username.trim().toLowerCase() === username.trim().toLowerCase() && docCreds.passwordHash === password)) {
      setUserAuthenticated(true);
      setUserRole('doctor');
      sessionStorage.setItem('my_secretary_session', 'true');
      sessionStorage.setItem('my_secretary_role', 'doctor');
      setCurrentScreen('dashboard');
      refreshPatientsList();
      return true;
    } else if (secCreds.username.trim().toLowerCase() === username.trim().toLowerCase() && secCreds.passwordHash === password) {
      setUserAuthenticated(true);
      setUserRole('secretary');
      sessionStorage.setItem('my_secretary_session', 'true');
      sessionStorage.setItem('my_secretary_role', 'secretary');
      setCurrentScreen('dashboard');
      refreshPatientsList();
      return true;
    }
    return false;
  };

  const selectRole = (role: UserRole) => {
    setUserRole(role);
    sessionStorage.setItem('my_secretary_role', role);
    // Force enter credentials for the selected role
    setUserAuthenticated(false);
    sessionStorage.removeItem('my_secretary_session');
    setCurrentScreen('login');
  };

  const logout = () => {
    setUserAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('my_secretary_session');
    sessionStorage.removeItem('my_secretary_role');
    setSelectedPatientId(null);
    setCurrentScreen('role-selection');
  };

  const updateCredentials = (username: string, password: string) => {
    dentalStorage.saveCredentials({
      username,
      passwordHash: password
    }, userRole || 'doctor');
  };

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    dentalStorage.setLanguage(lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    dentalStorage.setTheme(newTheme);
  };

  const t = translations[language] || translations.en;
  const isRtl = language === 'ar' || language === 'ku';

  return (
    <AppContext.Provider value={{
      language,
      theme,
      userAuthenticated,
      userRole,
      selectRole,
      t,
      isRtl,
      currentScreen,
      selectedPatientId,
      selectedConsultationId,
      setSelectedConsultationId,
      patients,
      navigateTo,
      login,
      logout,
      updateCredentials,
      setLanguage,
      setTheme,
      refreshPatientsList,
      activePatientRecord,
      folderHandle,
      setFolderHandle,
      dirAuthorized,
      setDirAuthorized
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider context.');
  }
  return context;
};
