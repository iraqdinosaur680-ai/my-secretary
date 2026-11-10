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
  Settings, 
  Info,
  Activity
} from 'lucide-react';
import { Drug, getDrugEmoji } from '../types';
import { dentalStorage } from '../services/storage';

const localDrugT = {
  en: {
    title: "Prescription Drug Register",
    desc: "Catalog your clinic's common formulas, brand names, and dosage guidelines. When adding a patient consultation, start typing in the treatment field to instantly load smart autocomplete suggestions.",
    backToSettings: "Back to Settings",
    addNewDrug: "Register New Medical Drug",
    editDrug: "Modify Clinical Formula",
    tradeName: "Trade Name (Brand)",
    scientificName: "Scientific Name (Ingredients)",
    dosageForm: "Dosage Form",
    strength: "Strength / Concentration",
    instructions: "Baseline Practice / Sig Instructions",
    tradePlaceholder: "e.g. Panadol Extra, Augmentin",
    scientificPlaceholder: "e.g. Paracetamol + Caffeine, Amoxicillin",
    strengthPlaceholder: "e.g. 500mg, 1g, 100mg/5ml",
    instructionsPlaceholder: "e.g. Take 1 tablet thrice daily after food for 5 days",
    searchPlaceholder: "Search registered drugs by brand or scientific formula...",
    noDrugs: "No registered molecular formulas found matching your search.",
    saveBtn: "Save Registered Drug",
    cancelBtn: "Cancel",
    confirmDeleteTitle: "Confirm Formula Deletion",
    confirmDeleteDesc: "Are you sure you want to completely discard {name} from the medical catalog? This cannot be undone.",
    deleteBtn: "Discard",
    searchQty: "Active catalog formulas: {qty}",
    successCreated: "Formula successfully cataloged in registry!",
    successUpdated: "Molecular formula successfully updated!",
    successDeleted: "Formula discarded from local registry."
  },
  ar: {
    title: "سجل وصيدلية الأدوية الخاصة بك",
    desc: "قم بإدراج الأدوية والوصفات الطبية الشائعة بالعيادة مع تراكيبها وجرعاتها الافتراضية. عند كتابة بروتوكول العلاج للمريض لاحقاً، ستظهر لك اقتراحات متطابقة تلقائياً وتعبأ فوراً.",
    backToSettings: "العودة للإعدادات",
    addNewDrug: "تسجيل علاج طبي جديد بالعيادة",
    editDrug: "تعديل بيانات العلاج الطبي بالدليل",
    tradeName: "الاسم التجاري للعلاج (براند)",
    scientificName: "الاسم العلمي (المادة الفعالة والتركيب)",
    dosageForm: "الشكل والجرعة الصيدلانية",
    strength: "قوة الدواء / التركيز",
    instructions: "طريقة الاستخدام والإرشادات الافتراضية للوصفة",
    tradePlaceholder: "مثال: Panadol Extra, Augmentin",
    scientificPlaceholder: "مثال: Paracetamol, Amoxicillin + Clavulanic",
    strengthPlaceholder: "مثال: 500mg, 1g, 250mg/5ml",
    instructionsPlaceholder: "مثال: حبة واحدة 3 مرات يومياً بعد الطعام لمدة 5 أيام",
    searchPlaceholder: "ابحث في سجل الأدوية عبر الاسم العلمي أو التجاري...",
    noDrugs: "لا توجد أدوية مسجلة مطابقة للبحث حالياً.",
    saveBtn: "حفظ وتثبيت الدواء بالسجل",
    cancelBtn: "إلغاء التعديل",
    confirmDeleteTitle: "تأكيد حذف صيغة الدواء",
    confirmDeleteDesc: "هل أنت متأكد تماماً من رغبتك بحذف دواء {name} نهائياً من سجل الصيدلية؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteBtn: "حذف نهائي",
    searchQty: "إجمالي الأدوية المسجلة: {qty} دواء",
    successCreated: "تم تسجيل الدواء بنجاح في سجل عيادتك!",
    successUpdated: "تم تحديث بيانات الصيغة الدوائية بنجاح!",
    successDeleted: "تم حذف الدواء بنجاح من الدليل المحلي."
  },
  ku: {
    title: "تۆمار و گەنجینەی دەرمانەکان",
    desc: "دەرمانە باوەکان و شێوازی بەکارهێنانیان پاشەکەوت بکە. لە کاتی نووسینی چارەسەر بۆ نەخۆش، بە تەنها نووسینی چەند پیتێک دەرمانی پاشەکەوتکراو دەردەکەوێت بە شێوازی زیرەک.",
    backToSettings: "گەڕانەوە بۆ ڕێکخستنەکان",
    addNewDrug: "تۆمارکردنی دەرمانی نوێ",
    editDrug: "دەستکاریکردنی فۆرمۆڵای دەرمان",
    tradeName: "ناوی بازرگانی (براند)",
    scientificName: "ناوی زانستی (پێکهاتەی چالاک)",
    dosageForm: "شێوازی دەرمانەکە",
    strength: "هێزی دەرمانەکە / خەستی",
    instructions: "ڕێنمایی بەکارهێنانی سەرەکی و بنەڕەتی",
    tradePlaceholder: "نموونە: Panadol Extra, Augmentin",
    scientificPlaceholder: "نموونە: Paracetamol, Amoxicillin",
    strengthPlaceholder: "نموونە: 500mg, 1g",
    instructionsPlaceholder: "نموونە: یەک حەب ٣ جار ڕۆژانە دوای نان خواردن",
    searchPlaceholder: "گەڕان بەدوای دەرمان بەپێی ناوی زانستی یان بازرگانی...",
    noDrugs: "هیچ دەرمانێک بۆ گەڕانەکەت نەدۆزرایەوە.",
    saveBtn: "پاشەکەوتکردنی دەرمان",
    cancelBtn: "پاشگەزبوونەوە",
    confirmDeleteTitle: "پشتڕاستکردنەوەی سڕینەوە",
    confirmDeleteDesc: "ئایا دڵنیای لە سڕینەوەی دەرمانی {name} لە تۆمارەکەدا؟ ناتوانرێت بگەڕێندرێتەوە.",
    deleteBtn: "سڕینەوە",
    searchQty: "کۆی دەرمانە تۆمارکراوەکان: {qty}",
    successCreated: "دەرمانەکە بە سەرکەوتوویی زیادکرا!",
    successUpdated: "دەرمانەکە بە سەرکەوتوویی نوێکرایەوە!",
    successDeleted: "دەرمانەکە بە سەرکەوتوویی سڕدرایەوە."
  }
};

