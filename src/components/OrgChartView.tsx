/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MapPin, 
  Building, 
  User, 
  Briefcase, 
  Calendar, 
  CreditCard,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface HRRecord {
  employee_id: string;
  name: string;
  gender: string;
  marital_status: string;
  department: string;
  designation: string;
  plant_location: string;
  recruitment_source: string;
  recruiter_name: string;
  job_posted_date: Date | null;
  interview_date: Date | null;
  offer_date: Date | null;
  date_of_joining: Date | null;
  tat_days: number;
  cost_per_hire_inr: number;
  monthly_ctc_inr: number;
  employment_status: string;
  exit_date: Date | null;
  exit_reason: string;
  tenure_days: number;
}

// Programmatic mock generator matching ReportsView to ensure we have backup data on mount
const generateMockDataList = () => {
  const depts = ['Engineering', 'Sales', 'Product', 'Marketing', 'Finance', 'HR Operations'];
  const sources = ['LinkedIn', 'Indeed', 'Naukri', 'Referral'];
  const recruiters = ['Thomas Wright', 'Neha Gupta', 'Amit Sen'];
  const names = [
    'Aisha Rahman', 'Rahul Sharma', 'Priya Patel', 'David Kim', 'Vikram Singh',
    'Sonia Verma', 'Amit Joshi', 'Karan Malhotra', 'Ananya Rao', 'Siddharth Das',
    'Meera Nair', 'Rohan Kapoor', 'Shweta Tiwari', 'Abhishek Roy', 'Kriti Sharma',
    'Arjun Mehta', 'Deepa Krishnan', 'Vijay Yadav', 'Nisha Gupta', 'Yash Vardhan',
    'Kavita Reddy', 'Sameer Deshmukh', 'Aditi Rao', 'Manish Pandey', 'Ritu Goel'
  ];

  const mock: any[] = [];
  const baseTime = new Date('2026-04-01').getTime();

  for (let i = 0; i < names.length; i++) {
    const isResigned = i === 2 || i === 10 || i === 18;
    const dept = depts[i % depts.length];
    const source = sources[i % sources.length];
    
    const joinTime = baseTime + (i * 3.2 * 24 * 3600 * 1000);
    const joinDate = new Date(joinTime);
    
    const offerDate = new Date(joinTime - 6 * 24 * 3600 * 1000);
    const interviewDate = new Date(joinTime - 12 * 24 * 3600 * 1000);
    const postDate = new Date(joinTime - 22 * 24 * 3600 * 1000);

    let exitDateStr = '';
    let exitReason = '';
    let tenure = 0;

    if (isResigned) {
      const exitDate = new Date(joinTime + 45 * 24 * 3600 * 1000);
      exitDateStr = exitDate.toISOString().split('T')[0];
      exitReason = i % 2 === 0 ? 'Better Prospects' : 'Relocation';
      tenure = 45;
    }

    mock.push({
      employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
      name: names[i],
      gender: i % 2 === 0 ? 'Female' : 'Male',
      marital_status: i % 3 === 0 ? 'Married' : 'Single',
      department: dept,
      designation: i % 2 === 0 ? `Senior ${dept} Executive` : `${dept} Associate`,
      plant_location: i % 2 === 0 ? 'Delhi' : 'Mumbai',
      recruitment_source: source,
      recruiter_name: recruiters[i % recruiters.length],
      job_posted_date: postDate.toISOString().split('T')[0],
      interview_date: interviewDate.toISOString().split('T')[0],
      offer_date: offerDate.toISOString().split('T')[0],
      date_of_joining: joinDate.toISOString().split('T')[0],
      tat_days: 20 + (i % 8) * 3,
      cost_per_hire_inr: 15000 + (i % 5) * 8000,
      monthly_ctc_inr: 50000 + (i % 6) * 15000,
      employment_status: isResigned ? 'Resigned' : 'Active',
      exit_date: exitDateStr,
      exit_reason: exitReason,
      tenure_days: tenure
    });
  }
  return mock;
};

