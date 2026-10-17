/**
 * Plain-language checks for English text: Flesch reading ease and sentence length.
 * Patient information should score 60 or more (plain English) with short sentences.
 */

/** Syllables in an English word, by vowel groups with the usual corrections. Good enough to rank text, not to publish a dictionary. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

export const words = (text: string) => text.split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9'°-]/g, '')).filter(Boolean);

export function readingEase(text: string): number {
  const ss = sentences(text);
  const ws = words(text);
  if (!ws.length) return 100;
  const syl = ws.reduce((a, w) => a + syllables(w), 0);
  return 206.835 - 1.015 * (ws.length / Math.max(1, ss.length)) - 84.6 * (syl / ws.length);
}

export const longestSentence = (text: string) => Math.max(0, ...sentences(text).map((s) => words(s).length));
