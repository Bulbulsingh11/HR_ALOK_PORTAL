/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Centralized HR Metrics Integration Layer (Layered Architecture v4)
// This file integrates Layer 1 (canonicalize.ts), Layer 2 (validate.ts),
// and Layer 3 (metrics.ts) to serve the Report Views.

import { HRRecord } from './hrDataBridge';
import {
  canonicalizeLocation,
  canonicalizeDepartment,
  canonicalizeSourceOfHiring,
  KNOWN_INVALID_RECRUITERS
} from './canonicalize';
import { validateTAT } from './validate';
import * as m from './metrics';

export type { HRRecord };

export interface DataWarning {
  employeeId: string;
  name: string;
  type:
    | 'JOIN_AFTER_EXIT'
    | 'NEGATIVE_NULL_TAT'
    | 'SMALL_DEPARTMENT'
    | 'OFFER_AFTER_JOINING'
    | 'FUTURE_DATE'
    | 'INVALID_HIRE_TYPE';
  message: string;
}

/**
 * Filter by branch filter, exclude employees with join date after exit date (data quality issue),
 * apply Layer 1 canonicalization, and compile warning logs.
 */
export function getCleanedRecords(
  employees: HRRecord[],
  branchFilter: string = 'All Branches'
) {
  const warnings: DataWarning[] = [];
  
  const cleaned = employees.map(r => {
    // Apply Layer 1 Canonicalization on Location, Department, and Recruitment Source
    let plant_location = r.plant_location;
    try {
      plant_location = canonicalizeLocation(r.plant_location);
    } catch (e: any) {
      console.warn(`[Startup Assertion Warning] ${e.message}`);
    }

    let department = r.department;
    try {
      department = canonicalizeDepartment(r.department);
    } catch (e: any) {
      console.warn(`[Startup Assertion Warning] ${e.message}`);
    }

    let recruitment_source = r.recruitment_source;
    try {
      recruitment_source = canonicalizeSourceOfHiring(r.recruitment_source);
    } catch (e: any) {
      console.warn(`[Startup Assertion Warning] ${e.message}`);
    }

    return {
      ...r,
      plant_location,
      department,
      recruitment_source
    };
  }).filter(r => {
    // 1. Apply Branch Filter (using the canonicalized plant location!)
    const branchMatch = branchFilter === 'All Branches' || r.plant_location === branchFilter;
    if (!branchMatch) return false;

    // 2. Data Quality Check: date_of_joining after exit_date (impossible)
    if (r.date_of_joining && r.exit_date) {
      const joinTime = new Date(r.date_of_joining).getTime();
      const exitTime = new Date(r.exit_date).getTime();
      if (joinTime > exitTime) {
        warnings.push({
          employeeId: String(r.employee_id || ''),
          name: r.name || '',
          type: 'JOIN_AFTER_EXIT',
          message: `Employee ${r.name} (${r.employee_id}) join date is after exit date.`
        });
        return false; // exclude entirely from calculations as a hard requirement
      }
    }

    // 3. Data Quality Check: unrecognized or missing hire_type
    const hType = (r.hire_type || '').toLowerCase().trim();
    if (hType !== 'new' && hType !== 'replacement') {
      warnings.push({
        employeeId: String(r.employee_id || ''),
        name: r.name || '',
        type: 'INVALID_HIRE_TYPE',
        message: `Employee ${r.name} (${r.employee_id}) has an unrecognized or missing Hire Type '${r.hire_type || 'blank'}'; defaulted for analysis.`
      });
    }

    return true;
  });

  return { cleaned, warnings };
}

// Delegate metrics calculation functions directly to Layer 3 pure functions

export function calculateTotalHires(records: HRRecord[], start: Date, end: Date): number {
  return m.calcTotalHires(records, start, end);
}

export function calculateHeadcountAtDate(records: HRRecord[], targetDate: Date): number {
  return m.calcHeadcountAtDate(records, targetDate);
}

