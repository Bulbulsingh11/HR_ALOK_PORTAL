/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'hr' | 'senior_hr' | 'admin' | 'HR_ADMIN';
  avatarUrl: string;
}

export type PageId =
  | 'dashboard'
  | 'employees'
  | 'offer-letter'
  | 'feedback-forms'
  | 'reports'
  | 'guide';

export interface NavigationItem {
  id: PageId;
  label: string;
  icon: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Suspended' | 'Terminated' | 'Resigned' | 'Archived' | 'Active' | 'Inactive' | 'On Probation'; // Extended statuses
  joinDate: string;
  avatarUrl?: string;
  salary: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  department_id?: string;
  designation_id?: string;
  reporting_manager_id?: string;

  // New Employee Master fields
  Employee_Code?: string;
  Salutation?: string;
  Employee_Name?: string;
  Employee_Status?: 'Active' | 'Inactive' | 'On Probation' | string;
  Employment_Type?: string;
  Gender?: string;
  Present_Address1?: string;
  Present_Address2?: string;
  Present_City?: string;
  Present_State?: string;
  Present_Pin?: string;
  Permanent_Address1?: string;
  Permanent_Address2?: string;
  PermanentCity?: string;
  PermanentState?: string;
  Permanent_Pin?: string;
  Marital_Status?: string;
  Father_Name?: string;
  Date_of_Birth?: string;
  Blood_Group?: string;
  Date_Of_Joining?: string;
  Date_Of_Leaving?: string;
  Reason_Leaving?: string;
  Date_of_confirmation?: string;
  Emergency_Contact_Person?: string;
  Emergency_Contact_Number?: string;
  Spouse_Name?: string;
  Spouse_DOB?: string;
  Child_Name_1?: string;
  Child_1_DOB?: string;
  Child_Name_2?: string;
  Child_2_DOB?: string;
  PAN?: string;
  ESIC_Account_Number?: string;
  IFSCCode?: string;
  Bank_Name?: string;
  Bank_Branch_Name?: string;
  Bank_Acct_No?: string;
  Payment_Description?: string;
  Pf_Base_Salary?: number;
  EPS_Base_Salary_Limit?: number;
  Official_Email?: string;
  Personal_Email?: string;
  UAN_No?: string;
  ReportingManager_Name?: string;
  ReportingManager_Code?: string;
  Company_Description?: string;
  Department_Description?: string;
  Designation_Description?: string;
  FirstName?: string;
  Grade_Code?: string;
  Grade_Description?: string;
  Location2_Description?: string;

  // Monthly Salary Breakdown fields
  Basic_Salary?: number;
  Medical?: number;
  Special_Allowance?: number;
  Stipend?: number;
  Food_Coupon_Allowance?: number;
  House_Rent_Allowance?: number;
  Conveyance_Allowance?: number;
  Education_Allowance?: number;
  DA?: number;
  Displacement_Allow?: number;
  Statutory_Bonus?: number;
  Leave_Travel_Allowance_CTC?: number;
  LWF?: number;
  Transport_Allowance?: number;
  Employer_PF?: number;
  Employer_ESIC?: number;
  Employee_ESIC?: number;
  Variable_Incentive_CTC?: number;
  Gratuity?: number;
  MONTHLY_GROSS?: number;
  MonthlyCTC?: number;

  // Annual Salary Breakdown fields
  ANNUAL_GROSS?: number;
  TOTALCTC?: number;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  status: 'Open' | 'Closed' | 'Draft';
  applicantsCount: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  appliedRole: string;
  appliedDate: string;
  status: 'New' | 'Interview Scheduled' | 'Shortlisted' | 'Selected' | 'Rejected' | 'Offer Pending' | 'Offer Approved' | 'Offer Sent' | 'Joined' | 'Applied' | 'Screening' | 'Interview' | 'Offered'; // preserve old for compatibility
  score: number; // 1-5 rating
  notes?: string;
  interviewDate?: string;
  interviewFeedback?: string;
  interviewInterviewer?: string;
  salaryOffered?: number;
  converted_employee_id?: string;
  offer_letter_url?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  category: 'Policies' | 'Contracts' | 'Templates' | 'Employee Uploads';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'On Time' | 'Late' | 'Absent' | 'On Leave';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  paymentStatus: 'Paid' | 'Processing' | 'On Hold';
  payPeriod: string;
}

export interface LoanRequest {
  id: string;
  employeeName: string;
  employeeRole: string;
  amount: number;
  tenureMonths: number;
  monthlyInstallment: number;
  purpose: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface FeedbackItem {
  id: string;
  title: string;
  category: 'Management' | 'Work Environment' | 'Benefits' | 'Process';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  date: string;
  isAnonymous: boolean;
  authorName?: string;
  content: string;
  status: 'New' | 'Reviewed' | 'Actioned';
}

export interface ExitCase {
  id: string;
  employeeName: string;
  department: string;
  role: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason: string;
  status: 'Notice Period' | 'Cleared' | 'Completed';
  interviewScheduled: boolean;
}

export interface SettingsConfig {
  companyName: string;
  contactEmail: string;
  currency: string;
  timezone: string;
  attendanceGraceMinutes: number;
  enableNotifications: boolean;
  enableAnonymousFeedback: boolean;
}
