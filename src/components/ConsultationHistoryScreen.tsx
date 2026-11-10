import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Tag, 
  User, 
  FileText, 
  Clipboard, 
  ShieldAlert, 
  DollarSign, 
  ArrowLeft, 
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Move,
  X,
  ImageIcon,
  Printer,
  Edit,
  Save,
  AlertCircle
} from 'lucide-react';
import { DentalHistoryEntry, DentalImage } from '../types';
import { formatIQDAmount, dentalStorage, parseIQDAmount } from '../services/storage';
import { PatientImageRenderer } from './PatientProfileScreen'; // Re-use the existing physical disk file sync renderer

export const ConsultationHistoryScreen: React.FC = () => {
  const { 
    activePatientRecord, 
    isRtl, 
    navigateTo, 
    t, 
    folderHandle, 
    dirAuthorized,
    language,
    selectedConsultationId,
    setSelectedConsultationId,
    userRole,
    refreshPatientsList
  } = useApp();

  // Guard for secretary role
  useEffect(() => {
    if (userRole === 'secretary') {
      navigateTo('dashboard');
    }
  }, [userRole]);

  // Safely get history sorted by date descending (latest first)
  const sortedHistory = activePatientRecord
    ? [...activePatientRecord.history].sort((a, B) => B.visitDate.localeCompare(a.visitDate))
    : [];

  // State for active chosen consultation
  const [selectedEntry, setSelectedEntry] = useState<DentalHistoryEntry | null>(() => {
    if (selectedConsultationId) {
      const match = sortedHistory.find(h => h.id === selectedConsultationId);
      if (match) return match;
    }
    return sortedHistory.length > 0 ? sortedHistory[0] : null;
  });

  // Sync selection when selectedConsultationId changes or on cleanup
  useEffect(() => {
    if (selectedConsultationId) {
      const match = sortedHistory.find(h => h.id === selectedConsultationId);
      if (match) setSelectedEntry(match);
    }
  }, [selectedConsultationId, activePatientRecord?.id]);

  useEffect(() => {
    return () => {
      setSelectedConsultationId(null);
    };
  }, []);

  // Keep state updated in case history was updated or patient changed
  useEffect(() => {
    if (sortedHistory.length > 0) {
      // Keep selected entry in sync or fallback to the latest
      const stillExists = sortedHistory.find(h => h.id === selectedEntry?.id);
      setSelectedEntry(stillExists || sortedHistory[0]);
    } else {
      setSelectedEntry(null);
    }
  }, [activePatientRecord?.id]);

  // Inline/Direct editing states for consultation details
  const [isEditing, setIsEditing] = useState(false);
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editSymptoms, setEditSymptoms] = useState('');
  const [editTreatment, setEditTreatment] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editBillingAmount, setEditBillingAmount] = useState('');
  const [editVisitDate, setEditVisitDate] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Sync editing inputs whenever selectedEntry changes
  useEffect(() => {
    if (selectedEntry) {
      setEditDiagnosis(selectedEntry.diagnosis || '');
      setEditSymptoms(selectedEntry.symptoms || '');
      setEditTreatment(selectedEntry.treatment || '');
      setEditNotes(selectedEntry.notes || '');
      setEditBillingAmount(selectedEntry.billingAmount !== undefined ? formatIQDAmount(selectedEntry.billingAmount) : '');
      setEditVisitDate(selectedEntry.visitDate || '');
      setIsEditing(false); // Reset editing mode when swapping to another consultation
      setEditError(null);
    }
  }, [selectedEntry]);

  const handleSaveDirect = () => {
    if (!selectedEntry || !activePatientRecord) return;
    if (!editDiagnosis.trim()) {
      setEditError(isRtl ? "التشخيص الطبي مطلوب" : "Medical diagnosis is required");
      return;
    }
    if (!editVisitDate.trim()) {
      setEditError(isRtl ? "تاريخ الزيارة مطلوب" : "Visit date is required");
      return;
    }

    try {
      const parsedAmount = parseIQDAmount(editBillingAmount);
      const entryToSave = {
        visitDate: editVisitDate,
        diagnosis: editDiagnosis,
        symptoms: editSymptoms,
        treatment: editTreatment,
        notes: editNotes,
        billingAmount: parsedAmount,
      };

      dentalStorage.updateHistoryEntry(activePatientRecord.id, selectedEntry.id, entryToSave);
      refreshPatientsList();
      setIsEditing(false);
      setEditError(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update consultation.");
    }
  };

  // Image zoom/pan state for individual preview lightbox
  const [fullscreenImage, setFullscreenImage] = useState<DentalImage | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };
  const handleZoomReset = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.12;
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(prev + zoomIntensity, 5));
    } else {
      setZoomScale(prev => {
        const next = Math.max(prev - zoomIntensity, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || zoomScale <= 1) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    const touch = e.touches[0];
    setIsPanning(true);
    setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || zoomScale <= 1) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - panStart.x,
      y: touch.clientY - panStart.y
    });
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleZoomReset();
    } else {
      setZoomScale(2);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  }, [fullscreenImage]);

  // -- EARLY RETURNS PLACED AFTER ALL HOOKS HAVE EXECUTED --
  if (userRole === 'secretary') {
    return null;
  }

  if (!activePatientRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {isRtl ? "لم يتم تحديد أي مريض" : "No active patient record selected"}
          </h2>
          <button
            onClick={() => navigateTo('dashboard')}
            className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg text-xs hover:bg-teal-700 transition"
          >
            {isRtl ? "العودة للوحة التحكم" : "Return to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  // Find images mapped to the selected consultation's exact visit date
  const selectedConsultationImages = selectedEntry 
    ? activePatientRecord.images.filter(img => img.date === selectedEntry.visitDate) 
    : [];

  const handleGrantImagePermission = () => {
    // If we trigger this, we can simulate or pass callback
  };

  const parseTreatmentIntoNumberedSteps = (treatmentStr: string): string[] => {
    if (!treatmentStr) return [];
    let lines = treatmentStr.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    
    if (lines.length === 1 && treatmentStr.includes(';')) {
      lines = treatmentStr.split(';').map(l => l.trim()).filter(Boolean);
    }
    
    if (lines.length === 1 && treatmentStr.includes(',')) {
      const parts = treatmentStr.split(',').map(l => l.trim()).filter(Boolean);
      if (parts.length > 1) {
        lines = parts;
      }
    }

    return lines.map((line, index) => {
      const cleanedLine = line.replace(/^\d+[-.)\s]+/, '').trim();
      return `${index + 1}- ${cleanedLine}`;
    });
  };

  const handlePrintPrescriptionOnly = () => {
    if (!selectedEntry) return;
    const numberedList = parseTreatmentIntoNumberedSteps(selectedEntry.treatment);
    if (numberedList.length === 0) return;

    const iframeId = 'print-minimal-treatment-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (iframe) {
      document.body.removeChild(iframe);
    }
    
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const docStr = `
      <!DOCTYPE html>
      <html lang="${language || 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>Treatment Prescription</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@450;700&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          body {
            font-family: 'Courier Prime', monospace;
            background: #ffffff;
            color: #000000;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            width: 100vw;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
          }
          
          .print-content {
            text-align: center;
            max-width: 85%;
            margin: auto;
            padding: 20px;
            font-size: 20px;
            line-height: 2.2;
            white-space: pre-line;
            word-wrap: break-word;
          }

          .drug-line {
            display: block;
            margin-bottom: 24px;
            font-weight: 700;
            text-align: center;
          }

          @media print {
            body {
              width: 100vw;
              height: 100vh;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-content">
          ${numberedList.map(item => `<div class="drug-line">${item}</div>`).join('')}
        </div>
        <script>
          window.onload = function() {
            document.fonts.ready.then(function() {
              window.print();
            });
          };
        </script>
      </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow || iframe.contentDocument;
    if (iframeDoc) {
      const doc = (iframeDoc as any).document || iframeDoc;
      doc.open();
      doc.write(docStr);
      doc.close();
    }
  };

  const handlePrint = () => {
    if (!selectedEntry || !activePatientRecord) return;

    const patient = activePatientRecord;
    const entry = selectedEntry;

    // Determine directionality
    const docDir = isRtl ? 'rtl' : 'ltr';

    // Labels based on language
    let titleLabel = "CLINICAL SUMMARY & CONSULTATION REPORT";
    let dateLabel = "Consultation Date";
    let idLabel = "Patient ID";
    let nameLabel = "Patient Full Name";
    let genderLabel = "Gender";
    let ageLabel = "Age / Date of Birth";
    let diagnosisLabel = "Primary Diagnosis";
    let symptomsLabel = "Clinical Presentation & Symptoms";
    let treatmentLabel = "Treatment Protocol & Prescriptions";
    let notesLabel = "Observations & Instructions";
    let paidLabel = "Total Consultation Fee Paid";
    let stampLabel = "Authorized Signature / Clinical Stamp";
    let footerLabel = "This document is an official digital record generated by My Secretary Clinical Records System.";

    if (isRtl) {
      if (language === 'ku') {
        titleLabel = "ڕاپۆرتی سەردانی پزیشکی و دەستنیشانکردن";
        dateLabel = "ڕێکەوتی پشکنین";
        idLabel = "کۆدی نەخۆش";
        nameLabel = "ناوی تەواوی نەخۆش";
        genderLabel = "ڕەگەز";
        ageLabel = "تەمەن / ساڵی لەدایکبوون";
        diagnosisLabel = "دەستنیشانکردنی سەرەکی (تەشخیس)";
        symptomsLabel = "نیشانەکان و دەرکەوتەی نەخۆشی";
        treatmentLabel = "چارەسەر و دەرمانی نووسراو";
        notesLabel = "تێبینی پزیشک و ڕێنماییەکان";
        paidLabel = "کۆی گشتیی تێچووی دراو";
        stampLabel = "واژۆ و مۆری نۆرینگە";
        footerLabel = "ئەم بەڵگەنامەیە تۆمارێکی فەرمی دیجیتاڵییە کە لەلایەن سیستەمی سکرتێرەکەمەوە دروستکراوە.";
      } else {
        titleLabel = "تقرير ملخص الاستشارة والزيارة الطبية";
        dateLabel = "تاريخ الاستشارة";
        idLabel = "رقم ملف المريض";
        nameLabel = "الاسم الكامل للمريض";
        genderLabel = "الجنس";
        ageLabel = "العمر / تاريخ الولادة";
        diagnosisLabel = "التشخيص الطبي الرئيسي";
        symptomsLabel = "الأعراض والمظهر السريري";
        treatmentLabel = "بروتوكول العلاج والوصفة الطبية";
        notesLabel = "الملاحظات الإضافية والتعليمات";
        paidLabel = "إجمالي أجور الاستشارة المدفوعة";
        stampLabel = "توقيع الطبيب الأخصائي / الختم الطبي المعين";
        footerLabel = "هذه الوثيقة عبارة عن سجل رقمي رسمي تم إنشاؤه تلقائياً بواسطة نظام سكرتيري السريري.";
      }
    }

    const genderVal = patient.gender === 'male' ? t.genderMale : patient.gender === 'female' ? t.genderFemale : t.genderOther;

    // Create printer iframe helper
    const iframeId = 'print-summary-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (iframe) {
      document.body.removeChild(iframe);
    }
    
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Build the beautiful document content
    const docStr = `
      <!DOCTYPE html>
      <html lang="${language || 'en'}" dir="${docDir}">
      <head>
        <meta charset="utf-8">
        <title>${titleLabel} - ${patient.fullName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          
          body {
            font-family: 'Inter', 'Noto Kufi Arabic', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 11.5px;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
          }
          .report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .clinic-logo-area {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .clinic-badge {
            background-color: #0d9488;
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .clinic-title-wrapper {
            display: flex;
            flex-direction: column;
          }
          .clinic-title {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            line-height: 1.1;
          }
          .clinic-subtitle {
            font-size: 9px;
            color: #64748b;
            margin: 2px 0 0 0;
            font-weight: 500;
          }
          .document-meta {
            text-align: ${isRtl ? 'left' : 'right'};
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .report-title-badge {
            background-color: #f0fdfa;
            color: #0d9488;
            border: 1px solid #ccfbf1;
            padding: 3px 8px;
            border-radius: 6px;
            text-transform: uppercase;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.5px;
            display: inline-block;
            align-self: ${isRtl ? 'flex-start' : 'flex-end'};
          }
          .meta-date {
            font-size: 10px;
            color: #475569;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 14px;
          }
          .info-block {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          .info-label {
            font-size: 8.5px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .info-value {
            font-size: 11px;
            color: #0f172a;
            font-weight: 700;
          }
          .section-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 10px;
            overflow: hidden;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.01);
            page-break-inside: avoid;
          }
          .section-title {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 12px;
            font-size: 9.5px;
            font-weight: 700;
            color: #0d9488;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .section-title span {
            font-size: 11px;
          }
          .section-content {
            padding: 10px 12px;
            font-size: 11px;
            color: #334155;
            font-weight: 500;
            white-space: pre-wrap;
          }
          .diagnosis-highlight {
            font-size: 12.5px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.35;
          }
          .treatment-highlight {
            background-color: #fafbfc;
            border-left: ${isRtl ? 'none' : '3px solid #0d9488'};
            border-right: ${isRtl ? '3px solid #0d9488' : 'none'};
            padding: 8px 12px;
            margin: 0;
            font-family: inherit;
            font-size: 11px;
            color: #1e293b;
            font-weight: 600;
            line-height: 1.45;
            white-space: pre-wrap;
          }
          .financial-badge {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f0fdf4;
            border: 1.2px dashed #bbf7d0;
            border-radius: 8px;
            padding: 8px 14px;
            margin-top: 10px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .financial-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .financial-value {
            font-size: 13.5px;
            font-weight: 800;
            color: #14532d;
            font-family: monospace, sans-serif;
          }
          .footer-section {
            margin-top: 25px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            page-break-inside: avoid;
          }
          .footer-text {
            font-size: 8.5px;
            color: #94a3b8;
            max-width: 65%;
            line-height: 1.4;
          }
          .signature-box {
            text-align: center;
            width: 180px;
          }
          .signature-line {
            border-bottom: 1.2px solid #cbd5e1;
            height: 25px;
            margin-bottom: 6px;
          }
          .signature-label {
            font-size: 9px;
            font-weight: 700;
            color: #475569;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="clinic-logo-area">
            <div class="clinic-badge">✚</div>
            <div class="clinic-title-wrapper">
              <span class="clinic-title">${t.appName || 'My Secretary'}</span>
              <span class="clinic-subtitle">${t.appSubtitle || 'Secure Clinical Records System'}</span>
            </div>
          </div>
          <div class="document-meta">
            <span class="report-title-badge">${isRtl ? 'ملخص زيارة عيادة' : 'Clinical Summary'}</span>
            <div class="meta-date">${dateLabel}: ${entry.visitDate}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-block">
            <span class="info-label">${nameLabel}</span>
            <span class="info-value">${patient.fullName}</span>
          </div>
          <div class="info-block">
            <span class="info-label">${idLabel}</span>
            <span class="info-value">${patient.patientId}</span>
          </div>
          <div class="info-block">
            <span class="info-label">${genderLabel}</span>
            <span class="info-value">${genderVal}</span>
          </div>
          <div class="info-block">
            <span class="info-label">${ageLabel}</span>
            <span class="info-value">
              ${patient.dateOfBirth ? `${patient.dateOfBirth}` : ''}
              ${patient.birthYear ? `${patient.birthYear}` : ''}
            </span>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">
            <span>📋</span> ${diagnosisLabel}
          </div>
          <div class="section-content diagnosis-highlight">
            ${entry.diagnosis}
          </div>
        </div>

        ${entry.symptoms ? `
          <div class="section-card">
            <div class="section-title">
              <span>🩺</span> ${symptomsLabel}
            </div>
            <div class="section-content">
              ${entry.symptoms}
            </div>
          </div>
        ` : ''}

        ${entry.treatment ? `
          <div class="section-card">
            <div class="section-title">
              <span>💊</span> ${treatmentLabel}
            </div>
            <div class="section-content" style="padding: 6px 12px;">
              <div class="treatment-highlight">${entry.treatment}</div>
            </div>
          </div>
        ` : ''}

        ${entry.notes ? `
          <div class="section-card">
            <div class="section-title">
              <span>📝</span> ${notesLabel}
            </div>
            <div class="section-content" style="font-style: italic; color: #475569; border-left: ${isRtl ? 'none' : '3px double #cbd5e1'}; border-right: ${isRtl ? '3px double #cbd5e1' : 'none'}; padding-left: ${isRtl ? '0' : '12px'}; padding-right: ${isRtl ? '12px' : '0'};">
              "${entry.notes}"
            </div>
          </div>
        ` : ''}

        ${entry.billingAmount !== undefined ? `
          <div class="financial-badge">
            <span class="financial-title">${paidLabel}</span>
            <span class="financial-value">${formatIQDAmount(entry.billingAmount)} ${isRtl ? "د.ع" : "IQD"}</span>
          </div>
        ` : ''}

        <div class="footer-section">
          <div class="footer-text">
            ${footerLabel}
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">${stampLabel}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(docStr);
      iframeDoc.close();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-20 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            id="consult_btn_back"
            onClick={() => navigateTo('profile', activePatientRecord.id)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 font-extrabold transition-all cursor-pointer"
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span>{isRtl ? "العودة لملف المريض" : "Back to Patient Profile"}</span>
          </button>

          <h1 id="consult_page_title" className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {isRtl ? "سجل الاستشارات والاستدعاء" : "Clinical Consultation Hub"}
          </h1>

          <div className="w-16"></div> {/* Spacer balance */}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Patient Demographics Banner card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-teal-50 dark:bg-teal-950/45 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                {activePatientRecord.fullName}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 font-mono text-xs font-bold text-slate-500 dark:text-slate-450">
                <Tag className="h-3 w-3" />
                <span>{activePatientRecord.patientId}</span>
                <span className="text-slate-200 dark:text-slate-800">•</span>
                <span>{activePatientRecord.gender === 'male' ? t.genderMale : activePatientRecord.gender === 'female' ? t.genderFemale : t.genderOther}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-800 rounded-xl text-right">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest block text-[9px] mb-0.5">
                {t.totalPaid}
              </span>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {formatIQDAmount(
                  activePatientRecord.history.reduce((sum, entry) => sum + (entry.billingAmount || 0), 0)
                )} {isRtl ? "د.ع" : "IQD"}
              </p>
            </div>
          </div>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-16 text-center shadow-xs">
            <Clipboard className="h-16 w-16 text-slate-350 dark:text-slate-600 mx-auto opacity-40 mb-4" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isRtl ? "لا توجد استشارات سابقة سجلت لهذا المريض" : "No documented consultations yet"}
            </h3>
            <p className="text-xs text-slate-450 mt-1 max-w-md mx-auto">
              {isRtl 
                ? "انتقل إلى ملف المريض لإضافة زيارة طبية جديدة لملئه بالتفاصيل." 
                : "Return to the patient profile to add clinical history, diagnosis, symptoms, and treatment fees."}
            </p>
            <button
              onClick={() => navigateTo('profile', activePatientRecord.id)}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-teal-600 text-white font-bold rounded-lg text-xs hover:bg-teal-700 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isRtl ? "الذهاب لإضافة استشارة" : "Return to Patient File"}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Timeline Selector pane (Lg: col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-xs font-black text-slate-450 tracking-wider uppercase">
                {isRtl ? "قائمة الزيارات والاستشارات" : "Consultation History List"}
              </h3>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {sortedHistory.map((entry, index) => {
                  const isSelected = selectedEntry?.id === entry.id;
                  const isLast = index === 0;

                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col gap-2 relative overflow-hidden text-slate-900 dark:text-white group select-none cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-transparent shadow-md shadow-teal-700/10' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      {isLast && (
                        <span className={`absolute top-0 right-0 ${isRtl ? 'left-auto' : 'right-0'} text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg transition-colors ${
                          isSelected 
                            ? 'bg-teal-800/50 text-emerald-200' 
                            : 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border-l border-b border-teal-100 dark:border-teal-900/60'
                        }`}>
                          {isRtl ? "الأحدث" : "Latest"}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Calendar className={`h-3.5 w-3.5 ${isSelected ? 'text-teal-200' : 'text-teal-500'}`} />
                        <span className="font-mono">{entry.visitDate}</span>
                      </div>

                      <div className="space-y-0.5 text-left">
                        <p className={`text-base font-extrabold line-clamp-1 group-hover:underline ${
                          isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                        }`}>
                          {entry.diagnosis}
                        </p>
                        
                        {entry.billingAmount !== undefined && (
                          <span className={`text-[10px] uppercase font-mono font-bold ${
                            isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {isRtl ? "أجور:" : "Fee:"} {formatIQDAmount(entry.billingAmount)} {isRtl ? "د.ع" : "IQD"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Active consultation Pane (Lg: col-span-8) */}
            <div className="lg:col-span-8">
              {selectedEntry && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xs transition-colors space-y-8">
                  
                  {/* Active Consult Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-100 dark:border-slate-800/80 gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-teal-50 dark:bg-teal-950/45 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-md border border-teal-100/50 dark:border-teal-900/40">
                        <Calendar className="h-3 w-3" />
                        <span className="font-mono">{selectedEntry.visitDate}</span>
                      </span>
                      <h3 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight mt-1">
                        {selectedEntry.diagnosis}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
                      {/* Direct Edit Consultation Button - highly obvious style */}
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 px-4.5 py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/45 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-black rounded-xl text-xs transition-all cursor-pointer border border-amber-200 hover:border-amber-300 dark:border-amber-900 shadow-md hover:scale-102 active:scale-98"
                          title={isRtl ? "تعديل الاستشارة الطبية" : "Edit this consultation record"}
                        >
                          <Edit className="h-4 w-4 stroke-[2.5px] text-amber-600 dark:text-amber-400" />
                          <span>{isRtl ? "تعديل الاستشارة 📝" : "Edit Consultation 📝"}</span>
                        </button>
                      )}

                      {/* Print Prescription Only Button */}
                      {selectedEntry.treatment && selectedEntry.treatment.trim() !== "" && (
                        <button
                          id="btn_print_prescription_only"
                          onClick={handlePrintPrescriptionOnly}
                          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer border border-emerald-200/50 dark:border-emerald-900/50 shadow-xs"
                        >
                          <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{isRtl ? "طباعة الوصفة فقط" : "Print Prescription Only"}</span>
                        </button>
                      )}

                      {/* Professional Print summary action Button */}
                      <button
                        id="btn_print_consultation"
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer border border-teal-100 dark:border-teal-900/50 shadow-xs"
                      >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? "طباعة الملخص" : "Print Summary"}</span>
                      </button>

                      {selectedEntry.billingAmount !== undefined && (
                        <div className="text-right font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/55 dark:border-slate-850 shrink-0">
                          <span className="text-[9px] uppercase text-slate-450 font-extrabold block mb-0.5">
                            {isRtl ? "أجور الزيارة المدفوعة" : "Paid Visit Fee"}
                          </span>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                            {formatIQDAmount(selectedEntry.billingAmount)} {isRtl ? "د.ع" : "IQD"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    /* Display full-featured direct editing form inline */
                    <div className="space-y-6 bg-slate-50/50 dark:bg-slate-950/15 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      
                      {editError && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
                          <span>{editError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* LEFT COLUMN: Date, Diagnosis, Billing */}
                        <div className="space-y-4">
                          
                          {/* Visit Date */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              📅 {isRtl ? "تاريخ الزيارة *" : "Visit Date *"}
                            </label>
                            <input
                              type="date"
                              value={editVisitDate}
                              onChange={(e) => setEditVisitDate(e.target.value)}
                              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xs font-semibold transition-all"
                              required
                            />
                          </div>

                          {/* Diagnosis */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              🔬 {isRtl ? "التشخيص الطبي *" : "Medical Diagnosis *"}
                            </label>
                            <input
                              type="text"
                              value={editDiagnosis}
                              onChange={(e) => setEditDiagnosis(e.target.value)}
                              placeholder={isRtl ? "التشخيص الطبي" : "Medical diagnosis"}
                              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xs font-semibold transition-all"
                              required
                            />
                          </div>

                          {/* Paid Fee Amount */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              💰 {isRtl ? "الأجور المدفوعة" : "Paid Visit Fee"} (IQD)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder={isRtl ? "مثال: ٣٥ أو 35.000" : "e.g. 35 or 35.000"}
                                value={editBillingAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^[0-9.,]*$/.test(val)) {
                                    setEditBillingAmount(val);
                                  }
                                }}
                                onBlur={() => {
                                  const parsed = parseIQDAmount(editBillingAmount);
                                  if (parsed > 0) {
                                    setEditBillingAmount(formatIQDAmount(parsed));
                                  }
                                }}
                                className={`w-full py-2.5 px-3.5 ${isRtl ? 'pl-28' : 'pr-28'} rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xs font-mono font-bold`}
                              />
                              {editBillingAmount && (
                                <div className={`absolute inset-y-0.5 flex items-center text-[10px] text-teal-700 dark:text-teal-300 font-extrabold bg-teal-50 dark:bg-slate-800 px-3 border border-teal-100 dark:border-slate-800 ${isRtl ? 'left-0.5 rounded-l-xl border-r' : 'right-0.5 rounded-r-xl border-l'}`}>
                                  {formatIQDAmount(parseIQDAmount(editBillingAmount))} {isRtl ? "د.ع" : "IQD"}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* RIGHT COLUMN: Symptoms and Observational notes */}
                        <div className="space-y-4">
                          
                          {/* Symptoms */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              🤒 {isRtl ? "الأعراض والشكوى الأساسية" : "Underlying Symptoms / Complains"}
                            </label>
                            <textarea
                              value={editSymptoms}
                              onChange={(e) => setEditSymptoms(e.target.value)}
                              placeholder={isRtl ? "أعراض المريض والشكوى الشائعة..." : "Patient symptoms and medical issues..."}
                              rows={3}
                              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xs font-medium resize-none leading-relaxed"
                            />
                          </div>

                          {/* Notes */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              📝 {isRtl ? "تعليمات وملاحظات إضافية" : "Observational Notes & Post-Op Advice"}
                            </label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder={isRtl ? "ملاحظات الطبيب وتوجيهاته..." : "Physician observations and instructions..."}
                              rows={3}
                              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xs font-medium resize-none leading-relaxed"
                            />
                          </div>

                        </div>

                      </div>

                      {/* Wide Span Column: Treatment Plan */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          💊 {isRtl ? "الخطة العلاجية والإجراء الطبي" : "Medical Treatment & Dental Procedure"}
                        </label>
                        <textarea
                          value={editTreatment}
                          onChange={(e) => setEditTreatment(e.target.value)}
                          placeholder={isRtl ? "الخطة العلاجية الدقيقة، والأدوية الموصوفة..." : "Clinical treatment plan, procedures performed, or pharmacy medication advices..."}
                          rows={4}
                          className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-955 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xs font-semibold resize-none leading-relaxed"
                        />
                      </div>

                      {/* Action save/cancel panel */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/55 dark:border-slate-800">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          {isRtl ? "إلغاء ودون حفظ" : "Cancel"}
                        </button>
                        <button
                          onClick={handleSaveDirect}
                          className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-teal-700/15"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isRtl ? "حفظ التغييرات" : "Save Changes"}</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* Display normal interactive viewer blocks with very BIG legible text */
                    <div className="space-y-6">
                      
                      {/* Diagnosis Full Content */}
                      <div className="space-y-1.5 p-4.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl">
                        <span className="text-xs text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-widest block">
                          {isRtl ? "التشخيص الطبي" : "Medical Diagnosis"}
                        </span>
                        <p className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white leading-relaxed">
                          {selectedEntry.diagnosis}
                        </p>
                      </div>

                      {/* Symptoms Detailed View */}
                      {selectedEntry.symptoms && (
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest block">
                            {isRtl ? "الأعراض والشكوى الأساسية" : "Underlying Symptoms / Complains"}
                          </span>
                          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl">
                            <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                              {selectedEntry.symptoms}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Treatment Plan Highlight */}
                      {selectedEntry.treatment && (
                        <div className="space-y-2">
                          <span className="text-xs text-teal-500 dark:text-teal-400 font-black uppercase tracking-widest block">
                            {isRtl ? "الخطة العلاجية والإجراء الطبي المنفذ" : "Medical Treatment & Dental Procedure"}
                          </span>
                          <div className="p-5 bg-teal-50/15 dark:bg-slate-950/40 border-l-4 border-l-teal-500 border border-slate-250 dark:border-slate-800 rounded-r-xl">
                            <p className="text-lg font-mono text-slate-800 dark:text-slate-200 leading-relaxed font-bold whitespace-pre-wrap">
                              {selectedEntry.treatment}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Observational notes */}
                      {selectedEntry.notes && (
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest block">
                            {isRtl ? "الملاحظات الإضافية والتعليمات" : "Observational Notes & Patient Post-Op Advice"}
                          </span>
                          <div className="p-4 bg-slate-50/50 dark:bg-slate-850/30 border border-slate-150 dark:border-slate-850 rounded-xl italic text-slate-600 dark:text-slate-450 leading-relaxed text-base font-medium">
                            <p>"{selectedEntry.notes}"</p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Consultation Photos (From the same date!) */}
                  <div className="pt-6 border-t border-slate-150 dark:border-slate-850 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4" />
                        <span>{isRtl ? "صور الأشعة والتقارير المرفقة بهذه الزيارة" : "Dental Scans & Photos Linked to this Consultation"}</span>
                      </span>
                      <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                        {selectedConsultationImages.length}
                      </span>
                    </div>

                    {selectedConsultationImages.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-950/20 p-8 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-450">
                        <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-bold">
                          {isRtl ? "لم يتم إرفاق صور أو أشعة في تاريخ هذا الموعد" : "No images or dental scans uploaded on this clinical date."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                        {selectedConsultationImages.map((img) => (
                          <div 
                            key={img.id}
                            onClick={() => setFullscreenImage(img)}
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl cursor-pointer hover:border-teal-500 dark:hover:border-teal-400 transform hover:-translate-y-0.5 transition-all group overflow-hidden"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                              <PatientImageRenderer
                                dataUrl={img.dataUrl}
                                alt={img.title}
                                className="object-contain max-h-40 w-full group-hover:scale-102 transition duration-200"
                                folderHandle={folderHandle}
                                dirAuthorized={dirAuthorized}
                                onGrantPermission={handleGrantImagePermission}
                                patientId={activePatientRecord.patientId}
                                fullName={activePatientRecord.fullName}
                                isRtl={isRtl}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <span className="bg-white/95 text-slate-900 rounded-full px-3 py-1.5 text-[10px] font-black shadow flex items-center gap-1">
                                  <ZoomIn className="h-3 w-3 text-teal-600" />
                                  <span>{isRtl ? "تكبير الصورة" : "Zoom Image"}</span>
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-center text-xs">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate">{img.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Fullscreen Magnifier Lightbox modal window with complete Pan/Zoom systems */}
      {fullscreenImage !== null && (
        <div id="image_lightbox" className="fixed inset-0 z-50 bg-black/98 flex flex-col justify-between p-4 md:p-8 select-none font-sans">
          
          {/* Header controls inside Lightbox */}
          <div className="flex justify-between items-center text-white my-2 shrink-0">
            <div className="flex flex-col text-left">
              <h3 className="font-bold text-base text-teal-400">
                {fullscreenImage.title}
              </h3>
              <p className="text-xs text-slate-400">
                {fullscreenImage.date}
              </p>
            </div>
            
            <button
              id="btn_close_lightbox"
              onClick={() => setFullscreenImage(null)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition cursor-pointer"
              title={isRtl ? "إغلاق" : "Exit Preview"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Viewport content */}
          <div 
            className="flex-1 w-full flex items-center justify-center p-2 md:p-4 overflow-hidden relative"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{
              cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in'
            }}
          >
            <div 
              style={{ 
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transition: isPanning ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transformOrigin: 'center center'
              }}
              className="relative max-h-[75vh] w-full max-w-4xl flex items-center justify-center select-none"
            >
              <PatientImageRenderer
                dataUrl={fullscreenImage.dataUrl}
                alt={fullscreenImage.title}
                className="max-h-[75vh] max-w-full md:max-w-4xl object-contain shadow-2xl rounded-lg pointer-events-none"
                folderHandle={folderHandle}
                dirAuthorized={dirAuthorized}
                onGrantPermission={handleGrantImagePermission}
                patientId={activePatientRecord.patientId}
                fullName={activePatientRecord.fullName}
                isRtl={isRtl}
              />
            </div>

            {zoomScale > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white border border-slate-800 px-3 py-1.5 rounded-full text-[10px] md:text-xs flex items-center gap-1.5 shadow-xl animate-bounce pointer-events-none">
                <Move className="h-3.5 w-3.5 text-teal-400" />
                <span>{isRtl ? "اسحب لتحريك ملف الصورة وتعديله" : "Drag to move or pan around"}</span>
              </div>
            )}
          </div>

          {/* Floating Zoom Controls HUD */}
          <div className="flex flex-col items-center gap-2 shrink-0 my-2">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-3 border border-slate-800">
              <button
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                title={isRtl ? "تصغير" : "Zoom Out"}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-full transition cursor-pointer"
              >
                <ZoomOut className="h-4.5 w-4.5" />
              </button>
              
              <span className="text-xs font-mono font-bold text-teal-400 min-w-16 text-center select-none">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoomScale >= 5}
                title={isRtl ? "تكبير" : "Zoom In"}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-full transition cursor-pointer"
              >
                <ZoomIn className="h-4.5 w-4.5" />
              </button>

              <div className="w-px h-5 bg-slate-700"></div>

              <button
                onClick={handleZoomReset}
                disabled={zoomScale === 1 && panOffset.x === 0 && panOffset.y === 0}
                title={isRtl ? "إعادة تعيين الأبعاد" : "Reset View"}
                className="p-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-full transition cursor-pointer"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="text-center text-slate-400 text-[10px] md:text-xs">
              <p>{isRtl ? "مرر بكرة الماوس أو انقر مرتين للتكبير التلقائي • اضغط زر الخروج في الأعلى للعودة" : "Scroll wheel or double click to zoom • Press exit button above to return"}</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
