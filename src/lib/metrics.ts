/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HRRecord } from './hrDataBridge';
import { validateTAT } from './validate';
import { KNOWN_INVALID_RECRUITERS } from './canonicalize';

/**
 * Formula: Total Hires (in period) = count of employees where period_start <= date_of_joining <= period_end.
 */
export function calcTotalHires(records: HRRecord[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  }).length;
}

/**
 * Formula: Headcount at Date = joined <= targetDate && (exit_date is null || exit_date > targetDate)
 */
export function calcHeadcountAtDate(records: HRRecord[], targetDate: Date): number {
  const targetMs = targetDate.getTime();
  return records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    if (joinMs > targetMs) return false;
    if (r.exit_date) {
      const exitMs = new Date(r.exit_date).getTime();
      return exitMs > targetMs;
    }
    return true;
  }).length;
}

export function calcHeadcountAtStart(records: HRRecord[], start: Date): number {
  // Headcount at start = joined < start && (exit_date is null || exit_date >= start)
  const startMs = start.getTime();
  return records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    if (joinMs >= startMs) return false;
    if (r.exit_date) {
      const exitMs = new Date(r.exit_date).getTime();
      return exitMs >= startMs;
    }
    return true;
  }).length;
}

export function calcHeadcountAtEnd(records: HRRecord[], end: Date): number {
  // Headcount at end = joined <= end && (exit_date is null || exit_date > end)
  const endMs = end.getTime();
  return records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    if (joinMs > endMs) return false;
    if (r.exit_date) {
      const exitMs = new Date(r.exit_date).getTime();
      return exitMs > endMs;
    }
    return true;
  }).length;
}

export function calcAverageHeadcount(records: HRRecord[], start: Date, end: Date): number {
  const headcountAtStart = calcHeadcountAtStart(records, start);
  const headcountAtEnd = calcHeadcountAtEnd(records, end);
  return (headcountAtStart + headcountAtEnd) / 2;
}

/**
 * Formula: Attrition Count = count of employees who left within the reporting period
 * (start <= exit_date <= end)
 */
export function calcAttritionCount(records: HRRecord[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return records.filter(r => {
    if (!r.exit_date) return false;
    const exitMs = new Date(r.exit_date).getTime();
    return exitMs >= startMs && exitMs <= endMs;
  }).length;
}

/**
 * Formula: Attrition Rate = (Exits / (Active Headcount at End + Exits)) * 100
 */
export function calcAttritionRate(records: HRRecord[], start: Date, end: Date) {
  const exits = calcAttritionCount(records, start, end);
  const active = calcHeadcountAtEnd(records, end);
  const total = active + exits;
  
  if (total === 0) {
    return {
      exits,
      exitsCount: exits,
      avgHeadcount: 0,
      totalHeadcount: 0,
      rate: "0.0",
      hasInsufficientData: true
    };
  }
  
  const rate = ((exits / total) * 100).toFixed(1);
  return {
    exits,
    exitsCount: exits,
    avgHeadcount: total,
    totalHeadcount: total,
    rate,
    hasInsufficientData: false
  };
}

/**
 * Computes average Time to Hire (TAT) using validateTAT under the hood.
 */
export function calcAvgTimeToHire(
  records: HRRecord[],
  start: Date,
  end: Date,
  referenceDate: Date = new Date()
) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hires = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  const { valid, rejected } = validateTAT(hires, referenceDate);

  const validTats = valid.map(h => {
    const offerMs = new Date(h.offer_date!).getTime();
    const mrfMs = new Date(h.job_posted_date!).getTime();
    return Math.round((offerMs - mrfMs) / (1000 * 60 * 60 * 24));
  });

  const totalTat = validTats.reduce((sum, val) => sum + val, 0);
  const avgTat = validTats.length > 0 ? (totalTat / validTats.length).toFixed(1) : "0.0";

  return {
    avgTat,
    validHiresWithTatCount: validTats.length,
    rejectedCount: rejected.length,
    rejectedDetails: rejected
  };
}

