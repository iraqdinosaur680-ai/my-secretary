import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Info,
  Activity,
  User,
  Check,
  ClipboardList,
  Clock,
  UserCheck,
  X,
  FileText
} from 'lucide-react';
import { PatientOperation, Patient } from '../types';
import { dentalStorage } from '../services/storage';

const localizedOpText = {
  en: {
    title: "Operations & Surgery Registry",
    desc: "Manage scheduled patient surgeries and clinical dental procedures. Referral logs help coordinate treatment timings, patient preparation, and operation statuses.",
    backToDashboard: "Back to Dashboard",
    addNewOperation: "Refer Patient to Operation",
    editOperation: "Modify Scheduled Operation",
    patient: "Select Patient",
    operationName: "Operation Name",
    operationDate: "Operation Date",
    day: "Day",
    month: "Month",
    year: "Year",
    extraNotes: "Extra Notes (Not Required)",
    opPlaceholder: "e.g., Immediate Implant Placement, Apicoectomy, Impacted Wisdom Extraction",
    notesPlaceholder: "Write specific preparations, sedation notes, or instruments required...",
    searchPlaceholder: "Search operations by patient or surgery name...",
    noOperations: "No scheduled or completed surgery records found matching your search.",
    saveBtn: "Save Operation",
    cancelBtn: "Cancel",
    confirmDeleteTitle: "Confirm Surgery Cancellation",
    confirmDeleteDesc: "Are you sure you want to completely remove the operation '{name}' scheduled for '{patient}'? This action cannot be undone.",
    deleteBtn: "Remove",
    activeCount: "Coming Operations",
    completedCount: "All Done Operations",
    isDoneLabel: "Mark Operation as Done / Completed",
    toastCreated: "Successfully referred patient!",
    toastUpdated: "Operation updated successfully!",
    toastDeleted: "Operation removed successfully.",
    comingTab: "Coming Operations",
    doneTab: "All Done Operations",
    badgeUpcoming: "Upcoming",
    badgeCompleted: "Completed",
    referralBtn: "Refer to operations"
  },
  ar: {
    title: "سجل وجدول العمليات الجراحية",
    desc: "إدارة العمليات الجراحية المجدولة للمرضى والإجراءات السريرية المتقدمة. يساعدك هذا السجل في تنظيم التوقيتات، التحضيرات الطبية، تتبع حالة إنجاز العمليات.",
    backToDashboard: "العودة للرئيسية",
    addNewOperation: "إحالة مريض إلى عملية جديدة",
    editOperation: "تعديل تفاصيل العملية المجدولة",
    patient: "اختر المريض من السجل الموحد",
    operationName: "نوع واسم العملية الجراحية",
    operationDate: "تاريخ إجراء العملية",
    day: "اليوم",
    month: "الشهر",
    year: "السنة",
    extraNotes: "ملاحظات وتوصيات إضافية (اختياري)",
    opPlaceholder: "مثال: زراعة فورية للسن، قلع مطمور، قطع ذروة، تجميل لثوي",
    notesPlaceholder: "اكتب هنا التحضيرات المبدئية، نوع التخدير، أو المواد المطلوبة للعملية...",
    searchPlaceholder: "ابحث في العمليات باسم المريض أو اسم العملية...",
    noOperations: "لم يتم العثور على أي عملية جراحية مطابقة لبحثك.",
    saveBtn: "حفظ وتثبيت تفاصيل العملية",
    cancelBtn: "إلغاء التعديل",
    confirmDeleteTitle: "تأكيد إلغاء العملية الجراحية",
    confirmDeleteDesc: "هل أنت متأكد تماماً من رغبتك في حذف العملية المجدولة '{name}' للمريض '{patient}'؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteBtn: "حذف نهائي",
    activeCount: "عمليات قادمة",
    completedCount: "العمليات المنتهية",
    isDoneLabel: "تحديد كمكتملة / تم إجراء العملية بنجاح",
    toastCreated: "تمت إحالة المريض للعمليات بنجاح!",
    toastUpdated: "تم تحديث بيانات العملية الجراحية بنجاح!",
    toastDeleted: "تم حذف سجل العملية.",
    comingTab: "العمليات القادمة",
    doneTab: "العمليات المنتهية",
    badgeUpcoming: "قيد الانتظار",
    badgeCompleted: "تم الإجراء",
    referralBtn: "إحاله الى العمليات"
  },
  ku: {
    title: "تۆمار و خشتەبەندی نەشتەرگەریەکان",
    desc: "بەڕێوەبردنی نەشتەرگەری نەخۆشەکان و کارە سەربەخۆ باڵاکان. ئەم تۆمارە یارمەتیت دەدات بۆ ڕێکخستنی کاتەکان و چاودێریکردنی دۆخی نەشتەرگەرییەکە.",
    backToDashboard: "گەڕانەوە بۆ سەرەکی",
    addNewOperation: "ڕەوانەکردنی نەخۆش بۆ نەشتەرگەری",
    editOperation: "دەستکاریکردنی نەشتەرگەری پاشەکەوتکراو",
    patient: "دیاریکردنی نەخۆش",
    operationName: "جۆری نەشتەرگەری",
    operationDate: "ڕێکەوتی نەشتەرگەری",
    day: "ڕۆژ",
    month: "مانگ",
    year: "ساڵ",
    extraNotes: "تێبینی زیاتر (پێویست نییە)",
    opPlaceholder: "نموونە: چاندنی ددان، دەرهێنانی عەقڵ دەم",
    notesPlaceholder: "ئامادەکارییەکان، جۆری بێهۆشکردن یان تێبینی تر لێرە بنووسە...",
    searchPlaceholder: "گەڕان بەدوای نەشتەرگەری بە ناوی نەخۆش یان جۆری نەشتەرگەری...",
    noOperations: "هیچ نەشتەرگەریەک پاشەکەوت نەکراوە بۆ ئەم گەڕانە.",
    saveBtn: "پاشەکەوتکردنی نەشتەرگەری",
    cancelBtn: "پاشگەزبوونەوە",
    confirmDeleteTitle: "پشتڕاستکردنەوەی سڕینەوە",
    confirmDeleteDesc: "دڵنیای لە سڕینەوەی نەشتەرگەری '{name}' بۆ نەخۆشی '{patient}'؟ ناتوانرێت بگەڕێندرێتەوە.",
    deleteBtn: "سڕینەوە",
    activeCount: "نەشتەرگەری داهاتوو",
    completedCount: "نەشتەرگەری تەواوبوو",
    isDoneLabel: "نیشانەکردن وەک ئەنجامدراو",
    toastCreated: "نەخۆش بە سەرکەوتوویی ڕەوانەی نەشتەرگەری کرا!",
    toastUpdated: "نەشتەرگەری بە سەرکەوتوویی نوێکرایەوە!",
    toastDeleted: "نەشتەرگەری سڕدرایەوە.",
    comingTab: "نەشتەرگەرییەکانی داهاتوو",
    doneTab: "نەشتەرگەرییە تەواوبووەکان",
    badgeUpcoming: "چاودێڕ وەرگرتن",
    badgeCompleted: "تەواوبوو",
    referralBtn: "ڕەوانەکردن بۆ نەشتەرگەری"
  }
};