const DOSAGE_FORMS = [
  "Tablet (حبة)",
  "Capsule (كبسولة)",
  "Syrup (شراب)",
  "Suspension (معلق)",
  "Injection (إبرة)",
  "Ointment / Cream (مرهم)",
  "Drops (قطرات)",
  "Inhaler (بخاخ)",
  "Gel (جل)",
  "Powder (بودرة)",
  "Other (أخرى)"
];

export const DrugsRegistryScreen: React.FC = () => {
  const { language, isRtl, navigateTo } = useApp();
  const tLocal = localDrugT[language] || localDrugT.en;

  // App States
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tradeName, setTradeName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [dosageForm, setDosageForm] = useState(DOSAGE_FORMS[0]);
  const [strength, setStrength] = useState('');
  const [instructions, setInstructions] = useState('');

  // UI notifications and overlays
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifyType, setNotifyType] = useState<'success' | 'error'>('success');
  const [deletingDrug, setDeletingDrug] = useState<Drug | null>(null);

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = () => {
    const list = dentalStorage.getDrugs();
    setDrugs(list);
  };

  const triggerNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotifyMsg(msg);
    setNotifyType(type);
    setTimeout(() => setNotifyMsg(''), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName.trim()) {
      triggerNotify(isRtl ? "يرجى تعبئة اسم الماركة كحد أدنى" : "Brand trade name is required", 'error');
      return;
    }

    const payload: Omit<Drug, 'id'> & { id?: string } = {
      tradeName: tradeName.trim(),
      scientificName: scientificName.trim(),
      dosageForm,
      strength: strength.trim(),
      instructions: instructions.trim()
    };

    if (editingId) {
      payload.id = editingId;
    }

    dentalStorage.saveDrug(payload);
    
    // Reset form
    setEditingId(null);
    setTradeName('');
    setScientificName('');
    setDosageForm(DOSAGE_FORMS[0]);
    setStrength('');
    setInstructions('');

    // Trigger feedback and reload
    triggerNotify(editingId ? tLocal.successUpdated : tLocal.successCreated, 'success');
    loadDrugs();
  };

  const handleEdit = (drug: Drug) => {
    setEditingId(drug.id);
    setTradeName(drug.tradeName);
    setScientificName(drug.scientificName);
    setDosageForm(drug.dosageForm || DOSAGE_FORMS[0]);
    setStrength(drug.strength);
    setInstructions(drug.instructions);
    
    // Scroll smoothly to form
    const container = document.getElementById("drug_form_anchor");
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTradeName('');
    setScientificName('');
    setDosageForm(DOSAGE_FORMS[0]);
    setStrength('');
    setInstructions('');
  };

  const handleDeleteConfirm = () => {
    if (!deletingDrug) return;
    dentalStorage.deleteDrug(deletingDrug.id);
    triggerNotify(tLocal.successDeleted, 'success');
    setDeletingDrug(null);
    loadDrugs();
  };

  // Filter implementation
  const filteredDrugs = drugs.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return d.tradeName.toLowerCase().includes(q) || 
           d.scientificName.toLowerCase().includes(q) ||
           (d.dosageForm && d.dosageForm.toLowerCase().includes(q)) ||
           (d.instructions && d.instructions.toLowerCase().includes(q));
  });

  return (
    <div id="drugs_registry_container" className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      
      {/* Top sticky bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            id="drugs_btn_back_settings"
            onClick={() => navigateTo('settings')}
            className={`flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 font-bold transition-all cursor-pointer ${
              isRtl ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span>{tLocal.backToSettings}</span>
          </button>

          <h1 id="drugs_title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>💊</span>
            <span>{tLocal.title}</span>
          </h1>

          <div className="w-16"></div> {/* balance spacer */}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* Visual feedback notice banner popups */}
        <AnimatePresence>
          {notifyMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={`p-4 rounded-xl shadow-md flex items-center gap-2.5 text-xs font-bold border ${
                notifyType === 'success' 
                  ? 'bg-teal-600 text-white border-teal-500' 
                  : 'bg-rose-600 text-white border-rose-500'
              }`}
            >
              {notifyType === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0 animate-bounce" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
              )}
              <span>{notifyMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intro explanatory dashboard banner */}
        <div className={`p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-slate-900/60 border border-teal-100 dark:border-slate-800 flex items-start gap-3.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/20 shrink-0">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white-850 dark:text-slate-100">
              {tLocal.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {tLocal.desc}
            </p>
          </div>
        </div>

        <div id="drug_form_anchor" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Formula Form - 1 Column side column for high density layout */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className={`flex items-center gap-2 pb-2 border-b border-slate-105 dark:border-slate-805/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <Plus className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingId ? tLocal.editDrug : tLocal.addNewDrug}
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              
              {/* Trade name */}
              <div className="space-y-1">
                <label className={`block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                  {tLocal.tradeName} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder={tLocal.tradePlaceholder}
                  className={`w-full py-2 px-3 rounded-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-colors ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                  required
                />
              </div>

              {/* Scientific name */}
              <div className="space-y-1">
                <label className={`block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                  {tLocal.scientificName}
                </label>
                <input
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder={tLocal.scientificPlaceholder}
                  className={`w-full py-2 px-3 rounded-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-colors ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              {/* Grid 2 slots */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Dosage form */}
                <div className="space-y-1">
                  <label className={`block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                    {tLocal.dosageForm}
                  </label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-955 dark:text-white outline-none focus:border-teal-500 text-xs transition-colors"
                  >
                    {DOSAGE_FORMS.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>

                {/* Strength */}
                <div className="space-y-1">
                  <label className={`block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                    {tLocal.strength}
                  </label>
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder={tLocal.strengthPlaceholder}
                    className={`w-full py-2 px-2.5 rounded-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-colors ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>
              </div>

              {/* Sig instructions */}
              <div className="space-y-1">
                <label className={`block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                  {tLocal.instructions}
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={tLocal.instructionsPlaceholder}
                  rows={3}
                  className={`w-full py-2 px-3 rounded-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-xs transition-colors resize-none ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-505 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {tLocal.cancelBtn}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 py-2 px-4 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-extrabold rounded-lg text-[11px] transition-colors shadow-sm cursor-pointer"
                >
                  {tLocal.saveBtn}
                </button>
              </div>

            </form>
          </section>

          {/* Interactive Catalog Registry and Live Filter search - 2 Columns */}
          <section className="lg:col-span-2 space-y-4">
            
            {/* Live Search Field bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3 transition-colors">
              <div className="relative flex-1">
                <span className={`absolute inset-y-0 flex items-center text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`}>
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tLocal.searchPlaceholder}
                  className={`w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white text-xs transition-all ${
                    isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                  }`}
                />
              </div>

              <div className="text-[10px] font-mono text-slate-450 shrink-0 select-none">
                {tLocal.searchQty.replace('{qty}', String(filteredDrugs.length))}
              </div>
            </div>

            {/* List cards section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDrugs.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                    <Info className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {tLocal.noDrugs}
                  </p>
                </div>
              ) : (
                filteredDrugs.map(drug => (
                  <div 
                    key={drug.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:border-teal-550/20 dark:hover:border-teal-400/20 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className={`flex items-start justify-between gap-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight flex items-center gap-1">
                            <span>{getDrugEmoji(drug.dosageForm)}</span>
                            <span>{drug.tradeName}</span>
                          </h3>
                          {drug.scientificName && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono leading-relaxed mt-0.5">
                              {drug.scientificName}
                            </p>
                          )}
                        </div>

                        {/* Badges indicators */}
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {drug.dosageForm && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-slate-950 text-teal-700 dark:text-teal-400 border border-teal-500/10 dark:border-slate-800 truncate max-w-[100px]">
                              {drug.dosageForm.split(" ")[0]}
                            </span>
                          )}
                          {drug.strength && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-410 border border-slate-205 dark:border-slate-805 truncate max-w-[80px]">
                              {drug.strength}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Sig prescription rules */}
                      {drug.instructions && (
                        <div className={`pt-2 border-t border-slate-50 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/30 p-2 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans ${isRtl ? 'text-right' : 'text-left'}`}>
                          <span className="font-bold text-teal-600 dark:text-teal-400">{isRtl ? "الإرشاد: " : "Sig: "}</span>
                          {drug.instructions}
                        </div>
                      )}
                    </div>

                    {/* Actions bar inline */}
                    <div className={`flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 ${isRtl ? 'justify-start flex-row-reverse' : 'justify-end flex-row'}`}>
                      <button
                        onClick={() => handleEdit(drug)}
                        className="flex items-center gap-1.5 py-1 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer shadow-xs"
                        title={tLocal.editDrug}
                      >
                        <Edit2 className="h-3 w-3 stroke-[2.5px]" />
                        <span>{isRtl ? "تعديل" : "Edit"}</span>
                      </button>
                      <button
                        onClick={() => setDeletingDrug(drug)}
                        className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </section>

        </div>

      </main>

      {/* CUSTOM OVERLAY DIALOG - DISCARD / DELETE CONFIRMATION (NO WINDOW.ALERT OR CONFIRM) */}
      <AnimatePresence>
        {deletingDrug && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 dark:bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-6 w-6 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {tLocal.confirmDeleteTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {tLocal.confirmDeleteDesc.replace('{name}', deletingDrug.tradeName)}
                  </p>
                </div>

                {/* Actons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setDeletingDrug(null)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {isRtl ? "تراجع" : "Cancel"}
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
                  >
                    {tLocal.deleteBtn}
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
