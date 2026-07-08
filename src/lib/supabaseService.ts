/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Employee, Candidate } from '../types';
import { initialEmployees, initialCandidates } from '../mockData';

export interface DBDepartment {
  id: string;
  name: string;
}

export interface DBDesignation {
  id: string;
  title: string;
}

export interface DBSupabaseEmployee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: string | null;
  designation_id: string | null;
  reporting_manager_id: string | null;
  joining_date: string;
  status: 'Active' | 'Resigned' | 'Terminated' | 'Archived' | 'On Leave' | 'Suspended';
  salary: number;
}

// SQL Schema code for easy reference and user copy-pasting
export const SQL_SCHEMA_BLUEPRINT = `-- 🚀 COPY & PASTE THIS INTO YOUR SUPABASE SQL EDITOR

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create designations table
CREATE TABLE IF NOT EXISTS designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES designations(id) ON DELETE SET NULL,
    reporting_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    joining_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Archived')),
    salary NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    applied_role VARCHAR(255) NOT NULL,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('New', 'Interview Scheduled', 'Shortlisted', 'Selected', 'Rejected', 'Offer Pending', 'Offer Approved', 'Offer Sent', 'Joined')),
    score NUMERIC(2,1) DEFAULT 3.0,
    notes TEXT,
    interview_date TIMESTAMP WITH TIME ZONE,
    interview_feedback TEXT,
    interview_interviewer VARCHAR(255),
    salary_offered NUMERIC(12, 2) DEFAULT 0.00,
    converted_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Seed initial lookup values
INSERT INTO departments (name) VALUES 
('Engineering'), 
('Product'), 
('Marketing'), 
('Sales'), 
('HR Operations'), 
('Finance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO designations (title) VALUES 
('Engineering Manager'), 
('Senior Software Engineer'), 
('Software Engineer'), 
('Product Manager'), 
('HR Director'), 
('HR Specialist'), 
('Finance Analyst')
ON CONFLICT (title) DO NOTHING;
`;

// Helper to load fallback items from localStorage
const getLocalData = <T>(key: string, initial: T): T => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return initial;
    }
  }
  return initial;
};

const setLocalData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize fallback lookup lists
const defaultDepts: DBDepartment[] = [
  { id: 'dept-eng', name: 'Engineering' },
  { id: 'dept-prod', name: 'Product' },
  { id: 'dept-mktg', name: 'Marketing' },
  { id: 'dept-sales', name: 'Sales' },
  { id: 'dept-hr', name: 'HR Operations' },
  { id: 'dept-fin', name: 'Finance' },
];

const defaultDesigs: DBDesignation[] = [
  { id: 'des-em', title: 'Engineering Manager' },
  { id: 'des-sse', title: 'Senior Software Engineer' },
  { id: 'des-se', title: 'Software Engineer' },
  { id: 'des-pm', title: 'Product Manager' },
  { id: 'des-hrd', title: 'HR Director' },
  { id: 'des-hrs', title: 'HR Specialist' },
  { id: 'des-fa', title: 'Finance Analyst' },
];

