/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Filter,
  UserCheck,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  Trash2,
  X,
  Edit2,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  PhoneCall,
  History,
  Landmark,
  ShieldAlert,
  ChevronRight,
  Database,
  ArrowRight,
  Sparkles,
  Check,
  ChevronLeft,
  UserMinus
} from 'lucide-react';
import { Employee } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useHRData } from '../lib/hrDataBridge';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onRemoveEmployee: (id: string) => void;
  onStatusChange: (id: string, status: any) => void;
  onPageChange?: (page: any) => void;
}

export default function EmployeesView({
  employees: parentEmployees,
  onAddEmployee,
  onRemoveEmployee,
  onStatusChange,
  onPageChange,
}: EmployeesViewProps) {
  // Database lookup & list state
  const [employees, setEmployees] = useState<Employee[]>(parentEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  
  // Tabs for the main viewer
  const [activeTab, setActiveTab] = useState<'org' | 'personal' | 'address' | 'emergency' | 'history' | 'bank' | 'salary'>('org');

  // Form states (Add & Edit Employee Modal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  // 75-field Form Values
  const [formValues, setFormValues] = useState<Partial<Employee>>({});

  // Resignation Modal States
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [resignationDate, setResignationDate] = useState('');
  const [isResigning, setIsResigning] = useState(false);

  // ── HR Reports imported data (read-only from HRDataProvider context) ──
  const { data: hrImportedData, isHydrating } = useHRData();
  const hrDataLoaded = hrImportedData && hrImportedData.length > 0;
  const [hrSearchQuery, setHrSearchQuery] = useState('');
  const [hrDeptFilter, setHrDeptFilter] = useState('All');
  const [hrStatusFilter, setHrStatusFilter] = useState('All');
  const [hrSelectedEmp, setHrSelectedEmp] = useState<any | null>(null);


  // Initialize selected employee with first one if available
  useEffect(() => {
    if (parentEmployees && parentEmployees.length > 0) {
      setEmployees(parentEmployees);
      if (!selectedEmployee) {
        setSelectedEmployee(parentEmployees[0]);
      } else {
        // Keep selected employee in sync
        const current = parentEmployees.find(e => e.id === selectedEmployee.id);
        if (current) setSelectedEmployee(current);
      }
    }
  }, [parentEmployees]);

  // Action: Open Form for New Employee
  const handleOpenAddForm = () => {
    setIsEditing(false);
    setFormStep(1);
    setFormError(null);
    setFormValues({
      Employee_Status: 'Active',
      Employment_Type: 'Full-time',
      Salutation: 'Mr.',
      Gender: 'Male',
      Marital_Status: 'Single',
      Blood_Group: 'O+',
      Date_Of_Joining: new Date().toISOString().split('T')[0],
      Company_Description: 'ALOK Corporate',
      Department_Description: 'Corporate HR',
      Designation_Description: 'Executive',
      Grade_Code: 'G1',
      Grade_Description: 'General Associate',
      Location2_Description: 'HQ - Mumbai Office',
      Basic_Salary: 25000,
      Medical: 1250,
      Special_Allowance: 5000,
      Stipend: 0,
      Food_Coupon_Allowance: 2000,
      House_Rent_Allowance: 10000,
      Conveyance_Allowance: 1600,
      Education_Allowance: 0,
      DA: 0,
      Displacement_Allow: 0,
      Statutory_Bonus: 2000,
      Leave_Travel_Allowance_CTC: 3000,
      LWF: 150,
      Transport_Allowance: 0,
      Employer_PF: 1800,
      Employer_ESIC: 0,
      Employee_ESIC: 0,
      Variable_Incentive_CTC: 5000,
      Gratuity: 1205,
      MONTHLY_GROSS: 45000,
      MonthlyCTC: 51155,
      ANNUAL_GROSS: 540000,
      TOTALCTC: 613860,
    });
    setIsFormOpen(true);
  };

  // Action: Open Form for Editing Employee
  const handleOpenEditForm = (emp: Employee) => {
    setIsEditing(true);
    setFormStep(1);
    setFormError(null);
    setFormValues({ ...emp });
    setIsFormOpen(true);
  };

  // Handlers for dynamic math in salary calculations
  const calculateSalaryMetrics = (vals: Partial<Employee>) => {
    const basic = Number(vals.Basic_Salary || 0);
    const med = Number(vals.Medical || 0);
    const spec = Number(vals.Special_Allowance || 0);
    const stip = Number(vals.Stipend || 0);
    const food = Number(vals.Food_Coupon_Allowance || 0);
    const hra = Number(vals.House_Rent_Allowance || 0);
    const conv = Number(vals.Conveyance_Allowance || 0);
    const edu = Number(vals.Education_Allowance || 0);
    const da = Number(vals.DA || 0);
    const disp = Number(vals.Displacement_Allow || 0);
    const bonus = Number(vals.Statutory_Bonus || 0);
    const lta = Number(vals.Leave_Travel_Allowance_CTC || 0);
    const trans = Number(vals.Transport_Allowance || 0);
    const varInc = Number(vals.Variable_Incentive_CTC || 0);

    const gross = basic + med + spec + stip + food + hra + conv + edu + da + disp + bonus + lta + trans + varInc;
    
    // PF Calculation
    const pfBase = Math.min(basic, Number(vals.Pf_Base_Salary || 15000));
    const empPF = pfBase > 0 ? Math.round(pfBase * 0.12) : 0;
    
    // ESIC (if applicable)
    const empESIC = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
    const employeeESIC = gross <= 21000 ? Math.round(gross * 0.0075) : 0;

    const lwF = Number(vals.LWF || 150);
    const gratuity = Math.round((basic * 15) / 26 / 12); // standard formula representation

    const mCtc = gross + empPF + empESIC + gratuity + lwF;

    return {
      MONTHLY_GROSS: gross,
      MonthlyCTC: mCtc,
      Employer_PF: empPF,
      Employer_ESIC: empESIC,
      Employee_ESIC: employeeESIC,
      Gratuity: gratuity,
      ANNUAL_GROSS: gross * 12,
      TOTALCTC: mCtc * 12,
    };
  };

  const handleSalaryFieldChange = (field: keyof Employee, value: number) => {
    const updatedValues = { ...formValues, [field]: value };
    const calculated = calculateSalaryMetrics(updatedValues);
    setFormValues({
      ...updatedValues,
      ...calculated
    });
  };

  // Same as Present Address sync
  const handleAddressSync = (checked: boolean) => {
    if (checked) {
      setFormValues(prev => ({
        ...prev,
        Permanent_Address1: prev.Present_Address1 || '',
        Permanent_Address2: prev.Present_Address2 || '',
        PermanentCity: prev.Present_City || '',
        PermanentState: prev.Present_State || '',
        Permanent_Pin: prev.Present_Pin || '',
      }));
    }
  };

  // Save changes to database / localStorage
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form Validation Checks
    if (!formValues.Employee_Code) {
      setFormError('Employee Code is required.');
      setFormStep(2); // Jump to Personal/General Info step
      return;
    }
    if (!formValues.FirstName || !formValues.Employee_Name) {
      setFormError('First Name and Full Employee Name are required.');
      setFormStep(2);
      return;
    }
    if (!formValues.Official_Email) {
      setFormError('Official Email is required.');
      setFormStep(4); // Emergency & Contact step
      return;
    }

    setIsLoading(true);

    // Package the payload to match Employee types
    const finalPayload: Employee = {
      id: formValues.id || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      name: formValues.Employee_Name || `${formValues.FirstName || ''} ${formValues.Salutation || ''}`,
      email: formValues.Official_Email || formValues.Personal_Email || '',
      phone: formValues.Emergency_Contact_Number || '',
      department: formValues.Department_Description || 'Unassigned',
      role: formValues.Designation_Description || 'Staff Specialist',
      status: (formValues.Employee_Status as any) || 'Active',
      joinDate: formValues.Date_Of_Joining || new Date().toISOString().split('T')[0],
      salary: Number(formValues.MonthlyCTC || formValues.salary || 50000),
      ...formValues
    };

    try {
      const result = await supabaseService.saveEmployee(finalPayload);
      if (result.success && result.data) {
        if (isEditing) {
          // Edit existing
          onStatusChange(result.data.id, result.data.status);
          // Reload local states
          const updatedEmps = employees.map(emp => emp.id === result.data!.id ? result.data! : emp);
          setEmployees(updatedEmps);
          setSelectedEmployee(result.data);
        } else {
          // Add new
          onAddEmployee(result.data);
          setEmployees(prev => [result.data!, ...prev]);
          setSelectedEmployee(result.data);
        }
        setIsFormOpen(false);
      } else {
        setFormError(result.errorMsg || 'Failed to save employee profile. Try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the employee record.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Remove Employee completely
  const handleRemoveClick = async (empId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the profile for ${selectedEmployee?.name}?`)) {
      return;
    }
    setIsLoading(true);
    try {
      const success = await supabaseService.deleteEmployee(empId);
      if (success) {
        onRemoveEmployee(empId);
        const filtered = employees.filter(e => e.id !== empId);
        setEmployees(filtered);
        setSelectedEmployee(filtered.length > 0 ? filtered[0] : null);
      } else {
        alert('Could not remove employee record. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred during deletion.');
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-Company Filter lists
  const availableCompanies = ['All', 'ALOK Corporate', 'ALOK Industries', 'ALOK Textiles'];

  // Filter & search implementation
  const filteredEmployees = employees.filter(emp => {
    const searchString = `${emp.name} ${emp.Employee_Code || emp.id} ${emp.department} ${emp.role}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const companyName = emp.Company_Description || 'ALOK Corporate';
    const matchesCompany = companyFilter === 'All' || companyName === companyFilter;

    return matchesSearch && matchesCompany;
  });

  // Count employees per company for badges
  const getCompanyCount = (comp: string) => {
    if (comp === 'All') return employees.length;
    return employees.filter(emp => (emp.Company_Description || 'ALOK Corporate') === comp).length;
  };

  // Status Badge styling helper
  const getStatusBadgeStyles = (status: string | undefined) => {
    const s = status || 'Active';
    if (s === 'Active') {
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-150', dot: 'bg-emerald-500' };
    } else if (s === 'Inactive' || s === 'Terminated' || s === 'Resigned') {
      return { bg: 'bg-rose-50 text-rose-700 border-rose-150', dot: 'bg-rose-500' };
    } else {
      // On Probation / On Leave
      return { bg: 'bg-amber-50 text-amber-700 border-amber-150', dot: 'bg-amber-500' };
    }
  };

  const handleMarkResigned = async () => {
    if (!resignationDate || !selectedEmployee) return;
    setIsResigning(true);
    try {
      const { error } = await supabase.from('employee_triggers')
        .update({
          employment_status: 'resigned',
          resignation_date: resignationDate
        })
        .eq('employee_email', selectedEmployee.Official_Email || selectedEmployee.email);

      if (error) throw error;
      
      // Update local state if needed
      onStatusChange(selectedEmployee.id, 'Resigned');
      const updated = { ...selectedEmployee, Employee_Status: 'Resigned', status: 'Resigned' as any };
      setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? updated : e));
      setSelectedEmployee(updated);
      setIsResignModalOpen(false);
      alert('Employee marked as resigned. Exit form will be triggered.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to mark as resigned');
    } finally {
      setIsResigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-6" id="hr-employee-system-container">
      {/* Resignation Modal */}
      {isResignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-rose-500" /> Mark as Resigned
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter the resignation date for {selectedEmployee?.name}. This will trigger the exit feedback form.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Resignation Date</label>
                <input 
                  type="date" 
                  value={resignationDate}
                  onChange={e => setResignationDate(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setIsResignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleMarkResigned}
                  disabled={isResigning || !resignationDate}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {isResigning ? 'Processing...' : 'Confirm Resignation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HR REPORTS DATA PANEL — reads from alok_hr_imported_data
          ══════════════════════════════════════════════════════ */}
      {(() => {
        if (isHydrating) {
          return (
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-xs overflow-hidden p-6 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-750 rounded"></div>
                <div className="h-6 w-24 bg-slate-100 dark:bg-slate-750 rounded"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 dark:bg-slate-750 rounded-xl"></div>
                ))}
              </div>
              <div className="h-10 bg-slate-150 dark:bg-slate-750 rounded-xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 bg-slate-100 dark:bg-slate-750 rounded-xl"></div>
                ))}
              </div>
            </div>
          );
        }

        // Derived stats
        const totalActive = hrImportedData.filter(e => e.employment_status === 'Active').length;
        const totalResigned = hrImportedData.filter(e => e.employment_status === 'Resigned').length;
        const uniqueDepts = new Set(hrImportedData.map(e => e.department).filter(Boolean)).size;
        const avgCTC = totalActive > 0
          ? Math.round(
              hrImportedData
                .filter(e => e.employment_status === 'Active')
                .reduce((sum, e) => sum + (Number(e.monthly_ctc_inr) || 0), 0)
              / totalActive
            )
          : 0;

        const departments = ['All', ...Array.from(
          new Set(hrImportedData.map((e: any) => e.department).filter(Boolean))
        ).sort()] as string[];

        const hrFiltered = hrImportedData.filter(emp => {
          const matchesSearch =
            emp.name?.toLowerCase().includes(hrSearchQuery.toLowerCase()) ||
            String(emp.employee_id || '').toLowerCase().includes(hrSearchQuery.toLowerCase()) ||
            emp.designation?.toLowerCase().includes(hrSearchQuery.toLowerCase());
          const matchesDept = hrDeptFilter === 'All' || emp.department === hrDeptFilter;
          const matchesStatus = hrStatusFilter === 'All' || emp.employment_status === hrStatusFilter;
          return matchesSearch && matchesDept && matchesStatus;
        });

        const formatDate = (d: any) => {
          if (!d) return '—';
          try {
            return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          } catch { return String(d); }
        };

        return (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-xs overflow-hidden">
            {/* Panel Header */}
            <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-indigo-600" />
                  <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
                    HR Records — Imported Data
                  </h2>
                  {hrDataLoaded && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full font-mono">
                      {hrImportedData.length} records
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Populated automatically from HR Reports → Import Data (CSV / Excel)
                </p>
              </div>
              {onPageChange && (
                <button
                  onClick={() => onPageChange('reports')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-150 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Go to HR Reports
                </button>
              )}
            </div>

            {!hrDataLoaded ? (
              /* Empty State */
              <div className="py-16 px-6 text-center">
                <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="h-7 w-7 text-indigo-400" />
                </div>
                <p className="text-base font-bold text-slate-700 mb-1">No employee data loaded yet</p>
                <p className="text-sm text-slate-400 mb-4 max-w-sm mx-auto leading-relaxed">
                  Go to <strong>HR Reports → Import Data (CSV/Excel)</strong> to load your employee records here automatically.
                </p>
                <p className="text-xs text-slate-300">Once imported, all employees will appear here with search and filter.</p>
                {onPageChange && (
                  <button
                    onClick={() => onPageChange('reports')}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Import HR Data Now
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-5">

                {/* ── Summary Stats Bar ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Employees', value: hrImportedData.length, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
                    { label: 'Active', value: totalActive, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-150' },
                    { label: 'Resigned', value: totalResigned, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-150' },
                    { label: 'Departments', value: uniqueDepts, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-150' },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-3 text-center`}>
                      <p className={`text-xl md:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Avg CTC callout */}
                {avgCTC > 0 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Avg Monthly CTC (Active)</span>
                    <span className="text-sm font-extrabold text-indigo-700 font-mono">₹{avgCTC.toLocaleString('en-IN')}/mo</span>
                  </div>
                )}

                {/* ── Search & Filters ── */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, ID or designation..."
                      value={hrSearchQuery}
                      onChange={e => setHrSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={hrDeptFilter}
                    onChange={e => setHrDeptFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select
                    value={hrStatusFilter}
                    onChange={e => setHrStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option>All</option>
                    <option>Active</option>
                    <option>Resigned</option>
                  </select>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0 self-center">
                    {hrFiltered.length} of {hrImportedData.length}
                  </span>
                </div>

                {/* ── Employee Cards Grid ── */}
                {hrFiltered.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm font-semibold">No employees match your filters.</p>
                    <p className="text-xs mt-1">Try clearing the search or changing the department filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {hrFiltered.map((emp: any) => {
                      const isActive = emp.employment_status === 'Active';
                      const isSelected = hrSelectedEmp?.employee_id === emp.employee_id;
                      return (
                        <div
                          key={emp.employee_id}
                          onClick={() => setHrSelectedEmp(isSelected ? null : emp)}
                          className={`rounded-xl border p-4 cursor-pointer transition-all space-y-3 ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-50/40 shadow-sm'
                              : 'border-slate-150 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                                  {(emp.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-slate-900 truncate">{emp.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{emp.employee_id}</p>
                                </div>
                              </div>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                : 'bg-rose-50 text-rose-600 border-rose-150'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {emp.employment_status || 'Unknown'}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate font-medium">{emp.designation || '—'}</span>
                              <span className="text-slate-300">·</span>
                              <span className="truncate text-slate-500">{emp.department || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{emp.plant_location || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>Joined: <span className="font-semibold text-slate-700">{formatDate(emp.date_of_joining)}</span></span>
                            </div>
                            {emp.monthly_ctc_inr && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <DollarSign className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-700">₹{Number(emp.monthly_ctc_inr).toLocaleString('en-IN')}/mo</span>
                              </div>
                            )}
                          </div>

                          {/* Resigned sub-row */}
                          {!isActive && (emp.exit_date || emp.exit_reason) && (
                            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                              {emp.exit_date && <p>Exit: <span className="font-semibold text-slate-600">{formatDate(emp.exit_date)}</span></p>}
                              {emp.exit_reason && <p>Reason: <span className="font-semibold text-slate-600">{emp.exit_reason}</span></p>}
                            </div>
                          )}

                          {/* Expanded detail row */}
                          {isSelected && (
                            <div className="pt-3 border-t border-indigo-100 grid grid-cols-2 gap-2 text-[10px]">
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Gender</span><p className="font-semibold text-slate-700 mt-0.5">{emp.gender || '—'}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Marital Status</span><p className="font-semibold text-slate-700 mt-0.5">{emp.marital_status || '—'}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Recruitment Source</span><p className="font-semibold text-slate-700 mt-0.5">{emp.recruitment_source || '—'}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Recruiter</span><p className="font-semibold text-slate-700 mt-0.5">{emp.recruiter_name || '—'}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">TAT (days)</span><p className="font-semibold text-slate-700 mt-0.5">{emp.tat_days ?? '—'}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Tenure (days)</span><p className="font-semibold text-slate-700 mt-0.5">{emp.tenure_days ?? '—'}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Cost per Hire</span><p className="font-semibold text-slate-700 mt-0.5">₹{Number(emp.cost_per_hire_inr || 0).toLocaleString('en-IN')}</p></div>
                              <div><span className="text-slate-400 font-bold uppercase tracking-wider">Offer Date</span><p className="font-semibold text-slate-700 mt-0.5">{formatDate(emp.offer_date)}</p></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

   </div>
  );
}
