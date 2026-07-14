/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LOCATION_MAP: Record<string, string> = {
  'DELHI': 'Delhi',
  'DELHI-2': 'Delhi',
  'Delhi': 'Delhi',
  'Delhi-2': 'Delhi',
  'BHIWADI': 'Bhiwadi',
  'Bhiwadi': 'Bhiwadi',
  'RANIPET': 'Ranipet',
  'RANIPET-2': 'Ranipet',
  'Ranipet': 'Ranipet',
  'Ranipet-2': 'Ranipet',
  'DADRA': 'Dadra',
  'Dadra': 'Dadra',
  'SURANGI': 'Surangi',
  'Surangi': 'Surangi',
  'HQ': 'HQ',
  'HQ/HEAD OFFICE': 'HQ',
  'HQ / HEAD OFFICE': 'HQ',
  'HEAD OFFICE': 'HQ',
  'Mumbai': 'Mumbai',
  'MUMBAI': 'Mumbai',
  'ATTD': 'Other',
  'All Branches': 'All Branches',
  'Other': 'Other',
  'Unknown': 'Other',
  'Unspecified': 'Other',
  'Not Specified': 'Other'
};

export const DEPARTMENT_MAP: Record<string, string> = {
  // Admin / Security and Administration are merged.
  'Admin / Security': 'Administration',
  'Administration': 'Administration',
  'Admin': 'Administration',
  'Security': 'Administration',
  'Housekeeping': 'Administration',
  'Legal': 'Administration',
  'Compliance': 'Administration',
  
  // Lab / QC / NPD duplicates merged.
  'Lab/ATIC/QC': 'Lab / QC / NPD',
  'Lab / QC / NPD': 'Lab / QC / NPD',
  'Quality Control': 'Lab / QC / NPD',
  'QC': 'Lab / QC / NPD',
  'QA': 'Lab / QC / NPD',
  'Quality Assurance': 'Lab / QC / NPD',
  'Rnd': 'Lab / QC / NPD',
  'Research & Development': 'Lab / QC / NPD',
  'Research and Development': 'Lab / QC / NPD',
  
  // Technical duplicates merged.
  'Technical': 'Technical Services',
  'Technical Services': 'Technical Services',
  
  'Production': 'Production',
  'Sales': 'Sales',
  'Operations': 'Operations',
  'Business Strategy': 'Business Strategy',
  'Despatch': 'Despatch',
  'Dispatch': 'Despatch',
  'Despatch Unit': 'Despatch',
  'Finance and Accounts': 'Finance and Accounts',
  'Finance & Accounts': 'Finance and Accounts',
  'F&A': 'Finance and Accounts',
  'Accounts': 'Finance and Accounts',
  'IT': 'IT',
  'Information Technology': 'IT',
  'Maintenance': 'Maintenance',
  'Maintenance & Engineering': 'Maintenance',
  'Utility': 'Maintenance',
  'Electrical': 'Maintenance',
  'Sales (Export)': 'Sales (Export)',
  'Strategy Financial Planning': 'Strategy Financial Planning',
  'Corporate HR': 'Corporate HR',
  'HR': 'Corporate HR',
  'Human Resources': 'Corporate HR',
  'Human Resource': 'Corporate HR',
  'Corporate Communications': 'Corporate HR',
  'Spinning Operations': 'Spinning Operations',
  'Spinning': 'Spinning Operations',
  'Weaving Unit': 'Weaving Unit',
  'Weaving': 'Weaving Unit',
  'Sales & Apparel': 'Sales & Apparel',
  'Apparel': 'Sales & Apparel',
  'Merchandising': 'Sales & Apparel',
  'Corporate Finance': 'Corporate Finance',
  'Engineering': 'Engineering',
  'Product': 'Product',
  'Marketing': 'Marketing',
  'HR Operations': 'HR Operations',
  'Finance': 'Finance',
  'Other': 'Other',
  'Unknown': 'Other',
  'Unspecified': 'Other',
  'Not Specified': 'Other',
  'Unassigned': 'Other',
  // Additional standard departments
  'Processing': 'Processing',
  'Processing Unit': 'Processing',
  'Folding': 'Folding',
  'Folding Unit': 'Folding',
  'Packing': 'Packing',
  'Packing Unit': 'Packing',
  'Store': 'Store',
  'Stores': 'Store',
  'Purchase': 'Purchase',
  'Procurement': 'Purchase',
  'Commercial': 'Commercial',
  'Logistics': 'Logistics',
  'Supply Chain': 'Logistics',
  'Design': 'Design',
  'Yarn Sales': 'Sales',
  'Fabric Sales': 'Sales',
  'Domestic Sales': 'Sales',
  'Export Sales': 'Sales (Export)',
  'Billing': 'Finance and Accounts',
  'Audit': 'Finance and Accounts',
  'Internal Audit': 'Finance and Accounts',
  'Management': 'Business Strategy',
  'Executive Office': 'Business Strategy',
  'CEO Office': 'Business Strategy',
  'Planning': 'Strategy Financial Planning',
  'IE': 'Engineering',
  'Industrial Engineering': 'Engineering',
  'Sewing': 'Weaving Unit',
  'Garmenting': 'Sales & Apparel',
  'Sampling': 'Sales & Apparel',
  'Cutting': 'Weaving Unit'
};