/**
 * Formula: Avg Cost per Hire = average of cost_per_hire_inr for hires within the period.
 */
export function calcAvgCostPerHire(records: HRRecord[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hiresInPeriod = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  const costedHires = hiresInPeriod.filter(r => r.cost_per_hire_inr && r.cost_per_hire_inr > 0);
  const totalCost = costedHires.reduce((sum, r) => sum + (r.cost_per_hire_inr || 0), 0);
  const avgCost = costedHires.length > 0 ? Math.round(totalCost / costedHires.length) : 0;

  return {
    avgCost,
    totalHiresCount: hiresInPeriod.length,
    costedHiresCount: costedHires.length,
    hasInsufficientData: costedHires.length === 0
  };
}

/**
 * Formula: Total Recruitment Spend = sum of cost_per_hire_inr for hires within the period.
 */
export function calcTotalSpend(records: HRRecord[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hiresInPeriod = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  const totalSpend = hiresInPeriod.reduce((sum, r) => sum + (r.cost_per_hire_inr || 0), 0);
  const hasCostData = hiresInPeriod.some(r => r.cost_per_hire_inr && r.cost_per_hire_inr > 0);

  return {
    totalSpend,
    hasInsufficientData: !hasCostData
  };
}

/**
 * Formula: Avg Tenure of exits (in days)
 */
export function calcAvgTenure(records: HRRecord[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const exits = records.filter(r => {
    if (!r.exit_date) return false;
    const exitMs = new Date(r.exit_date).getTime();
    return exitMs >= startMs && exitMs <= endMs;
  });

  if (exits.length === 0) return 0;

  const totalTenure = exits.reduce((sum, r) => {
    if (!r.date_of_joining || !r.exit_date) return sum;
    const joinMs = new Date(r.date_of_joining).getTime();
    const exitMs = new Date(r.exit_date).getTime();
    const days = Math.round((exitMs - joinMs) / (1000 * 60 * 60 * 24));
    return sum + Math.max(0, days);
  }, 0);

  return totalTenure / exits.length;
}

/**
 * Department-level breakdown
 */
export function calcDepartmentBreakdown(records: HRRecord[], start: Date, end: Date) {
  const departments = Array.from(new Set(records.map(r => r.department).filter(Boolean)));

  const breakdown = departments.map(dept => {
    const deptEmployees = records.filter(r => r.department === dept);

    const active = calcHeadcountAtEnd(deptEmployees, end);
    const resigned = calcAttritionCount(deptEmployees, start, end);
    const total = active + resigned;

    const attritionStats = calcAttritionRate(deptEmployees, start, end);
    const attritionPct = attritionStats.rate;

    const startMs = start.getTime();
    const endMs = end.getTime();
    const workforce = deptEmployees.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = new Date(r.date_of_joining).getTime();
      if (joinMs > endMs) return false;
      if (r.exit_date) {
        const exitMs = new Date(r.exit_date).getTime();
        return exitMs >= startMs;
      }
      return true;
    });

    const ctcRecords = workforce.filter(r => r.monthly_ctc_inr && r.monthly_ctc_inr > 0);
    const totalCtc = ctcRecords.reduce((sum, r) => sum + (r.monthly_ctc_inr || 0), 0);
    const avgCtc = ctcRecords.length > 0 ? Math.round(totalCtc / ctcRecords.length) : 0;

    const isSmallSampleSize = active > 0 && active <= 5;

    return {
      department: dept!,
      total,
      active,
      resigned,
      attritionPct,
      avgCtc,
      isSmallSampleSize
    };
  });

  return breakdown.sort((a, b) => a.department.localeCompare(b.department));
}

/**
 * Sourcing channel breakdown
 */
export function calcSourcingBreakdown(records: HRRecord[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hires = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  const totalHires = hires.length;
  const sourcingMap: Record<string, number> = {};

  hires.forEach(r => {
    const src = r.recruitment_source || 'Direct/Internal';
    sourcingMap[src] = (sourcingMap[src] || 0) + 1;
  });

  const breakdownRaw = Object.entries(sourcingMap).map(([name, count]) => {
    return { name, count };
  });

  return {
    totalHires,
    breakdown: breakdownRaw.sort((a, b) => b.count - a.count)
  };
}

/**
 * Attrition reasons breakdown
 */
export function calcAttritionReasonsBreakdown(records: HRRecord[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const exits = records.filter(r => {
    if (!r.exit_date) return false;
    const exitMs = new Date(r.exit_date).getTime();
    return exitMs >= startMs && exitMs <= endMs;
  });

  const totalExits = exits.length;
  const reasonsMap: Record<string, number> = {};

  exits.forEach(r => {
    const reason = r.exit_reason || 'Not Specified';
    reasonsMap[reason] = (reasonsMap[reason] || 0) + 1;
  });

  const breakdownRaw = Object.entries(reasonsMap).map(([name, count]) => {
    return { name, count };
  });

  return {
    totalExits,
    breakdown: breakdownRaw.sort((a, b) => b.count - a.count)
  };
}

/**
 * Recruiter performance calculation
 */
export function calcRecruiterPerformance(
  records: HRRecord[],
  start: Date,
  end: Date,
  referenceDate: Date = new Date()
) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hires = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  // Exclude KNOWN_INVALID_RECRUITERS
  const recruiterStatsMap: Record<string, { hires: number; validTats: number[]; sources: Record<string, number> }> = {};
  const dirtyHires: HRRecord[] = [];

  hires.forEach(r => {
    const recruiter = (r.recruiter_name || 'Direct/Internal').trim();
    
    if (KNOWN_INVALID_RECRUITERS.includes(recruiter)) {
      dirtyHires.push(r);
      return;
    }

    if (!recruiterStatsMap[recruiter]) {
      recruiterStatsMap[recruiter] = { hires: 0, validTats: [], sources: {} };
    }

    recruiterStatsMap[recruiter].hires += 1;
    const source = r.recruitment_source || 'Unknown';
    recruiterStatsMap[recruiter].sources[source] = (recruiterStatsMap[recruiter].sources[source] || 0) + 1;

    const { valid } = validateTAT([r], referenceDate);
    if (valid.length > 0 && r.offer_date && r.job_posted_date) {
      const offerMs = new Date(r.offer_date).getTime();
      const mrfMs = new Date(r.job_posted_date).getTime();
      const tatDays = Math.round((offerMs - mrfMs) / (1000 * 60 * 60 * 24));
      recruiterStatsMap[recruiter].validTats.push(tatDays);
    }
  });

  const breakdown = Object.entries(recruiterStatsMap).map(([name, s]) => {
    const totalTat = s.validTats.reduce((sum, val) => sum + val, 0);
    const avgTat = s.validTats.length > 0 ? Math.round(totalTat / s.validTats.length) : 0;
    
    // Most popular recruitment source
    let topSource = 'N/A';
    let maxSrcCount = -1;
    Object.entries(s.sources).forEach(([src, count]) => {
      if (count > maxSrcCount) {
        maxSrcCount = count;
        topSource = src;
      }
    });

    return {
      name,
      hires: s.hires,
      avgTat,
      avgTAT: avgTat,
      topSource,
      mostUsedSource: topSource
    };
  });

  return {
    breakdown: breakdown.sort((a, b) => b.hires - a.hires),
    dirtyCount: dirtyHires.length,
    dirtyDetails: dirtyHires
  };
}

/**
 * Computes New vs Replacement Hiring Cost grouped by hire_type.
 * Bug Fix: correctly infer hire_type from replacement_for to produce a 7 New / 3 Replacement split.
 */
export function calcNewVsReplacementCost(
  records: HRRecord[],
  start: Date,
  end: Date
) {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hires = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  let countNew = 0;
  let costNew = 0;
  let countRep = 0;
  let costRep = 0;

  hires.forEach(r => {
    let type = (r.hire_type || '').toLowerCase().trim();
    if (type !== 'new' && type !== 'replacement') {
      const repFor = (r.replacement_for || '').trim();
      const isRep = repFor !== '' && 
                    repFor.toUpperCase() !== 'N/A' && 
                    repFor.toUpperCase() !== 'NA' && 
                    repFor.toUpperCase() !== '-' && 
                    repFor.toUpperCase() !== 'NONE' && 
                    repFor.toUpperCase() !== 'NIL';
      type = isRep ? 'replacement' : 'new';
    }

    const totalCost = r.cost_per_hire_inr || 0;
    if (type === 'new') {
      countNew++;
      costNew += totalCost;
    } else {
      countRep++;
      costRep += totalCost;
    }
  });

  return [
    { name: 'New Hire', count: countNew, cost: costNew },
    { name: 'Replacement', count: countRep, cost: costRep }
  ];
}

export function calcHiringSpendByDept(hires: HRRecord[]): Record<string, number> {
  const result: Record<string, number> = {};
  hires.forEach(r => {
    if (!r.department) return;
    result[r.department] = (result[r.department] || 0) + (r.cost_per_hire_inr || 0);
  });
  return result;
}

export function calcHiringSpendByLoc(hires: HRRecord[]): Record<string, number> {
  const result: Record<string, number> = {};
  hires.forEach(r => {
    if (!r.plant_location) return;
    result[r.plant_location] = (result[r.plant_location] || 0) + (r.cost_per_hire_inr || 0);
  });
  return result;
}

export function calcHeadcountCostByDepartment(records: HRRecord[], start: Date, end: Date) {
  const departments = Array.from(new Set(records.map(r => r.department).filter(Boolean)));
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hiresInPeriod = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  const spendByDept = calcHiringSpendByDept(hiresInPeriod);

  return departments.map(dept => {
    const deptEmployees = records.filter(r => r.department === dept);
    const headcount = calcHeadcountAtEnd(deptEmployees, end);

    const totalCost = spendByDept[dept!] || 0;

    const activeAndExitedInPeriod = deptEmployees.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = new Date(r.date_of_joining).getTime();
      if (joinMs > endMs) return false;
      if (r.exit_date) {
        return new Date(r.exit_date).getTime() >= endMs;
      }
      return true;
    });

    const totalTenure = activeAndExitedInPeriod.reduce((sum, r) => {
      let days = r.tenure_days || 0;
      if (!r.tenure_days && r.date_of_joining) {
        const exit = r.exit_date ? new Date(r.exit_date) : end;
        const diffTime = Math.max(0, exit.getTime() - new Date(r.date_of_joining).getTime());
        days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      }
      return sum + days;
    }, 0);
    const avgDays = activeAndExitedInPeriod.length > 0 ? (totalTenure / activeAndExitedInPeriod.length) : 0;
    
    const totalMonths = avgDays / 30.44;
    const years = Math.floor(totalMonths / 12);
    const months = Math.floor(totalMonths % 12);
    const days = Math.round((totalMonths - Math.floor(totalMonths)) * 30.44);
    const parts = [];
    if (years > 0) parts.push(`${years} Years`);
    if (months > 0) parts.push(`${months} Months`);
    if (days > 0 || parts.length === 0) parts.push(`${days} Days`);
    const avgTenureText = parts.join(' / ');

    return {
      department: dept!,
      headcount,
      totalCost,
      avgTenureText
    };
  }).sort((a, b) => b.headcount - a.headcount);
}

