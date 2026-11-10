import { 
  IDentalStorageService, 
  Language, 
  Theme, 
  UserCredentials, 
  UserRole,
  Patient, 
  PatientFullRecord, 
  DentalHistoryEntry, 
  PatientNote, 
  DentalImage,
  Drug,
  PatientOperation
} from '../types';

// Concrete implementation of Storage Service using standard localStorage
class LocalStorageDentalService implements IDentalStorageService {
  private readonly STORAGE_KEYS = {
    CREDENTIALS: 'my_secretary_credentials',
    CREDENTIALS_SECRETARY: 'my_secretary_sec_credentials',
    PATIENTS: 'my_secretary_patients',
    HISTORY: 'my_secretary_history',
    NOTES: 'my_secretary_notes',
    IMAGES: 'my_secretary_images',
    DRUGS: 'my_secretary_drugs',
    LANGUAGE: 'my_secretary_language',
    THEME: 'my_secretary_theme',
    OPERATIONS: 'my_secretary_operations'
  };

  // In-memory caches for independent collections with lazy reads
  private _patientsCache: Patient[] | null = null;
  private _historyCache: DentalHistoryEntry[] | null = null;
  private _notesCache: PatientNote[] | null = null;
  private _imagesCache: DentalImage[] | null = null;
  private _drugsCache: Drug[] | null = null;
  private _operationsCache: PatientOperation[] | null = null;

  private listeners: ((action: 'create' | 'update' | 'delete', itemType: 'patient' | 'history' | 'note' | 'operation', data: any) => void)[] = [];

  public subscribe(cb: (action: 'create' | 'update' | 'delete', itemType: 'patient' | 'history' | 'note' | 'operation', data: any) => void): void {
    this.listeners.push(cb);
  }

  private notify(action: 'create' | 'update' | 'delete', itemType: 'patient' | 'history' | 'note' | 'operation', data: any) {
    this.listeners.forEach(cb => {
      try { cb(action, itemType, data); } catch (e) {}
    });
  }

  constructor() {
    this.initDatabase();
  }