export function calculateHeadcountAtStart(records: HRRecord[], start: Date): number {
  return m.calcHeadcountAtStart(records, start);
}

export function calculateHeadcountAtEnd(records: HRRecord[], end: Date): number {
  return m.calcHeadcountAtEnd(records, end);
}

export function calculateAverageHeadcount(records: HRRecord[], start: Date, end: Date): number {
  return m.calcAverageHeadcount(records, start, end);
}

export function calculateAttritionCount(records: HRRecord[], start: Date, end: Date): number {
  return m.calcAttritionCount(records, start, end);
}

export function calculateAttritionRate(records: HRRecord[], start: Date, end: Date) {
  return m.calcAttritionRate(records, start, end);
}

export function calculateAvgTimeToHire(
  records: HRRecord[],
  start: Date,
  end: Date,
  referenceDate: Date = new Date()
) {
  const res = m.calcAvgTimeToHire(records, start, end, referenceDate);
  // Format for compatibility with legacy components
  const tatWarnings = res.rejectedDetails.map(rej => ({
    employeeId: rej.row.employee_id || '',
    name: rej.row.name || '',
    type: 'NEGATIVE_NULL_TAT' as const,
    message: rej.reason
  }));

  return {
    avgTat: res.avgTat,
    validHiresWithTatCount: res.validHiresWithTatCount,
    tatWarnings,
    rejectedDetails: res.rejectedDetails
  };
}

export function calculateAvgCostPerHire(records: HRRecord[], start: Date, end: Date) {
  return m.calcAvgCostPerHire(records, start, end);
}

export function calculateTotalSpend(records: HRRecord[], start: Date, end: Date) {
  return m.calcTotalSpend(records, start, end);
}

export function calculateAvgTenure(records: HRRecord[], start: Date, end: Date): number {
  return m.calcAvgTenure(records, start, end);
}

export function calculateDepartmentBreakdown(records: HRRecord[], start: Date, end: Date) {
  return m.calcDepartmentBreakdown(records, start, end);
}

export function roundPercentagesLargestRemainder<T>(
  items: T[],
  getCount: (item: T) => number,
  total: number
): (T & { pct: number })[] {
  if (total <= 0) {
    return items.map(item => ({ ...item, pct: 0 }));
  }

  const exacts = items.map(item => {
    const count = getCount(item);
    const exact = (count / total) * 100;
    const floored = Math.floor(exact);
    const remainder = exact - floored;
    return {
      item,
      floored,
      remainder
    };
  });

  const sumOfFloors = exacts.reduce((sum, x) => sum + x.floored, 0);
  const remainingPoints = 100 - sumOfFloors;

  const indexedExacts = exacts.map((x, idx) => ({ ...x, idx }));

  const sortedForDistribution = [...indexedExacts].sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 0.000001) {
      return b.remainder - a.remainder;
    }
    return a.idx - b.idx;
  });

  for (let i = 0; i < Math.min(remainingPoints, sortedForDistribution.length); i++) {
    sortedForDistribution[i].floored += 1;
  }

  const finalSorted = [...sortedForDistribution].sort((a, b) => a.idx - b.idx);

  return finalSorted.map(x => ({
    ...x.item,
    pct: x.floored
  }));
}

export function calculateSourcingBreakdown(records: HRRecord[], start: Date, end: Date) {
  const res = m.calcSourcingBreakdown(records, start, end);
  const defaultSources = ['LinkedIn', 'Naukri', 'Referral', 'Consultancy', 'Campus'];
  
  const breakdownRaw = res.breakdown;
  defaultSources.forEach(s => {
    if (!breakdownRaw.some(item => item.name === s)) {
      breakdownRaw.push({ name: s, count: 0 });
    }
  });

  const breakdown = roundPercentagesLargestRemainder(breakdownRaw, d => d.count, res.totalHires);
  return {
    totalHires: res.totalHires,
    breakdown: breakdown.filter(item => item.count > 0 || res.totalHires === 0).sort((a, b) => b.count - a.count)
  };
}

