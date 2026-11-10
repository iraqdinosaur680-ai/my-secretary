import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { syncClient, SyncStatus, DiscoveredHost } from '../services/syncClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Database, 
  Server, 
  Search, 
  Lock, 
  RefreshCw, 
  CheckCircle, 
  XOctagon, 
  Activity, 
  Terminal, 
  Radio, 
  Sparkles,
  Smartphone,
  ChevronLeft
} from 'lucide-react';

const localizedContent = {
  en: {
    title: "Secure Hotspot Co-Sync Engine",
    subtitle: "Real-Time zero-config clinical sync over local WiFi network",
    hostModeTitle: "Secretary: Host Server Mode",
    hostModeDesc: "Activate this device as the local clinic server. It will initialize a local SQLite state repository and broadcast an mDNS beacon onto the hotspot network.",
    clientModeTitle: "Doctor: Client Peer Mode",
    clientModeDesc: "Start the automated scanner to discover active local clinic hosts on the hotspot, pairing securely using your custom clinic code.",
    hostName: "Host Beacon Name",
    pairingCode: "Clinic Pairing Code",
    pairingCodePlaceholder: "Enter 4-8 digit code",
    statusText: "Connection Status",
    diagnosticsLog: "P2P Hardware Diagnostics Console",
    simulateDisconnect: "Simulate Connection Drop",
    reconnect: "Resume Hotspot Connection",
    pairedWith: "Paired with:",
    activeHostsTitle: "Discovered mDNS Broadcasts",
    noHostsFound: "Scanning hotspot frequencies... ensure Secretary's Host Mode is active.",
    pairingButton: "Initiate SQLite Pair",
    offlineQueueTitle: "Offline Reconciliation Log",
    offlineQueueDesc: "Changes queued during network drops will automatically merge when connection is re-established.",
    activeSQLiteTitle: "Active SQLite Table States",
    rowsCount: "Rows Committed"
  },
  ar: {
    title: "محرك المزامنة عبر نقطة الاتصال الآمنة",
    subtitle: "مزامنة تفاعلية فورية خالية من الإعدادات عبر شبكة الواي فاي المحلية",
    hostModeTitle: "السكرتير: وضع السيرفر المضيف",
    hostModeDesc: "تمكين هذا الجهاز كخادم محلي للعيادة. يقوم بتشغيل قاعدة بيانات SQLite محلية وبث إشارة mDNS عبر نقطة الاتصال.",
    clientModeTitle: "الطبيب: وضع العميل المستكشف",
    clientModeDesc: "بدء المسح التلقائي لاكتشاف السيرفرات النشطة على شبكة نقطة الاتصال والمزامنة الآمنة باستخدام كود الاقتران.",
    hostName: "اسم بث المضيف",
    pairingCode: "رمز اقتران العيادة الآمن",
    pairingCodePlaceholder: "أدخل رمزًا من 4-8 أرقام",
    statusText: "حالة الاتصال",
    diagnosticsLog: "لوحة تشخيص وتتبع الإشارات P2P",
    simulateDisconnect: "محاكاة انقطاع الاتصال للشبكة",
    reconnect: "استئناف اتصال نقطة الاتصال",
    pairedWith: "مقترن بـ:",
    activeHostsTitle: "إشارات البث المكتشفة (mDNS)",
    noHostsFound: "يتم فحص ترددات الشبكة الآن... تأكد من تفعيل وضع المضيف لدى السكرتير.",
    pairingButton: "بدء اقتران SQLite الموضعي",
    offlineQueueTitle: "سجل مزامنة البيانات المتراكمة",
    offlineQueueDesc: "سيتم دمج التعديلات التي تمت أثناء انقطاع الشبكة تلقائيًا وبأمان فور عودة الاتصال.",
    activeSQLiteTitle: "حالة جداول SQLite النشطة",
    rowsCount: "الصفوف المخزنة"
  },
  ku: {
    title: "مۆتۆڕی هاوکاتکردنی خاڵی گەرمی پاشەکەوتکراو",
    subtitle: "هاوکاتکردنی ڕاستەوخۆ و بێ بەستنەوەی سەر هێڵ لە ڕێگەی وای فای ناوخۆییەوە",
    hostModeTitle: "سکرتێر: دۆخی سێرڤەری سەرەکی",
    hostModeDesc: "چالاککردنی ئەم ئامێرە وەک سێرڤەری ناوخۆیی نۆرینگە. داتابەیسێکی SQLite لێرە دەستپێدەکات و ناوی سێرڤەرەکە پەخش دەکات.",
    clientModeTitle: "پزیشک: دۆخی گەڕان و بەستنەوە",
    clientModeDesc: "دەستپێکردنی پشکنینی خۆکار بۆ دۆزینەوەی سێرڤەری سکرتێر لەسەر خاڵی گەرمی وای فای و بەستنەوەی بە کۆدی متمانە.",
    hostName: "ناوی پەخشی خانەخوێ",
    pairingCode: "کۆدی جوتبوونی نۆرینگە",
    pairingCodePlaceholder: "کۆدی ٤-٨ ژمارەیی بنووسە",
    statusText: "دۆخی پەیوەندی",
    diagnosticsLog: "کۆنسۆڵی تاقیكردنەوەی پەیوەندی P2P",
    simulateDisconnect: "تاقیکردنەوەی بچڕانی وای فای",
    reconnect: "بەستنەوەوەی وای فای گەرم",
    pairedWith: "بەستراوەتەوە بە:",
    activeHostsTitle: "سێرڤەرە دۆزراوەکان (mDNS)",
    noHostsFound: "سێرڤەرەکان دەپشکنرێن... دڵنیابە کە سکرتێر دۆخی خانەخوێی چالاک کردووە.",
    pairingButton: "دەستپێکردنی بەستنەوەی SQLite",
    offlineQueueTitle: "لیستی کارە پاشەکەوتکراوەکان (ئۆفلاین)",
    offlineQueueDesc: "هەر دەستکارییەک لە کاتی بچڕانی هێڵ بکرێت، بەگەڕانەوەی پەیوەندی بە شێوەی خۆکار تێکەڵ دەکرێتەوە.",
    activeSQLiteTitle: "دۆخی کۆگای داتاکانی SQLite",
    rowsCount: "ڕیزە نووسراوەکان"
  }
};