// Seniority Level Classifier Helper
export function getDesignationLevel(designation: string): 1 | 2 | 3 {
  const des = designation.toLowerCase();
  
  // Level 1 (Top): Manager / Senior Manager / Department Head / Executive Leadership
  if (
    des.includes('manager') || 
    des.includes('head') || 
    des.includes('director') || 
    des.includes('chief') || 
    des.includes('president') || 
    des.includes('vp') ||
    des.includes('leader') ||
    des.includes('lead') || // Lead executive / engineer is Level 1 or 2, we treat as Level 1 for structure
    des.includes('ceo') ||
    des.includes('chro') ||
    des.includes('cfo')
  ) {
    return 1;
  }
  
  // Level 3 (Junior): Operator / Technician / Associate / Intern / Trainee
  if (
    des.includes('operator') || 
    des.includes('technician') || 
    des.includes('associate') || 
    des.includes('intern') || 
    des.includes('trainee') || 
    des.includes('helper') || 
    des.includes('worker') || 
    des.includes('clerk') || 
    des.includes('junior') ||
    des.includes('staff') ||
    des.includes('assistant')
  ) {
    return 3;
  }
  
  // Level 2 (Mid): Supervisor / Executive / Engineer / Analyst
  return 2;
}

export default function OrgChartView() {
  const [employees, setEmployees] = useState<HRRecord[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<HRRecord[]>([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  
  // Selected Employee for Dossier Slide-out
  const [activeDossier, setActiveDossier] = useState<HRRecord | null>(null);

  // Pagination states inside department clusters (to keep UI fast with 400+ employees)
  // Maps level-deptKey to current page number
  const [clusterPages, setClusterPages] = useState<Record<string, number>>({});
  const CARDS_PER_CLUSTER = 6;

  // Load raw records from localStorage or fall back to generate mockup
  useEffect(() => {
    const saved = localStorage.getItem('alok_hr_raw_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mapped = parsed.map((row: any) => ({
          ...row,
          job_posted_date: row.job_posted_date ? new Date(row.job_posted_date) : null,
          interview_date: row.interview_date ? new Date(row.interview_date) : null,
          offer_date: row.offer_date ? new Date(row.offer_date) : null,
          date_of_joining: row.date_of_joining ? new Date(row.date_of_joining) : null,
          exit_date: row.exit_date ? new Date(row.exit_date) : null
        }));
        setEmployees(mapped);
      } catch (err) {
        console.error("Failed parsing raw local storage records in Org Chart", err);
        fallbackToDemo();
      }
    } else {
      fallbackToDemo();
    }
  }, []);

  const fallbackToDemo = () => {
    const mock = generateMockDataList();
    const mapped = mock.map((row: any) => ({
      ...row,
      job_posted_date: row.job_posted_date ? new Date(row.job_posted_date) : null,
      interview_date: row.interview_date ? new Date(row.interview_date) : null,
      offer_date: row.offer_date ? new Date(row.offer_date) : null,
      date_of_joining: row.date_of_joining ? new Date(row.date_of_joining) : null,
      exit_date: row.exit_date ? new Date(row.exit_date) : null
    }));
    setEmployees(mapped);
  };

  // Extract unique filters from all employees
  const uniqueDepts = Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort();
  const uniqueLocations = Array.from(new Set(employees.map(e => e.plant_location).filter(Boolean))).sort();

  // Apply filtering rules
  useEffect(() => {
    let result = [...employees];

    // Search query: name or ID
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.employee_id.toLowerCase().includes(q)
      );
    }

    // Department Filter
    if (selectedDept !== 'All') {
      result = result.filter(e => e.department === selectedDept);
    }

    // Plant Location Filter
    if (selectedLocation !== 'All') {
      result = result.filter(e => e.plant_location === selectedLocation);
    }

    // Employment Status Filter
    if (selectedStatus !== 'All') {
      result = result.filter(e => e.employment_status === selectedStatus);
    }

    // Designation Level Filter
    if (selectedLevel !== 'All') {
      const targetLvl = parseInt(selectedLevel, 10);
      result = result.filter(e => getDesignationLevel(e.designation) === targetLvl);
    }

    setFilteredEmployees(result);
  }, [employees, searchQuery, selectedDept, selectedLocation, selectedStatus, selectedLevel]);

  // Reset pagination when filters change
  useEffect(() => {
    setClusterPages({});
  }, [searchQuery, selectedDept, selectedLocation, selectedStatus, selectedLevel]);

  const handleClusterPageChange = (clusterKey: string, direction: 'prev' | 'next', totalPages: number) => {
    const current = clusterPages[clusterKey] || 1;
    let nextVal = current;
    if (direction === 'prev' && current > 1) {
      nextVal = current - 1;
    } else if (direction === 'next' && current < totalPages) {
      nextVal = current + 1;
    }
    setClusterPages(prev => ({
      ...prev,
      [clusterKey]: nextVal
    }));
  };

  // Separate records into levels
  const getLevelEmployees = (levelNum: 1 | 2 | 3) => {
    return filteredEmployees.filter(e => getDesignationLevel(e.designation) === levelNum);
  };

  const level1Employees = getLevelEmployees(1);
  const level2Employees = getLevelEmployees(2);
  const level3Employees = getLevelEmployees(3);

  // Group employees within a level by department
  const getDeptGrouped = (employeesList: HRRecord[]) => {
    const groups: Record<string, HRRecord[]> = {};
    employeesList.forEach(e => {
      const dept = e.department || 'Other';
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const formatDatePretty = (val: any) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const calculateTenureString = (joiningDate: any, exitDate: any, status: string): string => {
    if (!joiningDate) return 'N/A';
    const start = new Date(joiningDate);
    if (isNaN(start.getTime())) return 'N/A';
    const end = (status === 'Resigned' && exitDate) ? new Date(exitDate) : new Date();
    if (isNaN(end.getTime())) return 'N/A';
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years > 0) {
      let res = `${years} year${years > 1 ? 's' : ''}`;
      if (months > 0) {
        res += ` ${months} month${months > 1 ? 's' : ''}`;
      }
      return res;
    } else if (months > 0) {
      let res = `${months} month${months > 1 ? 's' : ''}`;
      if (days > 0) {
        res += ` ${days} day${days > 1 ? 's' : ''}`;
      }
      return res;
    } else {
      return `${days > 0 ? days : 0} day${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER */}
      <div className="border-b border-slate-150 pb-5">
        <p className="text-xs text-indigo-600 font-bold font-mono uppercase tracking-wider">Enterprise Hierarchy</p>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">ALOK Organisational Chart</h2>
        <p className="text-xs text-slate-500 mt-1">
          A designated structure map grouped by seniority levels and departments. Fully synchronized with raw imported records.
        </p>
      </div>

      {/* FILTER BAR PANEL */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-500 shrink-0" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Dynamic Tree Filter &amp; Drill-down</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Search bar */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-semibold text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
            >
              <option value="All">All Departments</option>
              {uniqueDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Plant Location */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Plant Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Employment Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Resigned">Resigned Only</option>
            </select>
          </div>

          {/* Seniority Level */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Seniority Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
            >
              <option value="All">All Tiers</option>
              <option value="1">Level 1: Management (Top)</option>
              <option value="2">Level 2: Professional (Mid)</option>
              <option value="3">Level 3: Operational (Junior)</option>
            </select>
          </div>

        </div>

        {/* Clear Filters pill */}
        {(searchQuery || selectedDept !== 'All' || selectedLocation !== 'All' || selectedStatus !== 'All' || selectedLevel !== 'All') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('All');
                setSelectedLocation('All');
                setSelectedStatus('All');
                setSelectedLevel('All');
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* QUICK STATS COUNTER BAR */}
      <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold font-mono">
        <div>
          Showing <span className="text-indigo-600 font-bold">{filteredEmployees.length}</span> of <span className="text-slate-700 font-bold">{employees.length}</span> database records.
        </div>
        <div className="flex gap-4">
          <span>Level 1: <strong className="text-indigo-600">{level1Employees.length}</strong></span>
          <span>Level 2: <strong className="text-indigo-600">{level2Employees.length}</strong></span>
          <span>Level 3: <strong className="text-indigo-600">{level3Employees.length}</strong></span>
        </div>
      </div>

      {/* MAIN ORG CHART HIERARCHICAL CANVAS */}
      <div className="relative space-y-12 py-4">
        
        {/* LEVEL 1: TOP TIER */}
        {(selectedLevel === 'All' || selectedLevel === '1') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
              <span className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">1</span>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Management Tier (Level 1)</h3>
                <p className="text-[10px] text-slate-500 font-medium">Managers, Senior Managers, Directors, and Department Heads</p>
              </div>
            </div>

            {level1Employees.length === 0 ? (
              <div className="text-center p-6 bg-slate-50/50 rounded-2xl text-xs text-slate-400">No Management records match current filters</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getDeptGrouped(level1Employees).map(([dept, deptEmps]) => {
                  const clusterKey = `l1-${dept}`;
                  const currentPage = clusterPages[clusterKey] || 1;
                  const totalPages = Math.ceil(deptEmps.length / CARDS_PER_CLUSTER);
                  const startIndex = (currentPage - 1) * CARDS_PER_CLUSTER;
                  const paginatedEmps = deptEmps.slice(startIndex, startIndex + CARDS_PER_CLUSTER);

                  return (
                    <div key={dept} className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">{dept}</span>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">{deptEmps.length}</span>
                      </div>
                      
                      <div className="p-4 flex-1 space-y-3">
                        {paginatedEmps.map(emp => (
                          <EmployeeNodeCard key={emp.employee_id} emp={emp} onClick={() => setActiveDossier(emp)} />
                        ))}
                      </div>

                      {/* Pagination inside Department Cell */}
                      {totalPages > 1 && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-[10px] font-bold text-slate-500 font-mono">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => handleClusterPageChange(clusterKey, 'prev', totalPages)}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span>Page {currentPage} of {totalPages}</span>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => handleClusterPageChange(clusterKey, 'next', totalPages)}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONNECTOR ROAD TRACK BETWEEN L1 & L2 */}
        {selectedLevel === 'All' && level1Employees.length > 0 && level2Employees.length > 0 && (
          <div className="relative h-12 flex justify-center items-center" data-html2canvas-ignore="true">
            <div className="absolute top-0 bottom-0 w-0.5 bg-dashed border-l border-indigo-200/80" />
            <div className="z-10 bg-indigo-50 border border-indigo-200 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center">
              <Layers className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* LEVEL 2: MID TIER */}
        {(selectedLevel === 'All' || selectedLevel === '2') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
              <span className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">2</span>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Professional Tier (Level 2)</h3>
                <p className="text-[10px] text-slate-500 font-medium">Supervisors, Executives, Engineers, and Analysts</p>
              </div>
            </div>

            {level2Employees.length === 0 ? (
              <div className="text-center p-6 bg-slate-50/50 rounded-2xl text-xs text-slate-400">No Professional records match current filters</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getDeptGrouped(level2Employees).map(([dept, deptEmps]) => {
                  const clusterKey = `l2-${dept}`;
                  const currentPage = clusterPages[clusterKey] || 1;
                  const totalPages = Math.ceil(deptEmps.length / CARDS_PER_CLUSTER);
                  const startIndex = (currentPage - 1) * CARDS_PER_CLUSTER;
                  const paginatedEmps = deptEmps.slice(startIndex, startIndex + CARDS_PER_CLUSTER);

                  return (
                    <div key={dept} className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">{dept}</span>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">{deptEmps.length}</span>
                      </div>
                      
                      <div className="p-4 flex-1 space-y-3">
                        {paginatedEmps.map(emp => (
                          <EmployeeNodeCard key={emp.employee_id} emp={emp} onClick={() => setActiveDossier(emp)} />
                        ))}
                      </div>

                      {/* Pagination inside Department Cell */}
                      {totalPages > 1 && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-[10px] font-bold text-slate-500 font-mono">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => handleClusterPageChange(clusterKey, 'prev', totalPages)}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span>Page {currentPage} of {totalPages}</span>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => handleClusterPageChange(clusterKey, 'next', totalPages)}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONNECTOR ROAD TRACK BETWEEN L2 & L3 */}
        {selectedLevel === 'All' && level2Employees.length > 0 && level3Employees.length > 0 && (
          <div className="relative h-12 flex justify-center items-center" data-html2canvas-ignore="true">
            <div className="absolute top-0 bottom-0 w-0.5 bg-dashed border-l border-indigo-200/80" />
            <div className="z-10 bg-indigo-50 border border-indigo-200 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center">
              <Layers className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* LEVEL 3: JUNIOR TIER */}
        {(selectedLevel === 'All' || selectedLevel === '3') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
              <span className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">3</span>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Operational Tier (Level 3)</h3>
                <p className="text-[10px] text-slate-500 font-medium">Operators, Technicians, Associates, and Interns</p>
              </div>
            </div>

            {level3Employees.length === 0 ? (
              <div className="text-center p-6 bg-slate-50/50 rounded-2xl text-xs text-slate-400">No Operational records match current filters</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getDeptGrouped(level3Employees).map(([dept, deptEmps]) => {
                  const clusterKey = `l3-${dept}`;
                  const currentPage = clusterPages[clusterKey] || 1;
                  const totalPages = Math.ceil(deptEmps.length / CARDS_PER_CLUSTER);
                  const startIndex = (currentPage - 1) * CARDS_PER_CLUSTER;
                  const paginatedEmps = deptEmps.slice(startIndex, startIndex + CARDS_PER_CLUSTER);

                  return (
                    <div key={dept} className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">{dept}</span>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">{deptEmps.length}</span>
                      </div>
                      
                      <div className="p-4 flex-1 space-y-3">
                        {paginatedEmps.map(emp => (
                          <EmployeeNodeCard key={emp.employee_id} emp={emp} onClick={() => setActiveDossier(emp)} />
                        ))}
                      </div>

                      {/* Pagination inside Department Cell */}
                      {totalPages > 1 && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-[10px] font-bold text-slate-500 font-mono">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => handleClusterPageChange(clusterKey, 'prev', totalPages)}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span>Page {currentPage} of {totalPages}</span>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => handleClusterPageChange(clusterKey, 'next', totalPages)}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
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

      {/* FULL EMPLOYEE DETAILS SLIDE-OUT PANEL MODAL */}
      <AnimatePresence>
        {activeDossier && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveDossier(null)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full text-left"
              >
                {/* Panel Header */}
                <div className="px-6 py-5 bg-gradient-to-br from-indigo-50/30 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-wider block">EMPLOYEE PROFILE DOSSIER</span>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight mt-0.5">{activeDossier.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{activeDossier.employee_id}</p>
                  </div>
                  <button
                    onClick={() => setActiveDossier(null)}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Panel Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  
                  {/* Status Indicator Panel */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-150 bg-slate-50">
                    <span className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">Employment Status</span>
                    {activeDossier.employment_status === 'Active' ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                        Resigned
                      </span>
                    )}
                  </div>

                  {/* 1. Personal Metadata */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Gender</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Marital Status</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.marital_status || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Employee ID Code</span>
                        <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{activeDossier.employee_id}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Professional Mapping */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Professional Mapping
                    </h4>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Department</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.department}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Designation</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.designation}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Plant Location</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {activeDossier.plant_location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Onboarding & Pipeline */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Recruitment &amp; Service Timeline
                    </h4>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Date of Joining</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDatePretty(activeDossier.date_of_joining)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Service Tenure</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                          {calculateTenureString(activeDossier.date_of_joining, activeDossier.exit_date, activeDossier.employment_status)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Recruitment Source</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.recruitment_source || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Recruiter Partner</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeDossier.recruiter_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Financial Profile */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Compensation &amp; Cost Structure
                    </h4>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Monthly CTC (INR)</span>
                        <p className="text-xs font-bold text-indigo-600 font-mono mt-0.5">₹{activeDossier.monthly_ctc_inr?.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Est Annual CTC</span>
                        <p className="text-xs font-semibold text-slate-600 font-mono mt-0.5">₹{(activeDossier.monthly_ctc_inr * 12)?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* 5. Exit details (only if resigned) */}
                  {activeDossier.employment_status === 'Resigned' && (
                    <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-wider font-mono border-b border-rose-100/50 pb-1 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Departure Profile Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider font-mono">Date of Exit</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{formatDatePretty(activeDossier.exit_date)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider font-mono">Exit Reason</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{activeDossier.exit_reason || 'Other / Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* EMPLOYEE CARD COMPONENT */
interface NodeCardProps {
  emp: HRRecord;
  onClick: () => void;
  key?: string;
}

function EmployeeNodeCard({ emp, onClick }: NodeCardProps) {
  const isActive = emp.employment_status === 'Active';

  return (
    <div 
      onClick={onClick}
      className={`p-3 border rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 text-left group ${
        isActive 
          ? 'bg-white border-slate-200 hover:border-indigo-300' 
          : 'bg-slate-50/60 border-slate-200 hover:border-rose-300 opacity-70 hover:opacity-100'
      }`}
    >
      <div className="min-w-0">
        <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{emp.employee_id}</span>
        <h5 className="text-xs font-black text-slate-800 truncate leading-snug">{emp.name}</h5>
        <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">{emp.designation}</p>
        <span className="text-[9px] text-slate-400 font-medium block truncate mt-0.5">{emp.plant_location}</span>
      </div>
      
      {/* Mini status indicator */}
      <div className="shrink-0 flex items-center">
        {isActive ? (
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" title="Active" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-slate-350" title={`Resigned - ${emp.exit_reason}`} />
        )}
      </div>
    </div>
  );
}
