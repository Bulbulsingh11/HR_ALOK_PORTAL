/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  FileSpreadsheet, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Search, 
  Sparkles, 
  Info, 
  Layers, 
  FileText, 
  PieChart, 
  ArrowRight, 
  Copy, 
  Check,
  CheckSquare
} from 'lucide-react';

interface ColumnSpec {
  key: string;
  aliases: string[];
  description: string;
  required: boolean;
  sample: string;
  dataType: string;
}

export default function PortalGuideView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedCsv, setCopiedCsv] = useState(false);

  const columnSpecs: ColumnSpec[] = [
    {
      key: 'employee_id',
      aliases: ['employee_id', 'employee_code', 'employee code', 'employeecode', 'emp_id', 'empid'],
      description: 'Unique alphanumeric identifier for each employee.',
      required: true,
      sample: 'EMP001',
      dataType: 'Alphanumeric String'
    },
    {
      key: 'name',
      aliases: ['name', 'employee_name', 'employee name', 'employeename', 'full_name', 'fullname'],
      description: 'The employee\'s full name.',
      required: true,
      sample: 'Aarav Sharma',
      dataType: 'String'
    },
    {
      key: 'employment_status',
      aliases: ['employment_status', 'employment status', 'employmentstatus', 'status'],
      description: 'Current working status. Standard options are "Active" or "Resigned".',
      required: true,
      sample: 'Active',
      dataType: 'String ("Active" | "Resigned")'
    },
    {
      key: 'date_of_joining',
      aliases: ['date_of_joining', 'date of joining', 'dateofjoining', 'joining_date', 'joining date'],
      description: 'Official start/joining date of the employee.',
      required: true,
      sample: '2025-01-15',
      dataType: 'Date (YYYY-MM-DD)'
    },
    {
      key: 'monthly_ctc_inr',
      aliases: ['monthly_ctc_inr', 'monthly ctc inr', 'monthlyctcinr', 'total m_ctc', 'total_m_ctc', 'monthly_ctc', 'monthly ctc', 'ctc'],
      description: 'The employee\'s monthly Cost to Company in INR.',
      required: true,
      sample: '85000',
      dataType: 'Numeric (positive integer)'
    },
    {
      key: 'department',
      aliases: ['department', 'dept'],
      description: 'The business unit or function the employee belongs to.',
      required: true,
      sample: 'Engineering',
      dataType: 'String'
    },
    {
      key: 'designation',
      aliases: ['designation', 'role', 'title', 'job_title'],
      description: 'The exact title/role within the company.',
      required: true,
      sample: 'Senior Fullstack Engineer',
      dataType: 'String'
    },
    {
      key: 'plant_location',
      aliases: ['plant_location', 'plant location', 'plantlocation', 'work location', 'work_location', 'pf location', 'pf_location', 'location', 'plant'],
      description: 'Physical workplace/branch designation.',
      required: true,
      sample: 'Delhi',
      dataType: 'String (e.g., Delhi, Bhiwadi, Ranipet, HQ)'
    },
    {
      key: 'recruitment_source',
      aliases: ['recruitment_source', 'recruitment source', 'recruitmentsource', 'source of hiring', 'source_of_hiring', 'hiring_source', 'source'],
      description: 'Source channel where candidate was acquired.',
      required: false,
      sample: 'LinkedIn',
      dataType: 'String'
    },
    {
      key: 'cost_per_hire_inr',
      aliases: ['cost_per_hire_inr', 'cost per hire inr', 'costperhireinr', 'hiring cost', 'hiring_cost', 'cost_per_hire', 'cost per hire'],
      description: 'Direct cost incurred to hire this employee.',
      required: false,
      sample: '15000',
      dataType: 'Numeric'
    },
    {
      key: 'job_posted_date',
      aliases: ['job_posted_date', 'job posted date', 'jobposteddate', 'mrf date', 'mrf_date', 'posting_date'],
      description: 'Date the requisition or job description was posted.',
      required: false,
      sample: '2024-11-20',
      dataType: 'Date (YYYY-MM-DD)'
    },
    {
      key: 'offer_date',
      aliases: ['offer_date', 'offer date', 'offerdate', 'offer letter date', 'offer_letter_date'],
      description: 'Date the formal offer was extended to the candidate.',
      required: false,
      sample: '2024-12-28',
      dataType: 'Date (YYYY-MM-DD)'
    },
    {
      key: 'interview_date',
      aliases: ['interview_date', 'interview date', 'interviewdate'],
      description: 'Date of the final round or interview.',
      required: false,
      sample: '2024-12-10',
      dataType: 'Date (YYYY-MM-DD)'
    },
    {
      key: 'exit_date',
      aliases: ['exit_date', 'exit date', 'exitdate', 'relieving_date', 'relieving date', 'resignation_date'],
      description: 'Official end/separation date (only for status="Resigned").',
      required: false,
      sample: '2025-06-30',
      dataType: 'Date (YYYY-MM-DD)'
    },
    {
      key: 'exit_reason',
      aliases: ['exit_reason', 'exit reason', 'exitreason', 'reason for leaving', 'reason_for_leaving', 'resignation_reason'],
      description: 'Specific reason for the employee\'s departure.',
      required: false,
      sample: 'Better Opportunity',
      dataType: 'String'
    },
    {
      key: 'recruiter_name',
      aliases: ['recruiter_name', 'recruiter name', 'recruitername', 'hr recruiter', 'hr_recruiter', 'recruiter'],
      description: 'HR recruiter who managed the hiring cycle.',
      required: false,
      sample: 'Priyanka Sen',
      dataType: 'String'
    },
    {
      key: 'gender',
      aliases: ['gender', 'sex'],
      description: 'Gender of the employee.',
      required: false,
      sample: 'Female',
      dataType: 'String'
    },
    {
      key: 'marital_status',
      aliases: ['marital_status', 'marital status', 'maritalstatus', 'marriage_status'],
      description: 'Marital status of the employee.',
      required: false,
      sample: 'Single',
      dataType: 'String'
    },
    {
      key: 'category',
      aliases: ['category', 'employee category', 'emp category', 'grade'],
      description: 'The employee grade or segment.',
      required: false,
      sample: 'A1',
      dataType: 'String'
    },
    {
      key: 'total_experience_years',
      aliases: ['total_experience', 'total experience', 'experience', 'total exp', 'exp'],
      description: 'Prior working experience of the candidate in years.',
      required: false,
      sample: '4.5',
      dataType: 'Numeric (float)'
    },
    {
      key: 'survey_status',
      aliases: ['survey_status', 'survey status', 'engagement survey', 'exit survey'],
      description: 'Participation or status in feedback surveys.',
      required: false,
      sample: 'Completed',
      dataType: 'String'
    },
    {
      key: 'hire_type',
      aliases: ['hire_type', 'hire type', 'hiretype', 'hiring type', 'hiring_type'],
      description: 'Identifies if this was a new headcount or a replacement.',
      required: false,
      sample: 'New Hire',
      dataType: 'String ("New Hire" | "Replacement")'
    },
    {
      key: 'replacement_for',
      aliases: ['replacement_for', 'replacement for', 'replacementfor', 'replacement_of', 'replacement of'],
      description: 'Name of the former employee replaced (if applicable).',
      required: false,
      sample: 'Rahul Verma',
      dataType: 'String'
    },
    {
      key: 'attrition_type',
      aliases: ['attrition_type', 'attrition type', 'attritiontype', 'exit type', 'exit_type', 'separation type', 'separation_type'],
      description: 'Classification of separation.',
      required: false,
      sample: 'Voluntary',
      dataType: 'String ("Voluntary" | "Involuntary")'
    }
  ];

  const filteredColumns = columnSpecs.filter(col => 
    col.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    col.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    col.aliases.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sampleCsvHeader = "employee_id,name,employment_status,date_of_joining,monthly_ctc_inr,department,designation,plant_location,recruitment_source,cost_per_hire_inr,job_posted_date,offer_date,exit_date,exit_reason";
  const sampleCsvRow = "EMP024,Nisha Gupta,Active,2025-02-01,75000,Engineering,Frontend Engineer,Delhi,LinkedIn,12000,2024-12-15,2025-01-10,,";

  const handleCopyCsvTemplate = () => {
    navigator.clipboard.writeText(`${sampleCsvHeader}\n${sampleCsvRow}`);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-xs font-bold text-indigo-300 uppercase tracking-widest font-mono">
            <Sparkles className="h-3 w-3" />
            Empower Your HR Workflows
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Portal Guide &amp; Specifications
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Welcome to the Alok Industries HR Portal. This interactive guide outlines the platform's capabilities, 
            navigational workflows, and details the structural schema required when uploading employee datasets.
          </p>
        </div>
      </div>

      {/* Grid: What It Gives & How To Use */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: What this Portal Offers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">What This Portal Offers</h2>
                <p className="text-xs text-slate-500 font-semibold font-mono">CORE SYSTEM CAPABILITIES</p>
              </div>
            </div>

            <div className="space-y-4 text-slate-600 text-sm">
              <div className="flex gap-3">
                <CheckSquare className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-700">Interactive HR Reports &amp; Analytics</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate comprehensive analyses on attrition rates, plant-by-plant counts, average tenure metrics, and budget spends. Filter results dynamically.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckSquare className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-700">Real-time Employee Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View active and resigned employee profiles. Register new team members, track probation timelines, and trigger automated feedback systems.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckSquare className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-700">Offer Letter Generation &amp; Workflows</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Draft professional offer letters instantly with automatic CTC breakdowns. Manage approvals from "Draft" and "Pending Admin Review" to "Approved".
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckSquare className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-700">Quantitative Listening (Feedback Forms)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Collect management review scores, workplace environment ratings, and conduct sentiment analyses to flag key attrition drivers.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Info className="h-4 w-4 shrink-0 text-slate-400" />
            Designed for secure multi-tenant plant operations.
          </div>
        </div>

        {/* Section 2: How To Use This Portal */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">How to Use the Portal</h2>
                <p className="text-xs text-slate-500 font-semibold font-mono">STEP-BY-STEP OPERATION</p>
              </div>
            </div>

            <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6 text-sm text-slate-600">
              <div className="relative">
                <span className="absolute -left-10 top-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 border-2 border-white text-xs font-bold text-slate-700 font-mono">1</span>
                <h3 className="font-bold text-slate-700">Access and Login</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in with your corporate credential. Secure role levels (Admin vs HR) dictate letter approval actions and access limits.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-10 top-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 border-2 border-white text-xs font-bold text-slate-700 font-mono">2</span>
                <h3 className="font-bold text-slate-700">Sync Master Roster</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Navigate to the <span className="font-semibold text-slate-800">HR Reports</span> tab and drop your spreadsheet into the parser. Ensure columns match the aliases in the schema below.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-10 top-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 border-2 border-white text-xs font-bold text-slate-700 font-mono">3</span>
                <h3 className="font-bold text-slate-700">Analyze &amp; Track</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explore generated interactive visual graphics. Toggle between branches, search for individual employee dossier reports, and capture screen snapshots of your metrics.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-10 top-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 border-2 border-white text-xs font-bold text-slate-700 font-mono">4</span>
                <h3 className="font-bold text-slate-700">Onboard &amp; Feedbacks</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate digital offer letters, approve draft candidates, and view anonymous or named feedback surveys on active environments.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Info className="h-4 w-4 shrink-0 text-slate-400" />
            Check the upload columns below to ensure accurate parsing.
          </div>
        </div>

      </div>

      {/* Section 3: Excel/CSV Columns Upload Specifications */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Excel / CSV Column Specifications</h2>
              <p className="text-xs text-slate-500 font-semibold font-mono">SMART-MAPPING COLUMN ALIAS ENGINE</p>
            </div>
          </div>

          {/* Download & Copy Helper tools */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyCsvTemplate}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              {copiedCsv ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  Copied Template!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  Copy CSV Header
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed">
          The portal uses an advanced **Smart-Mapping Column Alias Engine**. You do not need exact column headers! 
          The parser scans your headers and automatically matches them with our internal keys using aliases (aliases listed below).
        </p>

        {/* Copy block box */}
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner space-y-1 relative group">
          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopyCsvTemplate}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              title="Copy"
            >
              {copiedCsv ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none mb-1">Raw CSV Format Sample</div>
          <div><span className="text-indigo-400">{sampleCsvHeader}</span></div>
          <div><span className="text-slate-400">{sampleCsvRow}</span></div>
        </div>

        {/* Search Input filter */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search columns, aliases, descriptions, or requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm transition-all shadow-2xs font-mono"
          />
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto border border-slate-200/85 rounded-xl">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Standard Column Key</th>
                <th className="py-3 px-4 font-bold">Requirement</th>
                <th className="py-3 px-4 font-bold">Acceptable Headers (Aliases)</th>
                <th className="py-3 px-4 font-bold">Data Type</th>
                <th className="py-3 px-4 font-bold">Sample</th>
                <th className="py-3 px-4 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredColumns.map((col, index) => (
                <tr key={col.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {col.key}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {col.required ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] uppercase font-mono border border-rose-100">
                        <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase font-mono border border-slate-100">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs md:max-w-md">
                      {col.aliases.map((alias) => (
                        <span key={alias} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px]">
                          {alias}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {col.dataType}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-indigo-600 whitespace-nowrap">
                    {col.sample}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 leading-relaxed min-w-[200px]">
                    {col.description}
                  </td>
                </tr>
              ))}
              {filteredColumns.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                    No columns found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
