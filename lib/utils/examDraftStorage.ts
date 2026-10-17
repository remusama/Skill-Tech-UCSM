/**
 * Utility for persisting and retrieving exam drafts in localStorage.
 * Enables saving progress when students exit or pause an exam, and resuming seamlessly.
 */

export interface ExamDraft<TAnswers = any, TExtra = any> {
  examId: string;
  answers: TAnswers;
  currentIndex?: number;
  extra?: TExtra;
  updatedAt: number;
}

const STORAGE_PREFIX = "skilltech_exam_draft_";

export function getDraftKey(examId: string): string {
  return `${STORAGE_PREFIX}${String(examId).toLowerCase().trim()}`;
}

export function saveExamDraft<TAnswers = any, TExtra = any>(
  examId: string,
  data: {
    answers: TAnswers;
    currentIndex?: number;
    extra?: TExtra;
  }
): boolean {
  if (typeof window === "undefined" || !examId) return false;
  try {
    const payload: ExamDraft<TAnswers, TExtra> = {
      examId,
      answers: data.answers,
      currentIndex: data.currentIndex ?? 0,
      extra: data.extra,
      updatedAt: Date.now(),
    };
    localStorage.setItem(getDraftKey(examId), JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent("exam-draft-updated", {
        detail: { examId, hasDraft: true },
      })
    );
    return true;
  } catch (err) {
    console.warn("[examDraftStorage] Failed to save draft:", err);
    return false;
  }
}

export function loadExamDraft<TAnswers = any, TExtra = any>(
  examId: string
): ExamDraft<TAnswers, TExtra> | null {
  if (typeof window === "undefined" || !examId) return null;
  try {
    const raw = localStorage.getItem(getDraftKey(examId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as ExamDraft<TAnswers, TExtra>;
  } catch (err) {
    console.warn("[examDraftStorage] Failed to read draft:", err);
    return null;
  }
}

export function clearExamDraft(examId: string): void {
  if (typeof window === "undefined" || !examId) return;
  try {
    localStorage.removeItem(getDraftKey(examId));
    window.dispatchEvent(
      new CustomEvent("exam-draft-updated", {
        detail: { examId, hasDraft: false },
      })
    );
  } catch (err) {
    console.warn("[examDraftStorage] Failed to clear draft:", err);
  }
}

export function hasExamDraft(examId: string): boolean {
  if (typeof window === "undefined" || !examId) return false;
  try {
    return localStorage.getItem(getDraftKey(examId)) !== null;
  } catch {
    return false;
  }
}