export function calcHeadcountCostByLocation(records: HRRecord[], start: Date, end: Date) {
  const locations = Array.from(new Set(records.map(r => r.plant_location).filter(Boolean)));
  const startMs = start.getTime();
  const endMs = end.getTime();

  const hiresInPeriod = records.filter(r => {
    if (!r.date_of_joining) return false;
    const joinMs = new Date(r.date_of_joining).getTime();
    return joinMs >= startMs && joinMs <= endMs;
  });

  const spendByLoc = calcHiringSpendByLoc(hiresInPeriod);

  return locations.map(loc => {
    const locEmployees = records.filter(r => r.plant_location === loc);
    const headcount = calcHeadcountAtEnd(locEmployees, end);

    const totalCost = spendByLoc[loc!] || 0;

    const activeAndExitedInPeriod = locEmployees.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = new Date(r.date_of_joining).getTime();
      if (joinMs > endMs) return false;
      if (r.exit_date) {
        return new Date(r.exit_date).getTime() >= endMs;
      }
      return true;
    });

    const totalTenure = activeAndExitedInPeriod.reduce((sum, r) => {
      let days = r.tenure_days || 0;
      if (!r.tenure_days && r.date_of_joining) {
        const exit = r.exit_date ? new Date(r.exit_date) : end;
        const diffTime = Math.max(0, exit.getTime() - new Date(r.date_of_joining).getTime());
        days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      }
      return sum + days;
    }, 0);
    const avgDays = activeAndExitedInPeriod.length > 0 ? (totalTenure / activeAndExitedInPeriod.length) : 0;
    
    const totalMonths = avgDays / 30.44;
    const years = Math.floor(totalMonths / 12);
    const months = Math.floor(totalMonths % 12);
    const days = Math.round((totalMonths - Math.floor(totalMonths)) * 30.44);
    const parts = [];
    if (years > 0) parts.push(`${years} Years`);
    if (months > 0) parts.push(`${months} Months`);
    if (days > 0 || parts.length === 0) parts.push(`${days} Days`);
    const avgTenureText = parts.join(' / ');

    return {
      location: loc!,
      headcount,
      totalCost,
      avgTenureText
    };
  }).sort((a, b) => b.headcount - a.headcount);
}

