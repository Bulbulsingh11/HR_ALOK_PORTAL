/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HRRecord } from './hrDataBridge';

export interface ValidationResult<T> {
  valid: T[];
  rejected: Array<{ row: T; reason: string }>;
}

export function validateTAT(hires: HRRecord[], referenceDate: Date = new Date()): ValidationResult<HRRecord> {
  const valid: HRRecord[] = [];
  const rejected: Array<{ row: HRRecord; reason: string }> = [];

  for (const h of hires) {
    if (!h.job_posted_date || !h.offer_date) {
      rejected.push({ row: h, reason: 'Missing MRF (job posted) or Offer Letter date' });
      continue;
    }

    // Ensure we handle both Date object or string values correctly
    const offerMs = new Date(h.offer_date).getTime();
    const mrfMs = new Date(h.job_posted_date).getTime();
    const joinMs = h.date_of_joining ? new Date(h.date_of_joining).getTime() : null;

    // Reject offer dates in the future relative to reference date
    if (offerMs > referenceDate.getTime()) {
      rejected.push({ row: h, reason: 'Offer Date in the future relative to reference date' });
      continue;
    }

    // Reject offer dates after the employee's joining date
    if (joinMs && offerMs > joinMs) {
      rejected.push({ row: h, reason: 'Offer Date is after Joining Date' });
      continue;
    }

    const tat = Math.round((offerMs - mrfMs) / (1000 * 60 * 60 * 24));
    if (tat < 0) {
      rejected.push({ row: h, reason: `Offer Letter Date precedes MRF Date by ${-tat} days` });
      continue;
    }

    valid.push(h);
  }

  return { valid, rejected };
}
