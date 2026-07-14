/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHRData } from '../lib/hrDataBridge';
import { readDraft, useDraftAutosave } from '../lib/useDraftAutosave';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  FileText,
  Upload,
  Download,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  UserPlus,
  Clock,
  TrendingUp,
  Briefcase,
  TrendingDown,
  Percent,
  Calendar,
  CheckCircle2,
  Database,
  RefreshCw,
  Table,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Trash2,
  History,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

import { User } from '../types';
import { canonicalizeDepartment, canonicalizeLocation } from '../lib/canonicalize';
import ChartCard from './ChartCard';
import {
  ChartConfig,
  loadChartPreferences,
  saveChartPreferences,
  DEFAULT_CHART_REGISTRY
} from '../lib/chartRegistry';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  LabelList
} from 'recharts';

// Programmatic mock generator for compact code & fast downloads
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
    const isResigned = i === 2 || i === 10 || i === 18; // selective resigned
    const dept = depts[i % depts.length];
    const source = sources[i % sources.length];
    
    // Spread hiring dates between April 1 and June 25, 2026
    const joinTime = baseTime + (i * 3.2 * 24 * 3600 * 1000);
    const joinDate = new Date(joinTime);
    
    const offerDate = new Date(joinTime - 6 * 24 * 3600 * 1000);
    const interviewDate = new Date(joinTime - 12 * 24 * 3600 * 1000);
    const postDate = new Date(joinTime - 22 * 24 * 3600 * 1000);

    let exitDateStr = '';
    let exitReason = '';
    let tenure = 0;
    const attritionType = isResigned ? (i % 2 === 0 ? 'voluntary' : 'involuntary') : '';

    if (isResigned) {
      const exitDate = new Date(joinTime + 45 * 24 * 3600 * 1000);
      exitDateStr = exitDate.toISOString().split('T')[0];
      exitReason = i % 2 === 0 ? 'Better Prospects' : 'Relocation';
      tenure = 45;
    }

    const hireType = i % 3 === 0 ? 'replacement' : 'new';
    const replacementFor = hireType === 'replacement' ? `EMP${String(i).padStart(3, '0')}` : '';
    const baseCost = 12000 + (i % 5) * 6000;
    const topUp = i % 4 === 0 ? 3000 : (i % 4 === 1 ? 5000 : 0);

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
      cost_per_hire_inr: baseCost + topUp,
      monthly_ctc_inr: 50000 + (i % 6) * 15000,
      employment_status: isResigned ? 'Resigned' : 'Active',
      exit_date: exitDateStr,
      exit_reason: exitReason,
      tenure_days: tenure,
      hire_type: hireType,
      replacement_for: replacementFor,
      base_cost_per_hire: baseCost,
      top_up_cost: topUp,
      attrition_type: attritionType
    });
  }
  return mock;
};

export interface ReportSnapshot {
  id: string;
  generatedAt: string;
  fromDate: string;
  toDate: string;
  branchFilter: string;
  totalHires: number;
  avgTAT: string;
  avgCostPerHire: number;
  totalSpend: number;
  attritionCount: number;
  attritionRate: string;
  avgTenureExits: string;
  hiringByDepartment: Record<string, number>;
  hiringBySource: Record<string, number>;
  attritionByReason: Record<string, number>;
  recruiterStats: { name: string; hires: number; avgTAT: number }[];
  departmentTable: {
    department: string;
    total: number;
    active: number;
    resigned: number;
    attritionPct: string;
    avgCtc: number;
  }[];
  executiveSummaryText: string;
}

/**
 * Calculates standard HR period-over-period Attrition Rate and Attrition Count.
 * 
 * Formula:
 * Attrition Rate = (Exits within reporting period / Average Headcount during reporting period) * 100
 * Average Headcount = (Headcount at start + Headcount at end) / 2
 * 
 * Headcount at start = joined < start && (exit_date is null || exit_date >= start)
 * Headcount at end = joined <= end && (exit_date is null || exit_date > end)
 * Exits = exit_date >= start && exit_date <= end
 */
import {
  getCleanedRecords,
  calculateTotalHires,
  calculateHeadcountAtDate,
  calculateHeadcountAtStart,
  calculateHeadcountAtEnd,
  calculateAverageHeadcount,
  calculateAttritionCount,
  calculateAttritionRate,
  calculateAvgTimeToHire,
  calculateAvgCostPerHire,
  calculateTotalSpend,
  calculateAvgTenure,
  calculateDepartmentBreakdown,
  calculateSourcingBreakdown,
  calculateAttritionReasonsBreakdown,
  calculateRecruiterPerformance,
  DataWarning,
  roundPercentagesLargestRemainder,
  HRRecord,
  getAverageTenureDays,
  formatDaysToTenureString,
  calculateNewVsReplacementCost,
  calculateHeadcountCostByDepartment,
  calculateHeadcountCostByLocation,
  calculateTopUpCostBreakdown,
  calculateVoluntaryInvoluntaryAttrition,
  calculateTenureDistribution, calculateCategoryDistribution, calculateExperienceDistribution, calculateYearlyCtcVsHeadcount,
  validateDatasetOnce
} from '../lib/hrMetrics';
import { calcRecruiterPerformance } from '../lib/metrics';
import { validateTAT } from '../lib/validate';

const shortenName = (name: string): string => {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  if (lower === 'engineering & maintenance' || lower.includes('engineering')) return 'Engg & Maint';
  if (lower === 'sales & marketing' || lower.includes('sales')) return 'Sales & Mktg';
  if (lower === 'research & development' || lower.includes('research')) return 'R&D';
  if (lower === 'human resources' || lower.includes('human')) return 'HR';
  if (lower === 'production & operations' || lower.includes('production')) return 'Prod & Ops';
  if (lower === 'quality assurance' || lower.includes('assurance')) return 'QA';
  if (lower === 'quality control' || lower.includes('control')) return 'QC';
  if (lower === 'supply chain management' || lower.includes('supply')) return 'SCM';
  if (lower === 'information technology' || lower.includes('information')) return 'IT';
  if (lower === 'accounts & finance' || lower.includes('accounts')) return 'Accounts';
  if (lower === 'admin & security' || lower.includes('admin')) return 'Admin';
  if (lower.includes('puducherry')) return 'Puducherry';
  if (lower.includes('ranipet')) return 'Ranipet';
  if (lower.includes('silvassa')) return 'Silvassa';
  return name.length > 18 ? name.substring(0, 16) + '...' : name;
};

