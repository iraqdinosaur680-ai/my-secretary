import React from 'react';
import { useApp } from './AppContext';
import { motion } from 'motion/react';
import { ShieldAlert, Users, Stethoscope, Briefcase, Globe, Activity } from 'lucide-react';
import { Language, UserRole } from '../types';

export const RoleSelectionScreen: React.FC = () => {
  const { selectRole, language, setLanguage, isRtl } = useApp();

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

  // Multilingual content
  const content = {
    en: {
      title: "Clinic Workspace Portal",
      subtitle: "Choose your role to load custom clinical privileges",
      doctorTitle: "Surgeon Doctor",
      doctorDesc: "Full administrative & clinical control. Access consultation records, history logs, clinical session notes, and billing dashboard analytics.",
      secretaryTitle: "Clinic Secretary",
      secretaryDesc: "Register new patient arrivals, search registry, and manage basic file info. Zero access to sensitive consultation/history records.",
      disclaimer: "All data is securely saved local to this workspace. Fully secure database compliance.",
      doctorAction: "Access Doctor Vault",
      secretaryAction: "Enter Secretary Portal"
    },
    ar: {
      title: "بوابة عمل العيادة",
      subtitle: "اختر دورك الوظيفي لتحميل الصلاحيات الطبية المخصصة",
      doctorTitle: "الطبيب الأخصائي",
      doctorDesc: "التحكم الإداري والسريري الكامل. تشخيص المرضى، تدوين تفاصيل الاستشارات الطبية، التقارير والواردات المالية والتحاليل.",
      secretaryTitle: "سكرتير العيادة",
      secretaryDesc: "تسجيل المرضى الجدد، البحث في الدليل العام، وحذف أو تعديل معلومات الاتصال. لا يمكن الاطلاع على الاستشارات والتقارير الطبية نهائياً.",
      disclaimer: "يتم حفظ جميع البيانات محلياً بشكل مشفر وآمن تماماً ضمن مساحة عمل هذا الجهاز.",
      doctorAction: "تسجيل دخول الطبيب",
      secretaryAction: "تسجيل دخول السكرتير"
    },
    ku: {
      title: "دەروازەی کارکردنی نۆرینگە",
      subtitle: "دەسەڵاتی وەرگرتنی فایل و تۆمارەکان بەگوێرەی پسپۆڕییەکەت دیاری بکە",
      doctorTitle: "پزیشكی پسپۆر",
      doctorDesc: "کۆنتڕۆڵی تەواوی کارگێڕی و کلینیکی. دەستڕاگەیشتن بە دەستنیشانکردنی پزیشکی، مێژووی نەخۆش، تێبینییەکان، و شیکاری دارایی.",
      secretaryTitle: "سکرتێری نۆرینگە",
      secretaryDesc: "تۆمارکردنی نەخۆشی نوێ، گەڕان لە پێڕست، و دەستکاریکردنی زانیاری بنەڕەتی. هیچ دەسەڵاتێکی دەستڕاگەیشتن بە مێژووی پزیشکی نییە.",
      disclaimer: "سەرجەم داتاکان بە شێوەیەکی پارێزراو تەنها لەسەر ئەم ئامێرە پاشەکەوت دەکرێن.",
      doctorAction: "داخڵبوونی پزیشک",
      secretaryAction: "داخڵبوونی سکرتێر"
    }
  };

  const t = content[language] || content.en;

  return (
    <div id="role_selection_container" className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300 font-sans">
      {/* Absolute Language Options */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center dir-ltr">
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-medium tracking-tight">
          <Activity className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-semibold">My Secretary v1.2</span>
        </div>
        
        <button 
          id="role_lang_toggle"
          onClick={cycleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{getLangName(language)}</span>
        </button>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-10 max-w-lg">
          <h1 id="role_portal_title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {t.title}
          </h1>
          <p id="role_portal_subtitle" className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {t.subtitle}
          </p>
        </div>

        {/* Dynamic Options Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
          {/* Secretary Option Card */}
          <motion.div
            id="role_card_secretary"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => selectRole('secretary')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-teal-400 dark:hover:border-teal-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 ring-4 ring-teal-500/5">
                <Briefcase className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span>{t.secretaryTitle}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {t.secretaryDesc}
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800/60">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-600 dark:group-hover:bg-teal-500 text-slate-800 dark:text-slate-250 group-hover:text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                <span>{t.secretaryAction}</span>
              </button>
            </div>
          </motion.div>

          {/* Doctor Option Card */}
          <motion.div
            id="role_card_doctor"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => selectRole('doctor')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-teal-400 dark:hover:border-teal-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 ring-4 ring-teal-500/5">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                {t.doctorTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {t.doctorDesc}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800/60 font-medium">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-600 dark:group-hover:bg-teal-500 text-slate-800 dark:text-slate-250 group-hover:text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4 text-amber-500 group-hover:text-white transition-colors" />
                <span>{t.doctorAction}</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* HIPAA Compliance details block */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-12 text-center max-w-md uppercase tracking-wider font-mono font-bold">
          🛡️ {t.disclaimer}
        </p>
      </div>
    </div>
  );
};
