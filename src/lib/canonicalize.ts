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
  'All Branches': 'All Branches',
  'Other': 'Other',
  'Unknown': 'Other',
  'Unspecified': 'Other',
  'Not Specified': 'Other'
};

export const DEPARTMENT_MAP: Record<string, string> = {
  // IMPORTANT: "Admin / Security" is a distinct function (21 employees) —
  // do NOT merge into "Administration" (7 employees). Keep separate.
  'Admin / Security': 'Admin / Security',
  'Administration': 'Administration',
  'Admin': 'Administration',
  'Lab/ATIC/QC': 'Lab / QC / NPD',
  'Lab / QC / NPD': 'Lab / QC / NPD',
  'Technical': 'Technical Services',
  'Technical Services': 'Technical Services',
  'Production': 'Production',
  'Sales': 'Sales',
  'Operations': 'Operations',
  'Business Strategy': 'Business Strategy',
  'Despatch': 'Despatch',
  'Finance and Accounts': 'Finance and Accounts',
  'IT': 'IT',
  'Maintenance': 'Maintenance',
  'Sales (Export)': 'Sales (Export)',
  'Strategy Financial Planning': 'Strategy Financial Planning',
  'Corporate HR': 'Corporate HR',
  'Spinning Operations': 'Spinning Operations',
  'Weaving Unit': 'Weaving Unit',
  'Sales & Apparel': 'Sales & Apparel',
  'Corporate Finance': 'Corporate Finance',
  'Engineering': 'Engineering',
  'Product': 'Product',
  'Marketing': 'Marketing',
  'HR Operations': 'HR Operations',
  'Finance': 'Finance',
  'Other': 'Other',
  'Unknown': 'Other',
  'Unspecified': 'Other',
  'Not Specified': 'Other'
};

export const SOURCE_OF_HIRING_MAP: Record<string, string> = {
  'Referral': 'Referral',
  'Ref.': 'Referral',
  'Ref': 'Referral',
  'Consultancy': 'Consultancy',
  'Con.': 'Consultancy',
  'Con': 'Consultancy',
  'Campus': 'Campus',
  'Naukri': 'Naukri',
  'LinkedIn': 'LinkedIn',
  'Indeed': 'Indeed',
  'Direct/Internal': 'Direct/Internal',
  'Direct': 'Direct/Internal',
  'Internal': 'Direct/Internal',
  'Unknown': 'Direct/Internal',
  'Other': 'Direct/Internal',
  'Not Specified': 'Direct/Internal',
  'Unspecified': 'Direct/Internal'
};

export const KNOWN_INVALID_RECRUITERS = ['Ref.', 'RR/ RK', 'Ref', 'RR', 'RK'];

// Startup assertions / mapping getters that throw loudly on unmapped values
export function canonicalizeLocation(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'HQ';
  const trimmed = val.trim();
  if (trimmed === '') return 'HQ';
  const match = LOCATION_MAP[trimmed] || LOCATION_MAP[trimmed.toUpperCase()];
  if (!match) {
    throw new Error(`Unexpected Location raw value: "${trimmed}" — not present in LOCATION_MAP`);
  }
  return match;
}

export function canonicalizeDepartment(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'Other';
  const trimmed = val.trim();
  if (trimmed === '') return 'Other';
  
  // Direct match or check if case-insensitive mapping is available if exact fails
  const match = DEPARTMENT_MAP[trimmed];
  if (!match) {
    // If we can't find it, we throw loudly as requested to catch new fragmentation.
    throw new Error(`Unexpected Department raw value: "${trimmed}" — not present in DEPARTMENT_MAP`);
  }
  return match;
}

export function canonicalizeSourceOfHiring(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'Direct/Internal';
  const trimmed = val.trim();
  if (trimmed === '') return 'Direct/Internal';
  const match = SOURCE_OF_HIRING_MAP[trimmed];
  if (!match) {
    throw new Error(`Unexpected Source of Hiring raw value: "${trimmed}" — not present in SOURCE_OF_HIRING_MAP`);
  }
  return match;
}
