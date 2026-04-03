/**
 * Arabic text shaping — converts Unicode Arabic text to presentation forms.
 *
 * This is the core of Naqqash: ~150 lines that replace HarfBuzz for the
 * 95% case of Arabic business documents (invoices, contracts, certificates).
 */

import {
  ContextualForm,
  JoiningType,
  PRESENTATION_FORMS,
  LAM_ALEF_LIGATURES,
  isDiacritic,
  getJoiningType,
  isArabicLetter,
} from './tables';

/** A shaped character with its presentation form codepoint */
export interface ShapedChar {
  /** The original Unicode codepoint */
  original: number;
  /** The presentation form codepoint (from Forms-B) or original if non-Arabic */
  shaped: number;
  /** Whether this character was consumed by a ligature */
  isLigature: boolean;
}

/**
 * Shape Arabic text — apply contextual joining forms and lam-alef ligatures.
 *
 * Takes a Unicode string and returns an array of shaped codepoints using
 * Unicode Presentation Forms-B. The output can be rendered by any system
 * that supports these codepoints (which is virtually everything).
 *
 * @param text - Input Unicode Arabic text
 * @returns Array of shaped characters in logical order
 */
export function shapeArabic(text: string): ShapedChar[] {
  const codepoints = Array.from(text).map((ch) => ch.codePointAt(0)!);
  const result: ShapedChar[] = [];

  // First pass: resolve lam-alef ligatures
  const resolved: Array<{ cp: number; ligature?: number; skip?: boolean }> = [];
  for (let i = 0; i < codepoints.length; i++) {
    if (resolved[i]?.skip) continue;

    const cp = codepoints[i];

    // Check for Lam + Alef ligature
    if (cp === 0x0644) {
      // Find next non-diacritic character
      let j = i + 1;
      while (j < codepoints.length && isDiacritic(codepoints[j])) j++;

      if (j < codepoints.length && codepoints[j] in LAM_ALEF_LIGATURES) {
        const ligaturePair = LAM_ALEF_LIGATURES[codepoints[j]];
        resolved[i] = { cp, ligature: codepoints[j] };
        // Mark the alef as skipped (consumed by ligature)
        for (let k = i + 1; k <= j; k++) {
          resolved[k] = { cp: codepoints[k], skip: k === j };
        }
        // Push diacritics between lam and alef
        for (let k = i + 1; k < j; k++) {
          if (!resolved[k]) resolved[k] = { cp: codepoints[k] };
        }
        continue;
      }
    }

    if (!resolved[i]) resolved[i] = { cp };
  }

  // Second pass: determine contextual forms
  // We need to look at non-transparent, non-skipped neighbors
  const joining: Array<{
    cp: number;
    joiningType: JoiningType;
    index: number;
    ligature?: number;
  }> = [];

  for (let i = 0; i < resolved.length; i++) {
    const r = resolved[i];
    if (!r || r.skip) continue;
    if (isDiacritic(r.cp)) {
      // Diacritics pass through unchanged
      result.push({ original: r.cp, shaped: r.cp, isLigature: false });
      continue;
    }

    const jt = getJoiningType(r.cp);
    joining.push({ cp: r.cp, joiningType: jt, index: result.length, ligature: r.ligature });
    // Placeholder — we'll fill shaped value in the next step
    result.push({ original: r.cp, shaped: r.cp, isLigature: false });
  }

  // Third pass: apply contextual forms based on neighbors
  for (let i = 0; i < joining.length; i++) {
    const entry = joining[i];
    const prev = i > 0 ? joining[i - 1] : null;
    const next = i < joining.length - 1 ? joining[i + 1] : null;

    // Can this char join to the right? (i.e., does previous char join left?)
    // Previous char must be dual-joining to extend a join to the left
    const prevJoinsLeft = prev != null && prev.joiningType === JoiningType.Dual;

    // Can this char join to the left? (i.e., does next char join right?)
    const nextJoinsRight =
      next &&
      (next.joiningType === JoiningType.Dual || next.joiningType === JoiningType.Right);

    // Determine contextual form
    let form: ContextualForm;

    if (entry.joiningType === JoiningType.NonJoining) {
      form = ContextualForm.Isolated;
    } else if (entry.joiningType === JoiningType.Right) {
      // Right-joining: can only join to the right (from previous char)
      form = prevJoinsLeft ? ContextualForm.Final : ContextualForm.Isolated;
    } else if (entry.joiningType === JoiningType.Dual) {
      // Dual-joining: can join both sides
      const joinRight = prevJoinsLeft;
      const joinLeft = nextJoinsRight;

      if (joinRight && joinLeft) form = ContextualForm.Medial;
      else if (joinRight) form = ContextualForm.Final;
      else if (joinLeft) form = ContextualForm.Initial;
      else form = ContextualForm.Isolated;
    } else {
      form = ContextualForm.Isolated;
    }

    // Handle lam-alef ligature
    if (entry.ligature != null) {
      const ligPair = LAM_ALEF_LIGATURES[entry.ligature];
      if (ligPair) {
        const ligForm = (form === ContextualForm.Final || form === ContextualForm.Medial) ? 1 : 0;
        result[entry.index] = {
          original: entry.cp,
          shaped: ligPair[ligForm],
          isLigature: true,
        };
        continue;
      }
    }

    // Apply presentation form
    const forms = PRESENTATION_FORMS[entry.cp];
    if (forms) {
      result[entry.index] = {
        original: entry.cp,
        shaped: forms[form],
        isLigature: false,
      };
    }
  }

  return result;
}

