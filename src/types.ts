export type Language = 'en' | 'ar' | 'ku';
export type Theme = 'light' | 'dark';
export type UserRole = 'doctor' | 'secretary';

export interface UserCredentials {
  username: string;
  passwordHash: string; // we'll store basic verification hashes or strings
}

export interface Patient {
  id: string; // unique internal UUID
  patientId: string; // Doctor-assigned visible ID (e.g., P-1024)
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  createdAt: string;
  lastVisitDate: string;
  paymentType?: 'free' | 'paid';
  paymentAmount?: number;
}

export interface DentalHistoryEntry {
  id: string;
  patientId: string; // refers to Patient.id
  visitDate: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  billingAmount?: number;
}

export interface PatientNote {
  id: string;
  patientId: string; // refers to Patient.id
  date: string;
  title: string;
  content: string;
}

export interface DentalImage {
  id: string;
  patientId: string; // refers to Patient.id
  date: string;
  type: 'xray' | 'mri' | 'ct' | 'lab' | 'other';
  title: string;
  dataUrl: string; // base64 encoded image or loaded asset data
}

export interface PatientFullRecord extends Patient {
  history: DentalHistoryEntry[];
  notes: PatientNote[];
  images: DentalImage[];
}

export interface Drug {
  id: string;
  tradeName: string;
  scientificName: string;
  dosageForm: string;
  strength: string;
  instructions: string;
}

export function getDrugEmoji(dosageForm?: string): string {
  if (!dosageForm) return '💊';
  const form = dosageForm.toLowerCase();
  if (form.includes('tablet') || form.includes('حبة')) return '⚪';
  if (form.includes('capsule') || form.includes('كبسولة')) return '💊';
  if (form.includes('syrup') || form.includes('شراب') || form.includes('suspension') || form.includes('معلق')) return '🥄';
  if (form.includes('injection') || form.includes('إبرة') || form.includes('inj')) return '💉';
  if (form.includes('ointment') || form.includes('cream') || form.includes('مرهم') || form.includes('gel') || form.includes('جل')) return '🧴';
  if (form.includes('drops') || form.includes('قطرات')) return '💧';
  if (form.includes('inhaler') || form.includes('بخاخ')) return '🌬️';
  if (form.includes('powder') || form.includes('بودرة')) return '🧂';
  return '💊';
}

// Abstract Storage Layer interface
export interface PatientOperation {
  id: string;
  patientId: string;
  patientName: string;
  operationName: string;
  operationDate: string; // YYYY-MM-DD
  notes?: string;
  isDone: boolean;
  createdAt: string;
}

export interface IDentalStorageService {
  // Authentication
  getCredentials(role?: UserRole): UserCredentials;
  saveCredentials(credentials: UserCredentials, role?: UserRole): void;
  
  // Patients
  getPatients(): Patient[];
  getPatient(id: string): PatientFullRecord | null;
  addPatient(patient: Omit<Patient, 'createdAt' | 'lastVisitDate'>): Patient;
  updatePatient(id: string, patient: Partial<Patient>): Patient;
  deletePatient(id: string): boolean;
  
  // Dental History
  addHistoryEntry(patientId: string, entry: Omit<DentalHistoryEntry, 'id' | 'patientId'>): DentalHistoryEntry;
  updateHistoryEntry(patientId: string, entryId: string, entry: Partial<Omit<DentalHistoryEntry, 'id' | 'patientId'>>): DentalHistoryEntry;
  deleteHistoryEntry(patientId: string, entryId: string): boolean;
  
  // Notes
  addNote(patientId: string, note: Omit<PatientNote, 'id' | 'patientId'>): PatientNote;
  updateNote(patientId: string, noteId: string, note: Partial<Omit<PatientNote, 'id' | 'patientId'>>): PatientNote;
  deleteNote(patientId: string, noteId: string): boolean;
  
  // Images
  addImage(patientId: string, image: Omit<DentalImage, 'id' | 'patientId'>): DentalImage;
  deleteImage(patientId: string, imageId: string): boolean;

  // Drugs Registry
  getDrugs(): Drug[];
  saveDrug(drug: Omit<Drug, 'id'> & { id?: string }): Drug;
  deleteDrug(id: string): boolean;

  // Operations
  getOperations(): PatientOperation[];
  addOperation(operation: Omit<PatientOperation, 'id' | 'createdAt'>): PatientOperation;
  updateOperation(id: string, operation: Partial<PatientOperation>): PatientOperation;
  deleteOperation(id: string): boolean;
  
  // App Config
  getLanguage(): Language;
  setLanguage(lang: Language): void;
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  getPhotosRootPath(): string;
  setPhotosRootPath(path: string): void;
  subscribe(cb: (action: 'create' | 'update' | 'delete', itemType: 'patient' | 'history' | 'note' | 'operation', data: any) => void): void;
}