export const OfflineSyncScreen: React.FC = () => {
  const { language, isRtl, navigateTo, theme, refreshPatientsList } = useApp();
  const c = localizedContent[language] || localizedContent.en;

  const [syncRole, setSyncRole] = useState<'none' | 'host' | 'client'>('none');
  const [beaconName, setBeaconName] = useState('Central-Clinic-Hub');
  const [pairingCode, setPairingCode] = useState('7890');
  const [connectionStatus, setConnectionStatus] = useState<SyncStatus>('offline');
  const [discoveredHosts, setDiscoveredHosts] = useState<DiscoveredHost[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [testDisconnect, setTestDisconnect] = useState(false);
  
  // Local DB sizes for SQLite Visual Board
  const [dbStats, setDbStats] = useState({
    patients: 0,
    history: 0,
    notes: 0,
    operations: 0
  });

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`].slice(-40)); // keep last 40 lines
  };

  // Sync log listener from our client on mount
  useEffect(() => {
    syncClient.configure(
      (status) => {
        setConnectionStatus(status);
        addLog(`Status shifted automatically to: ${status.toUpperCase()}`);
      },
      (hosts) => {
        setDiscoveredHosts(hosts);
      },
      (logMsg) => {
        addLog(logMsg);
      },
      () => {
        addLog("Database Synchronized! SQLite transaction log parsed.");
        refreshPatientsList();
        syncDbStats();
      }
    );

    syncDbStats();

    return () => {
      syncClient.stopAll();
    };
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const syncDbStats = () => {
    try {
      const p = JSON.parse(localStorage.getItem('my_secretary_patients') || '[]');
      const h = JSON.parse(localStorage.getItem('my_secretary_history') || '[]');
      const n = JSON.parse(localStorage.getItem('my_secretary_notes') || '[]');
      const o = JSON.parse(localStorage.getItem('my_secretary_operations') || '[]');
      setDbStats({
        patients: p.length,
        history: h.length,
        notes: n.length,
        operations: o.length
      });
    } catch {}
  };

  const handleStartHosting = () => {
    if (!pairingCode) {
      alert("A pairing code is required for clinic security!");
      return;
    }
    setSyncRole('host');
    syncClient.startHostMode(pairingCode, beaconName);
  };

  const handleStartClient = () => {
    setSyncRole('client');
    syncClient.startClientMode();
  };

  const handleStopAll = () => {
    syncClient.stopAll();
    setSyncRole('none');
    addLog("Mesh interfaces offline. Synchronization disabled.");
  };

  const handlePair = (hostId: string) => {
    if (!pairingCode) {
      alert("Input pairing code first!");
      return;
    }
    syncClient.pairWithHost(hostId, pairingCode);
  };

  const toggleNetworkDrop = () => {
    if (testDisconnect) {
      addLog("Hotspot signal restored. Re-triggering discover/host broadcast channels...");
      if (syncRole === 'host') {
        syncClient.startHostMode(pairingCode, beaconName);
      } else if (syncRole === 'client') {
        syncClient.startClientMode();
      }
      setTestDisconnect(false);
    } else {
      addLog("[EMULATOR] Wi-Fi Hotspot signal degraded. Forcing network-socket disconnect...");
      syncClient.stopAll();
      setConnectionStatus('offline');
      setTestDisconnect(true);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col gap-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* Drawer Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateTo('dashboard')}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <ChevronLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Wifi className="h-6 w-6 text-teal-600 dark:text-teal-400 animate-pulse" />
              {c.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{c.subtitle}</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all
            ${connectionStatus === 'hosting' ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 ring-1 ring-sky-300' : ''}
            ${connectionStatus === 'paired' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 animate-bounce' : ''}
            ${connectionStatus === 'discovering' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 animate-pulse' : ''}
            ${connectionStatus === 'connecting' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300' : ''}
            ${connectionStatus === 'offline' ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400' : ''}
          `}>
            <span className={`h-2.5 w-2.5 rounded-full 
              ${connectionStatus === 'hosting' ? 'bg-sky-500' : ''}
              ${connectionStatus === 'paired' ? 'bg-emerald-500' : ''}
              ${connectionStatus === 'discovering' ? 'bg-amber-500 animate-ping' : ''}
              ${connectionStatus === 'connecting' ? 'bg-indigo-500 animate-pulse' : ''}
              ${connectionStatus === 'offline' ? 'bg-rose-500' : ''}
            `} />
            {connectionStatus.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column - control card slots */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* SEC LOGIC: HOST MODE PANEL */}
          <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all
            ${syncRole === 'host' ? 'ring-2 ring-teal-500/50' : 'opacity-85 hover:opacity-100'}
          `}>
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{c.hostModeTitle}</h2>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono uppercase font-bold">SQLITE WAL Broadcaster</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-normal leading-relaxed">{c.hostModeDesc}</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{c.hostName}</label>
                <input 
                  type="text"
                  disabled={syncRole !== 'none'}
                  value={beaconName}
                  onChange={(e) => setBeaconName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{c.pairingCode}</label>
                <div className="relative">
                  <input 
                    type="text"
                    maxLength={8}
                    disabled={syncRole !== 'none'}
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value)}
                    placeholder={c.pairingCodePlaceholder}
                    className="w-full mt-1 pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono tracking-widest disabled:opacity-50"
                  />
                  <Lock className="absolute left-2.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {syncRole === 'none' && (
                <button 
                  onClick={handleStartHosting}
                  className="w-full mt-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-lg hover:shadow-teal-600/10 transition-all"
                >
                  Enable Host Hotspot Mode
                </button>
              )}

              {syncRole === 'host' && (
                <button 
                  onClick={handleStopAll}
                  className="w-full mt-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-all"
                >
                  Disable Host Mode
                </button>
              )}
            </div>
          </div>

          {/* DOCTOR LOGIC: CLIENT MODE PANEL */}
          <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all
            ${syncRole === 'client' ? 'ring-2 ring-indigo-500/50' : 'opacity-85 hover:opacity-100'}
          `}>
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{c.clientModeTitle}</h2>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono uppercase font-bold">mDNS Client Picker</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-normal leading-relaxed">{c.clientModeDesc}</p>

            <div className="flex flex-col gap-3">
              {syncRole === 'client' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{c.pairingCode}</label>
                  <div className="relative">
                    <input 
                      type="text"
                      maxLength={8}
                      value={pairingCode}
                      onChange={(e) => setPairingCode(e.target.value)}
                      placeholder={c.pairingCodePlaceholder}
                      className="w-full mt-1 pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest"
                    />
                    <Lock className="absolute left-2.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              )}

              {syncRole === 'none' && (
                <button 
                  onClick={handleStartClient}
                  className="w-full mt-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-lg hover:shadow-indigo-600/10 transition-all"
                >
                  Enable Autonomic Client Scanner
                </button>
              )}

              {syncRole === 'client' && (
                <button 
                  onClick={handleStopAll}
                  className="w-full mt-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-all"
                >
                  Disable Discovery Scanner
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Columns: Discovery status, SQLite monitors and real logs console */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* TOP RIGHT SUB-PANELS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* mDNS BROADCAST BEACON AREA */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Radio className="h-4.5 w-4.5 text-indigo-500 animate-ping" />
                  {c.activeHostsTitle}
                </h3>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wi-Fi Hotspot LAN Scan</span>
              </div>

              <div className="flex-1 mt-4 overflow-y-auto max-h-[140px] flex flex-col gap-2">
                {syncRole === 'client' && discoveredHosts.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl h-full">
                    <Search className="h-6 w-6 text-slate-300 animate-pulse mb-1" />
                    <span className="text-[11px] text-slate-400 leading-relaxed font-mono">{c.noHostsFound}</span>
                  </div>
                )}

                {syncRole !== 'client' && (
                  <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl h-full opacity-65">
                    <Smartphone className="h-6 w-6 text-slate-300 mb-1" />
                    <span className="text-[11px] text-slate-400 leading-relaxed font-mono">Select Peer Mode to start automated packet sweeps.</span>
                  </div>
                )}

                {syncRole === 'client' && discoveredHosts.map(host => (
                  <div 
                    key={host.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-indigo-400 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-indigo-500" />
                        {host.name}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">{host.ip}:{host.port} (ID: {host.id.substring(4)})</p>
                    </div>

                    {connectionStatus === 'paired' ? (
                      <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Synchronized
                      </span>
                    ) : (
                      <button 
                        onClick={() => handlePair(host.id)}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        {c.pairingButton}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SQLITE FILE ENGINE HARDWARE STATE MONITOR */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Database className="h-4.5 w-4.5 text-teal-500" />
                  {c.activeSQLiteTitle}
                </h3>
                <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">clinic_records_sqlite.db</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider">PATIENTS</div>
                  <div className="text-lg font-mono font-bold text-slate-800 dark:text-white mt-1">{dbStats.patients}</div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider">CONSULTATIONS</div>
                  <div className="text-lg font-mono font-bold text-slate-800 dark:text-white mt-1">{dbStats.history}</div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider">NOTES</div>
                  <div className="text-lg font-mono font-bold text-slate-800 dark:text-white mt-1">{dbStats.notes}</div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider">OPERATIONS</div>
                  <div className="text-lg font-mono font-bold text-slate-800 dark:text-white mt-1">{dbStats.operations}</div>
                </div>
              </div>
            </div>

          </div>

          {/* SIMULATOR WI-FI DROPPING ADVANCED DIAGNOSTICS DECK */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.diagnosticsLog}</h3>
              </div>

              {syncRole !== 'none' && (
                <button 
                  onClick={toggleNetworkDrop}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5
                    ${testDisconnect 
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400' 
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                    }
                  `}
                >
                  <Activity className={`h-3.5 w-3.5 ${testDisconnect ? 'animate-pulse' : ''}`} />
                  {testDisconnect ? c.reconnect : c.simulateDisconnect}
                </button>
              )}
            </div>

            {/* Terminal Feed of Wi-Fi Packets */}
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-teal-400 border border-slate-900 h-[280px] overflow-y-auto flex flex-col gap-1 shadow-inner select-text">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-600 gap-2">
                  <Terminal className="h-4 w-4" />
                  <span>No packets sent/received yet. Enable mesh connection...</span>
                </div>
              ) : (
                logs.map((log, i) => {
                  let alertColor = 'text-teal-400';
                  if (log.includes('HANDSHAKE') || log.includes('paired') || log.includes('VERIFIED')) alertColor = 'text-emerald-450 text-emerald-400 font-bold';
                  if (log.includes('error') || log.includes('REJECTED') || log.includes('failed')) alertColor = 'text-rose-400';
                  if (log.includes('offline') || log.includes('disconnect') || log.includes('lost')) alertColor = 'text-amber-450 text-amber-500';
                  if (log.includes('delta') || log.includes('SQLite')) alertColor = 'text-sky-450 text-sky-400';

                  return (
                    <div key={i} className={`leading-relaxed break-all ${alertColor}`}>
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 mt-1 gap-2 leading-relaxed">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span><strong>Hotspot Fallback Logic:</strong> If connection fails, edits buffer instantly to the memory deck queue.</span>
              </div>
              <span className="font-mono text-[10px]">MDNS Broadcast Port: 5353</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
