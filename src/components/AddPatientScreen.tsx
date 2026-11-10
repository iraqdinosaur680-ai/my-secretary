import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion } from 'motion/react';
import { ArrowLeft, User, Phone, MapPin, Calendar, Tag, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Patient } from '../types';
import { dentalStorage, getDirectoryHandle, parseIQDAmount, formatIQDAmount } from '../services/storage';
import { calculateAgeFromDobDetailed, buildBirthdateString } from '../services/ageHelper';

export const AddPatientScreen: React.FC = () => {
  const { 
    currentScreen, 
    selectedPatientId, 
    t, 
    isRtl, 
    navigateTo, 
    refreshPatientsList,
    language
  } = useApp();

  const isEdit = currentScreen === 'edit-patient';

  const [fullName, setFullName] = useState('');
  const [patientIdStr, setPatientIdStr] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [ageEntryMode, setAgeEntryMode] = useState<'age-number' | 'date-of-birth'>('age-number');

  // Parts for the segmented scroll bars
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear() - 25);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState<'free' | 'paid'>('paid');
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const calculateAgeFromDob = (dobString: string) => {
    if (!dobString) return '';
    const today = new Date();
    
    // Support clean 4-digit birth-year calculation
    if (/^\d{4}$/.test(dobString)) {
      const birthYear = parseInt(dobString, 10);
      const ageVal = today.getFullYear() - birthYear;
      return ageVal >= 0 ? ageVal.toString() : '';
    }

    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    let ageVal = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      ageVal--;
    }
    return ageVal >= 0 ? ageVal.toString() : '';
  };

  const calculatedBirthYear = React.useMemo(() => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - ageNum;
  }, [age]);

  // Sync dateOfBirth state dynamically from part bars-selectors
  useEffect(() => {
    if (ageEntryMode === 'date-of-birth') {
      const formattedDob = buildBirthdateString(selectedYear, selectedMonth, selectedDay);
      setDateOfBirth(formattedDob);
      setAge(calculateAgeFromDob(formattedDob));
    }
  }, [selectedDay, selectedMonth, selectedYear, ageEntryMode]);

  // Auto-generate an initial unique Patient ID if adding new
  useEffect(() => {
    if (isEdit && selectedPatientId) {
      const record = dentalStorage.getPatient(selectedPatientId);
      if (record) {
        setFullName(record.fullName);
        setPatientIdStr(record.patientId);
        setGender(record.gender === 'other' ? 'male' : record.gender);
        setDateOfBirth(record.dateOfBirth);
        const lAge = calculateAgeFromDob(record.dateOfBirth);
        setAge(lAge);
        
        // Detect if loaded record is a clean 4-digit year format or comprehensive YYYY-MM-DD
        if (record.dateOfBirth && /^\d{4}$/.test(record.dateOfBirth)) {
          setAgeEntryMode('age-number');
        } else {
          setAgeEntryMode('date-of-birth');
          const parts = record.dateOfBirth.split('-');
          if (parts.length === 3) {
            setSelectedYear(parseInt(parts[0], 10) || new Date().getFullYear() - 25);
            setSelectedMonth(parseInt(parts[1], 10) || 1);
            setSelectedDay(parseInt(parts[2], 10) || 1);
          }
        }

        setPhoneNumber(record.phoneNumber);
        setAddress(record.address);
        setPaymentType(record.paymentType || 'paid');
        setPaymentAmountStr(record.paymentAmount !== undefined ? formatIQDAmount(record.paymentAmount) : '35.000');
      }
    } else {
      // Auto-generate unique sequential looking ID (P-XXXX)
      const list = dentalStorage.getPatients();
      const currentHighest = list.reduce((max, p) => {
        const matches = p.patientId.match(/P-(\d+)/);
        if (matches) {
          const num = parseInt(matches[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 1000);
      setPatientIdStr(`P-${currentHighest + 1}`);
      
      // Default rest
      setFullName('');
      setGender('male');
      setDateOfBirth('');
      setAge('');
      setAgeEntryMode('age-number');
      setSelectedDay(1);
      setSelectedMonth(1);
      setSelectedYear(new Date().getFullYear() - 25);
      setPhoneNumber('');
      setAddress('');
      setPaymentType('paid');
      setPaymentAmountStr('');
    }
  }, [isEdit, selectedPatientId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Quick validation
    if (!fullName.trim()) {
      setErrorMsg(`${t.fullName}: ${t.fieldRequired}`);
      return;
    }
    if (!patientIdStr.trim()) {
      setErrorMsg(`${t.patientId}: ${t.fieldRequired}`);
      return;
    }

    // Check if patient ID is already used by another record (if adding or changing)
    const allPatients = dentalStorage.getPatients();
    const isIdTaken = allPatients.some(
      p => p.patientId.toLowerCase().trim() === patientIdStr.toLowerCase().trim() && p.id !== selectedPatientId
    );

    if (isIdTaken) {
      setErrorMsg(isRtl 
        ? "رقم ملف المريض هذا مسجل بالفعل لمريض آخر. يرجى اختيار رقم فريد." 
        : "This Patient ID is already assigned to another clinic record. Please input a unique identifier."
      );
      return;
    }

    try {
      let finalId = selectedPatientId;
      if (isEdit && selectedPatientId) {
        dentalStorage.updatePatient(selectedPatientId, {
          fullName: fullName.trim(),
          patientId: patientIdStr.trim(),
          gender,
          dateOfBirth,
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          paymentType,
          paymentAmount: paymentType === 'paid' ? parseIQDAmount(paymentAmountStr) : 0
        });
      } else {
        const newId = 'p-' + Math.random().toString(36).substring(2, 9);
        finalId = newId;
        dentalStorage.addPatient({
          id: newId,
          fullName: fullName.trim(),
          patientId: patientIdStr.trim(),
          gender,
          dateOfBirth,
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          paymentType,
          paymentAmount: paymentType === 'paid' ? parseIQDAmount(paymentAmountStr) : 0
        });
      }

      // Automatically register patient-specific subfolders on their actual hard drive
      try {
        const rootHandle = await getDirectoryHandle();
        if (rootHandle) {
          const status = await (rootHandle as any).queryPermission({ mode: 'readwrite' });
          if (status === 'granted') {
            const sanitizeDirName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '').trim();
            const patientFolderSlug = `${patientIdStr.trim()} - ${sanitizeDirName(fullName.trim())}`;
            
            await rootHandle.getDirectoryHandle(patientFolderSlug, { create: true });
          }
        }
      } catch (localFolderErr) {
        console.warn("Local storage directory creation deferred:", localFolderErr);
      }

      refreshPatientsList();
      if (finalId) {
        navigateTo('profile', finalId);
      } else {
        navigateTo('dashboard');
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to save record.");
    }
  };

  return (
    <div id="add_patient_container" className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      {/* Page Header bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            id="btn_back_dashboard"
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-all cursor-pointer font-bold"
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span>{t.backToDashboard}</span>
          </button>

          <h1 id="add_patient_title" className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? t.editPatientTitle : t.addPatientTitle}
          </h1>
          
          <div className="w-16"></div> {/* spacer */}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <motion.div
          id="patient_form_card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs"
        >
          <div className={`mb-6 p-4 bg-teal-500/5 rounded-xl border border-teal-500/10 flex items-center gap-3 ${
            isRtl ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <User className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {t.basicInformation}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {isRtl ? "بيانات المريض الديموغرافية والاتصال" : "Store complete verified clinic patient data on this sandbox client"}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div 
              id="form_error_alert"
              className={`mb-6 p-4 rounded-xl text-sm border bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950 ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.fullName} *
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="patient_form_name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isRtl ? "الاسم الكامل الثلاثي للمريض" : "Full three-part clinical name"}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm transition-all ${
                      isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Patient ID */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.patientId} *
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <Tag className="h-4 w-4" />
                  </span>
                  <input
                    id="patient_form_id"
                    type="text"
                    value={patientIdStr}
                    onChange={(e) => setPatientIdStr(e.target.value)}
                    placeholder="e.g. P-1024"
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm font-mono font-bold transition-all ${
                      isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.gender}
                </label>
                <div className={`grid grid-cols-2 gap-2 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      id={`gender_opt_${g}`}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        gender === g
                          ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {g === 'male' ? t.genderMale : t.genderFemale}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Mode Age Entry Selector */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? "طريقة إدخال تاريخ الميلاد" : "Birthdate Entry Method"}
                </label>
                <div className={`grid grid-cols-2 gap-2 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
                  <button
                    type="button"
                    id="mode_select_age"
                    onClick={() => {
                      setAgeEntryMode('age-number');
                      // If dateOfBirth is stored, convert back to age to prevent losing value
                      if (dateOfBirth) {
                        setAge(calculateAgeFromDob(dateOfBirth));
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      ageEntryMode === 'age-number'
                        ? 'bg-teal-600 border-teal-600 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isRtl ? "العمر بالسنوات" : "Age Number"}
                  </button>
                  <button
                    type="button"
                    id="mode_select_dob"
                    onClick={() => {
                      setAgeEntryMode('date-of-birth');
                      // If there is an age number inputted, approximate a date of birth YYYY-01-01
                      if (!dateOfBirth || /^\d{4}$/.test(dateOfBirth)) {
                        const birthYear = dateOfBirth || (calculatedBirthYear ? calculatedBirthYear.toString() : new Date().getFullYear().toString());
                        setDateOfBirth(`${birthYear}-01-01`);
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      ageEntryMode === 'date-of-birth'
                        ? 'bg-teal-600 border-teal-600 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isRtl ? "تاريخ ميلاد مفصل" : "Full Birth Date"}
                  </button>
                </div>
              </div>

              {/* Dynamic Age or Date of Birth Input Field */}
              <div className="space-y-4">
                {ageEntryMode === 'age-number' ? (
                  <div className="space-y-1.5">
                    <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t.age} *
                      </label>
                      {calculatedBirthYear !== null && (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40 animate-fade-in shrink-0">
                          {isRtl ? `تولد: ${calculatedBirthYear}` : `Birth Year: ${calculatedBirthYear}`}
                        </span>
                      )}
                    </div>
                    <div className="relative font-semibold">
                      <span className={`absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                        <Calendar className="h-4 w-4" />
                      </span>
                      <input
                        id="patient_form_age"
                        type="number"
                        min="0"
                        max="150"
                        value={age}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAge(val);
                          const ageNum = parseInt(val, 10);
                          if (!isNaN(ageNum) && ageNum >= 0) {
                            const currentYear = new Date().getFullYear();
                            const birthYear = currentYear - ageNum;
                            // Set only the 4-digit birth-year as requested without day or month
                            setDateOfBirth(birthYear.toString());
                          } else {
                            setDateOfBirth('');
                          }
                        }}
                        placeholder={isRtl ? "العمر الحالي بالسنوات" : "Patient's physical age"}
                        className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm transition-all ${
                          isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                        }`}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-250/40 dark:border-slate-800/60">
                    <div className={`flex justify-between items-center pb-2.5 border-b border-slate-200/50 dark:border-slate-800/40 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <label className="text-xs font-extrabold text-slate-600 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        <span>{t.dateOfBirth} *</span>
                      </label>
                      {dateOfBirth && (
                        <span className="text-[11px] bg-teal-600 dark:bg-teal-500 text-white font-black px-2.5 py-0.5 rounded-lg shadow-xs animate-fade-in shrink-0">
                          {calculateAgeFromDobDetailed(dateOfBirth, language, t)}
                        </span>
                      )}
                    </div>

                    {/* 1. Day Selector Bar (1 to 31) */}
                    <div className="space-y-1">
                      <div className={`flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span>{isRtl ? "اليوم:" : "Day:"}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-black font-mono">{selectedDay}</span>
                      </div>
                      <div className="flex overflow-x-auto gap-1.5 py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-teal-500/10 dark:scrollbar-thumb-teal-400/5 select-none touch-pan-x [-ms-overflow-style:none] [scrollbar-width:thin]">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDay(d)}
                            className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              selectedDay === d
                                ? 'bg-teal-600 dark:bg-teal-500 text-white font-black scale-105 shadow-md shadow-teal-500/15'
                                : 'bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Month Selector Bar (1 to 12) */}
                    <div className="space-y-1">
                      <div className={`flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span>{isRtl ? "الشهر:" : "Month:"}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-black select-none">
                          {isRtl 
                            ? ["1 - كانون الثاني", "2 - شباط", "3 - آذار", "4 - نيسان", "5 - أيار", "6 - حزيران", "7 - تموز", "8 - آب", "9 - أيلول", "10 - تشرين الأول", "11 - تشرين الثاني", "12 - كانون الأول"][selectedMonth - 1]
                            : ["1 - January", "2 - February", "3 - March", "4 - April", "5 - May", "6 - June", "7 - July", "8 - August", "9 - September", "10 - October", "11 - November", "12 - December"][selectedMonth - 1]}
                        </span>
                      </div>
                      <div className="flex overflow-x-auto gap-1.5 py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-teal-500/10 dark:scrollbar-thumb-teal-400/5 select-none touch-pan-x [-ms-overflow-style:none] [scrollbar-width:thin]">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const monthLabel = isRtl 
                            ? ["ك2", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "ت1", "ت2", "ك1"][m - 1]
                            : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSelectedMonth(m)}
                              className={`h-9 px-3.5 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedMonth === m
                                  ? 'bg-teal-600 dark:bg-teal-500 text-white font-black scale-105 shadow-md shadow-teal-500/15'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-mono text-[10px] opacity-70 mr-1">{m} -</span>
                              <span>{monthLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Year Selector Bar (Current year down to 1920) */}
                    <div className="space-y-1">
                      <div className={`flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span>{isRtl ? "السنة:" : "Year:"}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-black font-mono">{selectedYear}</span>
                      </div>
                      <div className="flex overflow-x-auto gap-1.5 py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-teal-500/10 dark:scrollbar-thumb-teal-400/5 select-none touch-pan-x [-ms-overflow-style:none] [scrollbar-width:thin]">
                        {Array.from({ length: (new Date().getFullYear()) - 1920 + 1 }, (_, i) => (new Date().getFullYear()) - i).map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setSelectedYear(y)}
                            className={`h-9 px-4 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              selectedYear === y
                                ? 'bg-teal-600 dark:bg-teal-500 text-white font-black scale-105 shadow-md shadow-teal-500/15'
                                : 'bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual output string read-only summary helper and manual switcher back */}
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 pt-1 font-mono select-none">
                      <span className={isRtl ? 'text-right' : 'text-left'}>
                        {isRtl ? `التاريخ المبرمج: ${dateOfBirth}` : `Selected Date: ${dateOfBirth}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact phone */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.phoneNumber}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    id="patient_form_phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +964 770 000 0000"
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm transition-all ${
                      isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                    }`}
                  />
                </div>
              </div>

              {/* Payment Info Section */}
              <div className="space-y-3.5 md:col-span-2 border-t border-slate-150 dark:border-slate-800/80 pt-5">
                <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {isRtl ? "بيانات الدفع والرسوم" : "Billing Details"}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Type Selection */}
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? "حالة الدفع" : "Payment Status"} *
                    </label>
                    <div className={`grid grid-cols-2 gap-2 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
                      <button
                        type="button"
                        onClick={() => setPaymentType('paid')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          paymentType === 'paid'
                            ? 'bg-teal-600 border-teal-600 text-white shadow-xs font-extrabold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isRtl ? "مدفوع" : "Paid"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('free')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          paymentType === 'free'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-extrabold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isRtl ? "مجاني / مكاني" : "Free visit"}
                      </button>
                    </div>
                  </div>

                  {/* Payment Amount Input */}
                  {paymentType === 'paid' ? (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? "المبلغ المستلم" : "Amount Paid"} *
                      </label>
                      <div className="relative">
                        <span className={`absolute inset-y-0 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 ${isRtl ? 'left-3' : 'right-3'}`}>
                          {isRtl ? "د.ع" : "IQD"}
                        </span>
                        <input
                          type="text"
                          value={paymentAmountStr}
                          onChange={(e) => setPaymentAmountStr(e.target.value)}
                          placeholder="e.g. 35.000"
                          className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm font-mono font-bold transition-all ${
                            isRtl ? 'pl-12 pr-4 text-right' : 'pr-12 pl-4 text-left'
                          }`}
                          required={paymentType === 'paid'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-500 dark:text-slate-400 text-xs font-bold">
                      {isRtl ? "✓ تم تعيين الزيارة كزيارة مجانية معفاة من الرسوم" : "✓ Visit is treated as fully Free of charge"}
                    </div>
                  )}
                </div>
              </div>

              {/* Small Note (Optional) replaces Address details */}
              <div className="space-y-1.5 md:col-span-2">
                <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.address}
                </label>
                <div className="relative">
                  <span className={`absolute top-2.5 text-slate-400 dark:text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`}>
                    <Tag className="h-4 w-4" />
                  </span>
                  <textarea
                    id="patient_form_address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isRtl ? "ملاحظة إضافية صغيرة اختيارية للملف" : "Optional medical / administrative summary note..."}
                    rows={2}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-sm transition-all ${
                      isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className={`pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 ${
              isRtl ? 'flex-row-reverse' : 'flex-row'
            }`}>
              <button
                id="btn_save_patient"
                type="submit"
                className="flex-1 py-3 px-4 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold rounded-lg transition-all shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{isEdit ? t.updatePatient : t.savePatient}</span>
              </button>

              <button
                id="btn_cancel_patient"
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="py-3 px-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};
