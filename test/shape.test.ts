import { describe, it, expect } from 'vitest';
import { shapeArabic, shapeArabicText, shapeArabicVisual } from '../src/shape';

describe('shapeArabic', () => {
  it('shapes isolated characters', () => {
    // Single Beh should be isolated form
    const result = shapeArabic('ب');
    expect(result).toHaveLength(1);
    expect(result[0].shaped).toBe(0xFE8F); // Beh isolated
  });

  it('shapes two dual-joining characters', () => {
    // Beh + Beh = initial + final
    const result = shapeArabic('بب');
    expect(result).toHaveLength(2);
    expect(result[0].shaped).toBe(0xFE91); // Beh initial
    expect(result[1].shaped).toBe(0xFE90); // Beh final
  });

  it('shapes three dual-joining characters', () => {
    // Beh + Beh + Beh = initial + medial + final
    const result = shapeArabic('ببب');
    expect(result).toHaveLength(3);
    expect(result[0].shaped).toBe(0xFE91); // Beh initial
    expect(result[1].shaped).toBe(0xFE92); // Beh medial
    expect(result[2].shaped).toBe(0xFE90); // Beh final
  });

  it('handles right-joining characters correctly', () => {
    // Beh + Alef = initial Beh + final Alef
    const result = shapeArabic('با');
    expect(result).toHaveLength(2);
    expect(result[0].shaped).toBe(0xFE91); // Beh initial
    expect(result[1].shaped).toBe(0xFE8E); // Alef final
  });

  it('breaks joining after right-joining character', () => {
    // Alef + Beh = isolated Alef + isolated Beh (Alef doesn't join left)
    const result = shapeArabic('اب');
    expect(result).toHaveLength(2);
    expect(result[0].shaped).toBe(0xFE8D); // Alef isolated
    expect(result[1].shaped).toBe(0xFE8F); // Beh isolated
  });

  it('handles lam-alef ligature', () => {
    const result = shapeArabic('لا');
    expect(result).toHaveLength(1);
    expect(result[0].shaped).toBe(0xFEFB); // Lam-Alef isolated
    expect(result[0].isLigature).toBe(true);
  });

  it('handles lam-alef ligature in final position', () => {
    // Beh + Lam-Alef = initial Beh + final Lam-Alef
    const result = shapeArabic('بلا');
    expect(result).toHaveLength(2);
    expect(result[0].shaped).toBe(0xFE91); // Beh initial
    expect(result[1].shaped).toBe(0xFEFC); // Lam-Alef final
    expect(result[1].isLigature).toBe(true);
  });

  it('passes through non-Arabic characters unchanged', () => {
    const result = shapeArabic('Hello');
    expect(result).toHaveLength(5);
    result.forEach((r, i) => {
      expect(r.shaped).toBe('Hello'.codePointAt(i));
    });
  });

  it('preserves diacritics', () => {
    // Beh with fatha + Beh = initial Beh + fatha + final Beh
    const result = shapeArabic('بَب');
    expect(result).toHaveLength(3);
    expect(result[0].shaped).toBe(0xFE91); // Beh initial
    expect(result[1].shaped).toBe(0x064E); // Fatha (unchanged)
    expect(result[2].shaped).toBe(0xFE90); // Beh final
  });

  it('starts new joining group after lam-alef ligature', () => {
    // الإجمالي — after لإ ligature, jeem should be INITIAL (not medial)
    // because the ligature ends with alef which cannot join left
    const result = shapeArabic('الإجم');
    // ا isolated, لإ ligature, ج initial, م final
    expect(result).toHaveLength(4); // alef + ligature + jeem + meem
    expect(result[2].shaped).toBe(0xFE9F); // Jeem INITIAL, not medial (0xFEA0)
  });

  it('handles the word "بسم" correctly', () => {
    // Beh + Seen + Meem
    const result = shapeArabic('بسم');
    expect(result).toHaveLength(3);
    expect(result[0].shaped).toBe(0xFE91); // Beh initial
    expect(result[1].shaped).toBe(0xFEB4); // Seen medial
    expect(result[2].shaped).toBe(0xFEE2); // Meem final
  });
});

describe('shapeArabicText', () => {
  it('returns a string with presentation forms', () => {
    const result = shapeArabicText('بسم');
    expect(typeof result).toBe('string');
    expect(result.length).toBe(3);
  });
});

describe('shapeArabicVisual', () => {
  it('reverses Arabic text for visual rendering', () => {
    const result = shapeArabicVisual('اب');
    // Visual order: Beh then Alef (reversed from logical)
    const codepoints = Array.from(result).map((c) => c.codePointAt(0));
    expect(codepoints[0]).toBe(0xFE8F); // Beh isolated (was second in logical)
    expect(codepoints[1]).toBe(0xFE8D); // Alef isolated (was first in logical)
  });

  it('handles mixed Arabic and Latin text', () => {
    const result = shapeArabicVisual('بب hello');
    expect(result).toContain('hello');
  });
});
