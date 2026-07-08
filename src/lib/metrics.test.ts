/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateTAT } from './validate';
import {
  calcVoluntaryVsInvoluntary,
  calcNewVsReplacementCost,
  calcHiringSpendByDept,
  calcDepartmentBreakdown
} from './metrics';
import { HRRecord } from './hrDataBridge';

// Simple mockup of describe/it structures to ensure tsc compiles this perfectly,
// while keeping the regression test fully compatible with standard Jest/Vitest setups.
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect(actual: any): {
    toBe(expected: any): void;
    toBeCloseTo(expected: any, precision: number): void;
  };
}

describe('HR Metrics regression suite', () => {
  // Test 1: Avg Time to Hire excludes exactly 18 records, surfaced not dropped
  it('Avg Time to Hire excludes exactly 18 records, surfaced not dropped', () => {
    // Construct test records matching the scenario where 18 are negative or invalid and 76 are valid
    const hires: HRRecord[] = [];
    
    // Add 76 valid hires with average TAT of 20.1 days
    for (let i = 0; i < 76; i++) {
      hires.push({
        employee_id: `VALID_${i}`,
        name: `Valid Employee ${i}`,
        job_posted_date: new Date('2026-04-01'),
        offer_date: new Date('2026-04-21'), // 20 days TAT
        date_of_joining: new Date('2026-04-25')
      });
    }

    // Add 18 rejected hires (e.g., negative TAT where offer precedes job post)
    for (let i = 0; i < 18; i++) {
      hires.push({
        employee_id: `REJECT_${i}`,
        name: `Reject Employee ${i}`,
        job_posted_date: new Date('2026-04-21'),
        offer_date: new Date('2026-04-01'), // negative TAT
        date_of_joining: new Date('2026-04-25')
      });
    }

    const { valid, rejected } = validateTAT(hires);
    expect(rejected.length).toBe(18);
    expect(valid.length).toBe(76);

    const tatDaysList = valid.map(h => {
      const offerMs = new Date(h.offer_date!).getTime();
      const mrfMs = new Date(h.job_posted_date!).getTime();
      return Math.round((offerMs - mrfMs) / (1000 * 60 * 60 * 24));
    });

    const sum = tatDaysList.reduce((acc, val) => acc + val, 0);
    const avg = sum / tatDaysList.length;
    expect(avg).toBeCloseTo(20.0, 1); // 20 days based on mocked values
  });

  // Test 2: Voluntary vs Involuntary is exactly 11 vs 1
  it('Voluntary vs Involuntary is exactly 11 vs 1', () => {
    const exits: HRRecord[] = [];
    
    // Add 11 voluntary exits
    for (let i = 0; i < 11; i++) {
      exits.push({
        employee_id: `V_${i}`,
        name: `Voluntary Employee ${i}`,
        exit_date: new Date('2026-05-15'),
        attrition_type: 'voluntary',
        exit_reason: 'Better Prospects'
      });
    }

    // Add 1 involuntary exit
    exits.push({
      employee_id: 'I_1',
      name: 'Involuntary Employee 1',
      exit_date: new Date('2026-05-15'),
      attrition_type: 'involuntary',
      exit_reason: 'Performance Issue'
    });

    const res = calcVoluntaryVsInvoluntary(exits);
    expect(res.voluntary).toBe(11);
    expect(res.involuntary).toBe(1);
  });

  // Test 3: New vs Replacement split
  it('New vs Replacement Hiring split is exactly 7 vs 3', () => {
    const hires: HRRecord[] = [];
    
    // Add 7 New Hires (empty or invalid replacement_for)
    for (let i = 0; i < 7; i++) {
      hires.push({
        employee_id: `N_${i}`,
        name: `New Employee ${i}`,
        date_of_joining: new Date('2026-04-10'),
        replacement_for: '  N/A  ',
        hire_type: '' // blank to test inference
      });
    }

    // Add 3 Replacement Hires (with valid replacement_for)
    for (let i = 0; i < 3; i++) {
      hires.push({
        employee_id: `R_${i}`,
        name: `Replacement Employee ${i}`,
        date_of_joining: new Date('2026-04-10'),
        replacement_for: 'EMP042',
        hire_type: '' // blank to test inference
      });
    }

    const breakdown = calcNewVsReplacementCost(hires, new Date('2026-04-01'), new Date('2026-04-30'));
    const newCount = breakdown.find(b => b.name === 'New Hire')?.count || 0;
    const repCount = breakdown.find(b => b.name === 'Replacement')?.count || 0;

    expect(newCount).toBe(7);
    expect(repCount).toBe(3);
  });

  // Test 4: Hiring Spend by department matches Top-Up Cost Base Cost, and both sum to Total Spend
  it('Hiring Spend by department matches Top-Up Cost Base Cost, and both sum to Total Spend', () => {
    const hires: HRRecord[] = [
      { employee_id: 'H1', department: 'Production', cost_per_hire_inr: 268955, date_of_joining: new Date('2026-04-10') },
      { employee_id: 'H2', department: 'Lab / QC / NPD', cost_per_hire_inr: 180945, date_of_joining: new Date('2026-04-10') },
      { employee_id: 'H3', department: 'Sales', cost_per_hire_inr: 605105, date_of_joining: new Date('2026-04-10') }
    ];

    const byDept = calcHiringSpendByDept(hires);
    expect(byDept['Production']).toBeCloseTo(268955, 0);
    expect(byDept['Lab / QC / NPD']).toBeCloseTo(180945, 0);
    const total = Object.values(byDept).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1055005, 0);
  });

  // Test 5: Attrition % is always Resigned / Total Headcount for the same row
  it('Attrition % is always Resigned / Total Headcount for the same row', () => {
    const records: HRRecord[] = [
      { employee_id: 'E1', department: 'Technical Services', date_of_joining: new Date('2025-05-01') },
      { employee_id: 'E2', department: 'Technical Services', date_of_joining: new Date('2025-05-01') },
      { employee_id: 'E3', department: 'Technical Services', date_of_joining: new Date('2025-05-01') },
      { employee_id: 'E4', department: 'Technical Services', date_of_joining: new Date('2025-05-01') },
      { employee_id: 'E5', department: 'Technical Services', date_of_joining: new Date('2025-05-01') },
      { employee_id: 'E6', department: 'Technical Services', date_of_joining: new Date('2025-05-01'), exit_date: new Date('2026-05-15'), attrition_type: 'voluntary' }
    ];

    const rows = calcDepartmentBreakdown(records, new Date('2026-04-01'), new Date('2026-06-30'));
    for (const row of rows) {
      const expectedPct = (row.resigned / row.total) * 100;
      expect(parseFloat(row.attritionPct)).toBeCloseTo(expectedPct, 1);
    }
  });
});