export const supabaseService = {
  // Check if tables exist by querying departments count
  async checkTablesExist(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('departments').select('id').limit(1);
      if (error) {
        console.warn('Supabase tables might be missing:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // Get Departments
  async getDepartments(): Promise<DBDepartment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('departments').select('id, name').order('name');
      if (!error && data) {
        return data as DBDepartment[];
      }
    }
    return getLocalData<DBDepartment[]>('hr_departments', defaultDepts);
  },

  // Add Department
  async createDepartment(name: string): Promise<DBDepartment> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('departments').insert([{ name }]).select().single();
      if (!error && data) {
        return data as DBDepartment;
      }
    }
    const local = getLocalData<DBDepartment[]>('hr_departments', defaultDepts);
    const newItem: DBDepartment = { id: `dept-${Date.now()}`, name };
    local.push(newItem);
    setLocalData('hr_departments', local);
    return newItem;
  },

  // Get Designations
  async getDesignations(): Promise<DBDesignation[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('designations').select('id, title').order('title');
      if (!error && data) {
        return data as DBDesignation[];
      }
    }
    return getLocalData<DBDesignation[]>('hr_designations', defaultDesigs);
  },

  // Add Designation
  async createDesignation(title: string): Promise<DBDesignation> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('designations').insert([{ title }]).select().single();
      if (!error && data) {
        return data as DBDesignation;
      }
    }
    const local = getLocalData<DBDesignation[]>('hr_designations', defaultDesigs);
    const newItem: DBDesignation = { id: `des-${Date.now()}`, title };
    local.push(newItem);
    setLocalData('hr_designations', local);
    return newItem;
  },

  // Get Employees (with joined relation resolution)
  async getEmployees(): Promise<{ data: Employee[]; isRealSupabase: boolean; errorMsg?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select(`
            id,
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            department_id,
            designation_id,
            reporting_manager_id,
            joining_date,
            status,
            salary,
            departments (name),
            designations (title)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          return {
            data: this.getFallbackEmployees(),
            isRealSupabase: false,
            errorMsg: `Supabase query failed: ${error.message}. You might need to create the database tables. Check instructions below.`
          };
        }

        // Map database records to frontend Employee type
        const mapped: Employee[] = (data || []).map((emp: any) => {
          const deptName = emp.departments?.name || 'Unassigned';
          const desigTitle = emp.designations?.title || 'Staff Specialist';
          return {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            phone: emp.phone || '',
            department: deptName,
            role: desigTitle,
            status: emp.status,
            joinDate: emp.joining_date,
            salary: emp.salary ? Number(emp.salary) : 0,
            avatarUrl: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces`,
            employee_code: emp.employee_code,
            first_name: emp.first_name,
            last_name: emp.last_name,
            department_id: emp.department_id,
            designation_id: emp.designation_id,
            reporting_manager_id: emp.reporting_manager_id
          };
        });

        return { data: mapped, isRealSupabase: true };
      } catch (err: any) {
        return {
          data: this.getFallbackEmployees(),
          isRealSupabase: false,
          errorMsg: err.message || 'Unknown Supabase connection error.'
        };
      }
    }

    return { data: this.getFallbackEmployees(), isRealSupabase: false };
  },

  getFallbackEmployees(): Employee[] {
    const defaultData: Employee[] = initialEmployees.map((emp, index) => ({
      ...emp,
      employee_code: `EMP${String(index + 1).padStart(3, '0')}`,
      first_name: emp.name.split(' ')[0],
      last_name: emp.name.split(' ').slice(1).join(' ') || 'Staff',
      department_id: `dept-${emp.department.toLowerCase().slice(0, 3)}`,
      designation_id: `des-${emp.role.toLowerCase().slice(0, 3)}`
    }));
    return getLocalData<Employee[]>('hr_employees', defaultData);
  },

  // Save Employee (Create or Update)
  async saveEmployee(empData: Partial<Employee>): Promise<{ success: boolean; data?: Employee; errorMsg?: string }> {
    const isNew = !empData.id || empData.id.startsWith('temp-');
    
    // Extract first and last names
    let firstName = empData.first_name || '';
    let lastName = empData.last_name || '';
    if (!firstName && empData.name) {
      const parts = empData.name.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || 'Staff';
    }

    if (isSupabaseConfigured) {
      try {
        const payload: any = {
          employee_code: empData.employee_code || `EMP${Math.floor(100 + Math.random() * 900)}`,
          first_name: firstName,
          last_name: lastName,
          email: empData.email,
          phone: empData.phone || '',
          department_id: empData.department_id || null,
          designation_id: empData.designation_id || null,
          reporting_manager_id: empData.reporting_manager_id || null,
          joining_date: empData.joinDate || new Date().toISOString().split('T')[0],
          status: empData.status || 'Active',
          salary: empData.salary || 0,
        };

        let result;
        if (isNew) {
          result = await supabase.from('employees').insert([payload]).select().single();
        } else {
          result = await supabase.from('employees').update(payload).eq('id', empData.id).select().single();
        }

        if (result.error) {
          return { success: false, errorMsg: result.error.message };
        }

        // Fetch departments & designations for this record to map it correctly
        const { data: dept } = empData.department_id 
          ? await supabase.from('departments').select('name').eq('id', empData.department_id).single()
          : { data: null };
        const { data: desig } = empData.designation_id
          ? await supabase.from('designations').select('title').eq('id', empData.designation_id).single()
          : { data: null };

        const saved = result.data;
        const mappedEmp: Employee = {
          id: saved.id,
          name: `${saved.first_name} ${saved.last_name}`,
          email: saved.email,
          phone: saved.phone || '',
          department: dept?.name || 'Unassigned',
          role: desig?.title || 'Staff Specialist',
          status: saved.status,
          joinDate: saved.joining_date,
          salary: Number(saved.salary),
          avatarUrl: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces`,
          employee_code: saved.employee_code,
          first_name: saved.first_name,
          last_name: saved.last_name,
          department_id: saved.department_id,
          designation_id: saved.designation_id,
          reporting_manager_id: saved.reporting_manager_id
        };

        return { success: true, data: mappedEmp };
      } catch (err: any) {
        return { success: false, errorMsg: err.message || 'Failed to save to Supabase' };
      }
    }

    // Fallback Simulation Mode
    const local = this.getFallbackEmployees();
    let savedLocal: Employee;

    if (isNew) {
      savedLocal = {
        ...empData,
        id: `EMP${String(local.length + 1).padStart(3, '0')}`,
        name: `${firstName} ${lastName}`,
        email: empData.email || '',
        phone: empData.phone || '',
        department: empData.department || 'Engineering',
        role: empData.role || 'Software Engineer',
        status: empData.status || 'Active',
        joinDate: empData.joinDate || new Date().toISOString().split('T')[0],
        salary: Number(empData.salary) || 60000,
        employee_code: empData.employee_code || `EMP${String(local.length + 1).padStart(3, '0')}`,
        first_name: firstName,
        last_name: lastName,
      };
      local.unshift(savedLocal);
    } else {
      const idx = local.findIndex(e => e.id === empData.id);
      savedLocal = {
        ...local[idx],
        ...empData,
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
      };
      if (idx !== -1) {
        local[idx] = savedLocal;
      }
    }

    setLocalData('hr_employees', local);
    return { success: true, data: savedLocal };
  },

  // Delete Employee
  async deleteEmployee(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (!error) return true;
    }
    const local = this.getFallbackEmployees();
    const filtered = local.filter(e => e.id !== id);
    setLocalData('hr_employees', filtered);
    return true;
  },

  // Get Candidates
  async getCandidates(): Promise<{ data: Candidate[]; isRealSupabase: boolean; errorMsg?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return {
            data: this.getFallbackCandidates(),
            isRealSupabase: false,
            errorMsg: `Supabase candidates query failed: ${error.message}. You might need to create the candidates table.`
          };
        }

        // Map db records
        const mapped: Candidate[] = (data || []).map((cand: any) => ({
          id: cand.id,
          name: cand.name,
          email: cand.email,
          phone: cand.phone || '',
          appliedRole: cand.applied_role,
          appliedDate: cand.applied_date,
          status: cand.status,
          score: cand.score ? Number(cand.score) : 3,
          notes: cand.notes || '',
          interviewDate: cand.interview_date || '',
          interviewFeedback: cand.interview_feedback || '',
          interviewInterviewer: cand.interview_interviewer || '',
          salaryOffered: cand.salary_offered ? Number(cand.salary_offered) : 0,
          converted_employee_id: cand.converted_employee_id || undefined,
          offer_letter_url: cand.offer_letter_url || undefined,
        }));

        return { data: mapped, isRealSupabase: true };
      } catch (err: any) {
        return {
          data: this.getFallbackCandidates(),
          isRealSupabase: false,
          errorMsg: err.message || 'Unknown Supabase connection error.'
        };
      }
    }
    return { data: this.getFallbackCandidates(), isRealSupabase: false };
  },

  getFallbackCandidates(): Candidate[] {
    return getLocalData<Candidate[]>('hr_candidates', initialCandidates);
  },

  // Save Candidate (Create or Update)
  async saveCandidate(candidate: Partial<Candidate>): Promise<{ success: boolean; data?: Candidate; errorMsg?: string }> {
    console.log('saveCandidate called with:', candidate);
    const isNew = !candidate.id || candidate.id.startsWith('temp-') || candidate.id.startsWith('CAN_temp') || candidate.id.startsWith('CAN');

    if (isSupabaseConfigured) {
      try {
        const payload: any = {
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || '',
          applied_role: candidate.appliedRole,
          applied_date: candidate.appliedDate || new Date().toISOString().split('T')[0],
          status: candidate.status || 'New',
          score: candidate.score || 3,
          notes: candidate.notes || '',
          interview_date: candidate.interviewDate || null,
          interview_feedback: candidate.interviewFeedback || null,
          interview_interviewer: candidate.interviewInterviewer || null,
          salary_offered: candidate.salaryOffered || 0,
          converted_employee_id: candidate.converted_employee_id || null,
        };

        let result;
        if (isNew) {
          result = await supabase.from('candidates').insert([payload]).select().single();
        } else {
          result = await supabase.from('candidates').update(payload).eq('id', candidate.id).select().single();
        }

        if (result.error) {
          console.warn('Supabase save error, falling back to local simulation:', result.error.message);
        } else {
          const saved = result.data;
          const mappedCand: Candidate = {
            id: saved.id,
            name: saved.name,
            email: saved.email,
            phone: saved.phone || '',
            appliedRole: saved.applied_role,
            appliedDate: saved.applied_date,
            status: saved.status,
            score: Number(saved.score),
            notes: saved.notes || '',
            interviewDate: saved.interview_date || '',
            interviewFeedback: saved.interview_feedback || '',
            interviewInterviewer: saved.interview_interviewer || '',
            salaryOffered: Number(saved.salary_offered),
            converted_employee_id: saved.converted_employee_id || undefined,
            offer_letter_url: saved.offer_letter_url || undefined,
          };

          return { success: true, data: mappedCand };
        }
      } catch (err: any) {
        console.warn('Supabase save exception, falling back to local simulation:', err.message);
      }
    }

    // Fallback LocalStorage Mode (Sandbox Mode)
    const local = this.getFallbackCandidates();
    let savedLocal: Candidate;

    if (isNew) {
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `CAN-${Date.now()}`;
      savedLocal = {
        id: generatedId,
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        appliedRole: candidate.appliedRole || '',
        appliedDate: candidate.appliedDate || new Date().toISOString().split('T')[0],
        status: candidate.status || 'New',
        score: candidate.score || 3,
        notes: candidate.notes || '',
        interviewDate: candidate.interviewDate || '',
        interviewFeedback: candidate.interviewFeedback || '',
        interviewInterviewer: candidate.interviewInterviewer || '',
        salaryOffered: candidate.salaryOffered || 0,
        converted_employee_id: candidate.converted_employee_id || null as any,
        offer_letter_url: candidate.offer_letter_url || null as any,
      };
      local.unshift(savedLocal);
    } else {
      const idx = local.findIndex(c => c.id === candidate.id);
      savedLocal = {
        ...(idx !== -1 ? local[idx] : {}),
        ...candidate,
      } as Candidate;
      if (idx !== -1) {
        local[idx] = savedLocal;
      }
    }

    setLocalData('hr_candidates', local);
    return { success: true, data: savedLocal };
  },

  // Convert selected candidate to employee
  async convertCandidateToEmployee(candidateId: string, empDetails: Partial<Employee>): Promise<{ success: boolean; candidate?: Candidate; employee?: Employee; errorMsg?: string }> {
    // 1. Create employee record in employees table
    const empResult = await this.saveEmployee(empDetails);
    if (!empResult.success || !empResult.data) {
      return { success: false, errorMsg: empResult.errorMsg || 'Failed to create employee record.' };
    }

    const newEmployee = empResult.data;

    // 2. Fetch the candidate to update status & link converted_employee_id
    let candToUpdate: Partial<Candidate> | null = null;
    if (isSupabaseConfigured) {
      try {
        const { data: cand } = await supabase.from('candidates').select('*').eq('id', candidateId).single();
        if (cand) {
          candToUpdate = {
            id: cand.id,
            name: cand.name,
            email: cand.email,
            phone: cand.phone || '',
            appliedRole: cand.applied_role,
            appliedDate: cand.applied_date,
            score: Number(cand.score),
            notes: cand.notes || '',
            interviewDate: cand.interview_date || '',
            interviewFeedback: cand.interview_feedback || '',
            interviewInterviewer: cand.interview_interviewer || '',
            salaryOffered: Number(cand.salary_offered),
          };
        }
      } catch (err) {
        // ignore, will fallback
      }
    }

    if (!candToUpdate) {
      const fallbackList = this.getFallbackCandidates();
      const cand = fallbackList.find(c => c.id === candidateId);
      if (cand) {
        candToUpdate = { ...cand };
      }
    }

    if (!candToUpdate) {
      return { success: false, errorMsg: 'Candidate not found.' };
    }

    candToUpdate.status = 'Joined';
    candToUpdate.converted_employee_id = newEmployee.id;

    // 3. Save candidate
    const candResult = await this.saveCandidate(candToUpdate);
    if (!candResult.success || !candResult.data) {
      return { success: false, errorMsg: candResult.errorMsg || 'Failed to update candidate record after employee creation.' };
    }

    return {
      success: true,
      candidate: candResult.data,
      employee: newEmployee,
    };
  },

  // Delete Candidate
  async deleteCandidate(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (!error) return true;
    }
    const local = this.getFallbackCandidates();
    const filtered = local.filter(c => c.id !== id);
    setLocalData('hr_candidates', filtered);
    return true;
  }
};