  // Generate mock dental images in SVG data URL form (safe, standalone, requires no network)
  private getMockScanSvg(type: 'xray' | 'mri' | 'ct' | 'lab'): string {
    let innerSvg = '';
    
    if (type === 'xray') {
      innerSvg = `
        <rect width="400" height="300" fill="#0d1117"/>
        <text x="20" y="35" fill="#58a6ff" font-family="monospace" font-size="12">CHEST PLANAR X-RAY</text>
        <text x="320" y="35" fill="#f85149" font-family="monospace" font-size="12">ID: 884-X</text>
        
        <!-- Spine -->
        <rect x="195" y="60" width="10" height="200" rx="3" fill="#666" opacity="0.6"/>
        <path d="M 190,70 Q 200,75 210,70" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        <path d="M 190,95 Q 200,100 210,95" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        <path d="M 190,120 Q 200,125 210,120" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        <path d="M 190,145 Q 200,150 210,145" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        <path d="M 190,170 Q 200,175 210,170" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        <path d="M 190,195 Q 200,200 210,195" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        <path d="M 190,220 Q 200,225 210,220" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
        
        <!-- Rib cage left -->
        <path d="M 190,75 C 100,85 80,130 140,150 C 180,160 190,165 190,165" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>
        <path d="M 190,100 C 90,110 70,165 130,185 C 170,195 190,200 190,200" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>
        <path d="M 190,125 C 80,135 60,200 120,220 C 160,230 190,235 190,235" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>
        <path d="M 190,150 C 70,160 50,230 110,250 C 150,260 190,265 190,265" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>

        <!-- Rib cage right -->
        <path d="M 210,75 C 300,85 320,130 260,150 C 220,160 210,165 210,165" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>
        <path d="M 210,100 C 310,110 330,165 270,185 C 230,195 210,200 210,200" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>
        <path d="M 210,125 C 320,135 340,200 280,220 C 240,230 210,235 210,235" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>
        <path d="M 210,150 C 330,160 350,230 290,250 C 250,260 210,265 210,265" stroke="#fff" stroke-width="4" fill="none" opacity="0.3"/>

        <!-- Lungs -->
        <ellipse cx="140" cy="160" rx="35" ry="70" fill="#223" filter="blur(8px)" opacity="0.5"/>
        <ellipse cx="260" cy="160" rx="35" ry="70" fill="#223" filter="blur(8px)" opacity="0.5"/>
        
        <!-- Diaphragm -->
        <path d="M 80,260 Q 140,220 200,260 Q 260,220 320,260" stroke="#888" stroke-width="3" fill="none" opacity="0.5"/>
        
        <!-- Heart Shadow -->
        <ellipse cx="180" cy="190" rx="30" ry="25" fill="#aaa" opacity="0.4" transform="rotate(-15 180 190)"/>
      `;
    } else if (type === 'mri' || type === 'ct') {
      innerSvg = `
        <rect width="400" height="300" fill="#07090e"/>
        <text x="20" y="35" fill="#00ffcc" font-family="monospace" font-size="12">CRANIAL BRAIN ${type.toUpperCase()} SCAN</text>
        <text x="320" y="35" fill="#ffcc00" font-family="monospace" font-size="12">SLICE 18/36</text>
        
        <!-- Outer Skull -->
        <ellipse cx="200" cy="160" rx="100" ry="110" fill="none" stroke="#fff" stroke-width="8" opacity="0.2"/>
        <ellipse cx="200" cy="160" rx="98" ry="108" fill="none" stroke="#666" stroke-width="2" opacity="0.5"/>
        
        <!-- Brain hemispheres -->
        <path d="M 200,60 C 130,60 110,120 110,160 C 110,210 140,260 200,260" fill="#2d3748" stroke="#718096" stroke-width="3" opacity="0.4"/>
        <path d="M 200,60 C 270,60 290,120 290,160 C 290,210 260,260 200,260" fill="#2d3748" stroke="#718096" stroke-width="3" opacity="0.4"/>
        
        <!-- Brain folds details -->
        <path d="M 150,100 C 170,110 160,130 190,120 M 250,100 C 230,110 240,130 210,120" stroke="#cbd5e0" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M 130,150 C 160,150 150,170 195,170 M 270,150 C 240,150 250,170 205,170" stroke="#cbd5e0" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M 140,200 C 170,190 180,210 195,220 M 260,200 C 230,190 220,210 205,220" stroke="#cbd5e0" stroke-width="2" fill="none" opacity="0.5"/>
        
        <!-- Ventricles -->
        <path d="M 185,140 Q 195,150 195,160 A 10,15 0 0,1 180,175" stroke="#00ffcc" stroke-width="3" fill="none" opacity="0.8"/>
        <path d="M 215,140 Q 205,150 205,160 A 10,15 0 0,0 220,175" stroke="#00ffcc" stroke-width="3" fill="none" opacity="0.8"/>
        
        <!-- Scanning Grid -->
        <line x1="200" y1="30" x2="200" y2="290" stroke="#00ffcc" stroke-dasharray="3,6" stroke-width="1" opacity="0.2"/>
        <line x1="80" y1="160" x2="320" y2="160" stroke="#00ffcc" stroke-dasharray="3,6" stroke-width="1" opacity="0.2"/>
      `;
    } else {
      innerSvg = `
        <rect width="400" height="300" fill="#fafafa" stroke="#e2e8f0"/>
        <text x="25" y="45" fill="#334155" font-family="sans-serif" font-weight="bold" font-size="14">CLINICAL LAB REPORT</text>
        <rect x="25" y="65" width="350" height="2" fill="#0d9488"/>
        
        <!-- Doctor & Patient details table -->
        <text x="25" y="90" fill="#64748b" font-family="sans-serif" font-size="10">Lab Code: L-9922</text>
        <text x="25" y="105" fill="#64748b" font-family="sans-serif" font-size="10">Date: 2026-06-01</text>
        <text x="220" y="90" fill="#64748b" font-family="sans-serif" font-size="10">Department: Hematology</text>
        
        <!-- Lab entries -->
        <text x="25" y="140" fill="#334155" font-family="monospace" font-weight="bold" font-size="11">Hemoglobin (Hb) ............. 14.2 g/dL</text>
        <text x="310" y="140" fill="#0d9488" font-family="sans-serif" font-weight="bold" font-size="10">NORMAL</text>
        <text x="25" y="165" fill="#334155" font-family="monospace" font-weight="bold" font-size="11">White Blood Cells ........... 4.8 x10^9/L</text>
        <text x="310" y="165" fill="#0d9488" font-family="sans-serif" font-weight="bold" font-size="10">NORMAL</text>
        <text x="25" y="190" fill="#334155" font-family="monospace" font-weight="bold" font-size="11">Fasting Blood Glucose ....... 135 mg/dL</text>
        <text x="310" y="190" fill="#ef4444" font-family="sans-serif" font-weight="bold" font-size="10">HIGH (+)</text>
        
        <!-- Sign -->
        <rect x="250" y="230" width="100" height="2" fill="#cbd5e1"/>
        <text x="250" y="245" fill="#94a3b8" font-family="sans-serif" font-size="9">AUTHORIZED SIGNATURE</text>
      `;
    }

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${encodeURIComponent(innerSvg.trim())}</svg>`;
  }

  private initDatabase(): void {
    // 1. Initial Credentials (Default: doctor / clinic123)
    if (!localStorage.getItem(this.STORAGE_KEYS.CREDENTIALS)) {
      const defaultCreds: UserCredentials = {
        username: 'doctor',
        passwordHash: 'clinic123'
      };
      localStorage.setItem(this.STORAGE_KEYS.CREDENTIALS, JSON.stringify(defaultCreds));
    }

    // 1b. Initial Secretary Credentials (Default: secretary / sec123)
    if (!localStorage.getItem(this.STORAGE_KEYS.CREDENTIALS_SECRETARY)) {
      const defaultSecCreds: UserCredentials = {
        username: 'secretary',
        passwordHash: 'sec123'
      };
      localStorage.setItem(this.STORAGE_KEYS.CREDENTIALS_SECRETARY, JSON.stringify(defaultSecCreds));
    }

    // 2. Initial Config Selection
    if (!localStorage.getItem(this.STORAGE_KEYS.LANGUAGE)) {
      localStorage.setItem(this.STORAGE_KEYS.LANGUAGE, 'en');
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.THEME)) {
      localStorage.setItem(this.STORAGE_KEYS.THEME, 'light');
    }

    // 3. Initial Mock Patient Database (Writes to central structures only if not existing)
    if (!localStorage.getItem(this.STORAGE_KEYS.PATIENTS)) {
      const initialPatients: Patient[] = [
        {
          id: 'mock-1',
          patientId: 'P-1002',
          fullName: 'Ahmad Mahmoud Ali',
          gender: 'male',
          dateOfBirth: '1982-04-12',
          phoneNumber: '+964 770 123 4567',
          address: 'Karrada, Baghdad, Iraq',
          createdAt: '2026-05-10T10:00:00Z',
          lastVisitDate: '2026-06-03'
        },
        {
          id: 'mock-2',
          patientId: 'P-1003',
          fullName: 'Sara Hawkar Mustafa',
          gender: 'female',
          dateOfBirth: '1995-11-23',
          phoneNumber: '+964 750 987 6543',
          address: 'Salim Street, Sulaymaniyah, Kurdistan Region',
          createdAt: '2026-05-15T14:30:00Z',
          lastVisitDate: '2026-06-01'
        },
        {
          id: 'mock-3',
          patientId: 'P-1004',
          fullName: 'Dilshad Baker Qadir',
          gender: 'male',
          dateOfBirth: '1970-08-05',
          phoneNumber: '+964 750 444 8899',
          address: 'Bakhtiyari, Erbil, Kurdistan Region',
          createdAt: '2026-05-20T09:15:00Z',
          lastVisitDate: '2026-05-28'
        }
      ];

      const initialHistory: DentalHistoryEntry[] = [
        {
          id: 'h-1',
          patientId: 'mock-1',
          visitDate: '2026-05-10',
          diagnosis: 'Acute Bronchitis & Secondary Upper Respiratory Infection',
          symptoms: 'Productive dry cough, throat irritation, congestion, occasionally low grade fever.',
          treatment: 'Albuterol inhaler 2 puffs every 6 hours, warm saline gargles, increase hydration.',
          notes: 'Advised strict compliance with medications. Rest for 3 days. Patient instructed to follow up if fever spikes above 38.5C.',
          billingAmount: 35000
        },
        {
          id: 'h-2',
          patientId: 'mock-1',
          visitDate: '2026-06-03',
          diagnosis: 'Essential Hypertension Follow-up Survey',
          symptoms: 'Mild morning headache. Heart rate stable, clear lung fields, blood pressure measured 135/85 mmHg.',
          treatment: 'Continue Lisinopril 10mg once daily. Added low sodium diet guidelines.',
          notes: 'Advised home daily blood pressure monitoring. Next routine survey is in 1 month.',
          billingAmount: 25000
        },
        {
          id: 'h-3',
          patientId: 'mock-2',
          visitDate: '2026-06-01',
          diagnosis: 'Acute Migraine Headache with Visual Aura',
          symptoms: 'Unilateral throbbing headache behind right eye. Sensitivity to light and loud noises, localized facial pressure.',
          treatment: 'Sumatriptan 50mg PO at onset of aura. Rest in a dark quiet room.',
          notes: 'Instructed on keeping a headache trigger journal. Avoid caffeine and irregular sleep cycles.',
          billingAmount: 40000
        },
        {
          id: 'h-4',
          patientId: 'mock-3',
          visitDate: '2026-05-28',
          diagnosis: 'Type 2 Diabetes Mellitus Follow-up',
          symptoms: 'Gradual fatigue, dry skin, no active neuropathy symptoms. HbA1c measured at 7.2%.',
          treatment: 'Adjusted Metformin 1000mg twice daily with meals. Weight loss consulting.',
          notes: 'Reviewed lab results. Recommended daily physical exercise and walking for 30 minutes.',
          billingAmount: 50000
        }
      ];

      const initialNotes: PatientNote[] = [
        {
          id: 'n-1',
          patientId: 'mock-1',
          date: '2026-05-10',
          title: 'Dietary Compliance Plan',
          content: 'Ahmad has a sweet tooth, particularly with traditional tea and sweets. We discussed using stevia or erythritol instead of sucrose. Handed out a customized Arabic-language diabetic meal guidelines brochure.'
        },
        {
          id: 'n-2',
          patientId: 'mock-2',
          date: '2026-06-01',
          title: 'Allergy Warning',
          content: 'Sara noted moderate hives when taking sulfonamide drugs during childhood. Documented strictly to avoid TMP-SMX and sulfas. No other known drug allergies.'
        }
      ];

      const initialImages: DentalImage[] = [
        {
          id: 'img-1',
          patientId: 'mock-1',
          date: '2026-06-01',
          type: 'lab',
          title: 'Periodontal Bacterial Panel',
          dataUrl: this.getMockScanSvg('lab')
        },
        {
          id: 'img-2',
          patientId: 'mock-3',
          date: '2026-05-28',
          type: 'mri',
          title: 'Cone Beam CT Jaw Segment',
          dataUrl: this.getMockScanSvg('mri')
        }
      ];

      localStorage.setItem(this.STORAGE_KEYS.PATIENTS, JSON.stringify(initialPatients));
      localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(initialHistory));
      localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(initialNotes));

      // Separate storage key per mock image
      const metadataList = initialImages.map(img => ({
        id: img.id,
        patientId: img.patientId,
        date: img.date,
        type: img.type,
        title: img.title
      }));
      localStorage.setItem(this.STORAGE_KEYS.IMAGES, JSON.stringify(metadataList));

      initialImages.forEach(img => {
        localStorage.setItem(`my_secretary_image_data_${img.id}`, img.dataUrl);
      });
    }

    // 4. Initial Mock Drugs Database
    if (!localStorage.getItem(this.STORAGE_KEYS.DRUGS)) {
      const initialDrugs: Drug[] = [
        { id: 'dg-1', tradeName: 'Panadol Extra', scientificName: 'Paracetamol + Caffeine', dosageForm: 'Tablet', strength: '500mg/65mg', instructions: '1-2 tablets every 6 hours as needed for pain or fever' },
        { id: 'dg-2', tradeName: 'Amoxil', scientificName: 'Amoxicillin', dosageForm: 'Capsule', strength: '500mg', instructions: '1 capsule 3 times daily for 5-7 days after meals' },
        { id: 'dg-3', tradeName: 'Ibufen', scientificName: 'Ibuprofen', dosageForm: 'Tablet', strength: '400mg', instructions: '1 tablet twice daily after food' },
        { id: 'dg-4', tradeName: 'Augmentin', scientificName: 'Amoxicillin + Clavulanic Acid', dosageForm: 'Tablet', strength: '1g', instructions: '1 tablet twice daily for 7 days' },
        { id: 'dg-5', tradeName: 'Flagyl', scientificName: 'Metronidazole', dosageForm: 'Tablet', strength: '500mg', instructions: '1 tablet 3 times daily for 5-7 days' }
      ];
      localStorage.setItem(this.STORAGE_KEYS.DRUGS, JSON.stringify(initialDrugs));
    }
  }

  // --- Collection Lazy Load & Getters ---
  private getCachedPatients(): Patient[] {
    if (this._patientsCache === null) {
      const raw = localStorage.getItem(this.STORAGE_KEYS.PATIENTS);
      this._patientsCache = raw ? JSON.parse(raw) : [];
    }
    return this._patientsCache!;
  }

  private savePatients(patients: Patient[]): void {
    this._patientsCache = patients;
    localStorage.setItem(this.STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    triggerAutoBackup().catch(err => console.warn("Auto-backup failed:", err));
  }

  private getCachedHistory(): DentalHistoryEntry[] {
    if (this._historyCache === null) {
      const raw = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
      this._historyCache = raw ? JSON.parse(raw) : [];
    }
    return this._historyCache!;
  }

  private saveHistory(history: DentalHistoryEntry[]): void {
    this._historyCache = history;
    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
    triggerAutoBackup().catch(err => console.warn("Auto-backup failed:", err));
  }

  private getCachedNotes(): PatientNote[] {
    if (this._notesCache === null) {
      const raw = localStorage.getItem(this.STORAGE_KEYS.NOTES);
      this._notesCache = raw ? JSON.parse(raw) : [];
    }
    return this._notesCache!;
  }

  private saveNotes(notes: PatientNote[]): void {
    this._notesCache = notes;
    localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(notes));
    triggerAutoBackup().catch(err => console.warn("Auto-backup failed:", err));
  }

  private getCachedImages(): DentalImage[] {
    if (this._imagesCache === null) {
      const raw = localStorage.getItem(this.STORAGE_KEYS.IMAGES);
      const metadataList = raw ? JSON.parse(raw) : [];
      this._imagesCache = metadataList.map((meta: any) => {
        // Build lightweight object
        const imgObj = {
          id: meta.id,
          patientId: meta.patientId,
          date: meta.date,
          type: meta.type,
          title: meta.title
        };
        // Define getter/setter for dataUrl to enable lazy, specific reads from localStorage!
        Object.defineProperty(imgObj, 'dataUrl', {
          get() {
            return localStorage.getItem(`my_secretary_image_data_${meta.id}`) || '';
          },
          set(value: string) {
            localStorage.setItem(`my_secretary_image_data_${meta.id}`, value);
          },
          enumerable: true,
          configurable: true
        });
        return imgObj as any as DentalImage;
      });
    }
    return this._imagesCache!;
  }

  private saveImages(images: DentalImage[]): void {
    this._imagesCache = images;
    // Extract metadata only so the list key does not bloat
    const metadataList = images.map(img => ({
      id: img.id,
      patientId: img.patientId,
      date: img.date,
      type: img.type,
      title: img.title
    }));
    localStorage.setItem(this.STORAGE_KEYS.IMAGES, JSON.stringify(metadataList));
    
    // Save image data separately
    images.forEach(img => {
      const rawData = img.dataUrl;
      if (rawData) {
        localStorage.setItem(`my_secretary_image_data_${img.id}`, rawData);
      }
    });

    triggerAutoBackup().catch(err => console.warn("Auto-backup failed:", err));
  }

  // --- Credentials ---
  public getCredentials(role?: UserRole): UserCredentials {
    const key = (role === 'secretary') ? this.STORAGE_KEYS.CREDENTIALS_SECRETARY : this.STORAGE_KEYS.CREDENTIALS;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    return (role === 'secretary') 
      ? { username: 'secretary', passwordHash: 'sec123' } 
      : { username: 'doctor', passwordHash: 'clinic123' };
  }

  public saveCredentials(credentials: UserCredentials, role?: UserRole): void {
    const key = (role === 'secretary') ? this.STORAGE_KEYS.CREDENTIALS_SECRETARY : this.STORAGE_KEYS.CREDENTIALS;
    localStorage.setItem(key, JSON.stringify(credentials));
  }

  // --- Patients ---
  public getPatients(): Patient[] {
    return this.getCachedPatients();
  }

  public getPatient(id: string): PatientFullRecord | null {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === id);
    if (!patient) return null;

    // Get History filtered lazily from cache
    const history = this.getCachedHistory();
    const patientHistory = history.filter(h => h.patientId === id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));

    // Get Notes filtered lazily from cache
    const notes = this.getCachedNotes();
    const patientNotes = notes.filter(n => n.patientId === id).sort((a,b) => b.date.localeCompare(a.date));

    // Get Images filtered lazily from cache
    const images = this.getCachedImages();
    const patientImages = images.filter(img => img.patientId === id).sort((a,b) => b.date.localeCompare(a.date));

    return {
      ...patient,
      history: patientHistory,
      notes: patientNotes,
      images: patientImages
    };
  }

  public addPatient(patientData: Omit<Patient, 'createdAt' | 'lastVisitDate'>): Patient {
    const patients = this.getCachedPatients();
    const newPatient: Patient = {
      ...patientData,
      createdAt: new Date().toISOString(),
      lastVisitDate: '-'
    };
    patients.push(newPatient);
    this.savePatients(patients);
    this.notify('create', 'patient', newPatient);
    return newPatient;
  }

  public updatePatient(id: string, updatedData: Partial<Patient>): Patient {
    const patients = this.getCachedPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Patient with internal ID ${id} not found.`);
    }
    patients[index] = { ...patients[index], ...updatedData };
    this.savePatients(patients);
    this.notify('update', 'patient', patients[index]);
    return patients[index];
  }

  public deletePatient(id: string): boolean {
    const patients = this.getCachedPatients();
    const filteredPatients = patients.filter(p => p.id !== id);
    if (filteredPatients.length === patients.length) return false;
    
    this.savePatients(filteredPatients);

    // Clean up related data cascadingly from caches
    const history = this.getCachedHistory();
    this.saveHistory(history.filter(h => h.patientId !== id));

    const notes = this.getCachedNotes();
    this.saveNotes(notes.filter(n => n.patientId !== id));

    // Cleanup images and individual blobs
    const images = this.getCachedImages();
    const imagesToKeep = images.filter(img => img.patientId !== id);
    const imagesToDelete = images.filter(img => img.patientId === id);
    
    this.saveImages(imagesToKeep);
    imagesToDelete.forEach(img => {
      localStorage.removeItem(`my_secretary_image_data_${img.id}`);
    });

    this.notify('delete', 'patient', { id });
    return true;
  }

  // --- Dental History ---
  public addHistoryEntry(patientId: string, entryData: Omit<DentalHistoryEntry, 'id' | 'patientId'>): DentalHistoryEntry {
    const history = this.getCachedHistory();
    
    const newEntry: DentalHistoryEntry = {
      ...entryData,
      id: 'h-' + Math.random().toString(36).substring(2, 9),
      patientId
    };
    history.push(newEntry);
    this.saveHistory(history);

    // Update patient's last visit date
    this.syncLastVisitDate(patientId);

    this.notify('create', 'history', newEntry);
    return newEntry;
  }

  public updateHistoryEntry(patientId: string, entryId: string, updatedFields: Partial<Omit<DentalHistoryEntry, 'id' | 'patientId'>>): DentalHistoryEntry {
    const history = this.getCachedHistory();
    
    const index = history.findIndex(h => h.id === entryId && h.patientId === patientId);
    if (index === -1) {
      throw new Error(`History entry not found for patient ${patientId}`);
    }
    history[index] = { ...history[index], ...updatedFields };
    this.saveHistory(history);

    this.syncLastVisitDate(patientId);

    this.notify('update', 'history', history[index]);
    return history[index];
  }

  public deleteHistoryEntry(patientId: string, entryId: string): boolean {
    const history = this.getCachedHistory();
    const originalCount = history.length;
    const filtered = history.filter(h => !(h.id === entryId && h.patientId === patientId));
    
    if (filtered.length === originalCount) return false;
    
    this.saveHistory(filtered);
    this.syncLastVisitDate(patientId);
    this.notify('delete', 'history', { id: entryId });
    return true;
  }

  private syncLastVisitDate(patientId: string): void {
    const history = this.getCachedHistory();
    const patientEntries = history.filter(h => h.patientId === patientId);
    
    let lastVisitDate = '-';
    if (patientEntries.length > 0) {
      const sorted = patientEntries.map(h => h.visitDate).sort();
      lastVisitDate = sorted[sorted.length - 1];
    }
    
    this.updatePatient(patientId, { lastVisitDate });
  }

  // --- Notes ---
  public addNote(patientId: string, noteData: Omit<PatientNote, 'id' | 'patientId'>): PatientNote {
    const notes = this.getCachedNotes();
    
    const newNote: PatientNote = {
      ...noteData,
      id: 'n-' + Math.random().toString(36).substring(2, 9),
      patientId
    };
    notes.push(newNote);
    this.saveNotes(notes);
    this.notify('create', 'note', newNote);
    return newNote;
  }

  public updateNote(patientId: string, noteId: string, updatedFields: Partial<Omit<PatientNote, 'id' | 'patientId'>>): PatientNote {
    const notes = this.getCachedNotes();
    
    const index = notes.findIndex(n => n.id === noteId && n.patientId === patientId);
    if (index === -1) {
      throw new Error(`Note not found for patient ${patientId}`);
    }
    notes[index] = { ...notes[index], ...updatedFields };
    this.saveNotes(notes);
    this.notify('update', 'note', notes[index]);
    return notes[index];
  }

  public deleteNote(patientId: string, noteId: string): boolean {
    const notes = this.getCachedNotes();
    const originalCount = notes.length;
    const filtered = notes.filter(n => !(n.id === noteId && n.patientId === patientId));
    
    if (filtered.length === originalCount) return false;
    
    this.saveNotes(filtered);
    this.notify('delete', 'note', { id: noteId });
    return true;
  }

  // --- Images ---
  public addImage(patientId: string, imageData: Omit<DentalImage, 'id' | 'patientId'>): DentalImage {
    const images = this.getCachedImages();
    const id = 'img-' + Math.random().toString(36).substring(2, 9);
    
    const imgObj: any = {
      id,
      patientId,
      date: imageData.date,
      type: imageData.type,
      title: imageData.title
    };

    // Save actual data to its separate specific key
    localStorage.setItem(`my_secretary_image_data_${id}`, imageData.dataUrl);

    // Dynamic getter for clean memory allocation
    Object.defineProperty(imgObj, 'dataUrl', {
      get() {
        return localStorage.getItem(`my_secretary_image_data_${id}`) || '';
      },
      set(value: string) {
        localStorage.setItem(`my_secretary_image_data_${id}`, value);
      },
      enumerable: true,
      configurable: true
    });

    const finalImg = imgObj as DentalImage;
    images.push(finalImg);
    this.saveImages(images);
    return finalImg;
  }

  public deleteImage(patientId: string, imageId: string): boolean {
    const images = this.getCachedImages();
    const originalCount = images.length;
    const filtered = images.filter(img => !(img.id === imageId && img.patientId === patientId));
    
    if (filtered.length === originalCount) return false;
    
    this.saveImages(filtered);
    localStorage.removeItem(`my_secretary_image_data_${imageId}`);
    return true;
  }

  // --- Drugs Registry ---
  private getCachedDrugs(): Drug[] {
    if (this._drugsCache === null) {
      const raw = localStorage.getItem(this.STORAGE_KEYS.DRUGS);
      this._drugsCache = raw ? JSON.parse(raw) : [];
    }
    return this._drugsCache!;
  }

  private saveDrugs(drugs: Drug[]): void {
    this._drugsCache = drugs;
    localStorage.setItem(this.STORAGE_KEYS.DRUGS, JSON.stringify(drugs));
    triggerAutoBackup().catch(err => console.warn("Auto-backup failed:", err));
  }

  public getDrugs(): Drug[] {
    return this.getCachedDrugs();
  }

  public saveDrug(drugData: Omit<Drug, 'id'> & { id?: string }): Drug {
    const drugs = this.getCachedDrugs();
    if (drugData.id) {
      const idx = drugs.findIndex(d => d.id === drugData.id);
      if (idx !== -1) {
        drugs[idx] = { ...drugs[idx], ...drugData } as Drug;
        this.saveDrugs(drugs);
        return drugs[idx];
      }
    }
    const newDrug: Drug = {
      ...drugData,
      id: drugData.id || 'dg-' + Math.random().toString(36).substring(2, 9)
    } as Drug;
    drugs.push(newDrug);
    this.saveDrugs(drugs);
    return newDrug;
  }

  public deleteDrug(id: string): boolean {
    const drugs = this.getCachedDrugs();
    const originalCount = drugs.length;
    const filtered = drugs.filter(d => d.id !== id);
    if (filtered.length === originalCount) return false;
    this.saveDrugs(filtered);
    return true;
  }

  // --- App Config Interfaces ---
  public getLanguage(): Language {
    return (localStorage.getItem(this.STORAGE_KEYS.LANGUAGE) as Language) || 'en';
  }

  public setLanguage(lang: Language): void {
    localStorage.setItem(this.STORAGE_KEYS.LANGUAGE, lang);
    const isRtl = lang === 'ar' || lang === 'ku';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  public getTheme(): Theme {
    return (localStorage.getItem(this.STORAGE_KEYS.THEME) as Theme) || 'light';
  }

  public setTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  public getPhotosRootPath(): string {
    return localStorage.getItem('my_secretary_photos_path') || '';
  }

  public setPhotosRootPath(path: string): void {
    localStorage.setItem('my_secretary_photos_path', path);
  }

  // Operations storage actions
  public getOperations(): PatientOperation[] {
    if (this._operationsCache === null) {
      const raw = localStorage.getItem(this.STORAGE_KEYS.OPERATIONS);
      this._operationsCache = raw ? JSON.parse(raw) : [];
    }

    // Automatically set done for operations matching today's local device date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let needsSave = false;
    const updated = this._operationsCache.map(op => {
      if (op.operationDate <= todayStr && !op.isDone) {
        needsSave = true;
        return { ...op, isDone: true };
      }
      return op;
    });

    if (needsSave) {
      this.saveOperations(updated);
    }

    return this._operationsCache!;
  }

  private saveOperations(operations: PatientOperation[]): void {
    this._operationsCache = operations;
    localStorage.setItem(this.STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
    triggerAutoBackup().catch(err => console.warn("Auto-backup failed:", err));
  }

  public addOperation(operation: Omit<PatientOperation, "id" | "createdAt">): PatientOperation {
    const operations = this.getOperations();
    const newOp: PatientOperation = {
      ...operation,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString()
    };
    operations.push(newOp);
    this.saveOperations(operations);
    this.notify('create', 'operation', newOp);
    return newOp;
  }

  public updateOperation(id: string, updated: Partial<PatientOperation>): PatientOperation {
    const operations = this.getOperations();
    const index = operations.findIndex(op => op.id === id);
    if (index === -1) {
      throw new Error(`Operation with ID ${id} not found.`);
    }
    const nextOp: PatientOperation = {
      ...operations[index],
      ...updated
    };
    operations[index] = nextOp;
    this.saveOperations(operations);
    this.notify('update', 'operation', nextOp);
    return nextOp;
  }

  public deleteOperation(id: string): boolean {
    const operations = this.getOperations();
    const filtered = operations.filter(op => op.id !== id);
    if (filtered.length === operations.length) return false;
    this.saveOperations(filtered);
    this.notify('delete', 'operation', { id });
    return true;
  }
}

// --- IndexedDB for Directory Handles (HTML5 File System Access API) ---
export function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open('my_secretary_db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('handles');
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'photos_root');
      tx.oncomplete = () => { db.close(); resolve(); };
    };
    request.onerror = () => resolve();
  });
}