const formatTenureShortYMD = (avgDays: number): string => {
  if (avgDays <= 0) return '0 days';
  const totalMonths = avgDays / 30.44;
  const years = Math.floor(totalMonths / 12);
  const months = Math.floor(totalMonths % 12);
  const days = Math.round((totalMonths - Math.floor(totalMonths)) * 30.44);

  const parts = [];
  if (years > 0) {
    parts.push(`${years} yr`);
  }
  if (months > 0) {
    parts.push(`${months} mo`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} days`);
  }
  return parts.join(', ');
};

const formatTenureLongYMD = (avgDays: number): string => {
  if (avgDays <= 0) return '0 days';
  const totalMonths = avgDays / 30.44;
  const years = Math.floor(totalMonths / 12);
  const months = Math.floor(totalMonths % 12);
  const days = Math.round((totalMonths - Math.floor(totalMonths)) * 30.44);

  const parts = [];
  if (years > 0) {
    parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
};

const formatDatePretty = (val: any) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

interface ReportsViewProps {
  currentUser?: User | null;
}

export default function ReportsView({ currentUser }: ReportsViewProps) {
  const [hrReportData, setHrReportData] = useState<HRRecord[]>([]);
  const [filteredReportData, setFilteredReportData] = useState<HRRecord[]>([]);
  const [chartPrefs, setChartPrefs] = useState<ChartConfig[]>([]);
  const [isManageChartsOpen, setIsManageChartsOpen] = useState<boolean>(false);
  
  // Must be called at top level — NOT inside callbacks (Rules of Hooks)
  const { data: hrReportDataCtx, setData: setHRContextData, isHydrating, error: hydrationError, retry: retryHydration } = useHRData();

  // Hydrate local state from context when it finishes loading from IndexedDB
  useEffect(() => {
    if (hrReportDataCtx && hrReportDataCtx.length > 0) {
      setHrReportData(hrReportDataCtx);
    } else if (hrReportDataCtx && hrReportDataCtx.length === 0 && !isHydrating) {
      setHrReportData([]);
    }
  }, [hrReportDataCtx, isHydrating]);

  // Report filter state — seeded from sessionStorage draft on mount
  const REPORT_FILTERS_KEY = 'draft_report_filters';
  type ReportFilterDraft = { fromDate: string; toDate: string; selectedBranch: string };

  const hasAutoRanged = useRef(false);

  // Default dates: 3 months before today and today
  const [fromDate, setFromDate] = useState<string>(() => {
    const saved = readDraft<ReportFilterDraft>(REPORT_FILTERS_KEY)?.fromDate;
    if (saved) return saved;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return threeMonthsAgo.toISOString().split('T')[0];
  });

  const [toDate, setToDate] = useState<string>(() => {
    return readDraft<ReportFilterDraft>(REPORT_FILTERS_KEY)?.toDate ?? new Date().toISOString().split('T')[0];
  });

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    return readDraft<ReportFilterDraft>(REPORT_FILTERS_KEY)?.selectedBranch ?? 'All Branches';
  });

  useEffect(() => {
    if (hrReportData.length > 0 && !hasAutoRanged.current) {
      const saved = readDraft<ReportFilterDraft>(REPORT_FILTERS_KEY);
      if (!saved) {
        const dates = hrReportData.map(r => r.date_of_joining).filter(Boolean) as Date[];
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          setFromDate(minDate.toISOString().split('T')[0]);
          setToDate(maxDate.toISOString().split('T')[0]);
        }
      }
      hasAutoRanged.current = true;
    }
  }, [hrReportData]);

  // Autosave report filters — only the three user-typed filter values, not the dataset
  const { clearDraft: clearFilterDraft } = useDraftAutosave<ReportFilterDraft>(
    REPORT_FILTERS_KEY,
    { fromDate, toDate, selectedBranch }
  );

  const [selectedEmployee, setSelectedEmployee] = useState<HRRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  // Report History feature state
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [historyList, setHistoryList] = useState<ReportSnapshot[]>([]);
  const [activeHistoryReport, setActiveHistoryReport] = useState<ReportSnapshot | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const historyWithStats = useMemo(() => {
    return historyList.map(item => {
      const { cleaned: snapshotCleaned } = getCleanedRecords(hrReportData, item.branchFilter);
      const stats = calculateAttritionRate(snapshotCleaned, new Date(item.fromDate), new Date(item.toDate));
      return {
        ...item,
        snapshotAttrition: {
          exitsCount: stats.exitsCount,
          attritionRate: stats.rate
        }
      };
    });
  }, [historyList, hrReportData]);

  const parseDate = (val: any, fieldName: string = 'date'): Date | null => {
    if (val === null || val === undefined) return null;
    if (val instanceof Date) {
      if (isNaN(val.getTime())) {
        console.warn(`[Data Quality] ${fieldName}: Invalid Date object provided:`, val);
        return null;
      }
      return val;
    }
    const str = String(val).trim();
    if (str === '' || str.toLowerCase() === 'null' || str === '0' || str === '-' || str.toLowerCase() === 'na' || str.toLowerCase() === 'n/a') return null;

    // Check if it's an Excel serial number
    if (/^\d+(\.\d+)?$/.test(str)) {
      const num = parseFloat(str);
      // Valid Excel dates in our modern context should be > 30000 (which is 1982) and < 100000 (which is 2173)
      // Rejecting 0 or small numbers that turn into 1900 dates
      if (num < 10000) {
        console.warn(`[Data Quality] ${fieldName}: Ignored suspiciously small Excel serial number:`, num);
        return null;
      }
      // Excel base date is Dec 30, 1899 (due to leap year bug in 1900)
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      }
    }

    // Try parsing standard YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1; // 0-indexed
      const day = parseInt(ymdMatch[3], 10);
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) return date;
    }

    // Try parsing standard DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
      const year = parseInt(dmyMatch[3], 10);
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) return date;
    }

    // Try parsing standard DD-MMM-YY or DD-MMM-YYYY (e.g., "13-Jul-26" or "13-Jul-2026")
    const dmmmMatch = str.match(/^(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{2,4})$/);
    if (dmmmMatch) {
      const day = parseInt(dmmmMatch[1], 10);
      const yearStr = dmmmMatch[3];
      let year = parseInt(yearStr, 10);
      if (yearStr.length === 2) {
        year += year < 50 ? 2000 : 1900;
      }
      const monthsMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const monthStr = dmmmMatch[2].toLowerCase();
      const month = monthsMap[monthStr];
      if (month !== undefined) {
        const date = new Date(Date.UTC(year, month, day));
        if (!isNaN(date.getTime())) return date;
      }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      if (str.includes('T') || str.includes('Z')) {
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      } else {
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    }
    
    console.warn(`[Data Quality] ${fieldName}: Failed to parse date string: "${str}"`);
    return null;
  };

  const parseNumber = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (val instanceof Date) return 0;
    const str = String(val);
    if (/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(str)) return 0;
    if (/[a-zA-Z]/.test(str)) return 0; // "Act_Stipend" etc.
    const cleaned = str.replace(/[^0-9.-]/g, '').trim();
    if (cleaned === '') return 0;
    if (cleaned.indexOf('-') > 0) return 0; // like "12-2026"
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // State for Mapping Preview
  const [mappingPreview, setMappingPreview] = useState<{
    fileName: string;
    totalRows: number;
    headersFound: string[];
    headerRowIdx: number;
    resolvedMappings: Record<string, string>;
    records: HRRecord[];
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCsv && !isExcel) {
      setErrorMessage("Unsupported file format. Please upload a .csv, .xlsx, or .xls file.");
      e.target.value = '';
      return;
    }

    const fieldAliases: Record<string, string[]> = {
      employee_id: ['employee_id', 'employee_code', 'employee code', 'employeecode', 'emp_id', 'empid'],
      name: ['name', 'employee_name', 'employee name', 'employeename', 'full_name', 'fullname'],
      gender: ['gender', 'sex'],
      marital_status: ['marital_status', 'marital status', 'maritalstatus', 'marriage_status'],
      department: ['department', 'dept'],
      designation: ['designation', 'role', 'title', 'job_title'],
      plant_location: ['plant_location', 'plant location', 'plantlocation', 'work location', 'work_location', 'location', 'plant'],
      pf_location: ['pf location', 'pf_location', 'pf_loc'],
      recruitment_source: ['recruitment_source', 'recruitment source', 'recruitmentsource', 'source of hiring', 'source_of_hiring', 'hiring_source', 'source'],
      recruiter_name: ['recruiter_name', 'recruiter name', 'recruitername', 'hr recruiter', 'hr_recruiter', 'recruiter'],
      job_posted_date: ['job_posted_date', 'job posted date', 'jobposteddate', 'mrf date', 'mrf_date', 'posting_date'],
      interview_date: ['interview_date', 'interview date', 'interviewdate'],
      offer_date: ['offer_date', 'offer date', 'offerdate', 'offer letter date', 'offer_letter_date'],
      date_of_joining: ['date_of_joining', 'date of joining', 'dateofjoining', 'joining_date', 'joining date'],
      tat_days: ['tat_days', 'tat days', 'tatdays', 'tat', 'time_to_hire', 'time to hire'],
      cost_per_hire_inr: ['cost_per_hire_inr', 'cost per hire inr', 'costperhireinr', 'hiring cost', 'hiring_cost', 'cost_per_hire', 'cost per hire'],
      monthly_ctc_inr: ['monthly_ctc_inr', 'monthly ctc inr', 'monthlyctcinr', 'total m_ctc', 'total_m_ctc', 'monthly_ctc', 'monthly ctc', 'ctc'],
      employment_status: ['employment_status', 'employment status', 'employmentstatus', 'status'],
      exit_date: ['exit_date', 'exit date', 'exitdate', 'relieving_date', 'relieving date', 'resignation_date'],
      exit_reason: ['exit_reason', 'exit reason', 'exitreason', 'reason for leaving', 'reason_for_leaving', 'resignation_reason'],
      tenure_days: ['tenure_days', 'tenure days', 'tenuredays', 'tenure'],
      category: ['category', 'employee category', 'emp category', 'grade'],
      total_experience_years: ['total_experience', 'total experience', 'experience', 'total exp', 'exp'],
      survey_status: ['survey_status', 'survey status', 'engagement survey', 'exit survey'],
      hire_type: ['hire_type', 'hire type', 'hiretype', 'hiring type', 'hiring_type', 'new/ replacement', 'new / replacement', 'new/replacement'],
      replacement_for: ['replacement_for', 'replacement for', 'replacementfor', 'replacement_of', 'replacement of'],
      base_cost_per_hire: ['base_cost_per_hire', 'base cost per hire', 'basecostperhire', 'base_cost', 'base cost'],
      top_up_cost: ['top_up_cost', 'top up cost', 'topupcost', 'top_up', 'top up', 'top-up', 'agency_fee', 'agency fee', 'agency cost', 'agency_cost', 'consultant fee', 'consultant_fee'],
      attrition_type: ['attrition_type', 'attrition type', 'attritiontype', 'exit type', 'exit_type', 'separation type', 'separation_type', 'exit - voluntary / involuntary / retirement', 'exit-voluntary/involuntary/retirement', 'exit - voluntary/involuntary/retirement']
    };

    const processRawData = (rows: any[][]) => {
      // Find the header row (scan first 5 rows)
      let headerRowIdx = 0;
      let maxScore = -1;
      let resolvedMappings: Record<string, string> = {};
      let bestHeaders: string[] = [];

      const maxScanRows = Math.min(5, rows.length);
      for (let r = 0; r < maxScanRows; r++) {
        const row = rows[r];
        if (!row || !Array.isArray(row)) continue;
        
        let score = 0;
        let tempMappings: Record<string, string> = {};
        const stringRow = row.map(cell => String(cell || '').trim().toLowerCase());

        Object.entries(fieldAliases).forEach(([field, aliases]) => {
          const matchedIdx = stringRow.findIndex(cell => aliases.includes(cell));
          if (matchedIdx !== -1) {
            score++;
            tempMappings[field] = row[matchedIdx]; // Store exact raw column name matched
          }
        });

        if (score > maxScore) {
          maxScore = score;
          headerRowIdx = r;
          resolvedMappings = tempMappings;
          bestHeaders = row.map(cell => String(cell || '').trim());
        }
      }

      const rawHeaders = bestHeaders;
      const dataRows = rows.slice(headerRowIdx + 1).filter(row => 
        row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
      );

      // Map rows to objects based on resolved headers
      const rawRecords = dataRows.map(row => {
        const recordObj: any = {};
        rawHeaders.forEach((header, idx) => {
          recordObj[header] = row[idx];
        });
        return recordObj;
      });

      // Require fields check: name and employee_id are key. interview_date is now optional!
      const missingRequired: string[] = [];
      if (!resolvedMappings['employee_id']) missingRequired.push('employee_id (e.g. Employee_Code)');
      if (!resolvedMappings['name']) missingRequired.push('name (e.g. Employee_Name)');
      if (!resolvedMappings['date_of_joining']) missingRequired.push('date_of_joining (e.g. Date_Of_Joining)');

      if (missingRequired.length > 0) {
        setErrorMessage(`Failed to map column headers. The following key columns are missing: ${missingRequired.join(', ')}`);
        return;
      }

      const mapRowToHRRecord = (rowObj: any): HRRecord => {
        // Resolve raw value based on mapping
        const getValue = (field: string) => {
          const rawColName = resolvedMappings[field];
          return rawColName ? rowObj[rawColName] : undefined;
        };

        let workLocVal = String(getValue('plant_location') || '').trim();
        let pfLocVal = String(getValue('pf_location') || '').trim();
        
        let rawLoc = workLocVal;
        if (!rawLoc || rawLoc.toUpperCase() === 'ATTD') {
          rawLoc = pfLocVal;
        }
        if (!rawLoc) {
          rawLoc = 'HQ';
        }

        let plantLoc = canonicalizeLocation(rawLoc);
        
        let deptVal = canonicalizeDepartment(getValue('department'));
        const baseCostVal = getValue('base_cost_per_hire');
        const costPerHireVal = getValue('cost_per_hire_inr');
        const topUpVal = getValue('top_up_cost');

        const baseCost = baseCostVal !== undefined ? parseNumber(baseCostVal) : parseNumber(costPerHireVal);
        const topUp = parseNumber(topUpVal);
        const totalCost = baseCost + topUp;

        const doj = parseDate(getValue('date_of_joining'), 'date_of_joining');
        let exitDate = parseDate(getValue('exit_date'), 'exit_date');
        
        // Data Quality: Fix corrupted Total M_CTC entries (where exit date spilled into CTC column)
        const ctcRawValue = String(getValue('monthly_ctc_inr') || '');
        if (!exitDate && ctcRawValue && (/^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/.test(ctcRawValue) || /^\d{4}-\d{2}-\d{2}$/.test(ctcRawValue) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(ctcRawValue))) {
          const parsedFromCtc = parseDate(ctcRawValue, 'exit_date_from_ctc');
          if (parsedFromCtc) {
            exitDate = parsedFromCtc;
          }
        }
        
        let empStatus = String(getValue('employment_status') || '').trim();
        if (!empStatus) {
          empStatus = exitDate ? 'Resigned' : 'Active';
        }

        let tenureDays = parseNumber(getValue('tenure_days'));
        if (getValue('tenure_days') === undefined && doj) {
          const end = exitDate || new Date();
          const diffTime = Math.max(0, end.getTime() - doj.getTime());
          tenureDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        }

        let hireType = String(getValue('hire_type') || '').trim().toLowerCase();
        if (hireType !== 'new' && hireType !== 'replacement') {
          const repFor = String(getValue('replacement_for') || '').trim();
          const isRepForValid = repFor && !/^(n\/a|not applicable|none|-)$/i.test(repFor);
          if (isRepForValid) {
            hireType = 'replacement';
          } else {
            hireType = 'new';
          }
        }
        
        let attritionType = String(getValue('attrition_type') || '').trim().toLowerCase();
        const exitReason = String(getValue('exit_reason') || '').trim().toLowerCase();
        if (!attritionType && exitReason) {
          if (exitReason.includes('involuntary')) {
            attritionType = 'involuntary';
          } else if (exitReason.includes('voluntary')) {
            attritionType = 'voluntary';
          }
        }
        
        if (attritionType.includes('involuntary')) {
          attritionType = 'involuntary';
        } else if (attritionType.includes('voluntary') || attritionType.includes('retirement')) {
          attritionType = 'voluntary';
        } else {
          attritionType = exitDate ? 'voluntary' : '';
        }

        return {
          employee_id: String(getValue('employee_id') || '').trim(),
          name: String(getValue('name') || '').trim(),
          gender: String(getValue('gender') || '').trim(),
          marital_status: String(getValue('marital_status') || '').trim(),
          department: deptVal,
          designation: String(getValue('designation') || '').trim(),
          plant_location: plantLoc,
          pf_location: String(getValue('pf_location') || '').trim(),
          recruitment_source: String(getValue('recruitment_source') || '').trim(),
          recruiter_name: String(getValue('recruiter_name') || '').trim(),
          job_posted_date: parseDate(getValue('job_posted_date'), 'job_posted_date'),
          interview_date: parseDate(getValue('interview_date'), 'interview_date'),
          offer_date: parseDate(getValue('offer_date'), 'offer_date'),
          date_of_joining: doj,
          tat_days: parseNumber(getValue('tat_days')),
          cost_per_hire_inr: totalCost || parseNumber(costPerHireVal),
          monthly_ctc_inr: parseNumber(getValue('monthly_ctc_inr')),
          employment_status: empStatus,
          exit_date: exitDate,
          exit_reason: String(getValue('exit_reason') || '').trim(),
          tenure_days: tenureDays,
          category: String(getValue('category') || '').trim(),
          total_experience_years: parseNumber(getValue('total_experience_years')),
          survey_status: String(getValue('survey_status') || '').trim(),
          
          hire_type: hireType as 'new' | 'replacement',
          replacement_for: String(getValue('replacement_for') || '').trim(),
          base_cost_per_hire: baseCost,
          top_up_cost: topUp,
          attrition_type: attritionType as 'voluntary' | 'involuntary' | ''
        };
      };

      const mappedRecords = rawRecords.map(mapRowToHRRecord).filter(r => r.employee_id || r.name);

      setMappingPreview({
        fileName: file.name,
        totalRows: mappedRecords.length,
        headersFound: rawHeaders,
        headerRowIdx: headerRowIdx + 1,
        resolvedMappings,
        records: mappedRecords
      });
      setSuccessMessage(null);
      setErrorMessage(null);
    };

    if (isCsv) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (!results.data || results.data.length === 0) {
              setErrorMessage("The uploaded file does not contain any valid records.");
              return;
            }
            processRawData(results.data as any[][]);
          } catch (err: any) {
            setErrorMessage(`Error parsing CSV file: ${err.message || err}`);
          }
        },
        error: (err) => {
          setErrorMessage(`Failed to read CSV file: ${err.message}`);
        }
      });
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const ab = evt.target?.result;
          const wb = XLSX.read(ab, { type: 'array', cellDates: true });
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const rawSheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

          if (!rawSheetData || rawSheetData.length === 0) {
            setErrorMessage("The uploaded file does not contain any valid records.");
            return;
          }
          processRawData(rawSheetData);
        } catch (err: any) {
          setErrorMessage(`Error parsing Excel file: ${err.message || err}`);
        }
      };
      reader.onerror = () => {
        setErrorMessage("Failed to read Excel file.");
      };
      reader.readAsArrayBuffer(file);
    }

    e.target.value = '';
  };

  const confirmImportMapping = () => {
    if (!mappingPreview) return;
    const { records, totalRows } = mappingPreview;
    
    setHrReportData(records);
    setHRContextData(records);
    
    localStorage.setItem('alok_hr_import_date', new Date().toISOString());
    localStorage.setItem('alok_hr_import_count', String(records.length));

    if (records.length > 0) {
      const dates = records.map(r => r.date_of_joining).filter(Boolean) as Date[];
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        setFromDate(minDate.toISOString().split('T')[0]);
        setToDate(maxDate.toISOString().split('T')[0]);
      }
    }

    setSuccessMessage(`${totalRows} records imported successfully after validating column mappings!`);
    setErrorMessage(null);
    setMappingPreview(null);
    setIsGenerated(false);
    setFilteredReportData([]);
    setSelectedEmployee(null);
  };

  const loadBuiltInDemoData = () => {
    const mock = generateMockDataList();
    const parsed = mock.map((row: any) => {
      const plantLoc = canonicalizeLocation(row.plant_location);
      const deptVal = canonicalizeDepartment(row.department);

      return {
      ...row,
      plant_location: plantLoc,
      department: deptVal,
      job_posted_date: parseDate(row.job_posted_date, 'job_posted_date'),
      interview_date: parseDate(row.interview_date, 'interview_date'),
      offer_date: parseDate(row.offer_date, 'offer_date'),
      date_of_joining: parseDate(row.date_of_joining, 'date_of_joining'),
      exit_date: parseDate(row.exit_date, 'exit_date')
    };
    });
    
    setHrReportData(parsed);
    setHRContextData(parsed);
    // Persist only lightweight import metadata — NOT the full dataset (quota-safe)
    localStorage.setItem('alok_hr_import_date', new Date().toISOString());
    localStorage.setItem('alok_hr_import_count', String(parsed.length));

    if (parsed.length > 0) {
      const dates = parsed.map(r => r.date_of_joining).filter(Boolean) as Date[];
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        setFromDate(minDate.toISOString().split('T')[0]);
        setToDate(maxDate.toISOString().split('T')[0]);
      }
    }

    setSuccessMessage(`${parsed.length} records populated successfully from Alok demo database!`);
    setErrorMessage(null);
    setMappingPreview(null);
    setIsGenerated(false);
    setFilteredReportData([]);
    setSelectedEmployee(null);
    setSelectedBranch('All Branches');
  };

  const downloadSampleCSV = () => {
    const mock = generateMockDataList();
    const csv = Papa.unparse(mock);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ALOK_HR_Demo_Data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Report Action
  const handleGenerateReport = () => {
    if (hrReportData.length === 0) {
      alert("Please import data first");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      const filtered = hrReportData.filter((record) => {
        const branchMatch = selectedBranch === 'All Branches' || record.plant_location === selectedBranch;
        if (!branchMatch) return false;

        if (!record.date_of_joining) return false;
        const joinedBeforePeriodEnd = record.date_of_joining <= to;
        const isActiveOrExitedAfterPeriodStart = !(record.exit_date && record.exit_date < from);

        return joinedBeforePeriodEnd && isActiveOrExitedAfterPeriodStart;
      });

      setFilteredReportData(filtered);
      setIsGenerated(true);
      clearFilterDraft(); // Filters acted upon — draft no longer needed
      setIsLoading(false);
    }, 450);
  };

  // Load chart preferences on mount / user change
  useEffect(() => {
    const prefs = loadChartPreferences(currentUser?.id);
    setChartPrefs(prefs);
  }, [currentUser]);

  const handleHideChart = (chartId: string) => {
    const updated = chartPrefs.map(c => c.id === chartId ? { ...c, visible: false } : c);
    setChartPrefs(updated);
    saveChartPreferences(updated, currentUser?.id);
  };

  const handleToggleChartVisibility = (chartId: string) => {
    const updated = chartPrefs.map(c => c.id === chartId ? { ...c, visible: !c.visible } : c);
    setChartPrefs(updated);
    saveChartPreferences(updated, currentUser?.id);
  };

  const handleMoveChart = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= chartPrefs.length) return;
    
    const updated = [...chartPrefs];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    // Re-assign order based on index
    const reordered = updated.map((c, i) => ({ ...c, order: i }));
    setChartPrefs(reordered);
    saveChartPreferences(reordered, currentUser?.id);
  };

  const handleResetCharts = () => {
    setChartPrefs(DEFAULT_CHART_REGISTRY);
    saveChartPreferences(DEFAULT_CHART_REGISTRY, currentUser?.id);
  };

  // Load saved report history on mount
  useEffect(() => {
    const saved = localStorage.getItem('alok_hr_report_history');
    if (saved) {
      try {
        setHistoryList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Helper to save current report snapshot to history
  const saveCurrentReportToHistory = () => {
    if (activeHistoryReport !== null) return; // Guard: Do not save when viewing history!
    if (!isGenerated || filteredReportData.length === 0) return;

    // Convert chart data to the expected simple object maps
    const hiringByDeptMap: Record<string, number> = {};
    departmentChartData_live.forEach(item => {
      hiringByDeptMap[item.name] = item.count;
    });

    const hiringBySrcMap: Record<string, number> = {};
    sourceChartData_live.forEach(item => {
      hiringBySrcMap[item.name] = item.count;
    });

    const attritionByReasonMap: Record<string, number> = {};
    attritionReasonsChartData_live.forEach(item => {
      attritionByReasonMap[item.name] = item.count;
    });

    const snapshot: ReportSnapshot = {
      id: Date.now().toString(),
      generatedAt: new Date().toISOString(),
      fromDate,
      toDate,
      branchFilter: selectedBranch,
      totalHires: totalHires_live,
      avgTAT: avgTimeToHire_live,
      avgCostPerHire: avgCostPerHire_live.avgCost,
      totalSpend: totalRecruitmentSpend_live.totalSpend,
      attritionCount: attritionCount_live,
      attritionRate: attritionRate_live,
      avgTenureExits: formatTenureShortYMD(avgTenureDays_live),
      hiringByDepartment: hiringByDeptMap,
      hiringBySource: hiringBySrcMap,
      attritionByReason: attritionByReasonMap,
      recruiterStats: recruiterChartData_live.map(item => ({
        name: item.name,
        hires: item.hires,
        avgTAT: item.avgTat
      })),
      departmentTable: orgSummaryData_live,
      executiveSummaryText: executiveSummaryText_live
    };

    const saved = localStorage.getItem('alok_hr_report_history');
    let currentHistory: ReportSnapshot[] = [];
    if (saved) {
      try {
        currentHistory = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    // Check for duplicate parameters to prevent history flooding
    const latest = currentHistory[0];
    if (latest && 
        latest.fromDate === snapshot.fromDate && 
        latest.toDate === snapshot.toDate && 
        latest.branchFilter === snapshot.branchFilter &&
        latest.totalHires === snapshot.totalHires &&
        latest.attritionCount === snapshot.attritionCount) {
      // It is identical, just refresh the generated timestamp to show it's current
      latest.generatedAt = snapshot.generatedAt;
    } else {
      currentHistory.unshift(snapshot);
    }

    // Retain only the most recent 15 snapshots
    if (currentHistory.length > 15) {
      currentHistory = currentHistory.slice(0, 15);
    }

    localStorage.setItem('alok_hr_report_history', JSON.stringify(currentHistory));
    setHistoryList(currentHistory);
  };

  // Automatically save/update the history snapshot when compilation completes
  useEffect(() => {
    if (activeHistoryReport !== null) return; // Guard: Do not save when viewing history!
    if (isGenerated && filteredReportData.length > 0) {
      const timer = setTimeout(() => {
        saveCurrentReportToHistory();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [filteredReportData, isGenerated, fromDate, toDate, selectedBranch, activeHistoryReport]);

  // Run startup validation exactly once when dataset is loaded/imported
  useEffect(() => {
    if (hrReportData.length > 0) {
      validateDatasetOnce(hrReportData);
    }
  }, [hrReportData]);

  // Auto compile on load or when branch filter or dates change
  useEffect(() => {
    if (hrReportData.length > 0) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      // Get cleaned records (removes join_after_exit errors)
      const { cleaned } = getCleanedRecords(hrReportData, selectedBranch);

      const filtered = cleaned.filter((record) => {
        if (!record.date_of_joining) return false;
        const joinedBeforePeriodEnd = record.date_of_joining <= to;
        const isActiveOrExitedAfterPeriodStart = !(record.exit_date && record.exit_date < from);

        return joinedBeforePeriodEnd && isActiveOrExitedAfterPeriodStart;
      });

      setFilteredReportData(filtered);
      setIsGenerated(true);
      clearFilterDraft(); // Filters acted upon — draft no longer needed
    }
  }, [hrReportData, selectedBranch, fromDate, toDate]);

  // Filter stage audit logging and console assertion
  useEffect(() => {
    if (hrReportData.length > 0) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      const { cleaned } = getCleanedRecords(hrReportData, selectedBranch);
      const totalLoaded = hrReportData.length;
      const afterDate = cleaned.filter((r) => {
        if (!r.date_of_joining) return false;
        const joinedBeforePeriodEnd = r.date_of_joining <= to;
        const isActiveOrExitedAfterPeriodStart = !(r.exit_date && r.exit_date < from);
        return joinedBeforePeriodEnd && isActiveOrExitedAfterPeriodStart;
      }).length;
      const afterBranch = filteredReportData.length;

      console.assert(
        afterBranch <= afterDate,
        `[Filter Stage Assertion Failed] afterBranch (${afterBranch}) cannot be larger than afterDate (${afterDate})`
      );
      console.assert(
        afterDate <= totalLoaded,
        `[Filter Stage Assertion Failed] afterDate (${afterDate}) cannot be larger than totalLoaded (${totalLoaded})`
      );

      console.log(`[Filter Stage Audit Trail]`);
      console.log(`  - Active Filters: Date range (${fromDate} to ${toDate}), Branch (${selectedBranch})`);
      console.log(`  - Stage 1: Total Loaded: ${totalLoaded} records`);
      console.log(`  - Stage 2: After Date Filter: ${afterDate} records`);
      console.log(`  - Stage 3: After Branch Filter: ${afterBranch} records`);
    }
  }, [hrReportData, filteredReportData, fromDate, toDate, selectedBranch]);

  // Click outside handler to close the employee dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // PRE-CALCULATE METRICS - Normalized to UTC Midnight to prevent timezone offset boundary errors
  const fromDateObj = new Date(fromDate + 'T00:00:00Z');
  const toDateObj = new Date(toDate + 'T00:00:00Z');

  // Clean and filter raw records by branch
  const { cleaned: cleanedHRRecords, warnings: hrDataWarnings } = useMemo(() => {
    return getCleanedRecords(hrReportData, selectedBranch);
  }, [hrReportData, selectedBranch]);

  // 1. Total Hires
  const totalHires_live = calculateTotalHires(cleanedHRRecords, fromDateObj, toDateObj);

  // 2. Avg Time to Hire (TAT)
  const tatStats = calculateAvgTimeToHire(cleanedHRRecords, fromDateObj, toDateObj);
  const avgTimeToHire_live = tatStats.avgTat;
  const tatWarnings = tatStats.tatWarnings;

  // 3. Avg Cost per Hire
  const avgCostPerHire_live = calculateAvgCostPerHire(cleanedHRRecords, fromDateObj, toDateObj);

  // 4. Total Spend
  const totalRecruitmentSpend_live = calculateTotalSpend(cleanedHRRecords, fromDateObj, toDateObj);

  // 5. Attrition Count
  const attritionCount_live = calculateAttritionCount(cleanedHRRecords, fromDateObj, toDateObj);

  // 6. Attrition Rate
  const attritionStats_live = calculateAttritionRate(cleanedHRRecords, fromDateObj, toDateObj);
  const attritionRate_live = attritionStats_live.rate;
  const isInsufficientData = attritionStats_live.hasInsufficientData;

  // 7. Total Headcount (Headcount at end of period)
  const totalHeadcount_live = calculateHeadcountAtEnd(cleanedHRRecords, toDateObj);

  // 8. Average Tenure (Exits)
  const avgTenureDays_live = calculateAvgTenure(cleanedHRRecords, fromDateObj, toDateObj);
  
  const tenureMonths_live = Math.floor(avgTenureDays_live / 30);
  let tenureDaysRemainder_live = Math.round(avgTenureDays_live % 30);
  let tenureMonthsAdjusted_live = tenureMonths_live;
  if (tenureDaysRemainder_live === 30) {
    tenureMonthsAdjusted_live += 1;
    tenureDaysRemainder_live = 0;
  }

  // CHARTS COMPILATION
  // 1. Hiring by Department
  const deptGroupMap: Record<string, number> = {};
  cleanedHRRecords.filter(r => r.date_of_joining && r.date_of_joining >= fromDateObj && r.date_of_joining <= toDateObj)
    .forEach((r) => {
      const dept = r.department || 'Unknown';
      deptGroupMap[dept] = (deptGroupMap[dept] || 0) + 1;
    });
  const departmentChartData_live = Object.entries(deptGroupMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Sourcing Channels (Hiring by Source)
  const sourcingStats = calculateSourcingBreakdown(cleanedHRRecords, fromDateObj, toDateObj);
  const sourceChartData_live = sourcingStats.breakdown;

  // 3. Attrition Reasons Breakdown
  const reasonsStats = calculateAttritionReasonsBreakdown(cleanedHRRecords, fromDateObj, toDateObj);
  const attritionReasonsChartData_live = reasonsStats.breakdown;

  // 4. Recruiter Performance
  const recruiterChartData_live = calculateRecruiterPerformance(cleanedHRRecords, fromDateObj, toDateObj);

  // NEW ANALYTICS CHARTS COMPILATION
  // 1. Attrition Over Time (Monthly Trend)
  const getMonthlyAttritionTrend = (records: HRRecord[], start: Date, end: Date) => {
    const trend: { month: string; exits: number }[] = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    
    let iterations = 0;
    while (current <= last && iterations < 600) {
      iterations++;
      const year = current.getFullYear();
      const month = current.getMonth();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthStr = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;
      
      const monthExits = records.filter(r => {
        if (!r.exit_date) return false;
        const d = new Date(r.exit_date);
        return d.getFullYear() === year && d.getMonth() === month && d >= start && d <= end;
      }).length;
      
      trend.push({ month: monthStr, exits: monthExits });
      current.setMonth(current.getMonth() + 1);
    }
    return trend;
  };

  // 2. Hiring by Location + Department
  const getHiringByLocationDept = (records: HRRecord[], start: Date, end: Date) => {
    const hires = records.filter(r => r.date_of_joining && r.date_of_joining >= start && r.date_of_joining <= end);
    const locations = Array.from(new Set(records.map(r => r.plant_location).filter(Boolean))).sort();
    const depts = Array.from(new Set(records.map(r => r.department).filter(Boolean))).sort();
    
    return locations.map(loc => {
      const obj: any = { name: loc };
      depts.forEach(dept => {
        obj[dept] = hires.filter(h => h.plant_location === loc && h.department === dept).length;
      });
      return obj;
    });
  };

  // 3. Attrition by Location
  const getLocationAttritionData = (records: HRRecord[], start: Date, end: Date) => {
    const exits = records.filter(r => r.exit_date && r.exit_date >= start && r.exit_date <= end);
    const totalExitsCount = exits.length;
    
    const locationCounts: Record<string, number> = {};
    exits.forEach(r => {
      const loc = r.plant_location || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });
    
    // Bug 1 Fix: Sort BOTH labels and values together as pairs first
    const sortedPairs = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    
    // Map to a list of raw objects
    const itemsRaw = sortedPairs.map(([name, count]) => ({ name, count }));
    
    // Bug 2 Fix: Apply largest-remainder rounding so percentages sum to exactly 100%
    return roundPercentagesLargestRemainder(itemsRaw, d => d.count, totalExitsCount);
  };

  // 4. Monthly CTC Distribution by Department
  const getDeptCtcDistribution = (records: HRRecord[], periodEnd: Date) => {
    const activeEmps = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joined = r.date_of_joining <= periodEnd;
      const notExited = !r.exit_date || r.exit_date > periodEnd;
      return joined && notExited;
    });
    
    const deptMap: Record<string, number> = {};
    activeEmps.forEach(r => {
      const dept = r.department || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + (r.monthly_ctc_inr || 0);
    });
    
    return Object.entries(deptMap).map(([name, totalCtc]) => ({
      name,
      totalCtc
    })).sort((a, b) => b.totalCtc - a.totalCtc);
  };

  // 5. Gender & Marital Status Distribution
  const getGenderDistribution = (records: HRRecord[], start: Date, end: Date) => {
    const activeEmps = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joined = r.date_of_joining <= end;
      const notExited = !r.exit_date || r.exit_date > end;
      return joined && notExited;
    });
    const counts: Record<string, number> = {};
    activeEmps.forEach(r => {
      const g = r.gender || 'Unknown';
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getMaritalDistribution = (records: HRRecord[], start: Date, end: Date) => {
    const activeEmps = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joined = r.date_of_joining <= end;
      const notExited = !r.exit_date || r.exit_date > end;
      return joined && notExited;
    });
    const counts: Record<string, number> = {};
    activeEmps.forEach(r => {
      const m = r.marital_status || 'Unknown';
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Helper for Designation Seniority
  const getSeniorityLevel = (designation: string): 'Junior' | 'Mid' | 'Senior' => {
    const lower = (designation || '').toLowerCase();
    if (lower.includes('manager') || lower.includes('director') || lower.includes('vp') || lower.includes('head') || lower.includes('chief') || lower.includes('president') || lower.includes('lead engineer') || lower.includes('lead manager') || lower.includes('lead consultant')) {
      return 'Senior';
    }
    if (lower.includes('senior') || lower.includes('lead') || lower.includes('specialist') || lower.includes('consultant') || lower.includes('supervisor') || lower.includes('analyst')) {
      return 'Mid';
    }
    return 'Junior';
  };

  // 6. Designation Seniority Pyramid
  const getSeniorityDistribution = (records: HRRecord[], end: Date) => {
    const activeEmps = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joined = r.date_of_joining <= end;
      const notExited = !r.exit_date || r.exit_date > end;
      return joined && notExited;
    });
    const counts = { Junior: 0, Mid: 0, Senior: 0 };
    activeEmps.forEach(r => {
      const lvl = getSeniorityLevel(r.designation);
      counts[lvl] += 1;
    });
    return [
      { level: 'Senior', count: counts.Senior },
      { level: 'Mid', count: counts.Mid },
      { level: 'Junior', count: counts.Junior }
    ];
  };

  // 7. Cost per Hire by Recruitment Source
  const getCostPerHireBySource = (records: HRRecord[], start: Date, end: Date) => {
    const periodHires = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = r.date_of_joining.getTime();
      return joinMs >= start.getTime() && joinMs <= end.getTime();
    });
    const sourceCostMap: Record<string, { total: number; count: number }> = {};
    periodHires.forEach(r => {
      const src = r.recruitment_source || 'Unknown';
      if (!sourceCostMap[src]) sourceCostMap[src] = { total: 0, count: 0 };
      sourceCostMap[src].total += r.cost_per_hire_inr || 0;
      sourceCostMap[src].count += 1;
    });
    return Object.entries(sourceCostMap)
      .map(([name, val]) => ({
        name,
        avgCost: val.count > 0 ? Math.round(val.total / val.count) : 0
      }))
      .sort((a, b) => b.avgCost - a.avgCost);
  };

  // 8. Headcount Growth Over Time
  const getHeadcountGrowthTrend = (records: HRRecord[], start: Date, end: Date) => {
    const trend = calculateYearlyCtcVsHeadcount(records, start, end);
    return trend.map(t => ({
      month: t.month,
      headcount: t.headcount
    }));
  };

  // 8b. Monthly Hiring Trend
  const getMonthlyHiringTrend = (records: HRRecord[], start: Date, end: Date) => {
    const hires = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = r.date_of_joining.getTime();
      return joinMs >= start.getTime() && joinMs <= end.getTime();
    });
    
    const countMap: Record<string, number> = {};
    hires.forEach(r => {
      if (r.date_of_joining) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthStr = `${monthNames[r.date_of_joining.getMonth()]} ${r.date_of_joining.getFullYear()}`;
        countMap[monthStr] = (countMap[monthStr] || 0) + 1;
      }
    });

    const trend: { month: string; hires: number }[] = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    let iterations = 0;
    while (current <= last && iterations < 600) {
      iterations++;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthStr = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;
      trend.push({ month: monthStr, hires: countMap[monthStr] || 0 });
      current.setMonth(current.getMonth() + 1);
    }
    return trend;
  };

  // 8c. Hires by Location
  const getHiresByLocation = (records: HRRecord[], start: Date, end: Date) => {
    const hires = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = r.date_of_joining.getTime();
      return joinMs >= start.getTime() && joinMs <= end.getTime();
    });
    const locMap: Record<string, number> = {};
    hires.forEach(r => {
      const loc = r.plant_location || 'Unknown';
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    return Object.entries(locMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // 9. Attrition by Designation Level
  const getAttritionBySeniority = (records: HRRecord[], start: Date, end: Date) => {
    const exits = records.filter(r => r.exit_date && r.exit_date >= start && r.exit_date <= end);
    const counts = { Junior: 0, Mid: 0, Senior: 0 };
    exits.forEach(r => {
      const lvl = getSeniorityLevel(r.designation);
      counts[lvl] += 1;
    });
    return [
      { name: 'Junior', exits: counts.Junior },
      { name: 'Mid', exits: counts.Mid },
      { name: 'Senior', exits: counts.Senior }
    ];
  };

  // 10. Exit Reasons by Department
  const getExitReasonsByDepartment = (records: HRRecord[], start: Date, end: Date) => {
    const exits = records.filter(r => r.exit_date && r.exit_date >= start && r.exit_date <= end);
    const depts = Array.from(new Set(records.map(r => r.department).filter(Boolean))).sort();
    const reasons = ['Better Opportunity', 'Relocation', 'Personal Reasons', 'Performance Issue', 'Higher Studies', 'Compensation', 'Other'];
    
    const normalizeReason = (r: string) => {
      const lower = (r || '').toLowerCase();
      if (lower.includes('opportunity') || lower.includes('prospects')) return 'Better Opportunity';
      if (lower.includes('relocation')) return 'Relocation';
      if (lower.includes('personal')) return 'Personal Reasons';
      if (lower.includes('performance')) return 'Performance Issue';
      if (lower.includes('studies')) return 'Higher Studies';
      if (lower.includes('compensation') || lower.includes('salary')) return 'Compensation';
      return 'Other';
    };
    
    const data = depts.map(dept => {
      const obj: any = { department: dept };
      reasons.forEach(r => { obj[r] = 0; });
      
      const deptExits = exits.filter(e => e.department === dept);
      deptExits.forEach(e => {
        const norm = normalizeReason(e.exit_reason);
        obj[norm] = (obj[norm] || 0) + 1;
      });
      
      return obj;
    });
    
    return { data, reasons };
  };

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 3. Org Summary Breakdown table (using central helper!)
  const orgSummaryData_live = calculateDepartmentBreakdown(cleanedHRRecords, fromDateObj, toDateObj);

  // Sanity checks & data assertions
  const isAttritionRateValid = parseFloat(attritionRate_live) <= 100;
  const isAttritionCountValid = attritionCount_live <= totalHeadcount_live;
  const isDeptTableConsistent = orgSummaryData_live.every(dept => dept.active + dept.resigned === dept.total);
  const isDataIntegrityVerified = isAttritionRateValid && isAttritionCountValid && isDeptTableConsistent;

  console.assert(isAttritionRateValid, `[Sanity Check Failed] Attrition Rate (${attritionRate_live}%) exceeds 100%!`);
  console.assert(isAttritionCountValid, `[Sanity Check Failed] Attrition Count (${attritionCount_live}) is greater than Total Headcount (${totalHeadcount_live})!`);
  console.assert(isDeptTableConsistent, `[Sanity Check Failed] Active and Resigned departments counts do not sum to total headcount!`);

  if (isDataIntegrityVerified && hrReportData.length > 0) {
    console.log(`[Sanity Check Passed] All metrics and department breakdown tables are 100% mathematically consistent.`);
  }

  // DYNAMIC INSIGHTS / BULLET POINTS COMPILING
  const highestAttritionDept = [...orgSummaryData_live]
    .sort((a, b) => parseFloat(b.attritionPct) - parseFloat(a.attritionPct))[0];
  const highestAttritionDeptStr = highestAttritionDept && parseFloat(highestAttritionDept.attritionPct) > 0
    ? `${highestAttritionDept.department} department exhibits the highest lifetime attrition rate at ${highestAttritionDept.attritionPct}%.`
    : "No major department attrition spikes were identified in this reporting period.";

  const sourceStats: Record<string, { count: number; totalCost: number }> = {};
  const periodHiresForSource = cleanedHRRecords.filter(r => r.date_of_joining && r.date_of_joining >= fromDateObj && r.date_of_joining <= toDateObj);
  periodHiresForSource.forEach(r => {
    const s = r.recruitment_source || 'Unknown';
    if (!sourceStats[s]) sourceStats[s] = { count: 0, totalCost: 0 };
    sourceStats[s].count += 1;
    sourceStats[s].totalCost += (r.cost_per_hire_inr || 0);
  });
  const sortedSourceStats = Object.entries(sourceStats)
    .filter(([name, s]) => s.totalCost > 0 && s.count > 0)
    .map(([name, s]) => ({ name, avgCost: s.totalCost / s.count, count: s.count }))
    .sort((a, b) => a.avgCost - b.avgCost);
  const bestSource = sortedSourceStats[0];

  const deptGrowth = [...departmentChartData_live].sort((a, b) => b.count - a.count)[0];
  const deptGrowthStr = deptGrowth && deptGrowth.count > 0
    ? `${deptGrowth.name} division saw the highest rate of headcount expansion with ${deptGrowth.count} new hire${deptGrowth.count > 1 ? 's' : ''} during this period.`
    : "Talent intake remains steady and distributed evenly across operations.";

  // DYNAMIC EXECUTIVE SUMMARY
  const uniqueDeptsCount = new Set(filteredReportData.map(r => r.department).filter(Boolean)).size;
  const topDepts = [...orgSummaryData_live]
    .sort((a, b) => b.total - a.total)
    .slice(0, 2)
    .map(d => d.department);
  const topDeptsStr = topDepts.length > 0
    ? (topDepts.length === 1 ? topDepts[0] : `${topDepts[0]} and ${topDepts[1]}`)
    : "various divisions";

  const executiveSummaryText_live = `Between ${formatDatePretty(fromDate)} and ${formatDatePretty(toDate)}, ALOK Masterbatches hired ${totalHires_live} employee${totalHires_live === 1 ? '' : 's'} across ${uniqueDeptsCount} department${uniqueDeptsCount === 1 ? '' : 's'} at an average cost of ₹${avgCostPerHire_live.avgCost.toLocaleString('en-IN')} per hire. Attrition stood at ${attritionRate_live}% during this period, with ${topDeptsStr} showing the highest headcount overall.`;

  // === DYNAMIC SHADOW OVERRIDES FOR REPORT SNAPSHOTS ===
  const isViewingHistory = activeHistoryReport !== null;

  const activeHistoryAttrition = activeHistoryReport
  
    ? (() => {
        const { cleaned } = getCleanedRecords(hrReportData, activeHistoryReport.branchFilter);
        const stats = calculateAttritionRate(cleaned, new Date(activeHistoryReport.fromDate), new Date(activeHistoryReport.toDate));
        return {
          exitsCount: stats.exitsCount,
          attritionRate: stats.rate
        };
      })()
    : null;

  const totalHires = isViewingHistory ? activeHistoryReport.totalHires : totalHires_live;
  const avgTimeToHire = isViewingHistory ? activeHistoryReport.avgTAT : avgTimeToHire_live;
  const avgCostPerHire = isViewingHistory ? activeHistoryReport.avgCostPerHire : avgCostPerHire_live.avgCost;
  const totalRecruitmentSpend = isViewingHistory ? activeHistoryReport.totalSpend : totalRecruitmentSpend_live.totalSpend;
  const attritionCount = isViewingHistory && activeHistoryAttrition ? activeHistoryAttrition.exitsCount : attritionCount_live;
  const attritionRate = isViewingHistory && activeHistoryAttrition ? activeHistoryAttrition.attritionRate : attritionRate_live;
  const executiveSummaryText = isViewingHistory ? activeHistoryReport.executiveSummaryText : executiveSummaryText_live;

  const departmentChartData = isViewingHistory
    ? Object.entries(activeHistoryReport.hiringByDepartment).map(([name, count]) => ({ name, count: count as number })).sort((a, b) => b.count - a.count)
    : departmentChartData_live;

  const sourceChartData = isViewingHistory
    ? Object.entries(activeHistoryReport.hiringBySource).map(([name, count]) => ({ name, count: count as number }))
    : sourceChartData_live;

  const attritionReasonsChartData = isViewingHistory
    ? Object.entries(activeHistoryReport.attritionByReason).map(([name, count]) => ({ name, count: count as number })).sort((a, b) => b.count - a.count)
    : attritionReasonsChartData_live;

  const recruiterChartData = isViewingHistory
    ? activeHistoryReport.recruiterStats.map(item => ({ name: item.name, hires: item.hires, avgTat: item.avgTAT }))
    : recruiterChartData_live;

  const orgSummaryData = isViewingHistory
    ? activeHistoryReport.departmentTable
    : orgSummaryData_live;

  const tenureDisplayStr = isViewingHistory 
    ? activeHistoryReport.avgTenureExits 
    : formatTenureShortYMD(avgTenureDays_live);

  const displayFromDate = isViewingHistory ? activeHistoryReport.fromDate : fromDate;
  const displayToDate = isViewingHistory ? activeHistoryReport.toDate : toDate;
  const displayBranch = isViewingHistory ? activeHistoryReport.branchFilter : selectedBranch;

  const bestSourceStr = isViewingHistory 
    ? "Recruitment pipelines and candidate acquisition channels are preserved in this read-only snapshot." 
    : (bestSource ? `"${bestSource.name}" proved to be the most_cost-efficient recruitment pipeline, with an average acquisition cost of ₹${Math.round(bestSource.avgCost).toLocaleString('en-IN')} per hire.` : "Sourcing efficiency remains balanced across all channels.");

  const avgTenureStr = isViewingHistory
    ? (activeHistoryReport.attritionCount > 0 
        ? `The average tenure for resigned employees during this reporting timeframe was ${activeHistoryReport.avgTenureExits}.`
        : "No employee departures occurred during this timeframe, keeping organizational tenure preserved.")
    : (attritionCount_live > 0 
        ? `The average tenure for resigned employees during this reporting timeframe was ${formatTenureLongYMD(avgTenureDays_live)}.`
        : "No employee departures occurred during this timeframe, keeping organizational tenure preserved.");

  // Shadow-aware variables for the 5 new charts - UTC aligned
  const startForNewCharts = isViewingHistory ? new Date(activeHistoryReport.fromDate + 'T00:00:00Z') : fromDateObj;
  const endForNewCharts = isViewingHistory ? new Date(activeHistoryReport.toDate + 'T00:00:00Z') : toDateObj;
  const branchForNewCharts = isViewingHistory ? activeHistoryReport.branchFilter : selectedBranch;

  const { cleaned: cleanedForNewCharts } = useMemo(() => {
    return getCleanedRecords(hrReportData, branchForNewCharts);
  }, [hrReportData, branchForNewCharts]);

  const attritionMonthlyTrendChartData = getMonthlyAttritionTrend(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const hiringByLocDeptChartData = getHiringByLocationDept(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const activeDepartmentsList = Array.from(new Set(cleanedForNewCharts.map(r => r.department).filter(Boolean))).sort();

  const deptBreakdownForNewCharts = calculateDepartmentBreakdown(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const attritionByDeptChartData = deptBreakdownForNewCharts.map((d: any) => ({
    name: d.department,
    exits: d.resigned,
    rate: parseFloat(d.attritionPct)
  })).sort((a: any, b: any) => b.exits - a.exits);

  const attritionByLocChartData = getLocationAttritionData(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const deptCtcDistributionChartData = getDeptCtcDistribution(cleanedForNewCharts, endForNewCharts);

  // Shadow-aware variables for the 6 additional charts
  const genderDistributionChartData = getGenderDistribution(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const maritalDistributionChartData = getMaritalDistribution(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const seniorityPyramidChartData = getSeniorityDistribution(cleanedForNewCharts, endForNewCharts);
  const costPerHireBySourceChartData = getCostPerHireBySource(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const headcountGrowthTrendChartData = getHeadcountGrowthTrend(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const attritionBySeniorityChartData = getAttritionBySeniority(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const { data: exitReasonsByDeptChartData, reasons: exitReasonsList } = getExitReasonsByDepartment(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const monthlyHiringTrendChartData = getMonthlyHiringTrend(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const hiresByLocationChartData = getHiresByLocation(cleanedForNewCharts, startForNewCharts, endForNewCharts);

  // 6 new charts computations (shadow-aware)
  const newVsReplacementCostChartData = calculateNewVsReplacementCost(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const headcountCostByDeptChartData = calculateHeadcountCostByDepartment(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const headcountCostByLocationChartData = calculateHeadcountCostByLocation(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const topUpCostBreakdownChartData = calculateTopUpCostBreakdown(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const voluntaryVsInvoluntaryAttritionChartData = calculateVoluntaryInvoluntaryAttrition(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  const tenureDistributionChartData = calculateTenureDistribution(cleanedForNewCharts, endForNewCharts);
  const categoryDistributionChartData = calculateCategoryDistribution(cleanedForNewCharts, endForNewCharts);
  const experienceDistributionChartData = calculateExperienceDistribution(cleanedForNewCharts, endForNewCharts);
  const yearlyCtcVsHeadcountChartData = calculateYearlyCtcVsHeadcount(cleanedForNewCharts, startForNewCharts, endForNewCharts);
  
  const periodHires = cleanedForNewCharts.filter(r => r.date_of_joining && r.date_of_joining >= startForNewCharts && r.date_of_joining <= endForNewCharts);
  
  const hiringByDeptNamesData = departmentChartData.map(dept => {
    return {
      department: dept.name,
      hires: periodHires.filter(h => h.department === dept.name).map(h => h.name).join(', ')
    };
  });

  const avgHiresTenureText = formatDaysToTenureString(getAverageTenureDays(periodHires, endForNewCharts));
  
  const periodExits = cleanedForNewCharts.filter(r => r.exit_date && r.exit_date >= startForNewCharts && r.exit_date <= endForNewCharts);
  const avgExitsTenureText = formatDaysToTenureString(getAverageTenureDays(periodExits, endForNewCharts));

  // Offer to Joining Funnel
  // offersWithExplicitDate: count records that have an offer_date within the selected period.
  // funnelJoined: count records that joined within the selected period.
  // Use offersWithExplicitDate as the primary count. Fall back to funnelJoined ONLY when zero
  // records have any offer_date in the period (data gap), to avoid showing 0/N% conversion.
  const offersWithExplicitDate = cleanedForNewCharts.filter(r => r.offer_date && r.offer_date >= startForNewCharts && r.offer_date <= endForNewCharts).length;
  const funnelJoined = cleanedForNewCharts.filter(r => r.date_of_joining && r.date_of_joining >= startForNewCharts && r.date_of_joining <= endForNewCharts).length;
  // Do NOT use Math.max here — that caused Offers Sent to equal Joined when both are period-filtered.
  // When offer_date data exists, use it; otherwise estimate from joined count.
  const funnelDataIntegrityWarning = offersWithExplicitDate === 0;
  const funnelOffersSent = offersWithExplicitDate > 0 ? offersWithExplicitDate : funnelJoined;
  const rawConversionRate = funnelOffersSent > 0 ? ((funnelJoined / funnelOffersSent) * 100) : 0;
  // Safety cap: conversion rate can never logically exceed 100%
  const funnelConversionRate = Math.min(rawConversionRate, 100.0).toFixed(1);

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


  const renderDataTableForChart = (chartId: string) => {
    let data: any[] = [];
    let columns: { key: string; label: string; format?: (v: any) => string }[] = [];

    switch (chartId) {
      case 'hiring-by-department':
        data = departmentChartData;
        columns = [{ key: 'name', label: 'Department' }, { key: 'count', label: 'Count' }];
        break;
      case 'sourcing-channels':
        data = sourceChartData;
        columns = [{ key: 'name', label: 'Source' }, { key: 'count', label: 'Count' }];
        break;
      case 'attrition-reasons':
        data = attritionReasonsChartData;
        columns = [{ key: 'name', label: 'Reason' }, { key: 'count', label: 'Count' }];
        break;
      case 'recruiter-performance':
        data = recruiterChartData;
        columns = [{ key: 'name', label: 'Recruiter' }, { key: 'count', label: 'Count' }];
        break;
      case 'attrition-over-time':
        data = attritionMonthlyTrendChartData;
        columns = [{ key: 'month', label: 'Month' }, { key: 'attrition', label: 'Exits' }, { key: 'headcount', label: 'Headcount' }];
        break;
      case 'attrition-by-dept':
        data = attritionByDeptChartData;
        columns = [{ key: 'department', label: 'Department' }, { key: 'attritionPct', label: 'Attrition %', format: v => v + '%' }];
        break;
      case 'gender-distribution':
        data = genderDistributionChartData;
        columns = [{ key: 'name', label: 'Gender' }, { key: 'count', label: 'Count' }];
        break;
      case 'marital-distribution':
        data = maritalDistributionChartData;
        columns = [{ key: 'name', label: 'Status' }, { key: 'count', label: 'Count' }];
        break;
      case 'seniority-pyramid':
        data = seniorityPyramidChartData;
        columns = [{ key: 'name', label: 'Level' }, { key: 'count', label: 'Count' }];
        break;
      case 'cost-by-source':
        data = costPerHireBySourceChartData;
        columns = [{ key: 'source', label: 'Source' }, { key: 'avgCost', label: 'Avg Cost (₹)', format: v => '₹' + v.toLocaleString() }, { key: 'count', label: 'Hires' }];
        break;
      case 'headcount-growth':
        data = headcountGrowthTrendChartData;
        columns = [{ key: 'month', label: 'Month' }, { key: 'headcount', label: 'Headcount' }];
        break;
      case 'attrition-by-seniority':
        data = attritionBySeniorityChartData;
        columns = [{ key: 'name', label: 'Designation' }, { key: 'count', label: 'Exits' }];
        break;
      case 'exit-reasons-by-dept':
        data = exitReasonsByDeptChartData;
        columns = [{ key: 'department', label: 'Department' }, ...exitReasonsList.map(r => ({ key: r, label: r }))];
        break;
      case 'monthly-hiring-trend':
        data = monthlyHiringTrendChartData;
        columns = [{ key: 'month', label: 'Month' }, { key: 'hires', label: 'Hires' }];
        break;
      case 'hires-by-location':
        data = hiresByLocationChartData;
        columns = [{ key: 'location', label: 'Location' }, { key: 'hires', label: 'Hires' }];
        break;
      case 'new-vs-replacement-cost':
        data = newVsReplacementCostChartData;
        columns = [{ key: 'name', label: 'Type' }, { key: 'cost', label: 'Cost (₹)', format: v => '₹' + v.toLocaleString() }, { key: 'count', label: 'Count' }];
        break;
      case 'headcount-cost-by-dept':
        data = headcountCostByDeptChartData;
        columns = [{ key: 'name', label: 'Department' }, { key: 'headcount', label: 'Headcount' }, { key: 'cost', label: 'Cost (₹)', format: v => '₹' + v.toLocaleString() }];
        break;
      case 'headcount-cost-by-location':
        data = headcountCostByLocationChartData;
        columns = [{ key: 'name', label: 'Location' }, { key: 'headcount', label: 'Headcount' }, { key: 'cost', label: 'Cost (₹)', format: v => '₹' + v.toLocaleString() }];
        break;
      case 'top-up-cost-breakdown':
        data = topUpCostBreakdownChartData;
        columns = [{ key: 'department', label: 'Department' }, { key: 'baseCost', label: 'Base Cost (₹)', format: v => '₹' + v.toLocaleString() }, { key: 'topUpCost', label: 'Top-Up Cost (₹)', format: v => '₹' + v.toLocaleString() }];
        break;
      case 'voluntary-vs-involuntary-attrition': {
        const totalVoluntary = (voluntaryVsInvoluntaryAttritionChartData || []).reduce((sum, item) => sum + (item.Voluntary || 0), 0);
        const totalInvoluntary = (voluntaryVsInvoluntaryAttritionChartData || []).reduce((sum, item) => sum + (item.Involuntary || 0), 0);
        const totalUnspecified = (voluntaryVsInvoluntaryAttritionChartData || []).reduce((sum, item) => sum + (item.Unspecified || 0), 0);
        const totalExits = totalVoluntary + totalInvoluntary + totalUnspecified;
        
        data = [
          { name: 'Voluntary', count: totalVoluntary },
          { name: 'Involuntary', count: totalInvoluntary }
        ];
        if (totalUnspecified > 0) {
          data.push({ name: 'Unspecified', count: totalUnspecified });
        }
        data.push({ name: 'Total', count: totalExits });
        columns = [{ key: 'name', label: 'Type' }, { key: 'count', label: 'Count' }];
        break;
      }
      case 'tenure-distribution':
        data = tenureDistributionChartData;
        columns = [{ key: 'name', label: 'Tenure' }, { key: 'count', label: 'Count' }];
        break;
      default:
        return null;
    }

    if (!data || data.length === 0) return null;

    return (
      <div className="mt-4 border-t border-slate-100 pt-4 overflow-x-auto">
        <table className="w-full text-left text-[10px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold">
              {columns.map(c => (
                <th key={c.key} className="pb-2 font-mono uppercase px-2">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/50">
                {columns.map(c => (
                  <td key={c.key} className="py-2 px-2 font-medium">
                    {c.format ? c.format(row[c.key]) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChartById = (chartId: string) => {
    const chartConfig = chartPrefs.find(c => c.id === chartId);
    if (!chartConfig || !chartConfig.visible) return null;

    switch (chartId) {
      case 'hiring-by-department':
        return (
          <ChartCard
            key="hiring-by-department"
            chartId="hiring-by-department"
            title="Hiring by Department"
            subtitle={avgHiresTenureText}
            icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {departmentChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No department data available</p>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -25, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar fill="#4f46e5" dataKey="count" radius={[3, 3, 0, 0]} barSize={25} ><LabelList dataKey="count" position="top" fontSize={9} fill="#475569" /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'monthly-hiring-trend':
        return (
          <ChartCard
            key="monthly-hiring-trend"
            chartId="monthly-hiring-trend"
            title="Monthly Hiring Trend"
            icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {monthlyHiringTrendChartData.every(d => d.hires === 0) ? (
              <p className="text-xs text-slate-400 text-center py-10">No hiring data in period</p>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyHiringTrendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar fill="#4f46e5" dataKey="hires" name="Hires" radius={[3, 3, 0, 0]} barSize={25} ><LabelList dataKey="hires" position="top" fontSize={9} fill="#475569" /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {tatStats.rejectedDetails && tatStats.rejectedDetails.length > 0 && (
              <div className="mt-4 p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-left" data-html2canvas-ignore="true">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-800 uppercase font-mono tracking-wider">Data Quality Notes</p>
                    <p className="text-[9px] text-amber-700 leading-relaxed font-semibold">
                      {tatStats.rejectedDetails.length} employee records were excluded from Time-to-Hire (TAT) average calculations due to impossible data sequences (e.g., offer date preceding job post date or future-dated entries).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        );

      case 'hires-by-location':
        return (
          <ChartCard
            key="hires-by-location"
            chartId="hires-by-location"
            title="Hires by Plant/Location"
            icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {hiresByLocationChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No location data available</p>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hiresByLocationChartData} margin={{ top: 15, right: 10, left: -25, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} tickFormatter={shortenName} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar fill="#06b6d4" dataKey="count" name="Hires" radius={[3, 3, 0, 0]} barSize={25} ><LabelList dataKey="count" position="top" fontSize={9} fill="#475569" /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'sourcing-channels':
        return (
          <ChartCard
            key="sourcing-channels"
            chartId="sourcing-channels"
            title="Sourcing Channels"
            icon={<PieIcon className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {sourceChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No recruitment source data available</p>
            ) : (
              <div className="h-[240px] w-full flex flex-col justify-between">
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      innerRadius={35}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {sourceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} hires`, name]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'new-vs-replacement-cost':
        return (
          <ChartCard
            key="new-vs-replacement-cost"
            chartId="new-vs-replacement-cost"
            title="New vs Replacement Hiring Cost"
            icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newVsReplacementCostChartData} margin={{ top: 25, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, "Cost"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="cost" name="Cost (₹)" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={40} ><LabelList dataKey="cost" position="top" offset={8} fontSize={10} fontWeight="bold" fill="#3730a3" formatter={(val: any) => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`} /></Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              {renderDataTableForChart(chartId)}
            </ChartCard>
        );

      case 'headcount-cost-by-dept':
        return (
          <ChartCard
            key="headcount-cost-by-dept"
            chartId="headcount-cost-by-dept"
            title="Headcount & Cost by Department"
            icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
            fullWidth={true}
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={headcountCostByDeptChartData} margin={{ top: 25, right: 10, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} tickFormatter={shortenName} />
                  <YAxis stroke="#4f46e5" fontSize={9} tickLine={false} label={{ value: 'Headcount', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#4f46e5' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ec4899" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} label={{ value: 'Cost', angle: 90, position: 'insideRight', fontSize: 9, fill: '#ec4899' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="headcount" name="Active Headcount" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={20} ><LabelList dataKey="headcount" position="top" offset={8} fontSize={10} fontWeight="bold" fill="#3730a3" /></Bar>
                  <Line yAxisId="right" type="monotone" dataKey="totalCost" name="Hiring Cost (INR)" stroke="#ec4899" strokeWidth={2} ><LabelList dataKey="totalCost" position="top" offset={12} fontSize={10} fontWeight="bold" fill="#9d174d" formatter={(v: any) => v > 0 ? `₹${(v / 1000).toFixed(0)}k` : ''} /></Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Table layout below the chart */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-slate-500 font-bold uppercase">Department</th>
                    <th className="px-3 py-2 text-center text-slate-500 font-bold uppercase">Headcount</th>
                    <th className="px-3 py-2 text-right text-slate-500 font-bold uppercase">Hiring Spend</th>
                    <th className="px-3 py-2 text-center text-slate-500 font-bold uppercase">Avg Tenure</th>
                  </tr>
                </thead>
                <tbody>
                  {headcountCostByDeptChartData.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-700">{row.department}</td>
                      <td className="px-3 py-2 text-center text-slate-700">{row.headcount}</td>
                      <td className="px-3 py-2 text-right text-slate-700">₹{row.totalCost.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{row.avgTenureText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        );

      case 'headcount-cost-by-location':
        return (
          <ChartCard
            key="headcount-cost-by-location"
            chartId="headcount-cost-by-location"
            title="Headcount & Cost by Location"
            icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
            fullWidth={true}
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={headcountCostByLocationChartData} margin={{ top: 25, right: 10, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="location" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} tickFormatter={shortenName} />
                  <YAxis stroke="#4f46e5" fontSize={9} tickLine={false} label={{ value: 'Headcount', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#4f46e5' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ec4899" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} label={{ value: 'Cost', angle: 90, position: 'insideRight', fontSize: 9, fill: '#ec4899' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="headcount" name="Active Headcount" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={20} ><LabelList dataKey="headcount" position="top" offset={8} fontSize={10} fontWeight="bold" fill="#3730a3" /></Bar>
                  <Line yAxisId="right" type="monotone" dataKey="totalCost" name="Hiring Cost (INR)" stroke="#ec4899" strokeWidth={2} ><LabelList dataKey="totalCost" position="top" offset={12} fontSize={10} fontWeight="bold" fill="#9d174d" formatter={(v: any) => v > 0 ? `₹${(v / 1000).toFixed(0)}k` : ''} /></Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Table layout below the chart */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-slate-500 font-bold uppercase">Plant Location</th>
                    <th className="px-3 py-2 text-center text-slate-500 font-bold uppercase">Headcount</th>
                    <th className="px-3 py-2 text-right text-slate-500 font-bold uppercase">Hiring Spend</th>
                    <th className="px-3 py-2 text-center text-slate-500 font-bold uppercase">Avg Tenure</th>
                  </tr>
                </thead>
                <tbody>
                  {headcountCostByLocationChartData.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-700">{row.location}</td>
                      <td className="px-3 py-2 text-center text-slate-700">{row.headcount}</td>
                      <td className="px-3 py-2 text-right text-slate-700">₹{row.totalCost.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{row.avgTenureText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        );

      case 'top-up-cost-breakdown':
        return (
          <ChartCard
            key="top-up-cost-breakdown"
            chartId="top-up-cost-breakdown"
            title="Top-Up Cost Breakdown"
            icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUpCostBreakdownChartData} margin={{ top: 25, right: 10, left: -15, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} tickFormatter={shortenName} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, "Cost"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="baseCost" name="Base Cost" stackId="a" fill="#4f46e5" ><LabelList dataKey="baseCost" position="center" fontSize={9} fontWeight="bold" fill="#ffffff" formatter={(v: any) => v > 0 ? `₹${(v / 1000).toFixed(0)}k` : ''} /></Bar>
                  <Bar dataKey="topUpCost" name="Top-Up Cost" stackId="a" fill="#06b6d4" ><LabelList dataKey="topUpCost" position="top" offset={8} fontSize={10} fontWeight="bold" fill="#0f766e" formatter={(v: any) => v > 0 ? `₹${(v / 1000).toFixed(0)}k` : ''} /></Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              {renderDataTableForChart(chartId)}
            </ChartCard>
        );

      case 'attrition-over-time':
        return (
          <ChartCard
            key="attrition-over-time"
            chartId="attrition-over-time"
            title="Attrition Over Time"
            subtitle={avgExitsTenureText}
            icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {attritionMonthlyTrendChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No monthly attrition data available</p>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attritionMonthlyTrendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Area type="monotone" dataKey="exits" name="Exits" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExits)" ><LabelList dataKey="exits" position="top" fontSize={9} fill="#475569" /></Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'attrition-by-dept':
        return (
          <ChartCard
            key="attrition-by-dept"
            chartId="attrition-by-dept"
            title="Attrition Rate by Department"
            subtitle={avgExitsTenureText}
            icon={<TrendingDown className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Low (&le; 5%)
              </span>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" /> Moderate (5% - 12%)
              </span>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-rose-500 rounded-full" /> High (&gt; 12%)
              </span>
            </div>
            {attritionByDeptChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No department attrition data available</p>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attritionByDeptChartData} margin={{ top: 15, right: 10, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} tickFormatter={shortenName} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, (dataMax) => Math.min(100, Math.max(20, Math.ceil(dataMax / 5) * 5))]} />
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [`${props.payload.exits} exits (${value}%)`, "Attrition Rate"]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar dataKey="rate" radius={[3, 3, 0, 0]} barSize={25}>
                      {attritionByDeptChartData.map((entry: any, index: number) => {
                        const color = entry.rate <= 5.0 ? '#10b981' : (entry.rate <= 12.0 ? '#f59e0b' : '#f43f5e');
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                      <LabelList dataKey="rate" position="top" fontSize={10} fill="#475569" formatter={(v: any) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'attrition-reasons':
        return (
          <ChartCard
            key="attrition-reasons"
            chartId="attrition-reasons"
            title="Attrition Reasons"
            icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {attritionReasonsChartData.length === 0 || attritionCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-[240px] border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">No recorded resignations in range</p>
              </div>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attritionReasonsChartData} layout="vertical" margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={110} tickFormatter={(val) => val && val.length > 20 ? val.substring(0, 18) + '...' : val} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar dataKey="count" fill="#f43f5e" radius={[0, 3, 3, 0]} barSize={15} ><LabelList dataKey="count" position="right" offset={8} fontSize={10} fontWeight="bold" fill="#be123c" /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'voluntary-vs-involuntary-attrition':
        return (
          <ChartCard
            key="voluntary-vs-involuntary-attrition"
            chartId="voluntary-vs-involuntary-attrition"
            title="Voluntary vs Involuntary Attrition"
            subtitle={avgExitsTenureText}
            icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={voluntaryVsInvoluntaryAttritionChartData} margin={{ top: 25, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Voluntary" name="Voluntary" stackId="a" fill="#f59e0b" ><LabelList dataKey="Voluntary" position="center" fontSize={9} fontWeight="bold" fill="#ffffff" formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                  <Bar dataKey="Involuntary" name="Involuntary" stackId="a" fill="#f43f5e" ><LabelList dataKey="Involuntary" position="top" offset={8} fontSize={10} fontWeight="bold" fill="#be123c" formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              {renderDataTableForChart(chartId)}
            </ChartCard>
        );

      case 'tenure-distribution':
        return (
          <ChartCard
            key="tenure-distribution"
            chartId="tenure-distribution"
            title="Tenure / Longevity Distribution"
            icon={<Calendar className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenureDistributionChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [`${value} employees`, "Headcount"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" name="Employees" fill="#8b5cf6" radius={[3, 3, 0, 0]} barSize={25} ><LabelList dataKey="count" position="top" fontSize={9} fill="#475569" /></Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              {renderDataTableForChart(chartId)}
            </ChartCard>
        );

      case 'recruiter-performance': {
        const perfFull = calcRecruiterPerformance(cleanedHRRecords, fromDateObj, toDateObj);
        const dirtyRecruiterCount = perfFull.dirtyCount;
        const dirtyRecruiterNames = Array.from(new Set(perfFull.dirtyDetails.map(h => (h.recruiter_name || '').trim())));

        return (
          <ChartCard
            key="recruiter-performance"
            chartId="recruiter-performance"
            title="Recruiter Performance Summary"
            icon={<UserPlus className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
            fullWidth={true}
          >
            {recruiterChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No recruiter statistics available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recruiter Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Hires</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg TAT (days)</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Most Used Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterChartData.map((recruiter, idx) => {
                      const isGreen = recruiter.avgTat < 25;
                      const isAmber = recruiter.avgTat >= 25 && recruiter.avgTat <= 35;
                      const badgeColor = isGreen ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isAmber ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200';
                      
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-xs font-medium text-slate-700">{recruiter.name}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{recruiter.hires}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                              {recruiter.avgTat}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">{recruiter.mostUsedSource}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {dirtyRecruiterCount > 0 && (
              <div className="mt-4 p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-left" data-html2canvas-ignore="true">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-800 uppercase font-mono tracking-wider">Data Quality Notes</p>
                    <p className="text-[9px] text-amber-700 leading-relaxed font-semibold">
                      {dirtyRecruiterCount} employee hire records were excluded from recruiter metrics because the raw 'HR Recruiter' field contains non-recruiter source leaks (e.g., {dirtyRecruiterNames.map(n => `"${n || 'blank'}"`).join(', ')}).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        );
      }

      case 'cost-by-source':
        return (
          <ChartCard
            key="cost-by-source"
            chartId="cost-by-source"
            title="Avg Cost per Hire by Source"
            icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {costPerHireBySourceChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No hiring spend data available in period</p>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costPerHireBySourceChartData} layout="vertical" margin={{ top: 10, right: 45, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={110} tickFormatter={(val) => val && val.length > 20 ? val.substring(0, 18) + '...' : val} />
                    <Tooltip
                      formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, "Average Cost"]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar dataKey="avgCost" name="Avg Cost (INR)" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={15} ><LabelList dataKey="avgCost" position="right" offset={8} fontSize={10} fontWeight="bold" fill="#0f766e" formatter={(v: any) => v > 0 ? `₹${v.toLocaleString('en-IN')}` : ''} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'headcount-growth':
        return (
          <ChartCard
            key="headcount-growth"
            chartId="headcount-growth"
            title="Headcount Growth Trend (Cumulative)"
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
            fullWidth={true}
          >
            {headcountGrowthTrendChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No monthly growth trend available</p>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={headcountGrowthTrendChartData} margin={{ top: 25, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[dataMin => Math.max(0, dataMin - 2), dataMax => dataMax + 2]} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Legend verticalAlign="top" height={28} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="headcount" name="Active Headcount" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGrowth)" activeDot={{ r: 6 }} ><LabelList dataKey="headcount" position="top" offset={8} fontSize={10} fontWeight="bold" fill="#3730a3" /></Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'seniority-pyramid':
        return (
          <ChartCard
            key="seniority-pyramid"
            chartId="seniority-pyramid"
            title="Designation Seniority Pyramid"
            icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {seniorityPyramidChartData.every(d => d.count === 0) ? (
              <p className="text-xs text-slate-400 text-center py-10">No seniority data available</p>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seniorityPyramidChartData} layout="vertical" margin={{ top: 10, right: 20, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis dataKey="level" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={110} tickFormatter={(val) => val && val.length > 20 ? val.substring(0, 18) + '...' : val} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar dataKey="count" name="Employees" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={25} ><LabelList dataKey="count" position="top" fontSize={9} fill="#475569" /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'attrition-by-seniority':
        return (
          <ChartCard
            key="attrition-by-seniority"
            chartId="attrition-by-seniority"
            title="Attrition by Designation Level"
            subtitle={avgExitsTenureText}
            icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
          >
            {attritionBySeniorityChartData.every(d => d.exits === 0) ? (
              <p className="text-xs text-slate-400 text-center py-10">No exits recorded in period</p>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attritionBySeniorityChartData} margin={{ top: 20, right: 10, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={45} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Bar dataKey="exits" name="Exits" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={25} ><LabelList dataKey="exits" position="top" fontSize={9} fill="#475569" /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'exit-reasons-by-dept':
        return (
          <ChartCard
            key="exit-reasons-by-dept"
            chartId="exit-reasons-by-dept"
            title="Exit Reasons by Department"
            icon={<BarChart3 className="h-4 w-4 text-indigo-600" />}
            visible={chartConfig.visible}
            onHide={handleHideChart}
            fullWidth={true}
          >
            {exitReasonsByDeptChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No exit reasons data available</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exitReasonsByDeptChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="department" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                    {exitReasonsList.map((reason, index) => (
                      <Bar
                        key={reason}
                        dataKey={reason}
                        name={reason}
                        fill={COLORS[index % COLORS.length]}
                        stackId="a"
                        barSize={25}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        );

      case 'category-distribution':
        return (
          <ChartCard key="category-distribution" chartId="category-distribution" title="Category Distribution" icon={<BarChart3 className="h-4 w-4 text-indigo-600" />} visible={chartConfig.visible} onHide={handleHideChart}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistributionChartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Bar fill="#4f46e5" dataKey="count" radius={[3, 3, 0, 0]} barSize={25}>
                    <LabelList dataKey="count" position="top" fontSize={9} fill="#475569" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 overflow-x-auto">
              <table className="w-full text-left text-[10px] whitespace-nowrap">
                <thead><tr className="border-b border-slate-100 text-slate-500 font-bold"><th className="pb-2 font-mono uppercase">Category</th><th className="pb-2 text-right font-mono uppercase">Count</th></tr></thead>
                <tbody>{categoryDistributionChartData.map((d, i) => <tr key={i} className="border-b border-slate-50 text-slate-700 last:border-0"><td className="py-2">{d.name}</td><td className="py-2 text-right font-bold">{d.count}</td></tr>)}</tbody>
              </table>
            </div>
          </ChartCard>
        );
      case 'experience-distribution':
        return (
          <ChartCard key="experience-distribution" chartId="experience-distribution" title="Experience Distribution" icon={<BarChart3 className="h-4 w-4 text-indigo-600" />} visible={chartConfig.visible} onHide={handleHideChart}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experienceDistributionChartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Bar fill="#0ea5e9" dataKey="count" radius={[3, 3, 0, 0]} barSize={25}>
                    <LabelList dataKey="count" position="top" fontSize={9} fill="#475569" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 overflow-x-auto">
              <table className="w-full text-left text-[10px] whitespace-nowrap">
                <thead><tr className="border-b border-slate-100 text-slate-500 font-bold"><th className="pb-2 font-mono uppercase">Experience</th><th className="pb-2 text-right font-mono uppercase">Count</th></tr></thead>
                <tbody>{experienceDistributionChartData.map((d, i) => <tr key={i} className="border-b border-slate-50 text-slate-700 last:border-0"><td className="py-2">{d.name}</td><td className="py-2 text-right font-bold">{d.count}</td></tr>)}</tbody>
              </table>
            </div>
          </ChartCard>
        );
      case 'yearly-ctc-trend':
        return (
          <ChartCard key="yearly-ctc-trend" chartId="yearly-ctc-trend" title="Yearly CTC vs Headcount" icon={<TrendingUp className="h-4 w-4 text-indigo-600" />} visible={chartConfig.visible} onHide={handleHideChart}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyCtcVsHeadcountChartData} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `${val}`} domain={[dataMin => Math.max(0, dataMin - 2), dataMax => dataMax + 2]} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} domain={[dataMin => Math.max(0, dataMin - 5000000), dataMax => dataMax + 5000000]} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Area yAxisId="left" type="monotone" name="Headcount" dataKey="headcount" stroke="#4f46e5" strokeWidth={2} fillOpacity={0.05} fill="#4f46e5" />
                  <Area yAxisId="right" type="monotone" name="Total Yearly CTC" dataKey="totalCtc" stroke="#10b981" strokeWidth={2} fillOpacity={0.1} fill="#10b981" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 overflow-x-auto">
              <table className="w-full text-left text-[10px] whitespace-nowrap">
                <thead><tr className="border-b border-slate-100 text-slate-500 font-bold"><th className="pb-2 font-mono uppercase">Month</th><th className="pb-2 text-right font-mono uppercase">Headcount</th><th className="pb-2 text-right font-mono uppercase">Total CTC</th></tr></thead>
                <tbody>{yearlyCtcVsHeadcountChartData.map((d, i) => <tr key={i} className="border-b border-slate-50 text-slate-700 last:border-0"><td className="py-2">{d.month}</td><td className="py-2 text-right font-bold">{d.headcount}</td><td className="py-2 text-right font-bold">₹{d.totalCtc.toLocaleString('en-IN')}</td></tr>)}</tbody>
              </table>
            </div>
          </ChartCard>
        );
      case 'hiring-by-dept-names':
        return (
          <ChartCard key="hiring-by-dept-names" chartId="hiring-by-dept-names" title="Hiring by Dept (with names)" icon={<BarChart3 className="h-4 w-4 text-indigo-600" />} visible={chartConfig.visible} onHide={handleHideChart}>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-[10px] whitespace-nowrap">
                <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold"><th className="p-3 font-mono uppercase">Department</th><th className="p-3 font-mono uppercase">Hires</th></tr></thead>
                <tbody>{hiringByDeptNamesData.map((d, i) => <tr key={i} className="border-b border-slate-50 text-slate-700 hover:bg-slate-50/50"><td className="p-3 font-bold">{d.department}</td><td className="p-3 text-slate-600 whitespace-normal">{d.hires || '-'}</td></tr>)}</tbody>
              </table>
            </div>
          </ChartCard>
        );
      default:
        return null;
    }
  };

  const downloadPDF = async () => {
    console.log('PDF download clicked');
    const element = document.getElementById('hr-report-capture');
    if (!element) {
      console.error('Target capture element #hr-report-capture not found in the DOM.');
      setErrorMessage('Failed to locate the report canvas element. Please make sure reports are generated first.');
      return;
    }
    
    setIsExporting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    // Temporarily make the element fully visible for capture
    const originalOverflow = element.style.overflow;
    const originalMaxHeight = element.style.maxHeight;
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';

    try {
      // Step 3: Add a 500ms delay to ensure all recharts animations/drawings are fully initialized/rendered
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Step 1: Capture the ENTIRE report as ONE tall canvas — not page by page
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowHeight: element.scrollHeight,
        height: element.scrollHeight,
        width: element.scrollWidth,
        backgroundColor: '#ffffff',
        logging: true,
        onclone: (clonedDoc) => {
          // Fix SVG or ResponsiveContainers that might render 0 width in offscreen canvas clone
          const containers = clonedDoc.querySelectorAll('.recharts-responsive-container');
          containers.forEach((container: any) => {
            // Check if this chart wrapper takes full width
            const isFullWidth = container.closest('.col-span-1\\.5') || container.closest('.lg\\:col-span-2') || container.closest('.col-span-2');
            container.style.width = isFullWidth ? '780px' : '380px';
            container.style.height = '240px';
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // Step 2: Set up A4 PDF dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // mm per canvas pixel
      const ratio = pdfWidth / canvasWidth;
      const totalHeightMM = canvasHeight * ratio;

      // Height of one A4 page in canvas pixels
      const pageHeightPx = Math.floor(pdfHeight / ratio);

      // Step 3: Slice the single canvas into A4 pages
      let yOffsetPx = 0;
      let pageNum = 0;

      while (yOffsetPx < canvasHeight) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        // Use negative y to shift the image up, showing a different slice each page
        pdf.addImage(
          imgData,
          'JPEG',
          0,                    // x position
          -(yOffsetPx * ratio), // y position — negative scrolls to current slice
          pdfWidth,             // image width = full page width
          totalHeightMM         // total image height (spans multiple pages)
        );

        yOffsetPx += pageHeightPx;
        pageNum++;
      }
      
      pdf.save(`ALOK_HR_Report_${displayFromDate}_to_${displayToDate}.pdf`);
      setSuccessMessage('Report PDF downloaded successfully.');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      const errMsg = err?.message || err || 'Unknown error occurred during canvas rendering';
      setErrorMessage(`Failed to generate PDF: ${errMsg}. Please try refreshing or using another browser.`);
    } finally {
      // Restore original styles
      element.style.overflow = originalOverflow;
      element.style.maxHeight = originalMaxHeight;
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs text-indigo-600 font-bold font-mono uppercase tracking-wider">Executive Intelligence</p>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">ALOK HR Analytics & Reports</h2>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            id="csv-file-picker"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <label
            htmlFor="csv-file-picker"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Upload className="h-4 w-4" />
            Import Data (CSV / Excel)
          </label>

          <button
            onClick={loadBuiltInDemoData}
            className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Database className="h-4 w-4 text-indigo-500" />
            Use Built-In Demo Data
          </button>

          <button
            onClick={() => setIsManageChartsOpen(true)}
            className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Settings className="h-4 w-4 text-indigo-500" />
            Manage Charts
          </button>
          
          <button
            onClick={downloadSampleCSV}
            title="Download Template CSV"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>


        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-xs text-emerald-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold cursor-pointer text-xs">
              Dismiss
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer text-xs">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COLUMN MAPPING PREVIEW CONFIRMATION MODAL */}
      <AnimatePresence>
        {mappingPreview && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMappingPreview(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/50 rounded-t-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                        Column Mapping Preview
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Review how your file columns were matched to internal fields before importing.
                      </p>
                    </div>
                    <button
                      onClick={() => setMappingPreview(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* File info badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-xs">
                      <FileText className="h-3 w-3 text-indigo-500" />
                      {mappingPreview.fileName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-xs">
                      <Table className="h-3 w-3 text-indigo-500" />
                      {mappingPreview.totalRows} data rows
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-xs">
                      <Search className="h-3 w-3 text-amber-500" />
                      Headers detected in Row {mappingPreview.headerRowIdx}
                    </span>
                  </div>
                </div>

                {/* Mapping Table */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Matched Columns */}
                  <div>
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Matched Columns ({Object.keys(mappingPreview.resolvedMappings).length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2 font-black text-slate-600 text-[10px] uppercase tracking-wider">Your Column</th>
                            <th className="text-center px-2 py-2 font-black text-slate-400 text-[10px]">→</th>
                            <th className="text-left px-3 py-2 font-black text-slate-600 text-[10px] uppercase tracking-wider">Internal Field</th>
                            <th className="text-center px-3 py-2 font-black text-slate-600 text-[10px] uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(mappingPreview.resolvedMappings).map(([internalField, rawColName], idx) => (
                            <tr key={internalField} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="px-3 py-2 font-mono font-bold text-indigo-700">{rawColName}</td>
                              <td className="px-2 py-2 text-center text-slate-300 font-bold">→</td>
                              <td className="px-3 py-2 font-mono text-slate-600">{internalField}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  Matched
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Auto-derived & Optional Fields */}
                  {(() => {
                    const allFields = ['employee_id','name','gender','marital_status','department','designation','plant_location','recruitment_source','recruiter_name','job_posted_date','interview_date','offer_date','date_of_joining','tat_days','cost_per_hire_inr','monthly_ctc_inr','employment_status','exit_date','exit_reason','tenure_days'];
                    const mapped = Object.keys(mappingPreview.resolvedMappings);
                    const unmapped = allFields.filter(f => !mapped.includes(f));
                    
                    const autoDerived: { field: string; note: string }[] = [];
                    const optionalMissing: { field: string; note: string }[] = [];
                    
                    unmapped.forEach(field => {
                      if (field === 'employment_status') {
                        autoDerived.push({ field, note: 'Auto-derived: "Active" if no exit date, "Resigned" if exit date present' });
                      } else if (field === 'tenure_days') {
                        autoDerived.push({ field, note: 'Auto-calculated: (exit_date or today) − date_of_joining, in days' });
                      } else if (field === 'interview_date') {
                        optionalMissing.push({ field, note: 'Optional — charts depending on this will show "N/A"' });
                      } else {
                        optionalMissing.push({ field, note: 'Not found in file — will default to empty' });
                      }
                    });

                    return (
                      <>
                        {autoDerived.length > 0 && (
                          <div>
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                              Auto-Derived Fields ({autoDerived.length})
                            </h4>
                            <div className="space-y-1.5">
                              {autoDerived.map(({ field, note }) => (
                                <div key={field} className="flex items-start gap-2 px-3 py-2 bg-amber-50/60 border border-amber-100 rounded-lg">
                                  <span className="font-mono text-[11px] font-bold text-amber-800 shrink-0">{field}</span>
                                  <span className="text-[10px] text-amber-600 leading-relaxed">— {note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {optionalMissing.length > 0 && (
                          <div>
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                              Optional / Unmapped ({optionalMissing.length})
                            </h4>
                            <div className="space-y-1.5">
                              {optionalMissing.map(({ field, note }) => (
                                <div key={field} className="flex items-start gap-2 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg">
                                  <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">{field}</span>
                                  <span className="text-[10px] text-slate-400 leading-relaxed">— {note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Sample data preview */}
                  {mappingPreview.records.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-indigo-500" />
                        Data Preview (first 3 rows)
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">ID</th>
                              <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">Name</th>
                              <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">Dept</th>
                              <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">Designation</th>
                              <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">DOJ</th>
                              <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mappingPreview.records.slice(0, 3).map((row, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="px-2.5 py-1.5 font-mono text-indigo-600 font-bold">{row.employee_id || '—'}</td>
                                <td className="px-2.5 py-1.5 text-slate-700 font-semibold">{row.name || '—'}</td>
                                <td className="px-2.5 py-1.5 text-slate-500">{row.department || '—'}</td>
                                <td className="px-2.5 py-1.5 text-slate-500">{row.designation || '—'}</td>
                                <td className="px-2.5 py-1.5 text-slate-500 font-mono">{row.date_of_joining ? row.date_of_joining.toLocaleDateString() : '—'}</td>
                                <td className="px-2.5 py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.employment_status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                                    {row.employment_status || '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between gap-3">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Verify the mappings above are correct. Click <strong>Confirm</strong> to load {mappingPreview.totalRows} records.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMappingPreview(null)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImportMapping}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm &amp; Import
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EMPTY STATE BEFORE IMPORT */}
      {hydrationError ? (
        <div className="bg-rose-50 border border-dashed border-rose-300 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="h-14 w-14 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Hydration Failed</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              We couldn't restore your HR dataset. This might be due to a browser storage issue.
            </p>
            <p className="text-[10px] text-rose-600 font-mono bg-white/50 p-2 rounded-lg mt-2">{hydrationError}</p>
          </div>
          <button
            onClick={retryHydration}
            className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 mx-auto mt-4"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Restoration
          </button>
        </div>
      ) : isHydrating ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4 my-8 animate-pulse">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Hydrating Data Catalog...</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Restoring your persisted dataset from secure IndexedDB storage.
            </p>
          </div>
        </div>
      ) : hrReportData.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <FileText className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Data Imported Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No corporate records have been loaded. Click "Import Data (CSV / Excel)" or use the quick "Use Built-In Demo Data" option to instantly visualize reports.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <label
              htmlFor="csv-file-picker"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="h-4 w-4" />
              Import CSV / Excel File
            </label>
            <button
              onClick={loadBuiltInDemoData}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Database className="h-4 w-4 text-indigo-500" />
              Use Built-In Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB SYSTEM */}
          <div className="flex border-b border-slate-200" data-html2canvas-ignore="true">
            <button
              onClick={() => {
                setActiveTab('generate');
              }}
              className={`pb-3.5 px-6 font-sans text-xs font-black tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'generate' ? 'border-indigo-600 text-indigo-600 border-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <FileText className="h-4.5 w-4.5" />
              Generate Live Report
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3.5 px-6 font-sans text-xs font-black tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 border-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <History className="h-4.5 w-4.5" />
              Report History &amp; Snapshots
              {historyList.length > 0 && (
                <span className="bg-slate-150 text-slate-600 text-[10px] font-black font-mono px-2 py-0.5 rounded-full ml-1 border border-slate-200">
                  {historyList.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'history' ? (
            <div className="space-y-4 text-left">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-indigo-500" />
                    Archive of Generated Executive Dossiers
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Access snapshots of previously generated reports from browser storage. Retains the 15 most recent versions.
                  </p>
                </div>
                {historyList.length > 0 && (
                  confirmClearAll ? (
                    <div className="flex items-center gap-2" data-html2canvas-ignore="true">
                      <span className="text-xs font-bold text-rose-700 animate-pulse">Are you sure?</span>
                      <button
                        onClick={() => {
                          localStorage.removeItem('alok_hr_report_history');
                          setHistoryList([]);
                          setActiveHistoryReport(null);
                          setConfirmClearAll(false);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-mono"
                      >
                        Yes, Clear All
                      </button>
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setConfirmClearAll(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto font-mono"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All History
                    </button>
                  )
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-3">
                  <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Archive Empty</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      No snapshots are currently saved. Run a new search in the "Generate Live Report" tab to automatically archive report outputs.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4.5">
                  {historyWithStats.map((item) => {
                    const { snapshotAttrition } = item;
                    return (
                      <div
                        key={item.id}
                        className={`bg-white border hover:shadow-2xs transition-all rounded-2xl p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-5 relative group ${activeHistoryReport?.id === item.id ? 'border-indigo-400 ring-1 ring-indigo-100 bg-indigo-50/10' : 'border-slate-200'}`}
                      >
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                            Report Snapshot
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono border border-slate-200">
                            ID: {item.id}
                          </span>
                          {activeHistoryReport?.id === item.id && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-black border border-indigo-100">
                              Currently Active
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Reporting Window</span>
                            <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                              {formatDatePretty(item.fromDate)} &mdash; {formatDatePretty(item.toDate)}
                            </p>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Plant Filter</span>
                            <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                              {item.branchFilter}
                            </p>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Saved On</span>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 font-mono">
                              {new Date(item.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {/* Stat Capsules */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <div className="bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-slate-400 font-bold font-mono">Hires:</span>
                            <span className="text-xs font-bold text-slate-700 font-mono">{item.totalHires}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-slate-400 font-bold font-mono">Spend:</span>
                            <span className="text-xs font-bold text-slate-700 font-mono">₹{item.totalSpend?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-slate-400 font-bold font-mono">Exits:</span>
                            <span className="text-xs font-bold text-slate-700 font-mono">{snapshotAttrition.exitsCount}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-slate-400 font-bold font-mono">Attrition:</span>
                            <span className="text-xs font-bold text-slate-700 font-mono">{snapshotAttrition.attritionRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:self-center">
                        <button
                          onClick={() => {
                            setActiveHistoryReport(item);
                            setActiveTab('generate');
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <FileText className="h-4 w-4" />
                          View Dossier
                        </button>
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5" data-html2canvas-ignore="true">
                            <button
                              onClick={() => {
                                const filtered = historyList.filter(h => h.id !== item.id);
                                localStorage.setItem('alok_hr_report_history', JSON.stringify(filtered));
                                setHistoryList(filtered);
                                if (activeHistoryReport?.id === item.id) {
                                  setActiveHistoryReport(null);
                                }
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer font-mono shrink-0"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmDeleteId(item.id);
                            }}
                            className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="Delete Snapshot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          ) : (
            <>
              {(() => {
            const uniqueBranches = Array.from(new Set(hrReportData.map(r => r.plant_location).filter(Boolean)));
            const filteredEmployeesForSearch = hrReportData.filter((emp) => {
              const branchMatch = selectedBranch === 'All Branches' || emp.plant_location === selectedBranch;
              const searchMatch = searchQuery === '' ||
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
              return branchMatch && searchMatch;
            });

            return (
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Search className="h-4.5 w-4.5 text-indigo-500" />
                      Individual Employee Lookup
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans">Filter the entire dashboard by branch, or inspect a single employee dossier.</p>
                  </div>
                  
                  {/* Reset filters link */}
                  {(selectedBranch !== 'All Branches' || selectedEmployee !== null || searchQuery !== '') && (
                    <button
                      onClick={() => {
                        setSelectedBranch('All Branches');
                        setSelectedEmployee(null);
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto transition-colors font-mono"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Dropdowns Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Branch Selector */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Filter by Branch/Plant</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value);
                        // Clear selected employee if they don't belong to the new branch
                        if (selectedEmployee && e.target.value !== 'All Branches' && selectedEmployee.plant_location !== e.target.value) {
                          setSelectedEmployee(null);
                          setSearchQuery('');
                        }
                      }}
                      className="block w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-semibold text-slate-700"
                    >
                      <option value="All Branches">All Branches (No filtering)</option>
                      {uniqueBranches.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Lookup Dropdown */}
                  <div className="space-y-1 relative text-left" ref={dropdownRef}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Search &amp; Select Employee</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onFocus={() => setIsEmployeeDropdownOpen(true)}
                        onChange={(e) => {
                           setSearchQuery(e.target.value);
                           setIsEmployeeDropdownOpen(true);
                        }}
                        placeholder={selectedEmployee ? selectedEmployee.name : "Type employee name or ID..."}
                        className="block w-full pl-9 pr-8 py-2 border border-slate-250 bg-white rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-semibold text-slate-700 placeholder:text-slate-400"
                      />
                      {selectedEmployee && (
                        <button
                          onClick={() => {
                            setSelectedEmployee(null);
                            setSearchQuery('');
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Search Results Dropdown List */}
                    <AnimatePresence>
                      {isEmployeeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100"
                        >
                          {filteredEmployeesForSearch.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center">No employees found</div>
                          ) : (
                            filteredEmployeesForSearch.map((emp) => (
                              <button
                                key={emp.employee_id}
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setSearchQuery(emp.name);
                                  setIsEmployeeDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-slate-700 block">{emp.name}</span>
                                  <span className="text-[10px] text-slate-400 block font-mono">{emp.employee_id} &bull; {emp.designation}</span>
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{emp.plant_location}</span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* Selected Employee Dossier / Detail Card */}
                <AnimatePresence>
                  {selectedEmployee && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 bg-gradient-to-br from-indigo-50/40 to-white p-5 border border-indigo-150 rounded-xl shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50 pb-3">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 font-mono uppercase tracking-wider">EMPLOYEE DOSSIER</span>
                            <h4 className="text-sm font-black text-slate-800">{selectedEmployee.name}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedEmployee.employee_id} &bull; {selectedEmployee.designation}</p>
                          </div>
                          <div className="self-start sm:self-auto">
                            {selectedEmployee.employment_status === 'Active' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Currently Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 block text-left">
                                Resigned on {formatDatePretty(selectedEmployee.exit_date)} &mdash; {selectedEmployee.exit_reason || 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Department &amp; Branch</span>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedEmployee.department}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{selectedEmployee.plant_location}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Date of Joining</span>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDatePretty(selectedEmployee.date_of_joining)}</p>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                              Tenure: {calculateTenureString(selectedEmployee.date_of_joining, selectedEmployee.exit_date, selectedEmployee.employment_status)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Recruitment Profile</span>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">Source: {selectedEmployee.recruitment_source}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Cost to Hire: ₹{selectedEmployee.cost_per_hire_inr?.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Financial Profile</span>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">Monthly CTC: ₹{selectedEmployee.monthly_ctc_inr?.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Time to Hire (TAT): {selectedEmployee.tat_days} days</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}
          
          {/* TOOLBAR: DATE SELECTORS & ACTION */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="block px-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-40 bg-slate-50/50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="block px-3 py-1.5 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-40 bg-slate-50/50"
                />
              </div>
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 h-[34px] shrink-0"
              >
                <BarChart3 className="h-4 w-4" />
                Generate Report
              </button>
            </div>
            
            {isGenerated && filteredReportData.length > 0 && (
              <button
                onClick={downloadPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 self-start md:self-auto h-[34px]"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Report (PDF)
                  </>
                )}
              </button>
            )}
          </div>

          {/* REPORT MAIN WORKSPACE */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Compiling Corporate Records...</p>
            </div>
          ) : isGenerated && filteredReportData.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No Hires in Selection Range</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No employee records matched the date of joining from <strong>{formatDatePretty(displayFromDate)}</strong> to <strong>{formatDatePretty(displayToDate)}</strong>. Please expand the range parameters.
                </p>
              </div>
            </div>
          ) : (
            isGenerated && (
              <div className="space-y-4 max-w-[900px] mx-auto">
                {isViewingHistory && (
                  <div data-html2canvas-ignore="true" className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Clock className="h-4.5 w-4.5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Viewing Saved Report Snapshot</p>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Generated on {new Date(activeHistoryReport.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &mdash; Read-only mode
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveHistoryReport(null);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Switch to Live View
                      </button>
                    </div>
                  </div>
                )}

                <div id="hr-report-capture" className="p-8 bg-white border border-slate-150 rounded-2xl shadow-xs space-y-8 text-left" style={{ overflow: 'visible', maxHeight: 'none', height: 'auto' }}>
                
                {/* PDF BRANDING HEADER */}
                <div className="border-b border-slate-200 pb-5 text-left space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    {/* ALOK Wordmark / Logo */}
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-sm">A</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black tracking-wider text-slate-900 font-sans">ALOK MASTERBATCHES</span>
                        <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Industrial Polymers</span>
                      </div>
                    </div>
                    {/* Confidential Notice */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50/50 border border-rose-100 px-2.5 py-1 rounded-md uppercase tracking-wide">
                        CONFIDENTIAL — INTERNAL USE ONLY
                      </span>
                    </div>
                  </div>
                  
                  {/* Accent Brand Bar */}
                  <div className="h-1 bg-indigo-600 rounded-full w-full shadow-2xs" />
                  
                  {/* Detailed Byline */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 pt-1">
                    <div>
                      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">HR Analytics &amp; Operational Performance Report</h1>
                      <p className="text-[11px] text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Reporting Period: <strong className="text-slate-700">{formatDatePretty(displayFromDate)}</strong> to <strong className="text-slate-700">{formatDatePretty(displayToDate)}</strong></span>
                        {displayBranch !== 'All Branches' && <span>| Plant Location: <strong className="text-slate-700">{displayBranch}</strong></span>}
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                          Calculated from {filteredReportData.length} of {hrReportData.length} total records
                        </span>

                        <span className="group relative cursor-help bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono hover:bg-slate-200 transition-colors shrink-0">
                          🔍 Audit stages
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-lg w-56 z-50 leading-relaxed font-mono whitespace-normal normal-case">
                            <strong className="text-indigo-400 mb-1 border-b border-slate-700 pb-1 block">Filter Audit Stages:</strong>
                            <span className="block">• Total Loaded: {hrReportData.length}</span>
                            <span className="block">• After Date Filter: {hrReportData.filter(r => r.date_of_joining && r.date_of_joining <= new Date(new Date(toDate).setHours(23,59,59,999)) && (r.employment_status === 'Active' || (r.exit_date && r.exit_date >= new Date(new Date(fromDate).setHours(0,0,0,0))))).length}</span>
                            <span className="block">• After Branch: {filteredReportData.length}</span>
                          </span>
                        </span>

                        {isDataIntegrityVerified && (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Data Integrity Verified
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-slate-400 font-mono">
                      <span>Generated: {isViewingHistory ? new Date(activeHistoryReport.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* DATA QUALITY & INTEGRITY WARNINGS BANNER */}
                {!isViewingHistory && (hrDataWarnings.length > 0 || tatWarnings.length > 0) && (
                  <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-left space-y-2" data-html2canvas-ignore="true">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                      <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider font-mono">
                        Data Quality Audit Warnings ({hrDataWarnings.length + tatWarnings.length})
                      </h4>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                      Some raw database records contain mathematical inconsistencies or missing values. They have been dynamically excluded from metric calculations to prevent corrupting analytics, and are detailed below:
                    </p>
                    <ul className="space-y-1 max-h-36 overflow-y-auto text-[10px] text-amber-600 font-mono list-disc pl-4 bg-white/40 p-2 rounded-xl border border-amber-100">
                      {hrDataWarnings.map((w, idx) => (
                        <li key={`hr-warn-${idx}`} className="leading-relaxed">
                          <strong className="text-amber-700">Join Date Error:</strong> {w.message} (Excluded from all metrics).
                        </li>
                      ))}
                      {tatWarnings.map((w, idx) => (
                        <li key={`tat-warn-${idx}`} className="leading-relaxed">
                          <strong className="text-amber-700">Time-to-Hire Error:</strong> {w.message} (TAT excluded from average speed).
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* EXECUTIVE SUMMARY */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Executive Summary</h2>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {executiveSummaryText}
                  </p>
                </div>

                {/* METRICS STATS GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  
                  {/* Total Hires */}
                  <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-1.5 min-w-0 hover:shadow-xs transition-shadow">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase truncate">TOTAL HIRES</span>
                      <p className="text-xl font-black text-slate-800 mt-1 whitespace-nowrap">{totalHires}</p>
                      <span className="text-[9px] text-indigo-600 font-semibold block mt-1.5 flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3 inline text-emerald-500" />
                        Joined in period
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <UserPlus className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Avg Time to Hire */}
                  <div className={`bg-white p-4 border rounded-2xl shadow-2xs flex items-center justify-between gap-1.5 min-w-0 hover:shadow-xs transition-shadow ${parseFloat(avgTimeToHire) <= 25 ? 'border-emerald-100' : 'border-slate-200'}`}>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase truncate">AVG TIME TO HIRE</span>
                      <p className="text-xl font-black text-slate-800 mt-1 whitespace-nowrap">{avgTimeToHire} days</p>
                      <span className="text-[9px] font-semibold block mt-1.5">
                        {parseFloat(avgTimeToHire) <= 25 ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <ArrowDownRight className="h-3 w-3 inline" />
                            Efficient recruitment
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3 inline" />
                            Target &gt; 25 days
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${parseFloat(avgTimeToHire) <= 25 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Avg Cost per Hire */}
                  <div className={`bg-white p-4 border rounded-2xl shadow-2xs flex items-center justify-between gap-1.5 min-w-0 hover:shadow-xs transition-shadow ${avgCostPerHire <= 20000 ? 'border-emerald-100' : 'border-slate-200'}`}>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase truncate">AVG COST PER HIRE</span>
                      <p className="text-xl font-black text-slate-800 mt-1 whitespace-nowrap">₹{avgCostPerHire.toLocaleString('en-IN')}</p>
                      <span className="text-[9px] font-semibold block mt-1.5">
                        {avgCostPerHire <= 20000 ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <ArrowDownRight className="h-3 w-3 inline" />
                            Under budget cap
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3 inline" />
                            Elevated sourcing cost
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${avgCostPerHire <= 20000 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Total Spend */}
                  <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex items-start justify-between gap-1.5 overflow-visible hover:shadow-xs transition-shadow">
                    <div className="flex-1 overflow-visible">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">TOTAL SPEND</span>
                      <p className="text-xl font-black text-slate-800 mt-1 whitespace-nowrap overflow-visible">₹{totalRecruitmentSpend.toLocaleString('en-IN')}</p>
                      <span className="text-[9px] text-indigo-600 font-semibold block mt-1.5 flex items-center gap-0.5">
                        <Briefcase className="h-3 w-3 text-indigo-500" />
                        Recruitment volume
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Attrition Count */}
                  <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-1.5 min-w-0 hover:shadow-xs transition-shadow">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase truncate">ATTRITION COUNT</span>
                      <p className="text-xl font-black text-slate-800 mt-1 whitespace-nowrap">{attritionCount}</p>
                      <span className="text-[9px] text-rose-600 font-semibold block mt-1.5 flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" />
                        Exits in range
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Attrition Rate */}
                  <div className={`bg-white p-4 border rounded-2xl shadow-2xs flex items-center justify-between gap-1.5 min-w-0 hover:shadow-xs transition-shadow ${parseFloat(attritionRate) <= 5.0 ? 'border-emerald-100' : (parseFloat(attritionRate) <= 12.0 ? 'border-amber-100' : 'border-rose-100')}`}>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase truncate">ATTRITION RATE</span>
                      <p className="text-xl font-black text-slate-800 mt-1 whitespace-nowrap">{attritionRate}%</p>
                      <span className="text-[9px] font-semibold block mt-1.5">
                        {parseFloat(attritionRate) <= 5.0 ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3 inline" />
                            Healthy stability
                          </span>
                        ) : (parseFloat(attritionRate) <= 12.0 ? (
                          <span className="text-amber-600 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3 inline" />
                            Moderate turnover
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <ShieldAlert className="h-3 w-3 inline" />
                            High turnover alert
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${parseFloat(attritionRate) <= 5.0 ? 'bg-emerald-50 text-emerald-600' : (parseFloat(attritionRate) <= 12.0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>
                      <Percent className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Avg Tenure */}
                  <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2 col-span-2 min-w-0 hover:shadow-xs transition-shadow">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase truncate">AVG TENURE (EXITS)</span>
                      <p className="text-base md:text-lg font-black text-slate-800 mt-1 whitespace-nowrap">
                        {tenureDisplayStr}
                      </p>
                      <span className="text-[9px] text-slate-500 font-semibold block mt-1.5 flex items-center gap-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Departure average
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>

                </div>

                {/* RECRUITMENT FUNNEL ROW */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-center gap-12 shadow-2xs">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Offers Issued (in period)</span>
                    <span className="text-2xl font-black text-slate-800">{funnelOffersSent}</span>
                  </div>
                  <div className="text-center border-l border-indigo-200 pl-12">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Joined (in period)</span>
                    <span className="text-2xl font-black text-indigo-700">{funnelJoined}</span>
                  </div>
                </div>

                {/* CHARTS SECTION - FLOWS DYNAMICALLY BASED ON PREFERENCES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  {chartPrefs.map(chart => renderChartById(chart.id))}
                </div>

                {/* PAGE 5 STARTS */}
                <div style={{ pageBreakBefore: 'always' }} className="pt-2" />

                {/* ORG SUMMARY SNAPSHOT TABLE */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Table className="h-4.5 w-4.5 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Department Headcount &amp; Attrition Analysis</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Headcount breakdown for employees active during the selected reporting period ({formatDatePretty(displayFromDate)} to {formatDatePretty(displayToDate)}){displayBranch !== 'All Branches' ? ` for ${displayBranch}` : ''}, based on join and exit dates.
                  </p>
                  
                  <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white shadow-2xs">
                    <table className="min-w-full divide-y divide-slate-150 text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Department</th>
                          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Total Headcount</th>
                          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Active</th>
                          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Resigned</th>
                          <th className="px-5 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Attrition %</th>
                          <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Avg Monthly CTC</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {orgSummaryData.map((row, index) => (
                          <tr key={row.department} className={`transition-colors hover:bg-slate-50/50 ${index % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'}`}>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-700 flex items-center">
                              <span>{row.department}</span>
                              {row.active > 0 && row.active <= 3 && (
                                <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-250 animate-pulse" title="Small cohort size makes percentage trends highly volatile.">
                                  ⚠ Small sample
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-center text-xs font-mono font-bold text-slate-800">{row.total}</td>
                            <td className="px-5 py-3.5 text-center text-xs">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {row.active}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center text-xs">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                {row.resigned}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center text-xs font-mono font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${parseFloat(row.attritionPct) > 15 ? 'bg-rose-105 text-rose-800' : (parseFloat(row.attritionPct) > 0 ? 'bg-amber-105 text-amber-800' : 'bg-slate-105 text-slate-600')}`}>
                                {row.attritionPct}%
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-xs font-mono font-bold text-slate-700">
                              ₹{row.avgCtc.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* KEY OBSERVATIONS / FLAGS SECTION */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800">Key Observations &amp; Performance Insights</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase font-mono block">Sourcing &amp; Growth Performance</span>
                      <ul className="space-y-2.5 text-xs text-slate-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{deptGrowthStr}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{bestSourceStr}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-rose-600 tracking-wider uppercase font-mono block">Retention &amp; Stability Risks</span>
                      <ul className="space-y-2.5 text-xs text-slate-600">
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{highestAttritionDeptStr}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{avgTenureStr}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* BRAND FOOTER */}
                <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-400 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span>ALOK Masterbatches HR System • Confidential Operational Dossier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Page 1 of 1</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-slate-500 font-bold">SYSTEM AUDIT-READY</span>
                  </div>
                </div>

              </div>
            </div>
          )
        )}
      </>
          )}
        </div>
      )}

      {/* MANAGE CHARTS DRAWER */}
      <AnimatePresence>
        {isManageChartsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManageChartsOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col font-sans"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Manage Report Charts</h3>
                  <p className="text-[10px] text-slate-500">Toggle visibility and display order</p>
                </div>
                <button
                  onClick={() => setIsManageChartsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Reset to defaults */}
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-indigo-50/20">
                <span className="text-[10px] text-indigo-700 font-bold">Custom layout saved automatically</span>
                <button
                  onClick={handleResetCharts}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              {/* List of charts */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chartPrefs.map((chart, idx) => (
                  <div
                    key={chart.id}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl border border-slate-150 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={chart.visible}
                        onChange={() => handleToggleChartVisibility(chart.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {chart.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveChart(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveChart(idx, 'down')}
                        disabled={idx === chartPrefs.length - 1}
                        title="Move Down"
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