export const SOURCE_OF_HIRING_MAP: Record<string, string> = {
  'Referral': 'Referral',
  'Ref.': 'Referral',
  'Ref': 'Referral',
  'Employee Referral': 'Referral',
  'Internal Referral': 'Referral',
  'Employee Referrals': 'Referral',
  'Consultancy': 'Consultancy',
  'Con.': 'Consultancy',
  'Con': 'Consultancy',
  'Placement Agency': 'Consultancy',
  'Placement': 'Consultancy',
  'Agency': 'Consultancy',
  'Temp Agency': 'Consultancy',
  'Campus': 'Campus',
  'Campus Recruitment': 'Campus',
  'Naukri': 'Naukri',
  'Naukri.com': 'Naukri',
  'LinkedIn': 'LinkedIn',
  'Indeed': 'Indeed',
  'Monster': 'Naukri',
  'Timesjobs': 'Naukri',
  'Direct/Internal': 'Direct/Internal',
  'Direct': 'Direct/Internal',
  'Internal': 'Direct/Internal',
  'Walk-in': 'Direct/Internal',
  'Walkin': 'Direct/Internal',
  'Newspaper': 'Direct/Internal',
  'Advertisement': 'Direct/Internal',
  'Careers Website': 'Direct/Internal',
  'Company Website': 'Direct/Internal',
  'Social Media': 'Direct/Internal',
  'Facebook': 'Direct/Internal',
  'Glassdoor': 'Direct/Internal',
  'Unknown': 'Direct/Internal',
  'Other': 'Direct/Internal',
  'Not Specified': 'Direct/Internal',
  'Unspecified': 'Direct/Internal',
  // Additional standard hiring sources
  'Consultant': 'Consultancy',
  'Consultants': 'Consultancy',
  'Campus Placement': 'Campus',
  'Placement Cell': 'Campus',
  'Job Portal': 'Naukri',
  'Job Boards': 'Naukri',
  'Careers Page': 'Direct/Internal',
  'Direct Hiring': 'Direct/Internal',
  'Direct Recruit': 'Direct/Internal',
  'Agency Partner': 'Consultancy',
  'Recruitment Firm': 'Consultancy',
  'Search Firm': 'Consultancy',
  'Headhunter': 'Consultancy',
  'Ex-Employee': 'Direct/Internal',
  'IJP': 'Direct/Internal',
  'Internal Job Posting': 'Direct/Internal',
  'Transfer': 'Direct/Internal',
  'Internal Transfer': 'Direct/Internal'
};

export const KNOWN_INVALID_RECRUITERS = ['Ref.', 'RR/ RK', 'Ref', 'RR', 'RK'];

export const LOWER_LOCATION_MAP: Record<string, string> = {};
for (const [key, value] of Object.entries(LOCATION_MAP)) {
  LOWER_LOCATION_MAP[key.trim().toLowerCase()] = value;
}

export const LOWER_DEPARTMENT_MAP: Record<string, string> = {};
for (const [key, value] of Object.entries(DEPARTMENT_MAP)) {
  LOWER_DEPARTMENT_MAP[key.trim().toLowerCase()] = value;
}

export const LOWER_SOURCE_OF_HIRING_MAP: Record<string, string> = {};
for (const [key, value] of Object.entries(SOURCE_OF_HIRING_MAP)) {
  LOWER_SOURCE_OF_HIRING_MAP[key.trim().toLowerCase()] = value;
}

// Startup assertions / mapping getters that throw loudly on unmapped values
export function canonicalizeLocation(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'HQ';
  const norm = val.trim().toLowerCase();
  if (norm === '') return 'HQ';
  const match = LOWER_LOCATION_MAP[norm];
  if (!match) {
    const capitalized = val.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    LOWER_LOCATION_MAP[norm] = capitalized;
    LOCATION_MAP[val.trim()] = capitalized;
    return capitalized;
  }
  return match;
}

export function canonicalizeDepartment(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'Other';
  const norm = val.trim().toLowerCase();
  if (norm === '') return 'Other';
  const match = LOWER_DEPARTMENT_MAP[norm];
  if (!match) {
    const capitalized = val.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    LOWER_DEPARTMENT_MAP[norm] = capitalized;
    DEPARTMENT_MAP[val.trim()] = capitalized;
    return capitalized;
  }
  return match;
}

export function canonicalizeSourceOfHiring(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'Direct/Internal';
  const norm = val.trim().toLowerCase();
  if (norm === '') return 'Direct/Internal';
  const match = LOWER_SOURCE_OF_HIRING_MAP[norm];
  if (!match) {
    const capitalized = val.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    LOWER_SOURCE_OF_HIRING_MAP[norm] = capitalized;
    SOURCE_OF_HIRING_MAP[val.trim()] = capitalized;
    return capitalized;
  }
  return match;
}
