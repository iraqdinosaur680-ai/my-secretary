import { Language } from './types';

export interface TranslationSet {
  appName: string;
  appSubtitle: string;
  loginTitle: string;
  username: string;
  password: string;
  loginButton: string;
  invalidCredentials: string;
  
  // Dashboard
  dashboard: string;
  totalPatients: string;
  searchPlaceholder: string;
  addNewPatient: string;
  patientList: string;
  lastVisit: string;
  patientId: string;
  fullName: string;
  actions: string;
  noPatientsFound: string;
  edit: string;
  delete: string;
  openProfile: string;
  confirmDeletePatient: string;
  confirmDeleteHistory: string;
  confirmDeleteNote: string;
  confirmDeleteImage: string;
  cancel: string;
  confirm: string;

  // Add/Edit Patient Form
  basicInformation: string;
  gender: string;
  totalPaid: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  savePatient: string;
  updatePatient: string;
  editPatientTitle: string;
  addPatientTitle: string;
  fieldRequired: string;
  yearOfBirth: string;

  // Patient Profile
  patientProfile: string;
  dentalHistory: string;
  clinicalNotes: string;
  dentalImages: string;
  addHistoryEntry: string;
  editHistoryEntry: string;
  addNote: string;
  editNote: string;
  addImage: string;
  
  // History Fields
  visitDate: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  save: string;
  
  // Note Fields
  date: string;
  title: string;
  content: string;

  // Medical Images Fields
  imageType: string;
  imageTitle: string;
  selectImageFile: string;
  viewFullScreen: string;
  uploadNewImage: string;
  noImagesYet: string;
  xray: string;
  mri: string;
  ct: string;
  lab: string;
  other: string;

  // Settings
  settings: string;
  changeUsername: string;
  changePassword: string;
  languageSelection: string;
  themeToggle: string;
  darkMode: string;
  lightMode: string;
  currentUsername: string;
  newPassword: string;
  credentialsUpdated: string;
  logout: string;
  backToDashboard: string;
  autoSaved: string;
  back: string;
  exportData: string;
  importData: string;
  exportDataDesc: string;
  importSuccess: string;
  importError: string;
  exportPromptTitle: string;
  exportPromptNever: string;
  exportPromptOld: string;
  age: string;
  yearsOld: string;
  billingAmount: string;
  iqdinar: string;
  incomeCountFrom: string;
  monthlyPatients: string;
  totalIncome: string;
  dailyIncome: string;
  chooseMonth: string;
  chooseYear: string;
  chooseDay: string;
  openPhoto: string;
}