/**
 * Shape Arabic text and return a string with presentation forms applied.
 * Non-Arabic characters pass through unchanged.
 * The string is in logical order (not reversed for RTL).
 *
 * @param text - Input Unicode Arabic text
 * @returns Shaped string using Presentation Forms-B
 */
export function shapeArabicText(text: string): string {
  const shaped = shapeArabic(text);
  return shaped.map((s) => String.fromCodePoint(s.shaped)).join('');
}

/**
 * Shape Arabic text and return a visual-order string (reversed for RTL).
 * Mixed content (Arabic + Latin/numbers) uses a simplified bidi algorithm:
 * Arabic segments are reversed, Latin/number segments stay LTR.
 *
 * @param text - Input Unicode Arabic text
 * @returns Shaped string in visual order (ready for left-to-right rendering)
 */
export function shapeArabicVisual(text: string): string {
  const shaped = shapeArabicText(text);

  // Split into runs of Arabic vs non-Arabic
  const runs: Array<{ text: string; isRTL: boolean }> = [];
  let current = '';
  let currentIsRTL: boolean | null = null;

  for (const ch of shaped) {
    const cp = ch.codePointAt(0)!;
    const isRTL = isArabicChar(cp);

    if (currentIsRTL !== null && isRTL !== currentIsRTL) {
      runs.push({ text: current, isRTL: currentIsRTL });
      current = '';
    }
    current += ch;
    currentIsRTL = isRTL;
  }
  if (current && currentIsRTL !== null) {
    runs.push({ text: current, isRTL: currentIsRTL });
  }

  // Reverse the overall run order (base direction is RTL) and reverse RTL runs
  const reversed = runs.reverse().map((run) => {
    if (run.isRTL) {
      return Array.from(run.text).reverse().join('');
    }
    return run.text;
  });

  return reversed.join('');
}

/**
 * Check if a codepoint is in an Arabic Unicode range
 * (including Presentation Forms-B).
 */
function isArabicChar(cp: number): boolean {
  return (
    (cp >= 0x0600 && cp <= 0x06FF) || // Arabic
    (cp >= 0x0750 && cp <= 0x077F) || // Arabic Supplement
    (cp >= 0xFB50 && cp <= 0xFDFF) || // Arabic Presentation Forms-A
    (cp >= 0xFE70 && cp <= 0xFEFF) || // Arabic Presentation Forms-B
    isArabicLetter(cp)
  );
}