export function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open('my_secretary_db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('handles');
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.close();
        resolve(null);
        return;
      }
      const tx = db.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      const getReq = store.get('photos_root');
      getReq.onsuccess = () => {
        db.close();
        resolve(getReq.result || null);
      };
      getReq.onerror = () => {
        db.close();
        resolve(null);
      };
    };
    request.onerror = () => resolve(null);
  });
}

export async function triggerAutoBackup(passedHandle?: any): Promise<void> {
  try {
    const handle = passedHandle || await getDirectoryHandle();
    if (!handle) {
      console.log("Auto-backup skipped: No directory connected.");
      return;
    }

    const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      console.log("Auto-backup skipped: 'readwrite' permission not granted.");
      return;
    }

    // Identify and delete previous auto-backup JSON entries from the folder
    try {
      const previousBackups: string[] = [];
      for await (const [name, entry] of (handle as any).entries()) {
        if (entry.kind === 'file' && name.startsWith('my_secretary_backup_') && name.endsWith('.json')) {
          previousBackups.push(name);
        }
      }
      for (const backupFileName of previousBackups) {
        await handle.removeEntry(backupFileName);
        console.log(`Deleted old backup file: ${backupFileName}`);
      }
    } catch (entriesErr) {
      console.warn("Failed to clean up old auto backup files:", entriesErr);
    }

    // Capture comprehensive backup data matching standard manual backup format
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newBackupName = `my_secretary_backup_${timestamp}.json`;

    const backupData = {
      app: "My Secretary Medical Records",
      version: "1.2",
      exportedAt: new Date().toISOString(),
      patients: JSON.parse(localStorage.getItem('my_secretary_patients') || '[]'),
      history: JSON.parse(localStorage.getItem('my_secretary_history') || '[]'),
      notes: JSON.parse(localStorage.getItem('my_secretary_notes') || '[]'),
      images: JSON.parse(localStorage.getItem('my_secretary_images') || '[]'),
      operations: JSON.parse(localStorage.getItem('my_secretary_operations') || '[]'),
      credentials: JSON.parse(localStorage.getItem('my_secretary_credentials') || 'null'),
      language: localStorage.getItem('my_secretary_language') || 'en',
      theme: localStorage.getItem('my_secretary_theme') || 'light'
    };

    const fileHandle = await handle.getFileHandle(newBackupName, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(JSON.stringify(backupData, null, 2));
    await writable.close();
    console.log(`Auto-backup saved successfully: ${newBackupName}`);
    localStorage.setItem('my_secretary_last_export_time', new Date().toISOString());
  } catch (err) {
    console.error("Auto backup execution failed:", err);
  }
}

