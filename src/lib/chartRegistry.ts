/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChartConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ChartPreferences {
  charts: ChartConfig[];
  updatedAt: string;
}

// Default list of all charts (13 existing + 6 new) in initial display order
export const DEFAULT_CHART_REGISTRY: ChartConfig[] = [
  // 1. Headcount & Growth Core Trends
  { id: 'headcount-growth', label: 'Headcount Growth Trend (Cumulative)', visible: true, order: 0 },
  { id: 'yearly-ctc-trend', label: 'Yearly CTC vs Headcount Trend', visible: true, order: 1 },
  
  // 2. Hiring Volumes & Channels
  { id: 'hiring-by-department', label: 'Hiring by Department', visible: true, order: 2 },
  { id: 'monthly-hiring-trend', label: 'Monthly Hiring Trend', visible: true, order: 3 },
  { id: 'hires-by-location', label: 'Hires by Plant/Location', visible: true, order: 4 },
  { id: 'sourcing-channels', label: 'Sourcing Channels', visible: true, order: 5 },
  
  // 3. Financial & Budget deep-dives
  { id: 'headcount-cost-by-dept', label: 'Headcount & Cost by Department', visible: true, order: 6 },
  { id: 'headcount-cost-by-location', label: 'Headcount & Cost by Location', visible: true, order: 7 },
  { id: 'new-vs-replacement-cost', label: 'New vs Replacement Hiring Cost', visible: true, order: 8 },
  { id: 'top-up-cost-breakdown', label: 'Top-Up Cost Breakdown', visible: true, order: 9 },
  { id: 'cost-by-source', label: 'Avg Cost per Hire by Source', visible: true, order: 10 },
  
  // 4. Exits & Attrition insights
  { id: 'attrition-over-time', label: 'Attrition Over Time (Monthly)', visible: true, order: 11 },
  { id: 'attrition-by-dept', label: 'Attrition Rate by Department', visible: true, order: 12 },
  { id: 'voluntary-vs-involuntary-attrition', label: 'Voluntary vs Involuntary Attrition', visible: true, order: 13 },
  { id: 'attrition-reasons', label: 'Attrition Reasons Breakdown', visible: true, order: 14 },
  { id: 'exit-reasons-by-dept', label: 'Exit Reasons by Department', visible: true, order: 15 },
  { id: 'attrition-by-seniority', label: 'Attrition by Designation Level', visible: true, order: 16 },
  { id: 'tenure-distribution', label: 'Tenure / Longevity Distribution', visible: true, order: 17 },
  
  // 5. Talent Composition & Team Metrics
  { id: 'seniority-pyramid', label: 'Designation Seniority Pyramid', visible: true, order: 18 },
  { id: 'category-distribution', label: 'Category Distribution', visible: true, order: 19 },
  { id: 'experience-distribution', label: 'Experience Distribution', visible: true, order: 20 },
  { id: 'recruiter-performance', label: 'Recruiter Performance Summary', visible: true, order: 21 },
  { id: 'hiring-by-dept-names', label: 'Hiring by Dept (with names)', visible: true, order: 22 }
];

const PREFS_KEY_PREFIX = 'alok_hr_chart_prefs';

export function getPrefsKey(userId?: string): string {
  return userId ? `${PREFS_KEY_PREFIX}_${userId}` : PREFS_KEY_PREFIX;
}

export function loadChartPreferences(userId?: string): ChartConfig[] {
  const key = getPrefsKey(userId);
  const saved = localStorage.getItem(key);
  if (!saved) {
    // If not found, check if there is a shared one (if we are logged in but none user-specific exists yet)
    if (userId) {
      const sharedSaved = localStorage.getItem(PREFS_KEY_PREFIX);
      if (sharedSaved) {
        try {
          return mergeWithDefaults(JSON.parse(sharedSaved));
        } catch (_) {}
      }
    }
    return DEFAULT_CHART_REGISTRY;
  }
  try {
    const parsed = JSON.parse(saved);
    const loadedList = Array.isArray(parsed) ? parsed : (parsed.charts || []);
    return mergeWithDefaults(loadedList);
  } catch (e) {
    console.error('Failed to parse chart preferences', e);
    return DEFAULT_CHART_REGISTRY;
  }
}

export function saveChartPreferences(charts: ChartConfig[], userId?: string): void {
  const key = getPrefsKey(userId);
  localStorage.setItem(key, JSON.stringify(charts));
  // If user ID is available, also update shared preferences as fallback
  if (userId) {
    localStorage.setItem(PREFS_KEY_PREFIX, JSON.stringify(charts));
  }
}

function mergeWithDefaults(savedList: ChartConfig[]): ChartConfig[] {
  // If the first saved chart is not 'headcount-growth', reset orders to the new premium sequence
  // but preserve user's custom visibility overrides
  const needsReorder = savedList.length > 0 && savedList[0]?.id !== 'headcount-growth';

  const merged = [...savedList];
  
  DEFAULT_CHART_REGISTRY.forEach(defaultChart => {
    if (!merged.some(c => c.id === defaultChart.id)) {
      merged.push(defaultChart);
    }
  });

  // Re-run sorting and fix duplicate/stale order values
  return merged
    .map((chart, idx) => {
      const defaultChart = DEFAULT_CHART_REGISTRY.find(c => c.id === chart.id);
      return {
        ...chart,
        // Preserve default label if not present
        label: chart.label || defaultChart?.label || chart.id,
        // Ensure visible is boolean
        visible: typeof chart.visible === 'boolean' ? chart.visible : true,
        // Default order fallback with migration
        order: needsReorder
          ? (defaultChart?.order ?? idx)
          : (typeof chart.order === 'number' ? chart.order : (defaultChart?.order ?? idx))
      };
    })
    .sort((a, b) => a.order - b.order);
}
