import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight,
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  FileText, 
  Clipboard, 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Tag,
  Folder,
  FolderOpen,
  HardDrive,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Move,
  Printer,
  Activity,
  AlertCircle
} from 'lucide-react';
import { PatientFullRecord, DentalHistoryEntry, PatientNote, DentalImage, Drug, getDrugEmoji } from '../types';
import { dentalStorage, parseIQDAmount, formatIQDAmount, getDirectoryHandle } from '../services/storage';
import { calculateAgeFromDobDetailed } from '../services/ageHelper';

type ActiveTab = 'history' | 'notes' | 'images';

export interface PatientImageRendererProps {
  dataUrl: string;
  alt: string;
  className?: string;
  folderHandle: any;
  dirAuthorized: boolean;
  onGrantPermission: () => void;
  patientId: string;
  fullName: string;
  isRtl: boolean;
}

export const PatientImageRenderer: React.FC<PatientImageRendererProps> = ({
  dataUrl,
  alt,
  className = "",
  folderHandle,
  dirAuthorized,
  onGrantPermission,
  patientId,
  fullName,
  isRtl
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isLocal = dataUrl.startsWith('local://');

  useEffect(() => {
    if (!isLocal) {
      setResolvedUrl(dataUrl);
      return;
    }

    const pathPart = dataUrl.replace('local://', '');
    const slashIndex = pathPart.indexOf('/');
    
    let subfolder = '';
    let filename = '';
    if (slashIndex === -1) {
      filename = pathPart;
    } else {
      subfolder = pathPart.substring(0, slashIndex);
      filename = pathPart.substring(slashIndex + 1);
    }

    if (!folderHandle || !dirAuthorized) {
      setResolvedUrl('');
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(false);
    let activeBlobUrl = '';

    const loadLocalFile = async () => {
      try {
        const sanitizeName = (val: string) => val.replace(/[\\/:*?"<>|]/g, '').trim();
        const pFolderSlug = `${patientId} - ${sanitizeName(fullName)}`;
        
        const pDir = await folderHandle.getDirectoryHandle(pFolderSlug, { create: false });
        
        let fileHandle;
        if (subfolder) {
          try {
            const subfolderDir = await pDir.getDirectoryHandle(subfolder, { create: false });
            fileHandle = await subfolderDir.getFileHandle(filename, { create: false });
          } catch (subErr) {
            // Fallback: check the root patient folder
            fileHandle = await pDir.getFileHandle(filename, { create: false });
          }
        } else {
          fileHandle = await pDir.getFileHandle(filename, { create: false });
        }
        
        const fileObj = await fileHandle.getFile();
        activeBlobUrl = URL.createObjectURL(fileObj);

        if (!isCancelled) {
          setResolvedUrl(activeBlobUrl);
          setLoading(false);
        } else {
          URL.revokeObjectURL(activeBlobUrl);
        }
      } catch (err: any) {
        console.warn("Failed to retrieve file from local Windows PC sync handle:", err);
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadLocalFile();

    return () => {
      isCancelled = true;
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [dataUrl, folderHandle, dirAuthorized, patientId, fullName]);

  if (!isLocal) {
    return (
      <img
        src={dataUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        className={className}
      />
    );
  }

  if (!folderHandle || !dirAuthorized) {
    return (
      <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center">
        <svg className="h-6 w-6 text-slate-400 mb-1 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[10px] text-slate-300 font-bold mb-1.5 leading-tight">
          {isRtl 
            ? "محفوط على المجلد المحلي" 
            : "Saved on local PC"
          }
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGrantPermission();
          }}
          className="px-2 py-0.5 bg-teal-500 hover:bg-teal-650 text-white rounded text-[8px] font-bold cursor-pointer transition-all"
        >
          🔑 {isRtl ? "تفعيل الاذن للرؤية" : "Grant Authorization"}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-2 text-center">
        <svg className="h-5 w-5 text-amber-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[8.5px] text-slate-300 font-bold leading-tight">
          {isRtl ? "الملف غير متوفر حالياً" : "File Not Found"}
        </p>
        <p className="text-[7px] text-slate-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full font-mono">
          {dataUrl.replace('local://', '')}
        </p>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};

export const PatientProfileScreen: React.FC = () => {
  const { 
    selectedPatientId, 
    activePatientRecord, 
    navigateTo, 
    t, 
    isRtl, 
    refreshPatientsList,
    folderHandle,
    setFolderHandle,
    dirAuthorized,
    setDirAuthorized,
    language,
    setSelectedConsultationId,
    userRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('history');

  const [photosPath, setPhotosPath] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  useEffect(() => {
    setPhotosPath(dentalStorage.getPhotosRootPath());
  }, []);

  const handleGrantImagePermission = async () => {
    if (!folderHandle) return;
    try {
      const status = await (folderHandle as any).requestPermission({ mode: 'readwrite' });
      if (status === 'granted') {
        setDirAuthorized(true);
      }
    } catch (err) {
      console.error("Failed to grant folder handle permissions:", err);
    }
  };
  
  // Custom Confirmation Dialog states
  const [deleteHistoryItem, setDeleteHistoryItem] = useState<DentalHistoryEntry | null>(null);
  const [deleteNoteItem, setDeleteNoteItem] = useState<PatientNote | null>(null);
  const [deleteImageItem, setDeleteImageItem] = useState<DentalImage | null>(null);
  
  // Dialog Open state
  const [historyForm, setHistoryForm] = useState<Partial<DentalHistoryEntry> | null>(null);
  const [noteForm, setNoteForm] = useState<Partial<PatientNote> | null>(null);
  const [imageForm, setImageForm] = useState<Partial<DentalImage> | null>(null);
  
  // Image Fullscreen Viewer
  const [fullscreenImage, setFullscreenImage] = useState<DentalImage | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
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
        if (next === 1) {
          setPanOffset({ x: 0, y: 0 });
        }
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

  const handleMouseUp = () => {
    setIsPanning(false);
  };

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

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleZoomReset();
    } else {
      setZoomScale(2);
      setPanOffset({ x: 0, y: 0 });
    }
  };
  
  // Form input states
  const [formDataHistory, setFormDataHistory] = useState({
    visitDate: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: '',
    billingAmount: ''
  });
  
  const [formDataNote, setFormDataNote] = useState({
    date: '',
    title: '',
    content: ''
  });
  
  const [formDataImage, setFormDataImage] = useState({
    date: '',
    title: '',
    type: 'xray' as 'xray' | 'mri' | 'ct' | 'lab' | 'other',
    dataUrl: ''
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Drug Registry Suggestions Smart Search States
  const [suggestedDrugs, setSuggestedDrugs] = useState<Drug[]>([]);
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);
  const [printPromptEntry, setPrintPromptEntry] = useState<DentalHistoryEntry | null>(null);

  const handleTreatmentChange = (text: string) => {
    setFormDataHistory(prev => ({ ...prev, treatment: text }));
    
    // Parse the query for smart auto-suggestions based on the last line typed
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    const query = lastLine.replace(/^\s*\d+[-.)\s]*/, '').trim().toLowerCase();

    if (query.length >= 1) {
      const allDrugs = dentalStorage.getDrugs();
      const matched = allDrugs.filter(d => 
        d.tradeName.toLowerCase().includes(query) || 
        d.scientificName.toLowerCase().includes(query)
      );
      setSuggestedDrugs(matched);
      setShowDrugSuggestions(matched.length > 0);
    } else {
      setSuggestedDrugs([]);
      setShowDrugSuggestions(false);
    }
  };

  const handleSelectSuggestedDrug = (drug: Drug) => {
    const text = formDataHistory.treatment;
    
    // Split key lines in current treatment log
    const lines = text.split('\n').map(l => l.trim());
    
    // Build beautiful standardized text: TradeName [Dosage] (Strength) - Sig instructions
    const nameStr = drug.tradeName;
    const formulaStr = drug.scientificName ? `, ${drug.scientificName}` : '';
    const strengthStr = drug.strength ? ` ${drug.strength}` : '';
    const sigStr = drug.instructions ? ` - Sig: ${drug.instructions}` : '';
    const dosageStr = drug.dosageForm ? ` [${drug.dosageForm.split(" ")[0]}]` : '';

    const formattedDrugText = `${nameStr}${dosageStr}${strengthStr}${formulaStr}${sigStr}`;

    // Grab active non-empty lines to calculate the current catalog index position
    const activeLines = lines.filter((line, i) => i < lines.length - 1 || line !== '');
    const itemIndex = activeLines.length > 0 ? activeLines.length : 1;
    const numberedLine = `${itemIndex}- ${formattedDrugText}`;
    
    let updatedLines = [...lines];
    if (updatedLines.length > 0) {
      updatedLines[updatedLines.length - 1] = numberedLine;
    } else {
      updatedLines = [numberedLine];
    }
    
    // Auto-prompt line carriage return with next list item index
    const nextLineIndex = itemIndex + 1;
    const nextLineText = `${nextLineIndex}- `;
    
    const updatedTreatment = updatedLines.join('\n') + '\n' + nextLineText;

    setFormDataHistory(prev => ({ ...prev, treatment: updatedTreatment }));
    setSuggestedDrugs([]);
    setShowDrugSuggestions(false);

    // Reposition cursor at the end of the text container for fluid non-click typing sequence
    setTimeout(() => {
      const textarea = document.getElementById("history_input_treatment") as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }
    }, 60);
  };

  const handleOpenLocalFile = async (img: any) => {
    try {
      if (!img.dataUrl.startsWith('local://')) {
        // Safe fallback for standard dataURL/http URL
        const link = document.createElement('a');
        link.href = img.dataUrl;
        link.target = '_blank';
        link.click();
        return;
      }

      if (!folderHandle || !dirAuthorized) {
        setSuccessToast(isRtl ? "يرجى السماح بالوصول لمجلد الصور أولاً 🔑" : "Please authorize folder access first 🔑");
        return;
      }

      const pathPart = img.dataUrl.replace('local://', '');
      const slashIndex = pathPart.indexOf('/');
      
      let subfolder = '';
      let filename = '';
      if (slashIndex === -1) {
        filename = pathPart;
      } else {
        subfolder = pathPart.substring(0, slashIndex);
        filename = pathPart.substring(slashIndex + 1);
      }

      const sanitizeName = (val: string) => val.replace(/[\\/:*?"<>|]/g, '').trim();
      const pFolderSlug = `${activePatientRecord.patientId} - ${sanitizeName(activePatientRecord.fullName)}`;
      
      const pDir = await folderHandle.getDirectoryHandle(pFolderSlug, { create: false });
      
      let fileHandle;
      if (subfolder) {
        try {
          const subfolderDir = await pDir.getDirectoryHandle(subfolder, { create: false });
          fileHandle = await subfolderDir.getFileHandle(filename, { create: false });
        } catch (err) {
          fileHandle = await pDir.getFileHandle(filename, { create: false });
        }
      } else {
        fileHandle = await pDir.getFileHandle(filename, { create: false });
      }

      const fileObj = await fileHandle.getFile();
      const blobUrl = URL.createObjectURL(fileObj);

      // Avoid browser sandbox block of direct blob URL navigations in new tabs
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${img.title || (isRtl ? 'عرض الصورة' : 'Image Viewer')}</title>
              <style>
                body {
                  margin: 0;
                  background-color: #0b111e;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  color: #f1f5f9;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .container {
                  text-align: center;
                  padding: 24px;
                  max-width: 90vw;
                }
                img {
                  max-width: 100%;
                  max-height: 82vh;
                  object-fit: contain;
                  border-radius: 8px;
                  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
                  border: 1px solid #1e293b;
                }
                h1 {
                  font-size: 16px;
                  margin-top: 16px;
                  font-weight: 600;
                  color: #0d9488;
                }
                p {
                  margin: 4px 0 0 0;
                  font-size: 11px;
                  color: #64748b;
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <img src="${blobUrl}" alt="${img.title || ''}" />
                <h1>${img.title || ''}</h1>
                <p>${img.date || ''}</p>
              </div>
            </body>
          </html>
        `);
        win.document.close();
        setSuccessToast(isRtl ? "تم فتح الصورة بنجاح!" : "Opening file...");
      } else {
        // Fallback for popup blocker: open within-app full-view lightbox
        setFullscreenImage(img);
        setSuccessToast(isRtl ? "تم فتح الصورة في العارض المدمج!" : "Opened in the built-in dynamic viewer!");
      }
    } catch (err: any) {
      console.warn(err);
      setSuccessToast(isRtl ? "عذراً، تعذر العثور على الملف المحدد في المجلد" : "Error: Could not find the selected file on disk.");
    }
  };

  // Auto-dismiss Toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Reset zoom scale and pan offset when a fullscreen image changes or opens/closes
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  }, [fullscreenImage]);

  if (!activePatientRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center">
          <p className="text-slate-500">Patient profile loading...</p>
          <button onClick={() => navigateTo('dashboard')} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg">
            {t.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // --- History CRUD Operations ---
  const handleOpenHistoryForm = (entry?: DentalHistoryEntry) => {
    setFormError('');
    if (entry) {
      setHistoryForm(entry);
      setFormDataHistory({
        visitDate: entry.visitDate,
        diagnosis: entry.diagnosis,
        symptoms: entry.symptoms,
        treatment: entry.treatment,
        notes: entry.notes,
        billingAmount: entry.billingAmount !== undefined ? formatIQDAmount(entry.billingAmount) : ''
      });
    } else {
      setHistoryForm({});
      setFormDataHistory({
        visitDate: new Date().toISOString().split('T')[0],
        diagnosis: '',
        symptoms: '',
        treatment: '',
        notes: '',
        billingAmount: ''
      });
    }
  };

  const parseTreatmentIntoNumberedSteps = (treatmentStr: string): string[] => {
    if (!treatmentStr) return [];
    // First, normalize any carriage returns and split by newlines
    let lines = treatmentStr.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    
    // If there's only one line, but it has semicolons, let's split by semicolons
    if (lines.length === 1 && treatmentStr.includes(';')) {
      lines = treatmentStr.split(';').map(l => l.trim()).filter(Boolean);
    }
    
    // If there's still only 1 line, and no semicolons, but has commas outside of instructions, split by those
    if (lines.length === 1 && treatmentStr.includes(',')) {
      const parts = treatmentStr.split(',').map(l => l.trim()).filter(Boolean);
      if (parts.length > 1) {
        lines = parts;
      }
    }

    // Map to "1- Description", "2- Description" etc.
    return lines.map((line, index) => {
      // Remove existing leading "1.", "1-", etc to avoid "1- 1- Drug"
      const cleanedLine = line.replace(/^\d+[-.)\s]+/, '').trim();
      return `${index + 1}- ${cleanedLine}`;
    });
  };

  const handlePrintMinimalTreatment = (entry: DentalHistoryEntry) => {
    const numberedList = parseTreatmentIntoNumberedSteps(entry.treatment);
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

    // Build plain, clean HTML with ONLY centered text in the middle, no borders or headers/branding
    const docStr = `
      <!DOCTYPE html>
      <html lang="${language || 'en'}">
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
    
    setPrintPromptEntry(null);
  };

  const handleSaveHistory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formDataHistory.visitDate || !formDataHistory.diagnosis.trim()) {
      setFormError(t.fieldRequired);
      return;
    }

    try {
      const parsedBilling = parseIQDAmount(formDataHistory.billingAmount);
      
      let cleanTreatment = formDataHistory.treatment;
      if (cleanTreatment) {
        let lines = cleanTreatment.split(/\r?\n+/).map(l => l.trim());
        lines = lines.filter(line => {
          // Filter out lines that are purely numeric, empty, or just blank placeholders like "2-", "2- " or "2"
          return !(/^\d+[-.)\s]*$/.test(line)) && line !== '';
        });
        const cleanLines = lines.map((line, index) => {
          const content = line.replace(/^\d+[-.)\s]+/, '').trim();
          return `${index + 1}- ${content}`;
        });
        cleanTreatment = cleanLines.join('\n');
      }

      const entryToSave = {
        visitDate: formDataHistory.visitDate,
        diagnosis: formDataHistory.diagnosis,
        symptoms: formDataHistory.symptoms,
        treatment: cleanTreatment,
        notes: formDataHistory.notes,
        billingAmount: parsedBilling > 0 ? parsedBilling : undefined
      };

      let savedEntry: DentalHistoryEntry | null = null;
      if (historyForm && historyForm.id) {
        // Edit Mode
        dentalStorage.updateHistoryEntry(activePatientRecord.id, historyForm.id, entryToSave);
        savedEntry = { id: historyForm.id, ...entryToSave } as DentalHistoryEntry;
        setSuccessToast(isRtl ? "تم تحديث الزيارة الطبية بنجاح" : "Consultation history updated.");
      } else {
        // Add Mode
        const newEntry = dentalStorage.addHistoryEntry(activePatientRecord.id, entryToSave);
        savedEntry = newEntry;
        setSuccessToast(isRtl ? "تمت إضافة زيارة طبية جديدة بنجاح" : "Consultation history added.");
      }
      
      refreshPatientsList();
      setHistoryForm(null);

      // Offer print if treatment exists
      if (savedEntry && savedEntry.treatment && savedEntry.treatment.trim()) {
        setPrintPromptEntry(savedEntry);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save history.");
    }
  };

  const handleDeleteHistoryConfirm = () => {
    if (deleteHistoryItem) {
      dentalStorage.deleteHistoryEntry(activePatientRecord.id, deleteHistoryItem.id);
      refreshPatientsList();
      setDeleteHistoryItem(null);
      setSuccessToast(isRtl ? "تم حذف الزيارة بنجاح" : "History entry removed.");
    }
  };

  // --- Notes CRUD Operations ---
  const handleOpenNoteForm = (note?: PatientNote) => {
    setFormError('');
    if (note) {
      setNoteForm(note);
      setFormDataNote({
        date: note.date,
        title: note.title,
        content: note.content
      });
    } else {
      setNoteForm({});
      setFormDataNote({
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: ''
      });
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formDataNote.date || !formDataNote.title.trim() || !formDataNote.content.trim()) {
      setFormError(t.fieldRequired);
      return;
    }

    try {
      if (noteForm && noteForm.id) {
        dentalStorage.updateNote(activePatientRecord.id, noteForm.id, formDataNote);
        setSuccessToast(isRtl ? "تمت تحديث الملاحظة بنجاح" : "Clinical session note updated.");
      } else {
        dentalStorage.addNote(activePatientRecord.id, formDataNote);
        setSuccessToast(isRtl ? "تمت إضافة الملاحظة السريرية بنجاح" : "Clinical session note added.");
      }
      refreshPatientsList();
      setNoteForm(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to save note.");
    }
  };

  const handleDeleteNoteConfirm = () => {
    if (deleteNoteItem) {
      dentalStorage.deleteNote(activePatientRecord.id, deleteNoteItem.id);
      refreshPatientsList();
      setDeleteNoteItem(null);
      setSuccessToast(isRtl ? "تم حذف الملاحظة بنجاح" : "Clinical note deleted.");
    }
  };

  // --- Images File Upload & CRUD ---
  const handleOpenImageForm = () => {
    setFormError('');
    setImageForm({});
    setFormDataImage({
      date: new Date().toISOString().split('T')[0],
      title: '',
      type: 'xray',
      dataUrl: ''
    });
  };

  // Safe client-side image file loader converts uploaded files into base64 instantly!
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileObj(file);

    const hasLocalStorePath = Boolean(photosPath);
    if (!hasLocalStorePath && file.size > 1.5 * 1024 * 1024) { // limit 1.5MB for local storage sanity ONLY IF no custom local disk path is configured
      setFormError(isRtl 
        ? "حجم الصورة كبير جداً. يرجى اختيار ملف أصغر من 1.5 ميغابايت أو ربط المجلد المحلي بجهازك من الإعدادات." 
        : "File size exceeds 1.5MB. Please upload a smaller scan or set up your Local PC Storage Path in system settings."
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormDataImage(prev => ({
        ...prev,
        dataUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formDataImage.title.trim() || !formDataImage.dataUrl) {
      setFormError(isRtl ? "يرجى تحديد عنوان المسح وصورة المرفق." : "Please define scan title and select file.");
      return;
    }

    try {
      let finalDataUrl = formDataImage.dataUrl;

      // Automatically register the file within the computer drive if direct explorer handle is authorized!
      if (folderHandle && dirAuthorized && selectedFileObj) {
        const sanitizeName = (val: string) => val.replace(/[\\/:*?"<>|]/g, '').trim();
        const pFolderSlug = `${activePatientRecord.patientId} - ${sanitizeName(activePatientRecord.fullName)}`;

        // Get/create patient top-folder
        const pDir = await (folderHandle as any).getDirectoryHandle(pFolderSlug, { create: true });

        // Save real file on actual raw computer
        const targetFileName = selectedFileObj.name;
        const fileHandle = await pDir.getFileHandle(targetFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(selectedFileObj);
        await writable.close();

        // Pass direct virtual path reference, fully bypassing 5MB/1.5GB local state constraints!
        finalDataUrl = `local://${targetFileName}`;
      }

      dentalStorage.addImage(activePatientRecord.id, {
        ...formDataImage,
        dataUrl: finalDataUrl
      });

      setSelectedFileObj(null);
      refreshPatientsList();
      setImageForm(null);
      setSuccessToast(isRtl ? "تم حفظ المرفق الطبي بنجاح" : "Medical attachment uploaded successfully.");
    } catch (err: any) {
      setFormError(err.message || "Failed to upload image.");
    }
  };

  const handleDeleteImageConfirm = () => {
    if (deleteImageItem) {
      dentalStorage.deleteImage(activePatientRecord.id, deleteImageItem.id);
      refreshPatientsList();
      setDeleteImageItem(null);
      setSuccessToast(isRtl ? "تمت إزالة المرفق الطبي بنجاح" : "Medical scan file deleted.");
    }
  };

  const handlePrintImages = async () => {
    if (selectedImageIds.length === 0 || !activePatientRecord) return;

    // Filter activePatientRecord images by selected IDs
    const selectedImages = activePatientRecord.images.filter(img => selectedImageIds.includes(img.id));
    if (selectedImages.length === 0) return;

    setSuccessToast(isRtl ? "جاري تحضير الملفات للطباعة..." : "Preparing secure files for printing...");

    // Resolve as many image URLs as possible
    const resolvedImagesList = await Promise.all(selectedImages.map(async (img) => {
      let url = img.dataUrl;
      const isLocal = url.startsWith('local://');
      
      if (isLocal) {
        if (!folderHandle || !dirAuthorized) {
          return { ...img, url: '' }; // Cannot resolve without authorized folder
        }
        try {
          const pathPart = url.replace('local://', '');
          const slashIndex = pathPart.indexOf('/');
          let subfolder = '';
          let filename = '';
          if (slashIndex === -1) {
            filename = pathPart;
          } else {
            subfolder = pathPart.substring(0, slashIndex);
            filename = pathPart.substring(slashIndex + 1);
          }
          
          const sanitizeName = (val: string) => val.replace(/[\\/:*?"<>|]/g, '').trim();
          const pFolderSlug = `${activePatientRecord.patientId} - ${sanitizeName(activePatientRecord.fullName)}`;
          const pDir = await folderHandle.getDirectoryHandle(pFolderSlug, { create: false });
          
          let fileHandle;
          if (subfolder) {
            try {
              const subfolderDir = await pDir.getDirectoryHandle(subfolder, { create: false });
              fileHandle = await subfolderDir.getFileHandle(filename, { create: false });
            } catch (subErr) {
              fileHandle = await pDir.getFileHandle(filename, { create: false });
            }
          } else {
            fileHandle = await pDir.getFileHandle(filename, { create: false });
          }
          
          const fileObj = await fileHandle.getFile();
          const blobUrl = URL.createObjectURL(fileObj);
          return { ...img, url: blobUrl };
        } catch (err) {
          console.error("Print resolution failed for local image path:", url, err);
          return { ...img, url: '' };
        }
      }
      
      return { ...img, url };
    }));

    // Determine layout direction
    const docDir = isRtl ? 'rtl' : 'ltr';

    // Labels based on language
    let titleLabel = "CLINICAL IMAGING & REPORT DOSSIER";
    let dateLabel = "Report Generated";
    let idLabel = "Patient ID";
    let nameLabel = "Patient Full Name";
    let genderLabel = "Gender";
    let ageLabel = "Age / Date of Birth";
    let stampLabel = "Authorized Signature / Clinical Stamp";
    let footerLabel = "This document is an official digital image record generated by My Secretary Clinical Records System.";
    let totalImagesLabel = "Selected Scans printed";

    if (isRtl) {
      if (language === 'ku') {
        titleLabel = "دۆسیەی وێنە و پشکنینە پزیشکییەکان";
        dateLabel = "ڕێکەوتی دروستکردنی ڕاپۆرت";
        idLabel = "کۆدی نەخۆش";
        nameLabel = "ناوی تەواوی نەخۆش";
        genderLabel = "ڕەگەز";
        ageLabel = "تەمەن / ساڵی لەدایکبوون";
        stampLabel = "واژۆ و مۆری نۆرینگە";
        footerLabel = "ئەم بەڵگەنامەیە تۆمارێکی فەرمی وێنەی پزیشکی دیجیتاڵییە کە لەلایەن سیستەمی سکرتێرەکەمەوە دروستکراوە.";
        totalImagesLabel = "وێنە تیشکییە ده‌ستنیشانکراوه‌کانی چاپکراو";
      } else {
        titleLabel = "ملف وثائق صور الأشعة والتقارير الطبية للمريض";
        dateLabel = "تاريخ إنشاء التقرير";
        idLabel = "رقم ملف المريض";
        nameLabel = "الاسم الكامل للمريض";
        genderLabel = "الجنس";
        ageLabel = "العمر / تاريخ الولادة";
        stampLabel = "توقيع الطبيب الأخصائي / الختم الطبي المعين";
        footerLabel = "هذه الوثيقة عبارة عن سجل رقمي رسمي مخصص لصور الأشعة والمرفقات الطبية، تم إنشاؤه تلقائياً بواسطة نظام سكرتيري السريري.";
        totalImagesLabel = "الملفات والصور المحددة التي تم طباعتها";
      }
    }

    const genderVal = activePatientRecord.gender === 'male' ? t.genderMale : activePatientRecord.gender === 'female' ? t.genderFemale : t.genderOther;

    // Create printer iframe helper
    const iframeId = 'print-images-iframe';
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
        <title>${titleLabel} - ${activePatientRecord.fullName}</title>
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
            font-size: 11px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
          }
          .report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
            margin-bottom: 12px;
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
            width: 32px;
            height: 32px;
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
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            line-height: 1.1;
          }
          .clinic-subtitle {
            font-size: 8.5px;
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
            padding: 2.5px 7px;
            border-radius: 5px;
            text-transform: uppercase;
            font-size: 8.5px;
            font-weight: 800;
            letter-spacing: 0.5px;
            display: inline-block;
            align-self: ${isRtl ? 'flex-start' : 'flex-end'};
          }
          .meta-date {
            font-size: 9.5px;
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
            padding: 8px 10px;
            margin-bottom: 12px;
          }
          .info-block {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          .info-label {
            font-size: 8px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .info-value {
            font-size: 10.5px;
            color: #0f172a;
            font-weight: 700;
          }
          .print-info-badge {
            font-size: 8.5px;
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 2.5px 7.5px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 12px;
          }
          
          /* Visual Images layout designed to fit nicely on A4 sheets */
          .images-container {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .print-image-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            background-color: #ffffff;
            box-shadow: 0 1px 2px rgba(0,0,0,0.01);
            page-break-inside: avoid;
          }
          .image-card-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
            display: flex;
            justify-content: space-between;
          }
          .image-card-meta {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            gap: 12px;
          }
          .image-render-wrapper {
            background-color: #0b0f17;
            border-radius: 6px;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            height: 270px;
            box-shadow: inset 0 0 8px rgba(0,0,0,0.25);
          }
          .image-render-wrapper img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .no-image-placeholder {
            color: #ef4444;
            font-weight: bold;
            font-size: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            text-align: center;
          }

          .footer-section {
            margin-top: 25px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            page-break-inside: avoid;
          }
          .footer-text {
            font-size: 8px;
            color: #94a3b8;
            max-width: 65%;
            line-height: 1.35;
          }
          .signature-box {
            text-align: center;
            width: 160px;
          }
          .signature-line {
            border-bottom: 1.2px solid #cbd5e1;
            height: 20px;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 8.5px;
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
            <span class="report-title-badge">${isRtl ? 'تقرير الأشعة والملفات الطبية' : 'Imaging Report'}</span>
            <div class="meta-date">${dateLabel}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-block">
            <span class="info-label">${nameLabel}</span>
            <span class="info-value">${activePatientRecord.fullName}</span>
          </div>
          <div class="info-block">
            <span class="info-label">${idLabel}</span>
            <span class="info-value">${activePatientRecord.patientId}</span>
          </div>
          <div class="info-block">
            <span class="info-label">${genderLabel}</span>
            <span class="info-value">${genderVal}</span>
          </div>
          <div class="info-block">
            <span class="info-label">${ageLabel}</span>
            <span class="info-value">
              ${activePatientRecord.dateOfBirth ? `${activePatientRecord.dateOfBirth}` : ''}
              ${activePatientRecord.birthYear ? `${activePatientRecord.birthYear}` : ''}
            </span>
          </div>
        </div>

        <div class="print-info-badge">
          📸 ${totalImagesLabel}: ${resolvedImagesList.length}
        </div>

        <div class="images-container">
          ${resolvedImagesList.map((img) => {
            const hasUrl = !!img.url;
            let displayElement = '';
            
            if (hasUrl) {
              displayElement = `<img src="${img.url}" alt="${img.title}" />`;
            } else {
              displayElement = `
                <div class="no-image-placeholder">
                  <span>⚠️ Unresolved Local Attachment</span>
                  <span style="font-size:8.5px; font-weight:normal; color:#64748b">${img.title} (${img.dataUrl})</span>
                </div>
              `;
            }

            return `
              <div class="print-image-card">
                <div class="image-card-title">
                  <span>📷 ${img.title}</span>
                  <span style="font-family: monospace; font-size:9.5px">${getScanTypeName(img.type)}</span>
                </div>
                <div class="image-card-meta">
                  <span>📅 ${img.date}</span>
                  <span>📁 Type: ${getScanTypeName(img.type).toUpperCase()}</span>
                </div>
                <div class="image-render-wrapper">
                  ${displayElement}
                </div>
              </div>
            `;
          }).join('')}
        </div>

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
            }, 600);
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

  const getScanTypeName = (type: 'xray' | 'mri' | 'ct' | 'lab' | 'other') => {
    switch (type) {
      case 'xray': return t.xray;
      case 'mri': return t.mri;
      case 'ct': return t.ct;
      case 'lab': return t.lab;
      case 'other': return t.other;
    }
  };

  return (
    <div id="profile_container" className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-10 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            id="profile_btn_back"
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 font-bold transition-all cursor-pointer"
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span>{t.backToDashboard}</span>
          </button>

          <h1 id="profile_page_title" className="text-base font-bold text-slate-900 dark:text-white">
            {t.patientProfile}
          </h1>

          <div className="w-16"></div> {/* Spacer balance */}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Demographic summary Sidebar */}
          <section id="profile_sidebar" className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs transition-colors self-start space-y-5">
            <div className="flex flex-col items-center pb-5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                <User className="h-8 w-8" />
              </div>
              <h2 id="patient_info_name" className="text-lg font-bold text-slate-950 dark:text-white text-center leading-tight">
                {activePatientRecord.fullName}
              </h2>
              <div className="flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded font-mono font-bold text-xs text-slate-600 dark:text-slate-400">
                <Tag className="h-3 w-3" />
                <span>{activePatientRecord.patientId}</span>
              </div>
            </div>

            <div className={`space-y-4 text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="space-y-0.5 p-3 bg-teal-500/5 dark:bg-slate-800/80 border border-teal-500/10 dark:border-slate-850 rounded-xl">
                <span className="text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider block text-[10px] mb-0.5">
                  {isRtl ? "بيانات الرسوم والدفع" : "Billing & Payments"}
                </span>
                <p className="text-sm font-extrabold text-teal-700 dark:text-teal-300 font-mono">
                  {(() => {
                    if (activePatientRecord.paymentType === 'free') {
                      return <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{isRtl ? "زيارة مجانية" : "Free Visit"}</span>;
                    }
                    const totalCons = activePatientRecord.history.reduce((sum, r) => sum + (r.billingAmount || 0), 0);
                    const initPayment = activePatientRecord.paymentType === 'paid' ? (activePatientRecord.paymentAmount || 0) : 0;
                    return formatIQDAmount(initPayment + totalCons) + " " + (isRtl ? "د.ع" : "IQD");
                  })()}
                </p>
                {activePatientRecord.paymentType === 'paid' && activePatientRecord.paymentAmount !== undefined && (
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    {isRtl ? `(رسوم تسجيل أولية: ${formatIQDAmount(activePatientRecord.paymentAmount)} د.ع)` : `(Initial Reg. Fee: ${formatIQDAmount(activePatientRecord.paymentAmount)} IQD)`}
                  </p>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t.gender}</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                  {activePatientRecord.gender === 'male' ? t.genderMale : activePatientRecord.gender === 'female' ? t.genderFemale : t.genderOther}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t.dateOfBirth}</span>
                <p className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>{activePatientRecord.dateOfBirth}</span>
                  {activePatientRecord.dateOfBirth && (
                    <span className="text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-md border border-teal-100/60 dark:border-teal-900/40 font-bold animate-fade-in">
                      {calculateAgeFromDobDetailed(activePatientRecord.dateOfBirth, language, t)}
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t.phoneNumber}</span>
                <p className="text-sm font-bold text-teal-600 dark:text-teal-400 dir-ltr">
                  {activePatientRecord.phoneNumber || '-'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t.address}</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {activePatientRecord.address || '-'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 block text-[11px] text-slate-400">
                {t.lastVisit}: <span className="font-bold text-slate-700 dark:text-slate-300">{activePatientRecord.lastVisitDate}</span>
              </div>
            </div>
          </section>

          {/* Clinical Records module tab switchboard */}
          {userRole === 'secretary' ? (
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 self-start">
              <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {isRtl ? "ملف الاستشارة محمي" : "Sealed Consultation Records"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                  {isRtl 
                    ? "الاستشارات الطبية والتقارير الطبية الخاصة بملف المريض مشفرة ومخصصة لمكتب الطبيب الأخصائي فقط." 
                    : "Consultation history sheets, clinical dental notes, and high-res imaging files require doctor-level credential access."}
                </p>
              </div>
            </div>
          ) : (
            <section id="profile_main_clinical_area" className="lg:col-span-3 space-y-6">
            
            {/* Custom Interactive Tabs selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs p-1.5 flex gap-1.5 transition-colors">
              <button
                id="tab_history"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Clipboard className="h-4 w-4" />
                <span>{t.dentalHistory}</span>
              </button>

              <button
                id="tab_notes"
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>{t.clinicalNotes}</span>
              </button>

              <button
                id="tab_images"
                onClick={() => setActiveTab('images')}
                className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'images'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>{t.dentalImages}</span>
              </button>
            </div>

            {/* TAB CONTAINER AREA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 min-h-[450px] shadow-xs transition-colors">
              
              {/* --- 1. CONSULTATION HISTORY TAB --- */}
              {activeTab === 'history' && (
                <div id="panel_history" className="space-y-6">
                  <div className={`flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 ${
                    isRtl ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {t.dentalHistory}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn_referred_operations"
                        onClick={() => {
                          sessionStorage.setItem('my_secretary_active_referral_patient_id', activePatientRecord.id);
                          navigateTo('operations-page');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        <span>{isRtl ? "احاله الى العمليات" : "Referred to operations"}</span>
                      </button>

                      <button
                        id="btn_add_history"
                        onClick={() => handleOpenHistoryForm()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t.addHistoryEntry}</span>
                      </button>
                    </div>
                  </div>

                  {activePatientRecord.history.length > 0 && (
                    <div id="latest_consult_banner" className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-600/5 dark:from-slate-850 dark:to-slate-800 border border-teal-200/55 dark:border-slate-750 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-all duration-200">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-teal-800 dark:text-teal-400 uppercase tracking-widest">
                          {isRtl ? "ملخص الاستشارة الأخيرة" : "LATEST CONSULTATION DETAILED VIEW"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {isRtl 
                            ? `آخر زيارة مسجلة في: ${[...activePatientRecord.history].sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0].visitDate}` 
                            : `Most recent documented clinical visit on: ${[...activePatientRecord.history].sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0].visitDate}`}
                        </p>
                      </div>
                      <button
                        id="btn_view_full_consultation"
                        onClick={() => navigateTo('consultation-history', activePatientRecord.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-750 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-md shrink-0 border border-transparent hover:border-teal-500"
                      >
                        <FolderOpen className="h-4 w-4 animate-pulse" />
                        <span>{isRtl ? "عرض الصفحة الكاملة والصور" : "Show Full Page Summary & Photos"}</span>
                      </button>
                    </div>
                  )}

                  {activePatientRecord.history.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                      <Clipboard className="h-10 w-10 mx-auto opacity-35 mb-3" />
                      <p className="text-xs font-bold">
                        {isRtl ? "التاريخ الاستشاري فارغ تماماً حالياً" : "No clinical consult visits documented yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {activePatientRecord.history.map((entry) => (
                        <div
                          id={`history_item_${entry.id}`}
                          key={entry.id}
                          onClick={() => {
                            setSelectedConsultationId(entry.id);
                            navigateTo('consultation-history', activePatientRecord.id);
                          }}
                          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg border-l-4 border-l-teal-500 shadow-xs hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-950/20 hover:border-teal-300 dark:hover:border-teal-700 transition-all relative overflow-hidden cursor-pointer group/history"
                        >
                          {/* Entry date banner */}
                          <div className={`flex justify-between items-center mb-2.5 ${
                            isRtl ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="font-mono">{entry.visitDate}</span>
                              </div>
                              {entry.billingAmount !== undefined && (
                                <span className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono font-bold">
                                  {formatIQDAmount(entry.billingAmount)} {isRtl ? "د.ع" : "IQD"}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2 z-5">
                              <button
                                id={`history_btn_edit_${entry.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenHistoryForm(entry);
                                }}
                                title={t.edit}
                                className="flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer shadow-xs"
                              >
                                <Edit className="h-3 w-3 stroke-[2.5px]" />
                                <span>{isRtl ? "تعديل" : "Edit"}</span>
                              </button>
                              <button
                                id={`history_btn_delete_${entry.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteHistoryItem(entry);
                                }}
                                title={t.delete}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className={`space-y-2.5 text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                            {/* Diagnosis */}
                            <div>
                              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-extrabold uppercase tracking-wider block mb-0.5">{t.diagnosis}</span>
                              <p className="text-sm font-bold text-slate-950 dark:text-white leading-tight">{entry.diagnosis}</p>
                            </div>
                            
                            {/* Symptoms */}
                            {entry.symptoms && (
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block mb-0.5">{t.symptoms}</span>
                                <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">{entry.symptoms}</p>
                              </div>
                            )}

                            {/* Treatment */}
                            {entry.treatment && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200/60 dark:border-slate-800">
                                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider block mb-0.5">{t.treatment}</span>
                                <p className="text-slate-800 dark:text-slate-250 font-mono text-[11px] leading-relaxed">{entry.treatment}</p>
                              </div>
                            )}

                            {/* Observations */}
                            {entry.notes && (
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block mb-0.5">{t.notes}</span>
                                <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">{entry.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- 2. CLINICAL NOTES TAB --- */}
              {activeTab === 'notes' && (
                <div id="panel_notes" className="space-y-6">
                  <div className={`flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 ${
                    isRtl ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {t.clinicalNotes}
                    </h3>
                    <button
                      id="btn_add_note"
                      onClick={() => handleOpenNoteForm()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t.addNote}</span>
                    </button>
                  </div>

                  {activePatientRecord.notes.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                      <FileText className="h-10 w-10 mx-auto opacity-35 mb-3" />
                      <p className="text-xs font-bold">
                        {isRtl ? "سجل الملاحظات فارغ حالياً" : "No clinical observations written yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activePatientRecord.notes.map((note) => (
                        <div
                          id={`note_item_${note.id}`}
                          key={note.id}
                          className="p-3.5 bg-amber-50/70 dark:bg-slate-900 border border-amber-200/60 dark:border-slate-800 rounded-lg hover:border-amber-400 dark:hover:border-teal-700 transition-all text-sm relative"
                        >
                          <div className={`flex justify-between items-center mb-2.5 ${
                            isRtl ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-slate-850 rounded font-bold font-mono text-[9px] text-amber-800 dark:text-teal-400">
                              {note.date}
                            </span>

                            <div className="flex gap-2">
                              <button
                                id={`note_btn_edit_${note.id}`}
                                onClick={() => handleOpenNoteForm(note)}
                                className="flex items-center gap-1 py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs"
                              >
                                <Edit className="h-3 w-3 stroke-[2.5px]" />
                                <span>{isRtl ? "تعديل" : "Edit"}</span>
                              </button>
                              <button
                                id={`note_btn_delete_${note.id}`}
                                onClick={() => setDeleteNoteItem(note)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className={isRtl ? 'text-right' : 'text-left'}>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                              {note.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-wrap font-semibold">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- 3. IMAGES & SCANS TAB --- */}
              {activeTab === 'images' && (
                <div id="panel_images" className="space-y-6">
                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3 ${
                    isRtl ? 'sm:flex-row-reverse' : ''
                  }`}>
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {t.dentalImages}
                      </h3>
                      {selectedImageIds.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-full animate-pulse">
                          {selectedImageIds.length} {isRtl ? "محددة" : "selected"}
                        </span>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end ${isRtl ? 'flex-row-reverse' : ''}`}>
                      {selectedImageIds.length > 0 && (
                        <>
                          <button
                            id="btn_print_selected_images"
                            onClick={handlePrintImages}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-lg border border-teal-100 dark:border-teal-900/50 transition-all cursor-pointer shadow-xs"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>{isRtl ? "طباعة المحددة" : "Print Selected"}</span>
                          </button>
                          
                          <button
                            id="btn_clear_image_selection"
                            onClick={() => setSelectedImageIds([])}
                            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline font-bold px-1 cursor-pointer"
                          >
                            {isRtl ? "إلغاء التحديد" : "Deselect All"}
                          </button>
                        </>
                      )}
                      
                      <button
                        id="btn_add_image"
                        onClick={handleOpenImageForm}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{t.uploadNewImage}</span>
                      </button>
                    </div>
                  </div>

                  {activePatientRecord.images.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                      <ImageIcon className="h-10 w-10 mx-auto opacity-35 mb-3" />
                      <p className="text-xs font-bold">{t.noImagesYet}</p>
                    </div>
                  ) : (
                    <div id="scans_grid" className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {activePatientRecord.images.map((img) => {
                        const slug = `${activePatientRecord.patientId} - ${activePatientRecord.fullName.replace(/[\\/:*?"<>|]/g, '').trim()}`;
                        const pathPart = img.dataUrl.startsWith('local://') ? img.dataUrl.replace('local://', '') : '';
                        const slashIdx = pathPart.indexOf('/');
                        
                        let filePCPath = '';
                        let folderPCPath = '';
                        if (slashIdx === -1) {
                          const fn = pathPart || 'attachment.jpg';
                          filePCPath = `${photosPath}\\${slug}\\${fn}`;
                          folderPCPath = `${photosPath}\\${slug}`;
                        } else {
                          const subDir = pathPart.substring(0, slashIdx);
                          const fn = pathPart.substring(slashIdx + 1);
                          filePCPath = `${photosPath}\\${slug}\\${subDir}\\${fn}`;
                          folderPCPath = `${photosPath}\\${slug}\\${subDir}`;
                        }

                        return (
                          <div
                            id={`image_card_${img.id}`}
                            key={img.id}
                            className={`border ${
                              selectedImageIds.includes(img.id)
                                ? 'border-teal-500 ring-2 ring-teal-500/15'
                                : 'border-slate-100 dark:border-slate-800/80'
                            } rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between bg-slate-50 dark:bg-slate-950`}
                          >
                            {/* Diagnostic SVG / Image view */}
                            <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800/80 group">
                              
                              {/* Selection checkbox overlay */}
                              <div className={`absolute top-2.5 ${isRtl ? 'right-2.5' : 'left-2.5'} z-[5] bg-white/95 dark:bg-slate-900/95 p-1 rounded-lg shadow-sm flex items-center justify-center border border-slate-200/50 dark:border-slate-800/55 transition-all`}>
                                <input
                                  type="checkbox"
                                  id={`chk_select_${img.id}`}
                                  checked={selectedImageIds.includes(img.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const isChecked = e.target.checked;
                                    if (isChecked) {
                                      setSelectedImageIds(prev => [...prev, img.id]);
                                    } else {
                                      setSelectedImageIds(prev => prev.filter(id => id !== img.id));
                                    }
                                  }}
                                  className="h-4 w-4 rounded text-teal-650 dark:text-teal-500 border-slate-350 dark:border-slate-705 focus:ring-teal-500 cursor-pointer"
                                />
                              </div>

                              <PatientImageRenderer
                                dataUrl={img.dataUrl}
                                alt={img.title}
                                className="max-h-full max-w-full object-contain select-none shadow-inner"
                                folderHandle={folderHandle}
                                dirAuthorized={dirAuthorized}
                                onGrantPermission={handleGrantImagePermission}
                                patientId={activePatientRecord.patientId}
                                fullName={activePatientRecord.fullName}
                                isRtl={isRtl}
                              />
                              
                              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-3 flex justify-between items-end opacity-100 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                                  {getScanTypeName(img.type)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-350">
                                  {img.date}
                                </span>
                              </div>

                              {/* Fullscreen inspector overlay */}
                              <div className="absolute inset-0 bg-transparent opacity-0 group-hover:bg-slate-950/25 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                <button
                                  id={`image_view_${img.id}`}
                                  onClick={() => setFullscreenImage(img)}
                                  title={t.viewFullScreen}
                                  className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-lg transition-all cursor-pointer transform scale-90 group-hover:scale-100"
                                >
                                  <Eye className="h-4.5 w-4.5" />
                                </button>
                                
                                <button
                                  id={`image_open_overlay_${img.id}`}
                                  onClick={() => handleOpenLocalFile(img)}
                                  title={isRtl ? "فتح الملف" : "Open File"}
                                  className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg transition-all cursor-pointer transform scale-90 group-hover:scale-100"
                                >
                                  <FolderOpen className="h-4.5 w-4.5" />
                                </button>
                                
                                <button
                                  id={`image_del_${img.id}`}
                                  onClick={() => setDeleteImageItem(img)}
                                  title={t.delete}
                                  className="p-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-full shadow-lg transition-all cursor-pointer transform scale-90 group-hover:scale-100"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </div>

                            <div className={`p-4 flex-1 flex flex-col justify-between ${isRtl ? 'text-right' : 'text-left'}`}>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 mb-1">
                                  {img.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-semibold font-mono">
                                  {getScanTypeName(img.type)} ({img.dataUrl.startsWith('local://') ? (isRtl ? "تخزين محلي مباشر بالكمبيوتر" : "LOCAL PC DISK FILE") : "SYNC PERSISTED STORAGE"})
                                </p>
                              </div>

                              {photosPath && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                                  <div className="bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-lg space-y-1.5 border border-slate-200/10">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                        <HardDrive className="h-3 w-3" />
                                        <span>PC Storage Location</span>
                                      </span>
                                      
                                      <div className="flex items-center gap-1">
                                        <button
                                          id={`btn_open_file_${img.id}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenLocalFile(img);
                                          }}
                                          className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-extrabold flex items-center gap-1 rounded transition-all cursor-pointer shadow-xs"
                                          title={isRtl ? "فتح مسح الأسنان بالكمبيوتر" : "Open medical scan file directly"}
                                        >
                                          <FolderOpen className="h-2.5 w-2.5" />
                                          <span>{isRtl ? "فتح" : "Open"}</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(filePCPath);
                                            setSuccessToast(isRtl ? "تم نسخ مسار الملف الكامل للكمبيوتر!" : "File PC path copied to clipboard!");
                                          }}
                                          className="px-2 py-0.5 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 text-[9px] text-slate-500 dark:text-slate-400 font-extrabold flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                                          title={isRtl ? "نسخ مسار الملف الكامل بالكمبيوتر" : "Copy full File path in Windows"}
                                        >
                                          <span>{isRtl ? "نسخ مسار الملف" : "Copy Path"}</span>
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500 break-all select-all leading-normal max-h-12 overflow-y-auto" dir="ltr">
                                      {filePCPath}
                                    </p>
                                  </div>

                                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                                    <span className="text-[8px] leading-tight text-slate-400">{isRtl ? "انسخ والصق في متصفح ملفات الكمبيوتر" : "Copy path & paste in Explorer"}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(folderPCPath);
                                        setSuccessToast(isRtl ? "تم نسخ مسار مجلد المريض للمشاركة والوصول!" : "Patient folder path copied to clipboard!");
                                      }}
                                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                                    >
                                      <Folder className="h-3 w-3" />
                                      <span>{isRtl ? "مسار المجلد" : "Copy Folder"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
          )}
        </div>
      </main>

      {/* SUCCESS TOAST MESSAGE */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            id="toast_alert_success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-xs z-50 bg-teal-600 text-white py-3.5 px-5 rounded-xl shadow-2xl flex items-center gap-3 border border-teal-500"
          >
            <CheckCircle className="h-5 w-5 text-teal-100 shrink-0 animate-bounce" />
            <span className="text-xs font-bold">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: HISTORY CONSULTATION --- */}
      <AnimatePresence>
        {historyForm !== null && (
          <div id="history_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full border border-slate-100 dark:border-slate-800 p-6 md:p-8 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/20 shrink-0">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                      {historyForm.id ? t.editHistoryEntry : t.addHistoryEntry}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {isRtl ? "سجل التشخيص الطبي، الأعراض والوصفة الطبية" : "Patient clinical diagnostics, symptom logs, and prescription details"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setHistoryForm(null)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-955/40 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveHistory} className="space-y-5">
                
                {/* 2-Column Grid Layout for premium horizontal layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* LEFT SIDE COLUMN / PRIMARY CLINICAL DATA */}
                  <div className="space-y-4">
                    
                    {/* Visit Date Field */}
                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-bold text-slate-550 dark:text-slate-350 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        <span className="text-teal-600 dark:text-teal-400">📅</span>
                        <span>{t.visitDate} *</span>
                      </label>
                      <input
                        id="history_input_date"
                        type="date"
                        value={formDataHistory.visitDate}
                        onChange={(e) => setFormDataHistory(prev => ({ ...prev, visitDate: e.target.value }))}
                        className={`w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-xs font-semibold transition-all ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                        required
                      />
                    </div>

                    {/* Diagnosis Field */}
                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-bold text-slate-550 dark:text-slate-350 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        <span className="text-teal-600 dark:text-teal-400">🔬</span>
                        <span>{t.diagnosis} *</span>
                      </label>
                      <input
                        id="history_input_diagnosis"
                        type="text"
                        value={formDataHistory.diagnosis}
                        onChange={(e) => setFormDataHistory(prev => ({ ...prev, diagnosis: e.target.value }))}
                        placeholder={isRtl ? "مثال: تسوس حاد، التهاب الغشاء المخاطي" : "e.g. Pulpitis, Tooth Decay"}
                        className={`w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-xs font-semibold transition-all ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                        required
                      />
                    </div>

                    {/* Billing Amount */}
                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-bold text-slate-550 dark:text-slate-350 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        <span className="text-teal-600 dark:text-teal-400">💰</span>
                        <span>{t.billingAmount} ({t.iqdinar})</span>
                      </label>
                      <div className="relative">
                        <input
                          id="history_input_billing"
                          type="text"
                          placeholder={isRtl ? "مثال: ٣٥ أو 35.000" : "e.g. 35 or 35.000"}
                          value={formDataHistory.billingAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9.,]*$/.test(val)) {
                              setFormDataHistory(prev => ({ ...prev, billingAmount: val }));
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseIQDAmount(formDataHistory.billingAmount);
                            if (parsed > 0) {
                              setFormDataHistory(prev => ({ ...prev, billingAmount: formatIQDAmount(parsed) }));
                            }
                          }}
                          className={`w-full py-2.5 px-3.5 ${isRtl ? 'pl-28' : 'pr-28'} rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-xs font-mono font-bold ${
                            isRtl ? 'text-right' : 'text-left'
                          }`}
                        />
                        {formDataHistory.billingAmount && (
                          <div className={`absolute inset-y-0.5 flex items-center text-[10px] text-teal-700 dark:text-teal-300 font-extrabold bg-teal-50 dark:bg-slate-800 px-3 border border-teal-100 dark:border-slate-800 ${isRtl ? 'left-0.5 rounded-l-xl border-r' : 'right-0.5 rounded-r-xl border-l'}`}>
                            {formatIQDAmount(parseIQDAmount(formDataHistory.billingAmount))} {isRtl ? "د.ع" : "IQD"}
                          </div>
                        )}
                      </div>
                      <p className={`text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl 
                          ? "اكتب رقم الحساب، مثل 35 ليتم تحويله تلقائياً لـ 35.000 دينار." 
                          : "Type 35 for 35.000. You can edit the thousands and zeros as you wish."}
                      </p>
                    </div>

                  </div>

                  {/* RIGHT SIDE COLUMN / CLINICAL OBSERVATIONS */}
                  <div className="space-y-4">
                    
                    {/* Symptoms Field */}
                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-bold text-slate-555 dark:text-slate-350 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        <span className="text-teal-600 dark:text-teal-400">🤒</span>
                        <span>{t.symptoms}</span>
                      </label>
                      <textarea
                        id="history_input_symptoms"
                        value={formDataHistory.symptoms}
                        onChange={(e) => setFormDataHistory(prev => ({ ...prev, symptoms: e.target.value }))}
                        placeholder={isRtl ? "ألم فظيع نابض ومستمر مع حساسية للساخن والبارد..." : "Sharp, throbbing pain with sensitivity to hot and cold liquids..."}
                        rows={3}
                        className={`w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-xs font-medium resize-none leading-relaxed ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      />
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-bold text-slate-555 dark:text-slate-350 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        <span className="text-teal-600 dark:text-teal-400">📝</span>
                        <span>{t.notes}</span>
                      </label>
                      <textarea
                        id="history_input_notes"
                        value={formDataHistory.notes}
                        onChange={(e) => setFormDataHistory(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={isRtl ? "ملاحظات إضافية، موعد المراجعة القادمة، حالة اللثة..." : "Additional feedback, periodontics review, next checkup schedules..."}
                        rows={3}
                        className={`w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-xs font-medium resize-none leading-relaxed ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      />
                    </div>

                  </div>

                </div>

                {/* BOTTOM SPAN / SMART SEARCH TREATMENT & PRESCRIPTIONS (TREATMENT PORTAL) */}
                <div className="space-y-1.5 relative pt-1">
                  <label className={`flex items-center gap-1.5 text-xs font-bold text-slate-555 dark:text-slate-350 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                    <span className="text-teal-600 dark:text-teal-400">💊</span>
                    <span>{t.treatment}</span>
                  </label>
                  <p className={`text-[10px] text-slate-400 dark:text-slate-500 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {isRtl 
                      ? "اكتب اسم الدواء وسنقوم باقتراحه فوراً من سجل صيادلتك الخاص المسجل."
                      : "Type brand/molecular name to instantly source formulas and guidelines from your catalog."}
                  </p>
                  <div className="relative">
                    <textarea
                      id="history_input_treatment"
                      value={formDataHistory.treatment}
                      onChange={(e) => handleTreatmentChange(e.target.value)}
                      onBlur={() => {
                        // Delay closing slightly so clicking a suggestion is processed first
                        setTimeout(() => setShowDrugSuggestions(false), 200);
                      }}
                      onFocus={() => {
                        if (formDataHistory.treatment) {
                          handleTreatmentChange(formDataHistory.treatment);
                        }
                      }}
                      placeholder={isRtl ? "مثال: Panadol Extra, Amoxil..." : "e.g. Panadol Extra, Amoxil..."}
                      rows={3}
                      className={`w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-950 dark:text-white outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-xs font-mono leading-relaxed ${
                        isRtl ? 'text-right' : 'text-left'
                      }`}
                    />

                    {/* Smart autocomplete list */}
                    <AnimatePresence>
                      {showDrugSuggestions && suggestedDrugs.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-slate-800"
                        >
                          {suggestedDrugs.map((drug) => (
                            <button
                              key={drug.id}
                              type="button"
                              onMouseDown={(e) => {
                                // prevent blur from firing before click
                                e.preventDefault();
                              }}
                              onClick={() => handleSelectSuggestedDrug(drug)}
                              className={`w-full py-2.5 px-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-0.5 transition-colors ${
                                isRtl ? 'text-right' : 'text-left'
                              }`}
                            >
                              <div className={`flex items-center justify-between gap-2 w-full ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                  {getDrugEmoji(drug.dosageForm)} {drug.tradeName}
                                </span>
                                {drug.dosageForm && (
                                  <span className="text-[9px] px-1.5 py-0.25 bg-slate-100 dark:bg-slate-950 text-slate-500 rounded font-semibold shrink-0">
                                    {drug.dosageForm.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                              {drug.scientificName && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{drug.scientificName}</span>
                              )}
                              {drug.instructions && (
                                <span className="text-[9px] text-slate-400 italic font-medium max-w-full truncate block">
                                  {isRtl ? "الإرشاد: " : "Sig: "}{drug.instructions}
                                </span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Submits and Control buttons footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHistoryForm(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 font-bold transition-all cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    id="history_btn_save"
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: CLINICAL NOTE --- */}
      <AnimatePresence>
        {noteForm !== null && (
          <div id="note_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 p-6"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {noteForm.id ? t.editNote : t.addNote}
                </h3>
                <button onClick={() => setNoteForm(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-600 text-xs border border-rose-100">{formError}</div>
              )}

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.date} *
                  </label>
                  <input
                    id="note_input_date"
                    type="date"
                    value={formDataNote.date}
                    onChange={(e) => setFormDataNote(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.title} *
                  </label>
                  <input
                    id="note_input_title"
                    type="text"
                    value={formDataNote.title}
                    onChange={(e) => setFormDataNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isRtl ? "مستجدات استشارة المريض" : "Compliance / Consultation note title"}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.content} *
                  </label>
                  <textarea
                    id="note_input_content"
                    value={formDataNote.content}
                    onChange={(e) => setFormDataNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={isRtl ? "اكتب محتوى مفصل للملاحظة الطبية هنا..." : "Type clinical observations here..."}
                    rows={4}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNoteForm(null)}
                    className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    id="note_btn_save"
                    type="submit"
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-md shadow-teal-500/10 cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: NEW IMAGE ATTACHMENT --- */}
      <AnimatePresence>
        {imageForm !== null && (
          <div id="image_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 p-6"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {t.uploadNewImage}
                </h3>
                <button onClick={() => setImageForm(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-600 text-xs border border-rose-100 whitespace-pre-wrap">{formError}</div>
              )}

              <form onSubmit={handleSaveImage} className="space-y-4">
                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.visitDate} *
                  </label>
                  <input
                    type="date"
                    value={formDataImage.date}
                    onChange={(e) => setFormDataImage(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.imageType} *
                  </label>
                  <select
                    id="image_input_type"
                    value={formDataImage.type}
                    onChange={(e) => setFormDataImage(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm cursor-pointer"
                  >
                    <option value="xray">{t.xray}</option>
                    <option value="mri">{t.mri}</option>
                    <option value="ct">{t.ct}</option>
                    <option value="lab">{t.lab}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.imageTitle} *
                  </label>
                  <input
                    id="image_input_title"
                    type="text"
                    value={formDataImage.title}
                    onChange={(e) => setFormDataImage(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isRtl ? "تقرير فحص الكلى مخبرياً" : "e.g. Brain axial slice 5"}
                    className={`w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.selectImageFile} *
                  </label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-950 transition-all hover:bg-slate-100/50 relative">
                    <input
                      id="image_file_loader"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      {isRtl ? "اسحب وأسقط تقرير المسح هنا أو انقر للتصفح" : "Drag & drop scan image here, or click to pick"}
                    </p>
                    <p className="text-[10px] text-slate-400">{isRtl ? "يقبل صور الأشعة والتحاليل أقل من 1.5 ميغابايت" : "Supports JPEG/PNG/SVG under 1.5MB for client persistence limits."}</p>
                  </div>
                </div>

                {/* File preview thumbnail if loaded */}
                {formDataImage.dataUrl && (
                  <div className="p-2 border border-slate-100 rounded-lg bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded overflow-hidden bg-black flex items-center justify-center shrink-0">
                        <img src={formDataImage.dataUrl} alt="Thumbnail loaded" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{isRtl ? "جاهز للإرفاق والمزامنة" : "Clinical scan loaded!"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormDataImage(prev => ({ ...prev, dataUrl: '' }))}
                      className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setImageForm(null)}
                    className="flex-1 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    id="image_btn_save"
                    type="submit"
                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-md shadow-teal-500/10 cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DIALOGS: CASCADING REMOVALS --- */}
      {/* 1. History remove confirm */}
      <AnimatePresence>
        {deleteHistoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-full mb-3.5">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{isRtl ? "تأكيد حذف من السجل" : "Confirm Entry Deletion"}</h3>
                <p className="text-xs text-slate-450 mb-4">{deleteHistoryItem.visitDate} - {deleteHistoryItem.diagnosis}</p>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">{t.confirmDeleteHistory}</p>

                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteHistoryItem(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold cursor-pointer">
                    {t.cancel}
                  </button>
                  <button id="btn_delete_history_confirm" onClick={handleDeleteHistoryConfirm} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Note remove confirm */}
      <AnimatePresence>
        {deleteNoteItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-full mb-3.5">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{isRtl ? "تأكيد حذف الملاحظة" : "Confirm Note Removal"}</h3>
                <p className="text-xs text-slate-450 mb-4">{deleteNoteItem.title}</p>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">{t.confirmDeleteNote}</p>

                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteNoteItem(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold cursor-pointer">
                    {t.cancel}
                  </button>
                  <button id="btn_delete_note_confirm" onClick={handleDeleteNoteConfirm} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg font-bold cursor-pointer font-sans">
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Image remove confirm */}
      <AnimatePresence>
        {deleteImageItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-full mb-3.5">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{isRtl ? "حذف التقرير المصور" : "Confirm Scan Removal"}</h3>
                <p className="text-xs text-slate-450 mb-4">{deleteImageItem.title}</p>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">{t.confirmDeleteImage}</p>

                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteImageItem(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold cursor-pointer">
                    {t.cancel}
                  </button>
                  <button id="btn_delete_image_confirm" onClick={handleDeleteImageConfirm} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DIAGNOSTIC IMAGING FULL SCREEN LIGHTBOX --- */}
      <AnimatePresence>
        {fullscreenImage !== null && (
          <div id="image_lightbox" className="fixed inset-0 z-55 bg-black/95 flex flex-col justify-between p-4 md:p-8 select-none font-sans">
            
            {/* Header controls inside Lightbox */}
            <div className="flex justify-between items-center text-white my-2 shrink-0">
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-base text-teal-400">
                  {fullscreenImage.title}
                </h3>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400">
                  {getScanTypeName(fullscreenImage.type)} | {fullscreenImage.date}
                </p>
              </div>

              <button
                id="btn_close_lightbox"
                onClick={() => setFullscreenImage(null)}
                className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-full border border-slate-800 text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inspectable viewport with Zoom & Pan */}
            <div 
              className="flex-1 w-full flex items-center justify-center p-2 md:p-4 overflow-hidden relative"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              style={{
                cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in'
              }}
              title={isRtl ? "انقر مرتين للتكبير / التصغير" : "Double-click to Zoom/Reset"}
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

              {/* Touch/Mouse Panning help indicator */}
              {zoomScale > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white border border-slate-800 px-3 py-1.5 rounded-full text-[10px] md:text-xs flex items-center gap-1.5 shadow-xl animate-bounce pointer-events-none">
                  <Move className="h-3.5 w-3.5 text-teal-400" />
                  <span>{isRtl ? "اسحب لتحريك ملف الصورة وتعديله" : "Drag to move or pan around"}</span>
                </div>
              )}
            </div>

            {/* Float HUD Zooming System controls */}
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

              {/* Lightbox footer instructions */}
              <div className="text-center text-slate-450 text-[10px] md:text-xs">
                <p>{isRtl ? "مرر بكرة الماوس أو انقر مرتين للتكبير التلقائي • اضغط زر الخروج في الأعلى للعودة" : "Scroll wheel or double click to zoom • Press exit button above to return"}</p>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: PRINT CHOSEN TREATMENT MINIMALIST --- */}
      <AnimatePresence>
        {printPromptEntry !== null && (
          <div id="print_choice_modal" className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full border border-slate-100 dark:border-slate-800 p-6 md:p-8"
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                  {isRtl ? "هل ترغب في طباعة الوصفة فقط؟" : "Print Treatment Protocol?"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isRtl 
                    ? "يقوم هذا الخيار بطباعة الوصفة الطبية بأسلوب نصي نظيف في منتصف الورقة وبدون أي حافة أو شعار عيادة." 
                    : "This prints only the treatment text centered on the page with absolutely no borders or headers."}
                </p>
              </div>

              {/* Minimalist preview showing only centered text in the middle of a blank canvas representing the printed page */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-8 mb-6 flex items-center justify-center min-h-[220px] shadow-inner relative overflow-hidden group">
                <div className="absolute top-2 left-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none select-none">
                  {isRtl ? "معاينة الطباعة النظيفة" : "Clean Print Preview"}
                </div>
                
                {/* Centered pure numbered text, absolutely no headers, borders or decorations */}
                <div className="text-center w-full font-mono text-sm text-slate-800 dark:text-slate-200 leading-relaxed max-w-xs mx-auto whitespace-pre-line select-text">
                  {parseTreatmentIntoNumberedSteps(printPromptEntry.treatment).map((item, idx) => (
                    <div key={idx} className="mb-3 font-bold">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setPrintPromptEntry(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs text-slate-600 dark:text-slate-350 font-bold transition-all cursor-pointer"
                >
                  {isRtl ? "إغلاق / لاحقاً" : "Close / Later"}
                </button>
                <button
                  id="btn_print_minimal_prescription"
                  type="button"
                  onClick={() => handlePrintMinimalTreatment(printPromptEntry)}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>{isRtl ? "طباعة النص فقط 🖨️" : "Print Plain Text 🖨️"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