export const dentalStorage: IDentalStorageService = new LocalStorageDentalService();

// Helper to parse typed IQD inputs into numbers, supporting automatically adding 3 zeros if length is short
export function parseIQDAmount(input: string): number {
  if (!input) return 0;
  let clean = input.trim();
  if (!clean) return 0;
  
  clean = clean.replace(/,/g, '.');
  
  if (/^\d+$/.test(clean) && clean.length <= 3) {
    return parseInt(clean, 10) * 1000;
  }
  
  if (clean.includes('.')) {
    const parts = clean.split('.');
    const main = parts[0];
    let thousandths = parts[1] || '';
    if (thousandths.length === 1) thousandths += '00';
    else if (thousandths.length === 2) thousandths += '0';
    else if (thousandths.length > 3) thousandths = thousandths.substring(0, 3);
    
    return parseInt(main, 10) * 1000 + (parseInt(thousandths.padEnd(3, '0'), 10) || 0);
  }
  
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }
  
  const digitsOnly = clean.replace(/\D/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

// Helper to format numeric values back to IQD dot-separated representation (e.g. 35000 -> "35.000")
export function formatIQDAmount(amount: number): string {
  if (isNaN(amount) || amount < 0) return '0.000';
  const main = Math.floor(amount / 1000);
  const rem = amount % 1000;
  return `${main}.${String(rem).padStart(3, '0')}`;
}