export function calculateAttritionReasonsBreakdown(records: HRRecord[], start: Date, end: Date) {
  const res = m.calcAttritionReasonsBreakdown(records, start, end);
  const defaultReasons = ['Better Opportunity', 'Relocation', 'Personal Reasons', 'Performance Issue', 'Higher Studies', 'Compensation', 'Other', 'Not Specified'];

  const breakdownRaw = res.breakdown;
  defaultReasons.forEach(r => {
    if (!breakdownRaw.some(item => item.name === r)) {
      breakdownRaw.push({ name: r, count: 0 });
    }
  });

  const breakdown = roundPercentagesLargestRemainder(breakdownRaw, d => d.count, res.totalExits);
  return {
    totalExits: res.totalExits,
    breakdown: breakdown.sort((a, b) => b.count - a.count)
  };
}

export function calculateRecruiterPerformance(
  records: HRRecord[],
  start: Date,
  end: Date,
  referenceDate: Date = new Date()
) {
  const res = m.calcRecruiterPerformance(records, start, end, referenceDate);
  return res.breakdown;
}

export function getAverageTenureDays(records: HRRecord[], referenceDate: Date = new Date()): number {
  if (records.length === 0) return 0;
  const totalTenure = records.reduce((sum, r) => {
    let days = r.tenure_days || 0;
    if (!r.tenure_days && r.date_of_joining) {
      const end = r.exit_date ? new Date(r.exit_date) : referenceDate;
      const diffTime = Math.max(0, end.getTime() - new Date(r.date_of_joining).getTime());
      days = Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
    return sum + days;
  }, 0);
  return totalTenure / records.length;
}

export function formatDaysToTenureString(avgDays: number): string {
  if (avgDays <= 0) return '0 Days';
  const totalMonths = avgDays / 30.44;
  const years = Math.floor(totalMonths / 12);
  const months = Math.floor(totalMonths % 12);
  const days = Math.round((totalMonths - Math.floor(totalMonths)) * 30.44);

  const parts = [];
  if (years > 0) parts.push(`${years} Years`);
  if (months > 0) parts.push(`${months} Months`);
  if (days > 0 || parts.length === 0) parts.push(`${days} Days`);
  return parts.join(' / ');
}

export function calculateNewVsReplacementCost(records: HRRecord[], start: Date, end: Date) {
  return m.calcNewVsReplacementCost(records, start, end);
}

export function calculateHeadcountCostByDepartment(records: HRRecord[], start: Date, end?: Date) {
  return m.calcHeadcountCostByDepartment(records, start, end || start);
}

export function calculateHeadcountCostByLocation(records: HRRecord[], start: Date, end?: Date) {
  return m.calcHeadcountCostByLocation(records, start, end || start);
}

export function calculateTopUpCostBreakdown(records: HRRecord[], start: Date, end: Date) {
  return m.calcTopUpCostBreakdown(records, start, end);
}

export function calculateVoluntaryInvoluntaryAttrition(records: HRRecord[], start: Date, end: Date) {
  return m.calcVoluntaryInvoluntaryAttrition(records, start, end);
}

export function calculateTenureDistribution(records: HRRecord[], start?: Date, end?: Date) {
  return m.calcTenureDistribution(records, end || start || new Date());
}

export function calculateCategoryDistribution(records: HRRecord[], start: Date, end?: Date) {
  return m.calcCategoryDistribution(records, end || start);
}

export function calculateExperienceDistribution(records: HRRecord[], start: Date, end?: Date) {
  return m.calcExperienceDistribution(records, end || start);
}

export function calculateYearlyCtcVsHeadcount(records: HRRecord[], start: Date, end: Date) {
  return m.calcYearlyCtcVsHeadcount(records, start, end);
}
