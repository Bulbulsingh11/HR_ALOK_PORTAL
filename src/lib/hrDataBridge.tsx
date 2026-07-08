import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadImportedData, saveImportedData, clearImportedData } from './indexedDbHelper';

// Types — kept in sync with hrMetrics.ts HRRecord
export interface HRRecord {
  employee_id?: string | number;
  name?: string;
  department?: string;
  employment_status?: string;
  date_of_joining?: Date | null;
  exit_date?: Date | null;
  offer_date?: Date | null;
  job_posted_date?: Date | null;
  interview_date?: Date | null;
  gender?: string;
  marital_status?: string;
  designation?: string;
  plant_location?: string;
  recruitment_source?: string;
  recruiter_name?: string;
  tat_days?: number;
  cost_per_hire_inr?: number;
  monthly_ctc_inr?: number;
  exit_reason?: string;
  tenure_days?: number;
  category?: string;
  total_experience_years?: number;
  survey_status?: string;
  hire_type?: 'new' | 'replacement' | '';
  replacement_for?: string;
  base_cost_per_hire?: number;
  top_up_cost?: number;
  attrition_type?: 'voluntary' | 'involuntary' | '';
}

interface HRDataContextValue {
  data: HRRecord[];
  setData: (records: HRRecord[]) => void;
  isHydrating: boolean;
}

const HRDataContext = createContext<HRDataContextValue | undefined>(undefined);

export const HRDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<HRRecord[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);

  // One‑time cleanup of legacy raw data in localStorage (pre‑fix for quota bug)
  useEffect(() => {
    const legacy = localStorage.getItem('alok_hr_imported_data');
    if (legacy) {
      console.warn('Cleaning up legacy HR import data from localStorage to prevent quota errors.');
      localStorage.removeItem('alok_hr_imported_data');
    }
  }, []);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const records = await loadImportedData();
        if (records && Array.isArray(records)) {
          const formatted = records.map((r: any) => ({
            ...r,
            date_of_joining: r.date_of_joining ? new Date(r.date_of_joining) : null,
            exit_date: r.exit_date ? new Date(r.exit_date) : null,
            offer_date: r.offer_date ? new Date(r.offer_date) : null,
            job_posted_date: r.job_posted_date ? new Date(r.job_posted_date) : null,
            interview_date: r.interview_date ? new Date(r.interview_date) : null,
          }));
          setData(formatted);
        }
      } catch (err) {
        console.error('Error hydrating HR data from IndexedDB:', err);
      } finally {
        setIsHydrating(false);
      }
    }
    hydrate();
  }, []);

  const setAndPersistData = async (records: HRRecord[]) => {
    setData(records);
    try {
      if (records.length > 0) {
        await saveImportedData(records);
      } else {
        await clearImportedData();
      }
    } catch (err) {
      console.error('Failed to persist HR data to IndexedDB:', err);
    }
  };

  return (
    <HRDataContext.Provider value={{ data, setData: setAndPersistData, isHydrating }}>
      {children}
    </HRDataContext.Provider>
  );
};

export const useHRData = (): HRDataContextValue => {
  const context = useContext(HRDataContext);
  if (!context) {
    throw new Error('useHRData must be used within an HRDataProvider');
  }
  return context;
};

// Short‑term note: this in‑memory store does NOT survive page refreshes.
// For production, migrate the dataset to Supabase storage and fetch it as needed.

