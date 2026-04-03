/**
 * Arabic joining types and Unicode Presentation Forms-B mappings.
 *
 * Each Arabic letter has up to 4 contextual forms stored in Unicode
 * Presentation Forms-B (U+FE70–U+FEFF). Instead of a full shaping
 * engine, we simply map each letter to the correct presentation form
 * based on its neighbors' joining behaviour.
 */

/** Joining type of an Arabic character */
export const enum JoiningType {
  /** Joins to the right only (e.g. Alef, Dal, Thal, Ra, Zain, Waw) */
  Right = 'R',
  /** Joins on both sides (most letters) */
  Dual = 'D',
  /** Does not join (but is transparent for joining context) */
  Transparent = 'T',
  /** Does not join and breaks joining */
  NonJoining = 'U',
}

/** Contextual form of an Arabic letter */
export const enum ContextualForm {
  Isolated = 0,
  Final = 1,
  Initial = 2,
  Medial = 3,
}

/**
 * Joining type for each Arabic letter (U+0621–U+064A).
 * R = right-joining, D = dual-joining, U = non-joining, T = transparent
 */
export const JOINING_TYPE: Record<number, JoiningType> = {
  0x0621: JoiningType.NonJoining, // Hamza
  0x0622: JoiningType.Right,     // Alef with Madda
  0x0623: JoiningType.Right,     // Alef with Hamza Above
  0x0624: JoiningType.Right,     // Waw with Hamza
  0x0625: JoiningType.Right,     // Alef with Hamza Below
  0x0626: JoiningType.Dual,      // Yeh with Hamza
  0x0627: JoiningType.Right,     // Alef
  0x0628: JoiningType.Dual,      // Beh
  0x0629: JoiningType.Right,     // Teh Marbuta
  0x062A: JoiningType.Dual,      // Teh
  0x062B: JoiningType.Dual,      // Theh
  0x062C: JoiningType.Dual,      // Jeem
  0x062D: JoiningType.Dual,      // Hah
  0x062E: JoiningType.Dual,      // Khah
  0x062F: JoiningType.Right,     // Dal
  0x0630: JoiningType.Right,     // Thal
  0x0631: JoiningType.Right,     // Reh
  0x0632: JoiningType.Right,     // Zain
  0x0633: JoiningType.Dual,      // Seen
  0x0634: JoiningType.Dual,      // Sheen
  0x0635: JoiningType.Dual,      // Sad
  0x0636: JoiningType.Dual,      // Dad
  0x0637: JoiningType.Dual,      // Tah
  0x0638: JoiningType.Dual,      // Zah
  0x0639: JoiningType.Dual,      // Ain
  0x063A: JoiningType.Dual,      // Ghain
  0x0640: JoiningType.Dual,      // Tatweel (Kashida)
  0x0641: JoiningType.Dual,      // Feh
  0x0642: JoiningType.Dual,      // Qaf
  0x0643: JoiningType.Dual,      // Kaf
  0x0644: JoiningType.Dual,      // Lam
  0x0645: JoiningType.Dual,      // Meem
  0x0646: JoiningType.Dual,      // Noon
  0x0647: JoiningType.Dual,      // Heh
  0x0648: JoiningType.Right,     // Waw
  0x0649: JoiningType.Dual,      // Alef Maksura
  0x064A: JoiningType.Dual,      // Yeh
  // Additional characters
  0x0671: JoiningType.Right,     // Alef Wasla
  0x067E: JoiningType.Dual,      // Peh (Farsi)
  0x0686: JoiningType.Dual,      // Tcheh (Farsi)
  0x0698: JoiningType.Right,     // Jeh (Farsi)
  0x06A9: JoiningType.Dual,      // Keheh (Farsi)
  0x06AF: JoiningType.Dual,      // Gaf (Farsi)
  0x06CC: JoiningType.Dual,      // Farsi Yeh
};

/**
 * Unicode Presentation Forms-B mapping.
 * Maps base codepoint -> [isolated, final, initial, medial]
 * Characters with only 2 forms (right-joining) have initial=isolated, medial=final.
 */
