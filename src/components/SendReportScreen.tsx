import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion } from 'motion/react';
import { ArrowLeft, Printer } from 'lucide-react';

export const SendReportScreen: React.FC = () => {
  const { navigateTo, isRtl, t } = useApp();
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('my_secretary_report_sender') || '';
  });
  const [reportText, setReportText] = useState(() => {
    return localStorage.getItem('my_secretary_report_text') || '';
  });

  useEffect(() => {
    localStorage.setItem('my_secretary_report_sender', senderName);
  }, [senderName]);

  useEffect(() => {
    localStorage.setItem('my_secretary_report_text', reportText);
  }, [reportText]);

  const handlePrintReport = () => {
    if (!reportText.trim()) return;

    const iframeId = 'print-clean-report-iframe';
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

    // Build plain, beautifully centered text blocks
    const lines: string[] = [];
    if (senderName.trim()) {
      lines.push(`${isRtl ? 'من: ' : 'From: '}${senderName.trim()}`);
    }
    lines.push(reportText.trim());

    const docStr = `
      <!DOCTYPE html>
      <html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>Report</title>
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

          .report-line {
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
          ${lines.map(line => `<div class="report-line">${line || '&nbsp;'}</div>`).join('')}
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Back Button and Title */}
        <div className={`flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            id="btn_report_back"
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className={`h-4 w-4 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            <span>{t.back}</span>
          </button>
          
          <h1 className="text-base font-extrabold text-teal-800 dark:text-teal-400">
            {isRtl ? "ارسال تقرير" : "Send Report"}
          </h1>
        </div>

        {/* Outer card holding inputs and cleaner formatting */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* Section 1: From */}
          <div className="space-y-2">
            <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? "من: اسمك" : "From: Your Name"}
            </label>
            <input
              id="report_sender_input"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder={isRtl ? "اكتب اسمك هنا..." : "Type your name..."}
              className={`w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm font-semibold transition-all ${isRtl ? 'text-right' : 'text-left'}`}
            />
          </div>

          {/* Section 2: Write your report */}
          <div className="space-y-2">
            <label className={`block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? "اكتب تقريرك" : "Type your report"}
            </label>
            <textarea
              id="report_content_input"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={12}
              placeholder={isRtl ? "اكتب تفاصيل التقرير هنا..." : "Type the report details here..."}
              className={`w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white outline-none focus:border-teal-500 text-sm font-semibold transition-all resize-none leading-relaxed min-h-[250px] ${isRtl ? 'text-right font-sans' : 'text-left'}`}
            />
          </div>

          {/* Print Green Action Button */}
          <div className={`flex pt-4 justify-end border-t border-slate-200 dark:border-slate-800 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              id="btn_print_report_submit"
              disabled={!reportText.trim()}
              onClick={handlePrintReport}
              className={`w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer ${!reportText.trim() ? 'cursor-not-allowed' : ''}`}
            >
              <Printer className="h-4 w-4" />
              <span>{isRtl ? "طباعة التقرير" : "Print the Report"}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
