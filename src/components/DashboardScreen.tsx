import React, { useState } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  FolderOpen, 
  Edit, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Tag,
  Stethoscope,
  Activity,
  Plus,
  ChevronRight,
  ChevronLeft,
  Download,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Patient, DentalHistoryEntry, PatientOperation } from '../types';
import { dentalStorage, formatIQDAmount } from '../services/storage';
import { calculateAgeFromDobDetailed } from '../services/ageHelper';

const highlightText = (text: string | null | undefined, highlight: string) => {
  if (!text) return '-';
  const term = highlight.trim();
  if (!term) return <span>{text}</span>;

  try {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === term.toLowerCase();
          return isMatch ? (
            <mark 
              key={index} 
              className="bg-yellow-250 dark:bg-amber-500/30 text-slate-900 dark:text-amber-100 font-bold px-0.5 rounded-sm"
            >
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
};

export const DashboardScreen: React.FC = () => {
  const { 
    patients, 
    t, 
    isRtl, 
    navigateTo, 
    refreshPatientsList,
    userRole,
    language
  } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [hideIncome, setHideIncome] = useState(() => {
    return localStorage.getItem('my_secretary_hide_income') === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('my_secretary_hide_income', String(hideIncome));
  }, [hideIncome]);

  const [deleteCandidate, setDeleteCandidate] = useState<Patient | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Virtual pagination elements
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [gridOffsetTop, setGridOffsetTop] = useState(400);

  // Track global scroll and window height
  React.useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    // Initial sync
    handleScroll();
    handleResize();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    if (gridRef.current) {
      setGridOffsetTop(gridRef.current.offsetTop);
    }
  }, [patients.length, searchQuery]);

  const [statsMonth, setStatsMonth] = useState(() => {
    return new Date().getMonth() + 1; // 1-12
  });

  const [statsYear, setStatsYear] = useState(() => {
    return new Date().getFullYear();
  });

  const [operations, setOperations] = React.useState<PatientOperation[]>([]);

  React.useEffect(() => {
    setOperations(dentalStorage.getOperations());
  }, []);

  const doneOpsCount = operations.filter(o => o.isDone).length;
  const todoOpsCount = operations.filter(o => !o.isDone).length;

  const nearestOp = React.useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const matchOps = operations.filter(op => {
      if (op.isDone) return false;
      const opDate = new Date(op.operationDate);
      if (isNaN(opDate.getTime())) return false;
      return opDate >= today;
    });

    const sorted = [...matchOps].sort((a,b) => a.operationDate.localeCompare(b.operationDate));
    return sorted[0] || null;
  }, [operations]);

  const [statsDailyDate, setStatsDailyDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Fetch consultation history from local storage directly for calculating real-time revenue stats
  const historyEntries: DentalHistoryEntry[] = (() => {
    try {
      const historyRaw = localStorage.getItem('my_secretary_history');
      return historyRaw ? JSON.parse(historyRaw) : [];
    } catch {
      return [];
    }
  })();

  // Filter entries based on selected month and year
  const monthlyEntries = historyEntries.filter(entry => {
    if (!entry.visitDate) return false;
    const parts = entry.visitDate.split('-');
    if (parts.length < 2) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return y === statsYear && m === statsMonth;
  });

  // Count unique patients who have visited within the selected month/year
  const uniqueMonthlyPatientsCount = new Set(monthlyEntries.map(e => e.patientId)).size;

  // Calculate total monthly fee/revenue collected in this period
  const totalMonthlyIncome = monthlyEntries.reduce((sum, entry) => {
    return sum + (entry.billingAmount || 0);
  }, 0);

  // Filter entries based on selected specific date for daily income
  const dailyEntries = historyEntries.filter(entry => {
    return entry.visitDate === statsDailyDate;
  });

  // Calculate total daily fee/revenue collected on this specific date
  const totalDailyIncome = dailyEntries.reduce((sum, entry) => {
    return sum + (entry.billingAmount || 0);
  }, 0);

  // Filter patients based on Name, Patient ID, or Phone Number
  const filteredPatients = patients.filter(p => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.patientId.toLowerCase().includes(term) ||
      (p.phoneNumber && p.phoneNumber.toLowerCase().includes(term))
    );
  });

  // Calculate virtual window boundaries
  const rowHeight = 84;
  const buffer = 5;

  const relativeScrollTop = Math.max(0, scrollTop - gridOffsetTop);
  const rawStartIndex = Math.floor(relativeScrollTop / rowHeight);
  const startIndex = Math.max(0, rawStartIndex - buffer);
  
  const rawEndIndex = Math.ceil((relativeScrollTop + viewportHeight) / rowHeight);
  const endIndex = Math.min(filteredPatients.length, rawEndIndex + buffer);

  const topSpacerHeight = startIndex * rowHeight;
  const bottomSpacerHeight = Math.max(0, (filteredPatients.length - endIndex) * rowHeight);

  const visiblePatients = filteredPatients.slice(startIndex, endIndex);

  const handleDeleteConfirm = () => {
    if (deleteCandidate) {
      dentalStorage.deletePatient(deleteCandidate.id);
      setSelectedPatientIds(prev => prev.filter(id => id !== deleteCandidate.id));
      refreshPatientsList();
      setDeleteCandidate(null);
    }
  };

  const handleToggleRow = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedPatientIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    const allFilteredIds = filteredPatients.map(p => p.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedPatientIds.includes(id));
    if (allSelected) {
      setSelectedPatientIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedPatientIds(prev => {
        const next = [...prev];
        allFilteredIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleExportSelected = () => {
    if (selectedPatientIds.length === 0) return;
    try {
      const rawPatients = JSON.parse(localStorage.getItem('my_secretary_patients') || '[]');
      const rawHistory = JSON.parse(localStorage.getItem('my_secretary_history') || '[]');
      const rawNotes = JSON.parse(localStorage.getItem('my_secretary_notes') || '[]');
      const rawImages = JSON.parse(localStorage.getItem('my_secretary_images') || '[]');

      const selectedPatients = rawPatients.filter((p: any) => selectedPatientIds.includes(p.id));
      const selectedHistory = rawHistory.filter((h: any) => selectedPatientIds.includes(h.patientId));
      const selectedNotes = rawNotes.filter((n: any) => selectedPatientIds.includes(n.patientId));
      const selectedImages = rawImages.filter((v: any) => selectedPatientIds.includes(v.patientId));

      const backupData = {
        app: "My Secretary Medical Records (Selected Patients Export)",
        version: "1.2",
        exportedAt: new Date().toISOString(),
        patients: selectedPatients,
        history: selectedHistory,
        notes: selectedNotes,
        images: selectedImages,
        language: localStorage.getItem('my_secretary_language') || 'en',
        theme: localStorage.getItem('my_secretary_theme') || 'light'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `my_secretary_selected_${selectedPatientIds.length}_patients_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Export selected failed", err);
    }
  };

  const handleBatchDeleteConfirm = () => {
    selectedPatientIds.forEach(id => {
      dentalStorage.deletePatient(id);
    });
    refreshPatientsList();
    setSelectedPatientIds([]);
    setShowBatchDeleteModal(false);
  };

  // Quick stats calculations
  const totalPatientsCount = patients.length;
  // Calculate approximate visits count (mocking realistic EHR indicator info)
  const simulatedVisitsToday = patients.length > 0 ? patients.length + 3 : 0;

  return (
    <div id="dashboard_container" className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      
      {/* High Density Desktop / Mobile Integrated Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-10 transition-colors px-4 sm:px-6">
        <div className={`max-w-7xl mx-auto py-3 flex flex-col md:flex-row justify-between items-center gap-3 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          
          <div className={`flex items-center gap-3 w-full md:w-auto ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="p-2 bg-teal-600 dark:bg-teal-500 text-white rounded-lg shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h1 id="dashboard_app_title" className="text-base font-extrabold text-teal-800 dark:text-teal-400 leading-tight">
                {t.appName}
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Compact real-time stats and HIPAA badge at top-right in EN and top-lift (left) in AR */}
          <div className={`flex flex-wrap items-center gap-2.5 w-full md:w-auto ${isRtl ? 'md:flex-row-reverse justify-start' : 'justify-end'}`}>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs">
              <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                {isRtl ? "المرضى المسجلين:" : "Registered Patients:"}
              </span>
              <span id="stat_patients_count" className="font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                {totalPatientsCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-550 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                {isRtl ? "سجلات الزيارات:" : "Visit Logs:"}
              </span>
              <span className="font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                {simulatedVisitsToday}
              </span>
            </div>

            <button
              id="btn_send_report_trigger"
              onClick={() => navigateTo('send-report')}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer shadow-xs"
            >
              <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              <span>{isRtl ? "ارسل تقرير" : "Send Report"}</span>
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Compact, ultra-sleek horizontal surgery coordinator ribbon */}
        <div className="bg-gradient-to-r from-teal-850 to-emerald-950 dark:from-slate-900 dark:to-slate-950 text-white px-4 py-3 rounded-2xl border border-teal-700/20 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
          <div className="flex items-center gap-2 max-w-full">
            <Activity className="h-4.5 w-4.5 text-emerald-400 shrink-0 animate-pulse" />
            <span className="font-extrabold text-teal-300 whitespace-nowrap">
              {isRtl ? "العملية الجراحية الأقرب:" : "Nearest Surgery:"}
            </span>
            {nearestOp ? (
              <div className="inline-flex flex-wrap items-center gap-2 max-w-full">
                <button
                  onClick={() => navigateTo('operations-page')}
                  className="inline-flex flex-wrap items-center gap-2 hover:text-emerald-300 text-left cursor-pointer truncate"
                >
                  <span className="font-extrabold text-white underline decoration-dashed underline-offset-3 hover:text-emerald-300 truncate">{nearestOp.patientName}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md font-mono shrink-0">
                    {nearestOp.operationDate}
                  </span>
                  <span className="text-teal-100 font-medium truncate">({nearestOp.operationName})</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dentalStorage.updateOperation(nearestOp.id, { isDone: true });
                    setOperations(dentalStorage.getOperations());
                  }}
                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs ml-1"
                  title={isRtl ? "تحديد كمكتملة" : "Mark as Done"}
                >
                  <Check className="h-3 w-3 stroke-[3px]" />
                </button>
              </div>
            ) : (
              <span className="text-teal-200/60 italic font-medium">
                {isRtl ? "لا توجد عمليات متبقية مجدولة" : "No scheduled upcoming surgeries"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold">
            <button
              onClick={() => {
                sessionStorage.setItem('my_secretary_operations_tab', 'completed');
                navigateTo('operations-page');
              }}
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded-lg transition-all text-emerald-300 font-extrabold cursor-pointer"
              title={isRtl ? "العمليات المنتهية" : "Completed Operations"}
            >
              <span>{isRtl ? "المنجزة:" : "Done:"}</span>
              <span className="font-mono bg-emerald-500/20 px-1.5 py-0.2 rounded">{doneOpsCount}</span>
            </button>

            <span className="text-teal-700/60">|</span>

            <button
              onClick={() => {
                sessionStorage.setItem('my_secretary_operations_tab', 'upcoming');
                navigateTo('operations-page');
              }}
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded-lg transition-all text-amber-300 font-extrabold cursor-pointer"
              title={isRtl ? "العمليات قيد الانتظار" : "Upcoming Operations"}
            >
              <span>{isRtl ? "الانتظار:" : "Upcoming:"}</span>
              <span className="font-mono bg-amber-500/20 px-1.5 py-0.2 rounded">{todoOpsCount}</span>
            </button>

            <span className="text-teal-700/60">|</span>

            <button
              onClick={() => navigateTo('operations-page')}
              className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-3 py-1.5 text-[10.5px] font-black rounded-lg shadow-sm text-white uppercase tracking-wider cursor-pointer active:scale-95 transition-all text-center whitespace-nowrap"
            >
              {isRtl ? "سجل العمليات 🡭" : "Manage 🡭"}
            </button>
          </div>
        </div>

        {/* Analytics Dashboard Panel */}
        {userRole === 'doctor' && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900/40 dark:to-slate-950/40 p-5 rounded-2xl border border-teal-100/60 dark:border-teal-900/45 shadow-xs space-y-4">
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h3 className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-widest">
                {isRtl ? "إحصائيات الأداء المالي والسريري" : "Financial & Clinical Performance Analytics"}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isRtl ? "حساب فوري للمرضى والمداخيل بناءً على الرصد التاريخي" : "Real-time calculation of active patient flow and clinical revenue"}
              </p>
            </div>

            {/* Month & Year Selectors */}
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {t.chooseMonth}:
                </span>
                <select
                  value={statsMonth}
                  onChange={(e) => setStatsMonth(parseInt(e.target.value, 10))}
                  className="py-1 px-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white outline-none focus:border-teal-500 cursor-pointer min-w-[55px]"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {t.chooseYear}:
                </span>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={statsYear}
                  onChange={(e) => setStatsYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                  className="py-1 px-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white outline-none focus:border-teal-500 max-w-[80px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Stat: Patients Count */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl shadow-2xs hover:shadow-xs transition-colors flex flex-col justify-between">
              <div>
                <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.monthlyPatients} ({statsMonth}/{statsYear})
                </div>
                <div className={`text-2xl font-black text-slate-900 dark:text-white mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {uniqueMonthlyPatientsCount}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-505 ml-1.5 font-mono">
                    ({monthlyEntries.length} {isRtl ? "زيارة" : "visits"})
                  </span>
                </div>
              </div>
              <div className={`text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                <span className="truncate">{isRtl ? "المرضى المستفيدين خلال الشهر المحدد" : "Distinct patients in chosen month"}</span>
              </div>
            </div>

            {/* Stat: Total Revenue */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl shadow-2xs hover:shadow-xs transition-colors flex flex-col justify-between">
              <div>
                <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span>{t.totalIncome} ({t.iqdinar}) ({statsMonth}/{statsYear})</span>
                  <button
                    onClick={() => setHideIncome(!hideIncome)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isRtl ? "تبديل الخصوصية" : "Toggle Privacy"}
                  >
                    {hideIncome ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className={`text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {hideIncome ? "••••••••" : `${formatIQDAmount(totalMonthlyIncome)} ${isRtl ? "د.ع" : "IQD"}`}
                </div>
              </div>
              <div className={`text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">{isRtl ? "إجمالي الواردات المستحصلة بالشهر" : "Total collectibles in chosen month"}</span>
              </div>
            </div>

            {/* Stat: Daily Income (Dynamic with inline Day Picker) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl shadow-2xs hover:shadow-xs transition-colors flex flex-col justify-between">
              <div>
                <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span>{t.dailyIncome} ({t.iqdinar})</span>
                  <button
                    onClick={() => setHideIncome(!hideIncome)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isRtl ? "تبديل الخصوصية" : "Toggle Privacy"}
                  >
                    {hideIncome ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className={`text-2xl font-black text-rose-600 dark:text-rose-450 mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {hideIncome ? "••••••••" : `${formatIQDAmount(totalDailyIncome)} ${isRtl ? "د.ع" : "IQD"}`}
                  {!hideIncome && (
                    <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 ml-1.5 font-mono">
                      ({dailyEntries.length} {isRtl ? "زيارة اليوم" : "visits today"})
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className={`flex items-center justify-between gap-1.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[9.5px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {t.chooseDay}:
                  </span>
                  <input
                    type="date"
                    value={statsDailyDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setStatsDailyDate(e.target.value);
                      }
                    }}
                    className="py-0.5 px-2 text-[11px] font-mono font-bold rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white outline-none focus:border-teal-500 max-w-[125px] cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
        )}

        {/* Directory Dashboard Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          
          {/* Header row with search query */}
          <div className={`px-5 py-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
            
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 id="patient_list_title" className="text-base font-extrabold text-slate-800 dark:text-white">
                {t.patientList}
              </h2>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-semibold">
                {isRtl ? "قائمة المستندات النشطة بالعيادة" : "Active Patient Records database"}
              </p>
            </div>

            {/* High Density Live Search & Redesigned Register Button */}
            <div className={`flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-2xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="relative w-full flex-1">
                <span className={`absolute inset-y-0 flex items-center text-slate-404 dark:text-slate-500 ${isRtl ? 'right-4' : 'left-4'}`}>
                  <Search className="h-5 w-5" />
                </span>
                <input
                  id="search_box"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className={`w-full py-2.5 px-4 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm font-semibold shadow-xs transition-all ${
                    isRtl ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                  }`}
                />
              </div>

              {/* Directly Accessible New Patient Button next to Search */}
              <button
                id="btn_add_patient_top"
                onClick={() => navigateTo('add-patient')}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-650 text-white font-bold py-2.5 px-5 rounded-full shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>{t.addNewPatient}</span>
              </button>
            </div>

          </div>

          {/* Directory Content Area */}
          <div ref={gridRef} id="patient_list_grid" className="overflow-x-auto min-h-[350px]">
            {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                <Users className="h-10 w-10 opacity-30 mb-2.5" />
                <p id="empty_search_msg" className="text-xs font-extrabold">{t.noPatientsFound}</p>
                {patients.length === 0 && (
                  <button
                    onClick={() => navigateTo('add-patient')}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 dark:bg-teal-500 text-white rounded-lg text-xs font-bold hover:bg-teal-750 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.addNewPatient}</span>
                  </button>
                )}
              </div>
            ) : (
              <table className={`w-full text-xs font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className={`text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <th className="px-4 py-3 text-center w-12" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={filteredPatients.length > 0 && filteredPatients.every(p => selectedPatientIds.includes(p.id))}
                        onChange={handleToggleAll}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-705 text-teal-600 focus:ring-teal-555 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3 font-mono">{isRtl ? "رمز المريض" : "Patient ID"}</th>
                    <th className="px-5 py-3">{isRtl ? "الاسم الكامل" : "Full Name"}</th>
                    <th className="px-5 py-3">{isRtl ? "الجنس" : "Gender"}</th>
                    <th className="px-5 py-3">{isRtl ? "اتصال الهاتف" : "Phone Connection"}</th>
                    <th className="px-5 py-3">{isRtl ? "تاريخ آخر زيارة" : "Last Visit Date"}</th>
                    <th className="px-5 py-3">{t.totalPaid}</th>
                    <th className="px-5 py-3 text-center w-36">{isRtl ? "خيارات الملف" : "Record Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {topSpacerHeight > 0 && (
                    <tr style={{ height: `${topSpacerHeight}px` }} aria-hidden="true">
                      <td colSpan={8} style={{ height: `${topSpacerHeight}px` }} />
                    </tr>
                  )}
                  {visiblePatients.map((patient) => {
                    const isMale = patient.gender === 'male';
                    const isRowSelected = selectedPatientIds.includes(patient.id);
                    return (
                      <tr
                        id={`patient_card_${patient.id}`}
                        key={patient.id}
                        onClick={() => navigateTo('profile', patient.id)}
                        className={`border-b border-slate-50 dark:border-slate-800/40 hover:bg-teal-500/5 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group ${
                          isRowSelected ? 'bg-teal-500/5 dark:bg-teal-450/5' : ''
                        }`}
                      >
                        {/* Selector Column */}
                        <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) => handleToggleRow(e, patient.id)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-705 text-teal-600 focus:ring-teal-555 cursor-pointer"
                          />
                        </td>

                        {/* ID */}
                        <td className="px-5 py-3.5 font-bold font-mono text-slate-500 dark:text-slate-450">
                          {patient.patientId}
                        </td>

                        {/* Full Name */}
                        <td className="px-5 py-3.5 text-base sm:text-lg md:text-xl font-bold md:font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors tracking-tight">
                          <div>{highlightText(patient.fullName, searchQuery)}</div>
                          {patient.dateOfBirth && (
                            <div className={`text-[10px] text-slate-400 dark:text-slate-500 font-mono font-semibold mt-0.5 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                              <span>{patient.dateOfBirth}</span>
                              <span className="inline-block w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                              <span className="text-teal-600 dark:text-teal-400 font-sans font-bold">
                                {calculateAgeFromDobDetailed(patient.dateOfBirth, language, t)}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Gender */}
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider ${
                            isMale 
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                              : 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400'
                          }`}>
                            {patient.gender === 'male' ? t.genderMale : patient.gender === 'female' ? t.genderFemale : t.genderOther}
                          </span>
                        </td>

                        {/* Phone Number */}
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 dir-ltr text-left">
                          {patient.phoneNumber ? highlightText(patient.phoneNumber, searchQuery) : '-'}
                        </td>

                        {/* Last Visit Date */}
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {patient.lastVisitDate}
                          </span>
                        </td>

                        {/* Total Paid */}
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                            {(() => {
                              if (patient.paymentType === 'free') {
                                return (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                    {isRtl ? "مجاني" : "Free"}
                                  </span>
                                );
                              }
                              const patientHistory = historyEntries.filter(e => e.patientId === patient.id);
                              const totalPaidConsultations = patientHistory.reduce((sum, entry) => sum + (entry.billingAmount || 0), 0);
                              const initialPayment = patient.paymentType === 'paid' ? (patient.paymentAmount || 0) : 0;
                              return `${formatIQDAmount(initialPayment + totalPaidConsultations)} ${isRtl ? "د.ع" : "IQD"}`;
                            })()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-center">
                          <div className={`flex items-center justify-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`} onClick={(e) => e.stopPropagation()}>
                            {/* Edit */}
                            <button
                              id={`patient_btn_edit_${patient.id}`}
                              onClick={() => navigateTo('edit-patient', patient.id)}
                              title={t.edit}
                              className="flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer shadow-xs"
                            >
                              <Edit className="h-3 w-3 stroke-[2.5px]" />
                              <span>{isRtl ? "تعديل" : "Edit"}</span>
                            </button>

                            {/* Delete */}
                            <button
                              id={`patient_btn_delete_${patient.id}`}
                              onClick={() => setDeleteCandidate(patient)}
                              title={t.delete}
                              className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Open */}
                            <button
                              id={`patient_btn_profile_${patient.id}`}
                              onClick={() => navigateTo('profile', patient.id)}
                              className="p-1.5 px-2 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-extrabold rounded text-[10px] transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <FolderOpen className="h-3 w-3" />
                              <span>{isRtl ? "الملف" : "Open"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {bottomSpacerHeight > 0 && (
                    <tr style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true">
                      <td colSpan={8} style={{ height: `${bottomSpacerHeight}px` }} />
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div> {/* Closing Table responsive wrapper */}
        </div> {/* Closing Directory Dashboard Container */}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteCandidate && (
          <div id="delete_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full mb-4">
                  <AlertTriangle className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isRtl ? "تأكيد حذف ملف المريض" : "Confirm Record Deletion"}
                </h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">
                  {deleteCandidate.fullName} ({deleteCandidate.patientId})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-6 font-semibold">
                  {t.confirmDeletePatient}
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    id="btn_cancel_delete"
                    onClick={() => setDeleteCandidate(null)}
                    className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-semibold transition-all cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    id="btn_confirm_delete"
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Batch Actions Bar */}
      <AnimatePresence>
        {selectedPatientIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 80, opacity: 0, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800/80 max-w-lg w-[calc(100%-2rem)] flex flex-col sm:flex-row items-center justify-between gap-3 font-sans"
          >
            <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="bg-teal-500/20 text-teal-400 p-1.5 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-mono">
                  {isRtl 
                    ? `تم تحديد ${selectedPatientIds.length} مرضى` 
                    : `${selectedPatientIds.length} Patient${selectedPatientIds.length > 1 ? 's' : ''} Selected`}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {isRtl 
                    ? "اختر إجراء للملفات المحددة" 
                    : "Choose action for the selected records"}
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 w-full sm:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={handleExportSelected}
                title={isRtl ? "تصدير المحدد" : "Export Selected"}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isRtl ? "تصدير" : "Export"}</span>
              </button>

              <button
                onClick={() => setShowBatchDeleteModal(true)}
                title={isRtl ? "حذف المحدد" : "Delete Selected"}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-all active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isRtl ? "حذف" : "Delete"}</span>
              </button>

              <button
                onClick={() => setSelectedPatientIds([])}
                title={isRtl ? "إلغاء التحديد" : "Deselect All"}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Delete Confirmation Modal */}
      <AnimatePresence>
        {showBatchDeleteModal && (
          <div id="batch_delete_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full mb-4">
                  <AlertTriangle className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isRtl ? "تأكيد حذف المرضى المحددين" : "Confirm Batch Deletion"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-6 font-semibold">
                  {isRtl 
                    ? `هل أنت متأكد من رغبتك في حذف ${selectedPatientIds.length} مرضى محددين بشكل نهائي؟ سيتم حذف جميع الزيارات والتأريخ المرضي والصور الطبية الخاصة بهم. لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to permanently delete the selected ${selectedPatientIds.length} patient records? All their visit logs, medical histories, diagnosis entries, notes, and uploaded images will be permanently erased. This action cannot be undone.`}
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowBatchDeleteModal(false)}
                    className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-semibold transition-all cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleBatchDeleteConfirm}
                    className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {isRtl ? "حذف الكل" : "Delete All"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