export const PRESENTATION_FORMS: Record<number, [number, number, number, number]> = {
  // Hamza
  0x0621: [0xFE80, 0xFE80, 0xFE80, 0xFE80],
  // Alef with Madda
  0x0622: [0xFE81, 0xFE82, 0xFE81, 0xFE82],
  // Alef with Hamza Above
  0x0623: [0xFE83, 0xFE84, 0xFE83, 0xFE84],
  // Waw with Hamza
  0x0624: [0xFE85, 0xFE86, 0xFE85, 0xFE86],
  // Alef with Hamza Below
  0x0625: [0xFE87, 0xFE88, 0xFE87, 0xFE88],
  // Yeh with Hamza
  0x0626: [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C],
  // Alef
  0x0627: [0xFE8D, 0xFE8E, 0xFE8D, 0xFE8E],
  // Beh
  0x0628: [0xFE8F, 0xFE90, 0xFE91, 0xFE92],
  // Teh Marbuta
  0x0629: [0xFE93, 0xFE94, 0xFE93, 0xFE94],
  // Teh
  0x062A: [0xFE95, 0xFE96, 0xFE97, 0xFE98],
  // Theh
  0x062B: [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C],
  // Jeem
  0x062C: [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0],
  // Hah
  0x062D: [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4],
  // Khah
  0x062E: [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8],
  // Dal
  0x062F: [0xFEA9, 0xFEAA, 0xFEA9, 0xFEAA],
  // Thal
  0x0630: [0xFEAB, 0xFEAC, 0xFEAB, 0xFEAC],
  // Reh
  0x0631: [0xFEAD, 0xFEAE, 0xFEAD, 0xFEAE],
  // Zain
  0x0632: [0xFEAF, 0xFEB0, 0xFEAF, 0xFEB0],
  // Seen
  0x0633: [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4],
  // Sheen
  0x0634: [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8],
  // Sad
  0x0635: [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC],
  // Dad
  0x0636: [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0],
  // Tah
  0x0637: [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4],
  // Zah
  0x0638: [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8],
  // Ain
  0x0639: [0xFEC9, 0xFECA, 0xFECB, 0xFECC],
  // Ghain
  0x063A: [0xFECD, 0xFECE, 0xFECF, 0xFED0],
  // Feh
  0x0641: [0xFED1, 0xFED2, 0xFED3, 0xFED4],
  // Qaf
  0x0642: [0xFED5, 0xFED6, 0xFED7, 0xFED8],
  // Kaf
  0x0643: [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC],
  // Lam
  0x0644: [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0],
  // Meem
  0x0645: [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4],
  // Noon
  0x0646: [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8],
  // Heh
  0x0647: [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC],
  // Waw
  0x0648: [0xFEED, 0xFEEE, 0xFEED, 0xFEEE],
  // Alef Maksura
  0x0649: [0xFEEF, 0xFEF0, 0xFBE8, 0xFBE9],
  // Yeh
  0x064A: [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4],
  // Tatweel — passes through as-is (already joining)
  0x0640: [0x0640, 0x0640, 0x0640, 0x0640],
};

/**
 * Lam-Alef ligature mappings.
 * When Lam (U+0644) is followed by an Alef variant, they form a mandatory ligature.
 * Maps the Alef codepoint to [isolated ligature, final ligature].
 */
export const LAM_ALEF_LIGATURES: Record<number, [number, number]> = {
  0x0622: [0xFEF5, 0xFEF6], // Lam + Alef with Madda
  0x0623: [0xFEF7, 0xFEF8], // Lam + Alef with Hamza Above
  0x0625: [0xFEF9, 0xFEFA], // Lam + Alef with Hamza Below
  0x0627: [0xFEFB, 0xFEFC], // Lam + Alef
};

/**
 * Check if a codepoint is an Arabic diacritical mark (tashkeel).
 * These are transparent for joining purposes.
 */
export function isDiacritic(cp: number): boolean {
  return (cp >= 0x064B && cp <= 0x065F) || cp === 0x0670 || (cp >= 0x06D6 && cp <= 0x06DC);
}

/**
 * Check if a codepoint is an Arabic letter (base character).
 */
export function isArabicLetter(cp: number): boolean {
  return cp in JOINING_TYPE;
}

/**
 * Get the joining type of a codepoint.
 */
export function getJoiningType(cp: number): JoiningType {
  if (isDiacritic(cp)) return JoiningType.Transparent;
  return JOINING_TYPE[cp] ?? JoiningType.NonJoining;
}