export function calcTopUpCostBreakdown(records: HRRecord[], start: Date, end: Date) {
  const departments = Array.from(new Set(records.map(r => r.department).filter(Boolean)));
  const startMs = start.getTime();
  const endMs = end.getTime();

  return departments.map(dept => {
    const deptHires = records.filter(r => {
      if (r.department !== dept || !r.date_of_joining) return false;
      const joinMs = new Date(r.date_of_joining).getTime();
      return joinMs >= startMs && joinMs <= endMs;
    });

    const baseCost = deptHires.reduce((sum, r) => sum + (r.base_cost_per_hire || 0), 0);
    const topUpCost = deptHires.reduce((sum, r) => sum + (r.top_up_cost || 0), 0);

    return {
      department: dept!,
      baseCost,
      topUpCost
    };
  }).filter(d => d.baseCost > 0 || d.topUpCost > 0);
}

export function calcVoluntaryVsInvoluntary(records: HRRecord[]) {
  let voluntary = 0;
  let involuntary = 0;
  records.forEach(r => {
    const type = (r.attrition_type || '').toLowerCase().trim();
    const reason = (r.exit_reason || '').toLowerCase().trim();
    if (type === 'voluntary' || reason === 'voluntary') {
      voluntary++;
    } else if (type === 'involuntary' || reason === 'involuntary') {
      involuntary++;
    }
  });
  return { voluntary, involuntary };
}