export const translations: Record<Language, TranslationSet> = {
  en: {
    appName: "My Secretary",
    appSubtitle: "Secure Clinical Records System",
    loginTitle: "Medical Portal Authentication",
    username: "Username",
    password: "Password",
    loginButton: "Access Patient Records",
    invalidCredentials: "Invalid credentials. Please use 'doctor' and 'clinic123' or your customized login.",
    
    // Dashboard
    dashboard: "Clinic Dashboard",
    totalPatients: "Total Registered Patients",
    searchPlaceholder: "Search by Name or Patient ID...",
    addNewPatient: "Register Patient",
    patientList: "Patient Directory",
    lastVisit: "Last Visit",
    patientId: "Patient ID",
    fullName: "Full Name",
    actions: "Actions",
    noPatientsFound: "No patient records matched the query.",
    edit: "Edit",
    delete: "Delete",
    openProfile: "Open File",
    confirmDeletePatient: "Are you sure you want to permanently delete this patient record and all related medical files?",
    confirmDeleteHistory: "Delete this diagnostic medical history entry?",
    confirmDeleteNote: "Delete this clinic note?",
    confirmDeleteImage: "Remove this medical scan or report?",
    cancel: "Cancel",
    confirm: "Yes, Delete",

    // Add/Edit Patient Form
    basicInformation: "Basic Demographic Information",
    gender: "Gender",
    totalPaid: "Total Paid",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    dateOfBirth: "Date of Birth",
    phoneNumber: "Contact Number",
    address: "Small Note (Optional)",
    savePatient: "Create Record",
    updatePatient: "Update Record",
    editPatientTitle: "Edit Patient Profile",
    addPatientTitle: "Register New Patient Record",
    fieldRequired: "This field is required",
    yearOfBirth: "Year of Birth",

    // Patient Profile
    patientProfile: "Patient Clinical Clipboard",
    dentalHistory: "Medical Consultation History",
    clinicalNotes: "Clinical Notes",
    dentalImages: "Medical Scans & Lab Reports",
    addHistoryEntry: "Add Consultation Visit",
    editHistoryEntry: "Edit History Entry",
    addNote: "Create Session Note",
    editNote: "Edit Session Note",
    addImage: "Attach Imaging/Lab Report",

    // History Fields
    visitDate: "Consultation Date",
    diagnosis: "Primary Diagnosis",
    symptoms: "Clinical Presentation & Symptoms",
    treatment: "Treatment Protocol & Prescriptions",
    notes: "Clinical Observations",
    save: "Save",

    // Note Fields
    date: "Note Date",
    title: "Note Title",
    content: "Content / Observations",

    // Medical Images Fields
    imageType: "Scan Type",
    imageTitle: "Scan/Report Title",
    selectImageFile: "Choose File/Scan Image",
    viewFullScreen: "View Full Size",
    uploadNewImage: "Attach Scan File",
    noImagesYet: "No diagnostic images or lab reports attached to this profile.",
    xray: "X-ray Planar",
    mri: "Magnetic Resonance Imaging (MRI)",
    ct: "Computed Tomography (CT) Scan",
    lab: "Laboratory Analysis Report",
    other: "Other Medical Photograph",

    // Settings
    settings: "System Management Settings",
    changeUsername: "Change Account Username",
    changePassword: "Change Account Password",
    languageSelection: "Interface Language Selection",
    themeToggle: "Visual UI Interface Theme",
    darkMode: "Dark Mode (Night)",
    lightMode: "Light Mode (Day)",
    currentUsername: "New Account Username",
    newPassword: "New Access Password",
    credentialsUpdated: "Login credentials updated successfully.",
    logout: "Secure Logout",
    backToDashboard: "Dashboard Directory",
    autoSaved: "Local state auto-saved",
    back: "Back",
    exportData: "Backup & Export Database",
    importData: "Import & Restore Database",
    exportDataDesc: "Download a secure JSON copy of all registered patients, diagnostic visits, reports, and clinician notes local to this device.",
    importSuccess: "Clinical records database restored successfully!",
    importError: "Failed to import file. Ensure it is a valid clinical JSON backup of this application.",
    exportPromptTitle: "Database Export Reminder",
    exportPromptNever: "No database backup has been detected on this device. Create an export now to prevent clinical data loss.",
    exportPromptOld: "It has been {days} days since your last database backup export. Periodic backups are highly recommended.",
    age: "Age",
    yearsOld: "years old",
    billingAmount: "Consultation Fee",
    iqdinar: "IQ Dinar",
    incomeCountFrom: "Count from Date",
    monthlyPatients: "Patients this Month",
    totalIncome: "Total Income",
    dailyIncome: "Daily Income",
    chooseMonth: "Month",
    chooseYear: "Year",
    chooseDay: "Choose Date",
    openPhoto: "Open Photo"
  },
  ar: {
    appName: "سكرتيري",
    appSubtitle: "نظام السجلات السريرية الآمن",
    loginTitle: "تسجيل الدخول للبوابة الطبية",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    loginButton: "عرض سجلات المرضى",
    invalidCredentials: "بيانات الاعتماد غير صالحة. يرجى استخدام اسم المستخدم 'doctor' وكلمة المرور 'clinic123'، أو بياناتك المخصصة.",
    
    // Dashboard
    dashboard: "لوحة تحكم العيادة",
    totalPatients: "إجمالي المرضى المسجلين",
    searchPlaceholder: "البحث بالاسم أو رقم ملف المريض...",
    addNewPatient: "تسجيل مريض جديد",
    patientList: "دليل ملفات المرضى",
    lastVisit: "آخر زيارة",
    patientId: "رقم المريض",
    fullName: "الاسم الكامل",
    actions: "الإجراءات",
    noPatientsFound: "لا توجد سجلات تطابق استعلام البحث.",
    edit: "تعديل",
    delete: "حذف",
    openProfile: "فتح الملف",
    confirmDeletePatient: "هل أنت متأكد من رغبتك في حذف ملف هذا المريض وكافة مستنداته الطبية نهائياً؟",
    confirmDeleteHistory: "هل تريد حذف مدخلة التاريخ الطبي السريري والتشخيص هذه؟",
    confirmDeleteNote: "هل تريد حذف هذه الملاحظة السريرية؟",
    confirmDeleteImage: "هل تريد إزالة هذا التقرير أو الفحص الطبي المصور؟",
    cancel: "إلغاء",
    confirm: "نعم، احذف",
    
    // Add/Edit Patient Form
    basicInformation: "المعلومات الديموغرافية الأساسية",
    gender: "الجنس",
    totalPaid: "إجمالي المدفوع",
    genderMale: "ذكر",
    genderFemale: "أنثى",
    genderOther: "أخرى",
    dateOfBirth: "تاريخ الولادة",
    phoneNumber: "رقم الاتصال",
    address: "ملاحظة صغيرة (اختياري)",
    savePatient: "إنشاء الملف الطبي",
    updatePatient: "تحديث ملف المريض",
    editPatientTitle: "تعديل بيانات ملف المريض",
    addPatientTitle: "تسجيل ملف مريض جديد",
    fieldRequired: "هذا الحقل مطلوب ومهم",
    yearOfBirth: "سنة الولادة",

    // Patient Profile
    patientProfile: "ملف المريض السريري",
    dentalHistory: "السجل الطبي والاستشارات",
    clinicalNotes: "الملاحظات السريرية",
    dentalImages: "تقارير وصور الأشعة الطبية والتحاليل",
    addHistoryEntry: "إضافة زيارة للعيادة الطبية",
    editHistoryEntry: "تعديل مدخلة التاريخ",
    addNote: "إضافة ملاحظة جلسة طبية",
    editNote: "تعديل ملاحظة الجلسة",
    addImage: "إرفاق فحص أو تقرير مخبري",

    // History Fields
    visitDate: "تاريخ الاستشارة",
    diagnosis: "التشخيص الرئيسي",
    symptoms: "الأعراض والمظهر السريري",
    treatment: "بروتوكول العلاج والوصفة",
    notes: "الملاحظات والمتابعة",
    save: "حفظ البيانات",

    // Note Fields
    date: "تاريخ الملاحظة",
    title: "عنوان الملاحظة",
    content: "محتوى الملاحظة الطبية",

    // Medical Images Fields
    imageType: "نوع الصورة/الفحص",
    imageTitle: "عنوان الفحص أو التقرير",
    selectImageFile: "اختر ملف الصورة أو الفحص",
    viewFullScreen: "عرض بالحجم الكامل",
    uploadNewImage: "إرفاق ملف الفحص",
    noImagesYet: "لا توجد صور تشخيصية أو تقارير مخبرية مرفقة بهذا الملف.",
    xray: "أشعة سينية (X-Ray)",
    mri: "رنين مغناطيسي (MRI)",
    ct: "أشعة مقطعية (CT Scan)",
    lab: "تقرير التحليل والاستقصاء المخبري",
    other: "صورة طبية أخرى",

    // Settings
    settings: "إعدادات إدارة النظام",
    changeUsername: "تغيير اسم المستخدم للملف",
    changePassword: "تغيير كلمة مرور العيادة",
    languageSelection: "تحديد لغة واجهة النظام",
    themeToggle: "السمة والمظهر البصري",
    darkMode: "الوضع الداكن (الليلي)",
    lightMode: "الوضع الفاتح (النهاري)",
    currentUsername: "اسم المستخدم الجديد لحسابك",
    newPassword: "كلمة المرور الجديدة للوصول",
    credentialsUpdated: "تم تحديث بيانات تسجيل الدخول بنجاح تام.",
    logout: "تسجيل الخروج الآمن",
    backToDashboard: "قائمة الملفات",
    autoSaved: "تم حفظ كل التغييرات تلقائيًا",
    back: "الرجوع",
    exportData: "تصدير ونسخ قاعدة البيانات",
    importData: "استيراد واستعادة قاعدة البيانات",
    exportDataDesc: "قم بتنزيل نسخة احتياطية آمنة بصيغة JSON تحتوي على جميع ملفات المرضى، واستشارات وعيادات المريض، والتقارير الطبية المرفقة لحفظها بأمان.",
    importSuccess: "تمت استعادة قاعدة بيانات السجلات الطبية بنجاح تام!",
    importError: "فشل استيراد الملف. يرجى التأكد من تحديد ملف نسخة احتياطية صالح خاص بنظام سكرتيري.",
    exportPromptTitle: "تذكير بتصدير قاعدة البيانات",
    exportPromptNever: "لم يتم العثور على أي نسخة احتياطية محلية لسجلات العيادة. يرجى التصدير الآن لتجنب فقدان البيانات.",
    exportPromptOld: "لقد مضى {days} يوماً منذ آخر عملية تصدير للنسخة الاحتياطية الموضعية. يوصى بإنشاء نسخة دورية لحفظ سجلاتك الطبية.",
    age: "العمر",
    yearsOld: "سنة",
    billingAmount: "أجور الاستشارة",
    iqdinar: "دينار عراقي",
    incomeCountFrom: "احسب من تاريخ",
    monthlyPatients: "مرضى هذا الشهر",
    totalIncome: "إجمالي الإيرادات",
    dailyIncome: "الإيراد اليومي",
    chooseMonth: "اختر الشهر",
    chooseYear: "اختر السنة",
    chooseDay: "اختر اليوم",
    openPhoto: "عرض الصورة"
  },
  ku: {
    appName: "سکرتێرەکەم",
    appSubtitle: "سیستەمی پارێزراوی تۆمارەکانی پزیشکی",
    loginTitle: "داخڵبوون بە دەروازەی نۆرینگەی پزیشکی",
    username: "ناوی بەکارهێنەر",
    password: "وشەی تێپەڕین",
    loginButton: "دیتنی تۆماری نەخۆشەکان",
    invalidCredentials: "زانیارییەکان هەڵەن. تکایە ناوی بەکارهێنەر 'doctor' و وشەی تێپەڕ 'clinic123' یان هی تایبەتی خۆت بەکاربهێنە.",
    
    // Dashboard
    dashboard: "بۆردی سەرەکی نۆرینگە",
    totalPatients: "تەواوی نەخۆشە تۆمارکراوەکان",
    searchPlaceholder: "گەڕان بەپێی ناو یان کۆدی نەخۆش...",
    addNewPatient: "تۆمارکردنی نەخۆشی نوێ",
    patientList: "پێڕستی فایلەکانی نەخۆش",
    lastVisit: "دواین سەردان",
    patientId: "کۆدی نەخۆش",
    fullName: "ناوی تەواو",
    actions: "کردارەکان",
    noPatientsFound: "هیچ نەخۆشێک نەدۆزرایەوە کە لەگەڵ گەڕانەکەت بگونجێت.",
    edit: "دەستکاری",
    delete: "سڕینەوە",
    openProfile: "کردنەوەی فایل",
    confirmDeletePatient: "ئایا دڵنیای لە سڕینەوەی هەمیشەیی ئەم نەخۆشە و سەرجەم کەرەستە و فایلە پزیشکییەکانی؟",
    confirmDeleteHistory: "ئایا مێژووی پشکنین و دەستنیشانکردنی پزیشکیی ئەم نەخۆشە دەسڕیتەوە؟",
    confirmDeleteNote: "ئایا ئەم تێبینییە پزیشکییە دەسڕیتەوە؟",
    confirmDeleteImage: "ئایا ئەم پشکنینە یان ڕاپۆرتە پزیشکییە دەسڕیتەوە؟",
    cancel: "پەشیمانبوونەوە",
    confirm: "بەڵێ، بسڕەوە",

    // Add/Edit Patient Form
    basicInformation: "زانیارییە دیمۆگرافییە بنەڕەتییەکان",
    gender: "ڕەگەز",
    totalPaid: "کۆی گشتیی دراو",
    genderMale: "نێر",
    genderFemale: "مێ",
    genderOther: "هیتر",
    dateOfBirth: "ڕێکەوتی لەدایکبوون",
    phoneNumber: "ژمارەی پەیوەندی",
    address: "تێبینییەکی بچووک (ئارەزوومەندانە)",
    savePatient: "دروستکردنی تۆمار",
    updatePatient: "نوێکردنەوەی تۆماری نەخۆش",
    editPatientTitle: "دەستکاریکردنی فایلی نەخۆش",
    addPatientTitle: "تۆمارکردنی نەخۆشێکی نوێ",
    fieldRequired: "ئەم خانەیە پێویستە پڕبکرێتەوە",
    yearOfBirth: "ساڵی لەدایکبوون",

    // Patient Profile
    patientProfile: "فایلی پزیشکیی نەخۆش",
    dentalHistory: "مێژووی سەردان و پشکنینە پزیشکییەکان",
    clinicalNotes: "تێبینییە پزیشکییەکان",
    dentalImages: "ڕاپۆرتەکان و وێنەی تیشکی پزیشکی",
    addHistoryEntry: "زیادکردنی سەردانی پزیشکی",
    editHistoryEntry: "دەستکاریکردنی مێژووی پشکنین",
    addNote: "زیادکردنی تێبینی وێنەگرتن",
    editNote: "دەستکاریکردنی تێبینی",
    addImage: "هاوپێچکردنی وێنەی تیشک یان ڕاپۆرت",

    // History Fields
    visitDate: "ڕێکەوتی پشکنین",
    diagnosis: "دەستنیشانکردنی سەرەکی (تەشخیس)",
    symptoms: "نیشانەکان و دەرکەوتەی نەخۆشی",
    treatment: "چارەسەر و دەرمانی نووسراو",
    notes: "تێبینی پزیشک و بەدواداچوون",
    save: "پاشەکەوتکردن",

    // Note Fields
    date: "ڕێکەوتی تێبینی",
    title: "سەردێڕی تێبینی",
    content: "ناوەڕۆکی تێبینیی پزیشکی",

    // Medical Images Fields
    imageType: "جۆری وێنەی تیشک/پشکنین",
    imageTitle: "سەردێڕی پشکنین یان ڕاپۆرت",
    selectImageFile: "دیاریکردنی فایلی وێنەکە",
    viewFullScreen: "پیشاندان لە قەبارەی تەواودا",
    uploadNewImage: "هاوپێچکردنی فایل",
    noImagesYet: "هیچ وێنەیەکی تیشکی یان ڕاپۆرتی تاقیگە بەم فایلەوە نەبەستراوەتەوە.",
    xray: "تیشکی ئێکس (X-Ray)",
    mri: "تیشکی لەرەلەری موگناتیسی (MRI)",
    ct: "تیشک وێنەگریی بڕگەیی (CT Scan)",
    lab: "ڕاپۆرتی پشکنینی تاقیگە",
    other: "وێنەی تری پزیشکی",

    // Settings
    settings: "ڕێکخستنەکانی سیستەم",
    changeUsername: "گۆڕینی ناوی بەکارهێنەر",
    changePassword: "گۆڕینی وشەی تێپەڕی نۆرینگە",
    languageSelection: "دیاریکردنی زمانی سیستەم",
    themeToggle: "شێوازی ڕووکار",
    darkMode: "ڕووکاری تاریک (شەو)",
    lightMode: "ڕووکاری ڕووناک (ڕۆژ)",
    currentUsername: "ناوی بەکارهێنەری نوێ",
    newPassword: "وشەی تێپەڕی نوێ",
    credentialsUpdated: "زانیارییەکان بە سەرکەوتوویی نوێکرانەوە.",
    logout: "چوونەدەرەوەی پارێزراو",
    backToDashboard: "پێڕستی سەرەکی",
    autoSaved: "زانیارییەکان بە شێوەی خۆکار پاشەکەوت کران",
    back: "گەڕانەوە",
    exportData: "پاشەکەوت و هەناردەکردنی داتابەیس",
    importData: "هاوردەکردن و گەڕاندنەوەی داتابەیس",
    exportDataDesc: "داگرتنی کۆپییەکی پارێزراوی JSON لە تەواوی زانیارییەکانی نەخۆشەکان، پشکنینەکان، ڕاپۆرتەکان و تێبینییەکان بۆ ناو کۆمپیوتەرەکەت.",
    importSuccess: "داتابەیسی پزیشکی بە سەرکەوتوویی گەڕێندرایەوە و نوێکرایەوە!",
    importError: "هاوردەکردنی فایلەکە سەرکەوتوو نەبوو. دڵنیابەوە لەوەی کە فایلێکی دروستی سیستەمەکەیە.",
    exportPromptTitle: "بیرهێنەرەوەی هەناردەکردنی داتابەیس",
    exportPromptNever: "هیچ کۆپییەکی پاشەکەوتکراوی داتابەیس لەسەر ئەم ئامێرە نەبینراوە. تکایە ئێستا هەناردەی بکە بۆ ڕێگری لە فەوتانی زانیارییەکان.",
    exportPromptOld: "سێبەر {days} ڕۆژ تێپەڕیوە بەسەر کۆتا هەناردەکردنی داتابەیسەکەت. پێشنیار دەکرێت بە شێوەی خولی کۆپی پاشەکەوت بکەیت.",
    age: "تەمەن",
    yearsOld: "ساڵ",
    billingAmount: "تێچووی پشکنین",
    iqdinar: "دیناری عێراقی",
    incomeCountFrom: "هەژمارکردن لە بەروارەوە",
    monthlyPatients: "نەخۆشەکانی ئەم مانگە",
    totalIncome: "کۆی داهات",
    dailyIncome: "داهاتی ڕۆژانە",
    chooseMonth: "مانگ",
    chooseYear: "ساڵ",
    chooseDay: "ڕۆژ دیاری بکە",
    openPhoto: "کردنەوەی وێنە"
  }
};
