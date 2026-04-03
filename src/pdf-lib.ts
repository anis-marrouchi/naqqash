/**
 * Naqqash pdf-lib adapter.
 *
 * Provides drawArabicText() — a drop-in helper that shapes Arabic text
 * and draws it on a pdf-lib page with correct RTL rendering.
 */

import type { PDFPage, PDFFont, Color } from 'pdf-lib';
import { shapeArabicText } from './shape';

export interface DrawArabicTextOptions {
  /** The pdf-lib font (must support Arabic glyphs, e.g. embedded Amiri) */
  font: PDFFont;
  /** Font size in points */
  size?: number;
  /** Text color */
  color?: Color;
  /** Maximum line width. If set, text wraps at this width. */
  maxWidth?: number;
  /** Line height multiplier (default: 1.4) */
  lineHeight?: number;
  /** Text alignment: 'right' (default for Arabic), 'left', 'center' */
  align?: 'right' | 'left' | 'center';
}

/**
 * Draw Arabic text on a pdf-lib page.
 *
 * Shapes the text using Naqqash (contextual joining + lam-alef ligatures),
 * converts to visual order, and draws it using the provided font.
 *
 * @param page - The pdf-lib PDFPage to draw on
 * @param text - Arabic text (Unicode, logical order)
 * @param x - X position (right edge if align='right', left edge if align='left')
 * @param y - Y position (baseline)
 * @param options - Font, size, color, alignment options
 */
export function drawArabicText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: DrawArabicTextOptions,
): void {
  const {
    font,
    size = 12,
    color,
    maxWidth,
    lineHeight = 1.4,
    align = 'right',
  } = options;

  const lines = maxWidth ? wrapText(text, font, size, maxWidth) : [text];
  const lineSpacing = size * lineHeight;

  for (let i = 0; i < lines.length; i++) {
    const shaped = shapeArabicText(lines[i]);
    const textWidth = font.widthOfTextAtSize(shaped, size);

    let drawX: number;
    if (align === 'right') {
      drawX = x - textWidth;
    } else if (align === 'center') {
      drawX = x - textWidth / 2;
    } else {
      drawX = x;
    }

    page.drawText(shaped, {
      x: drawX,
      y: y - i * lineSpacing,
      size,
      font,
      color,
    });
  }
}

/**
 * Simple word-wrap for Arabic text.
 */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const shaped = shapeArabicText(testLine);
    const width = font.widthOfTextAtSize(shaped, size);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

export { shapeArabic, shapeArabicText, shapeArabicVisual } from './shape';