export const OperationsPageScreen: React.FC = () => {
  const { isRtl, language, navigateTo, t, patients } = useApp();
  const ot = localizedOpText[language] || localizedOpText.en;

  const [operations, setOperations] = useState<PatientOperation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>(() => {
    const saved = sessionStorage.getItem('my_secretary_operations_tab');
    if (saved === 'completed' || saved === 'upcoming') {
      sessionStorage.removeItem('my_secretary_operations_tab');
      return saved;
    }
    return 'upcoming';
  });

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formPatientId, setFormPatientId] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [formOperationName, setFormOperationName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsDone, setFormIsDone] = useState(false);

  // Dropdown date part states
  const [formDay, setFormDay] = useState(() => new Date().getDate());
  const [formMonth, setFormMonth] = useState(() => new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState(() => new Date().getFullYear());

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Confirm delete states
  const [deleteCandidate, setDeleteCandidate] = useState<PatientOperation | null>(null);

  // Load operations on mount
  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = () => {
    const data = dentalStorage.getOperations();
    setOperations(data);
  };

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Pre-fill form for custom launch if redirect parameters can be read
  useEffect(() => {
    // If we have an active patient selected in context, let's select them by default in the patient select
    const activePatientId = sessionStorage.getItem('my_secretary_active_referral_patient_id');
    if (activePatientId) {
      setFormPatientId(activePatientId);
      setPatientSearchQuery('');
      setFormOperationName('');
      setFormNotes('');
      setFormIsDone(false);

      // Default operation date to today
      const today = new Date();
      setFormDay(today.getDate());
      setFormMonth(today.getMonth() + 1);
      setFormYear(today.getFullYear());

      setIsFormOpen(true);
      sessionStorage.removeItem('my_secretary_active_referral_patient_id');
    }
  }, [isFormOpen]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i); // 2026 to 2036

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormPatientId(patients[0]?.id || '');
    setPatientSearchQuery('');
    setFormOperationName('');
    setFormNotes('');
    setFormIsDone(false);

    // Default operation date to today
    const today = new Date();
    setFormDay(today.getDate());
    setFormMonth(today.getMonth() + 1);
    setFormYear(today.getFullYear());

    setIsFormOpen(true);
  };

  const handleOpenEdit = (op: PatientOperation) => {
    setEditingId(op.id);
    setFormPatientId(op.patientId);
    setFormOperationName(op.operationName);
    setFormNotes(op.notes || '');
    setFormIsDone(op.isDone);

    const parts = op.operationDate.split('-');
    if (parts.length === 3) {
      setFormYear(parseInt(parts[0], 10) || currentYear);
      setFormMonth(parseInt(parts[1], 10) || 1);
      setFormDay(parseInt(parts[2], 10) || 1);
    } else {
      const today = new Date();
      setFormDay(today.getDate());
      setFormMonth(today.getMonth() + 1);
      setFormYear(today.getFullYear());
    }

    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formOperationName.trim()) return;

    const selectedPatient = patients.find(p => p.id === formPatientId);
    const patientName = selectedPatient ? selectedPatient.fullName : 'External Patient';

    // Format date string carefully
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${formYear}-${pad(formMonth)}-${pad(formDay)}`;

    if (editingId) {
      // Edit
      dentalStorage.updateOperation(editingId, {
        patientId: formPatientId,
        patientName,
        operationName: formOperationName,
        operationDate: formattedDate,
        notes: formNotes,
        isDone: formIsDone
      });
      triggerToast(ot.toastUpdated, 'success');
    } else {
      // Create
      dentalStorage.addOperation({
        patientId: formPatientId,
        patientName,
        operationName: formOperationName,
        operationDate: formattedDate,
        notes: formNotes,
        isDone: formIsDone
      });
      triggerToast(ot.toastCreated, 'success');
    }

    setIsFormOpen(false);
    loadOperations();
  };

  const handleDelete = (id: string) => {
    dentalStorage.deleteOperation(id);
    setDeleteCandidate(null);
    triggerToast(ot.toastDeleted, 'info');
    loadOperations();
  };

  const toggleDoneDirectly = (op: PatientOperation) => {
    dentalStorage.updateOperation(op.id, { isDone: !op.isDone });
    loadOperations();
    triggerToast(
      isRtl
        ? `تم وضع العلامة على العملية كـ ${!op.isDone ? 'مكتملة' : 'انتظار'}`
        : `Marked as ${!op.isDone ? 'Completed' : 'Upcoming'}`
    );
  };

  // Filter & Search operations
  const filteredOperations = operations.filter(op => {
    const matchSearch = 
      op.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (op.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'upcoming') {
      return !op.isDone;
    } else {
      return op.isDone;
    }
  });

  const upcomingCount = operations.filter(op => !op.isDone).length;
  const completedCount = operations.filter(op => op.isDone).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-150 transition-colors duration-300 font-sans pb-16">
      
      {/* Dynamic Toast Success Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -45, scale: 0.95 }}
            className="fixed top-5 inset-x-0 z-50 flex justify-center px-4"
          >
            <div className={`flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg border text-sm font-bold ${
              toastType === 'success' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-slate-800 text-white border-slate-705'
            }`}>
              {toastType === 'success' ? <CheckCircle className="h-4.5 w-4.5" /> : <Info className="h-4.5 w-4.5" />}
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-black uppercase tracking-wider">{ot.confirmDeleteTitle}</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                {ot.confirmDeleteDesc
                  .replace('{name}', deleteCandidate.operationName)
                  .replace('{patient}', deleteCandidate.patientName)}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-820 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteCandidate.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  {ot.deleteBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header ribbon section */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className={`flex items-center gap-3 w-full md:w-auto ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <button
              id="back_to_dashboard_btn"
              onClick={() => navigateTo('dashboard')}
              className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
              title={ot.backToDashboard}
            >
              {isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h1 className="text-lg font-extrabold text-teal-800 dark:text-teal-400 leading-tight">
                {ot.title}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                {isRtl ? "سجل التنسيق الطبي للعمليات الجراحية" : "Dental surgery schedule & referrals"}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-650 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{ot.addNewOperation}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Informative helper block describing procedures checklist */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-slate-950/60 p-4 rounded-xl border border-teal-100/60 dark:border-teal-900/40 shadow-2xs text-xs font-semibold leading-relaxed flex items-start gap-3">
          <Info className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <p className="text-slate-500 dark:text-slate-400">
            {ot.desc}
          </p>
        </div>

        {/* Sliding form drawer when open */}
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-500/20 dark:border-teal-400/10 p-5 shadow-md space-y-4"
          >
            <div className={`flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Activity className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                <span>{editingId ? ot.editOperation : ot.addNewOperation}</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Patient Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  {ot.patient} *
                </label>
                <div className="relative space-y-1">
                  <input
                    type="text"
                    placeholder={isRtl ? "🔍 ابحث عن مريض بالاسم أو الهوية..." : "🔍 Search patient by name or ID..."}
                    value={patientSearchQuery}
                    onChange={(e) => {
                      const q = e.target.value;
                      setPatientSearchQuery(q);
                      
                      // Auto-select the first matching patient if current selection doesn't match
                      const filtered = patients.filter(p => 
                        p.fullName.toLowerCase().includes(q.toLowerCase()) ||
                        p.patientId.toLowerCase().includes(q.toLowerCase())
                      );
                      if (filtered.length > 0 && !filtered.some(f => f.id === formPatientId)) {
                        setFormPatientId(filtered[0].id);
                      }
                    }}
                    className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <select
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm font-bold cursor-pointer outline-none transition-all"
                    required
                  >
                    <option value="" disabled>{isRtl ? "-- اختر مريضاً --" : "-- Select a patient --"}</option>
                    {patients
                      .filter(p => {
                        if (!patientSearchQuery.trim()) return true;
                        const q = patientSearchQuery.toLowerCase();
                        return p.fullName.toLowerCase().includes(q) || p.patientId.toLowerCase().includes(q);
                      })
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.patientId})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* Operation Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  {ot.operationName} *
                </label>
                <input
                  type="text"
                  value={formOperationName}
                  onChange={(e) => setFormOperationName(e.target.value)}
                  placeholder={ot.opPlaceholder}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm font-bold outline-none transition-all"
                  required
                />
              </div>

              {/* Patient Date Selector - 3 Dropdowns */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  {ot.operationDate} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Day Dropdown Selector */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">{ot.day}</span>
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(parseInt(e.target.value, 10))}
                      className="w-full py-1.5 px-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {days.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Dropdown Selector */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">{ot.month}</span>
                    <select
                      value={formMonth}
                      onChange={(e) => setFormMonth(parseInt(e.target.value, 10))}
                      className="w-full py-1.5 px-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {months.map(m => {
                        const mLabel = isRtl
                          ? ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"][m - 1]
                          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
                        return (
                          <option key={m} value={m}>{m} - {mLabel}</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Year Dropdown Selector */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">{ot.year}</span>
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                      className="w-full py-1.5 px-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Status Done Indicator */}
              <div className="flex items-center pt-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsDone}
                    onChange={(e) => setFormIsDone(e.target.checked)}
                    className="w-4.5 h-4.5 accent-teal-600 rounded-md cursor-pointer cursor-pointer border border-slate-350 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {ot.isDoneLabel}
                  </span>
                </label>
              </div>

              {/* Extra notes optional */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  {ot.extraNotes}
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={ot.notesPlaceholder}
                  rows={2}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm font-semibold outline-none transition-all resize-none"
                />
              </div>

              {/* Save / Cancel triggers */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4.5 py-2 bg-slate-100 dark:bg-slate-820 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {ot.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-650 text-white font-black rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  {ot.saveBtn}
                </button>
              </div>

            </form>
          </motion.div>
        )}

        {/* Directory Card List Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          
          {/* Tabs header + search box row */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Elegant tab toggles */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl items-center w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.0 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{ot.comingTab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ml-1 font-mono font-bold ${
                  activeTab === 'upcoming' ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {upcomingCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.0 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{ot.doneTab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ml-1 font-mono font-bold ${
                  activeTab === 'completed' ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {completedCount}
                </span>
              </button>
            </div>

            {/* Live Search Field */}
            <div className="relative w-full sm:max-w-xs">
              <span className={`absolute inset-y-0 flex items-center text-slate-404 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ot.searchPlaceholder}
                className={`w-full py-1.5 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs font-bold transition-all ${
                  isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3 text-left'
                }`}
              />
            </div>

          </div>

          {/* Table index layout */}
          <div className="overflow-x-auto min-h-[300px]">
            {filteredOperations.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-[10.5px] uppercase tracking-wider select-none">
                    <th className={`px-5 py-3 text-left ${isRtl ? 'text-right' : ''}`}>
                      {isRtl ? "المريض" : "Patient"}
                    </th>
                    <th className={`px-5 py-3 text-left ${isRtl ? 'text-right' : ''}`}>
                      {isRtl ? "العملية الجراحية" : "Surgery / Operation"}
                    </th>
                    <th className="px-5 py-3 text-center">
                      {isRtl ? "تاريخ الموعد المخطط" : "Target Date"}
                    </th>
                    <th className={`px-5 py-3 text-left ${isRtl ? 'text-right' : ''}`}>
                      {isRtl ? "الملاحظات الإضافية" : "Extra Details & Sig Notes"}
                    </th>
                    <th className="px-5 py-3 text-center">
                      {isRtl ? "الحالة" : "Status"}
                    </th>
                    <th className="px-5 py-3 text-center">
                      {isRtl ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredOperations.map((op) => {
                    return (
                      <tr 
                        key={op.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-820/30 transition-colors group"
                      >
                        
                        {/* 1. Patient column linked directly to profile */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigateTo('profile', op.patientId)}
                            className="flex items-center gap-2.5 text-left group-hover:text-teal-600 dark:group-hover:text-teal-400 cursor-pointer outline-none"
                            title={isRtl ? "فتح الملف السريري للمريض" : "Open patient profile clinical clipboard"}
                          >
                            <div className="h-8.5 w-8.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-850 dark:text-white transition-colors">
                                {op.patientName}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-505 font-mono">
                                {isRtl ? "عرض السجل الطبي 🡭" : "Open clip file 🡭"}
                              </div>
                            </div>
                          </button>
                        </td>

                        {/* 2. Surgery Title */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {!op.isDone && (
                              <button
                                onClick={() => toggleDoneDirectly(op)}
                                className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xs"
                                title={isRtl ? "تحديد كمكتملة" : "Mark as Done"}
                              >
                                <Check className="h-3 w-3 stroke-[3px]" />
                              </button>
                            )}
                            <div className="font-extrabold text-slate-850 dark:text-white text-xs sm:text-sm">
                              {op.operationName}
                            </div>
                          </div>
                        </td>

                        {/* 3. Operation Planned Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-center font-mono text-xs font-black">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-820 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-md">
                            <Calendar className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                            <span>{op.operationDate}</span>
                          </div>
                        </td>

                        {/* 4. Notes snippet / raw presentation */}
                        <td className="px-5 py-4 max-w-xs xl:max-w-md">
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-semibold" title={op.notes}>
                            {op.notes ? op.notes : (
                              <span className="text-slate-300 dark:text-slate-700 italic">
                                {isRtl ? "لا توجد تفاصيل" : "No added notes"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Direct Status Toggle Check label */}
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => toggleDoneDirectly(op)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black transition-all cursor-pointer ${
                              op.isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 font-bold'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 font-bold'
                            }`}
                          >
                            {op.isDone ? (
                              <>
                                <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                <span>{ot.badgeCompleted}</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                <span>{ot.badgeUpcoming}</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* 6. Edit/Delete actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-center text-xs">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(op)}
                              className="flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer shadow-xs"
                              title={isRtl ? "تعديل تفاصيل الإحالة" : "Edit surgery detail"}
                            >
                              <Edit2 className="h-3 w-3 stroke-[2.5px]" />
                              <span>{isRtl ? "تعديل" : "Edit"}</span>
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(op)}
                              className="p-1 px-2 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/30 text-rose-500 rounded-md transition-all cursor-pointer"
                              title={isRtl ? "حذف وسحب الإحالة" : "Cancel scheduled surgery"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3 stroke-[1.5]" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold max-w-sm">
                  {ot.noOperations}
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
};
