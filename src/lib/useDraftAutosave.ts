/**
 * useDraftAutosave — lightweight sessionStorage draft persistence.
 *
 * Design decisions:
 * - readDraft is a plain function, NOT a hook. Call it inside useState(() => ...)
 *   initializers so components seed their state on first render with zero extra renders.
 * - Debounce timer is always cleared on unmount (useEffect cleanup), so a pending write
 *   can never fire into sessionStorage after the form is gone.
 * - clearDraft also cancels any pending timer — prevents a stale write racing a clear.
 * - Draft persists through navigation-away without submit (intentional): if the user
 *   accidentally clicks away mid-form, their work survives the session. sessionStorage
 *   auto-expires when the tab closes, so this never leaks across days.
 * - All storage calls are try/caught — private/incognito mode can throw on writes.
 */

import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 500;

/**
 * Read an existing draft from sessionStorage.
 * Returns null if absent, unparseable, or storage is unavailable.
 * Call this inside a useState(() => ...) initializer — not during render.
 */
export function readDraft<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Autosave `value` to sessionStorage[key] after a 500 ms debounce on every change.
 *
 * @param key     - sessionStorage key scoped to this form (e.g. "draft_offer_letter_form")
 * @param value   - current form state object to persist (must be JSON-serialisable)
 * @param enabled - set false to pause saving (e.g. while in preview/read-only step)
 * @returns       - { clearDraft } — call on successful submit to remove the draft
 */
export function useDraftAutosave<T>(
  key: string,
  value: T,
  enabled: boolean = true
): { clearDraft: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Cancel any previously-scheduled write before scheduling a new one
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silently ignore — private mode or storage quota exceeded
      }
      timerRef.current = null;
    }, DEBOUNCE_MS);

    // Cleanup: fires on every value change AND on unmount.
    // This is the critical guard that prevents a stale write firing after unmount.
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [key, value, enabled]);

  const clearDraft = () => {
    // Cancel any pending debounced write first — prevents a clear being overwritten
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silently ignore
    }
  };

  return { clearDraft };
}