export function calcVoluntaryInvoluntaryAttrition(
  records: HRRecord[],
  start: Date,
  end: Date
) {
  const trend: { month: string; Voluntary: number; Involuntary: number; Unspecified: number }[] = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  let iterations = 0;
  while (current <= last && iterations < 600) {
    iterations++;
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;

    let vol = 0;
    let invol = 0;
    let unspecified = 0;

    records.forEach(r => {
      if (!r.exit_date) return;
      const d = new Date(r.exit_date);
      if (d.getFullYear() === year && d.getMonth() === month && d >= start && d <= end) {
        const type = (r.attrition_type || '').toLowerCase().trim();
        const reason = (r.exit_reason || '').toLowerCase().trim();

        // Exact comparisons only as mandated by scope rules to prevent Voluntary/Involuntary bug
        if (type === 'voluntary') {
          vol++;
        } else if (type === 'involuntary') {
          invol++;
        } else if (reason === 'voluntary') {
          vol++;
        } else if (reason === 'involuntary') {
          invol++;
        } else {
          unspecified++;
        }
      }
    });

    trend.push({ month: monthStr, Voluntary: vol, Involuntary: invol, Unspecified: unspecified });
    current.setMonth(current.getMonth() + 1);
  }
  return trend;
}

export function calcTenureDistribution(records: HRRecord[], referenceDate: Date = new Date()) {
  let bucket1 = 0; // <6mo
  let bucket2 = 0; // 6-12mo
  let bucket3 = 0; // 1-2yr
  let bucket4 = 0; // 2-5yr
  let bucket5 = 0; // >5yr

  records.forEach(r => {
    // Only count active or exits where tenure_days is calculated
    let days = r.tenure_days || 0;
    if (!r.tenure_days && r.date_of_joining) {
      const end = r.exit_date ? new Date(r.exit_date) : referenceDate;
      const diffTime = Math.max(0, end.getTime() - new Date(r.date_of_joining).getTime());
      days = Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    const months = days / 30.44;

    if (months < 6) {
      bucket1++;
    } else if (months < 12) {
      bucket2++;
    } else if (months < 24) {
      bucket3++;
    } else if (months < 60) {
      bucket4++;
    } else {
      bucket5++;
    }
  });

  return [
    { name: '< 6 Months', count: bucket1 },
    { name: '6 - 12 Months', count: bucket2 },
    { name: '1 - 2 Years', count: bucket3 },
    { name: '2 - 5 Years', count: bucket4 },
    { name: '5+ Years', count: bucket5 }
  ];
}

export function calcCategoryDistribution(records: HRRecord[], end: Date) {
  const counts: Record<string, number> = {};
  records.forEach(r => {
    // Only active employees at end
    if (!r.date_of_joining) return;
    const joinMs = new Date(r.date_of_joining).getTime();
    if (joinMs > end.getTime()) return;
    if (r.exit_date && new Date(r.exit_date).getTime() <= end.getTime()) return;

    const cat = r.category || 'Staff';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function calcExperienceDistribution(records: HRRecord[], end: Date) {
  let entry = 0; // <2yr
  let mid = 0;   // 2-5yr
  let senior = 0; // 5-10yr
  let veteran = 0; // >10yr

  records.forEach(r => {
    // Only active employees at end
    if (!r.date_of_joining) return;
    const joinMs = new Date(r.date_of_joining).getTime();
    if (joinMs > end.getTime()) return;
    if (r.exit_date && new Date(r.exit_date).getTime() <= end.getTime()) return;

    const exp = r.total_experience_years || 0;
    if (exp < 2) {
      entry++;
    } else if (exp < 5) {
      mid++;
    } else if (exp < 10) {
      senior++;
    } else {
      veteran++;
    }
  });

  return [
    { name: 'Entry (<2 yrs)', count: entry },
    { name: 'Mid-Level (2-5 yrs)', count: mid },
    { name: 'Senior (5-10 yrs)', count: senior },
    { name: 'Veteran (10+ yrs)', count: veteran }
  ];
}

export function calcYearlyCtcVsHeadcount(records: HRRecord[], start: Date, end: Date) {
  const trend: { month: string; Headcount: number; headcount: number; CTC: number; ctc: number; totalCtc: number }[] = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  let iterations = 0;
  while (current <= last && iterations < 600) {
    iterations++;
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;

    // Target date is the last day of this current month
    const targetDate = new Date(year, month + 1, 0);
    const hc = calcHeadcountAtDate(records, targetDate);

    // Filter workforce active at this month's end to calculate total CTC
    const activeAndExitedInPeriod = records.filter(r => {
      if (!r.date_of_joining) return false;
      const joinMs = new Date(r.date_of_joining).getTime();
      if (joinMs > targetDate.getTime()) return false;
      if (r.exit_date) {
        return new Date(r.exit_date).getTime() >= targetDate.getTime();
      }
      return true;
    });

    const totalCtc = activeAndExitedInPeriod.reduce((sum, r) => sum + (r.monthly_ctc_inr || 0), 0);
    trend.push({ month: monthStr, Headcount: hc, headcount: hc, CTC: totalCtc, ctc: totalCtc, totalCtc });
    current.setMonth(current.getMonth() + 1);
  }
  return trend;
}
