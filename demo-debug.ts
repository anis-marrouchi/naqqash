import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// @ts-ignore
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import { shapeArabicText, shapeArabicVisual } from './src/shape';

async function demo() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Use Helvetica for English labels
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load Amiri for Arabic — try WITHOUT subsetting first
  const fontBytes = fs.readFileSync('./fonts/Amiri-Regular.ttf');
  const amiri = await pdfDoc.embedFont(fontBytes, { subset: false });

  const page = pdfDoc.addPage([600, 700]);
  const blue = rgb(0, 0.44, 0.96);
  const black = rgb(0, 0, 0);
  const red = rgb(0.8, 0.1, 0.1);
  const green = rgb(0, 0.5, 0.15);

  // Title (Helvetica for English)
  page.drawText('Naqqash Demo: Arabic PDF Text Shaping', {
    x: 50, y: 660, size: 18, font: helveticaBold, color: blue,
  });
  page.drawText('github.com/anis-marrouchi/naqqash', {
    x: 50, y: 640, size: 10, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });

  // --- Test 1: Raw Arabic (what pdf-lib does by default) ---
  page.drawText('1. WITHOUT naqqash (raw Unicode):', {
    x: 50, y: 600, size: 13, font: helveticaBold, color: red,
  });

  const testTexts = [
    'بسم الله الرحمن الرحيم',
    'فاتورة إلكترونية',
    'شركة نقطة للتكنولوجيا',
  ];

  let y = 570;
  for (const text of testTexts) {
    page.drawText(`"${text}"`, {
      x: 50, y, size: 14, font: amiri, color: black,
    });
    y -= 26;
  }

  // --- Test 2: With naqqash shaping (logical order) ---
  y -= 10;
  page.drawText('2. WITH naqqash shapeArabicText (shaped, logical order):', {
    x: 50, y, size: 13, font: helveticaBold, color: rgb(0.8, 0.5, 0),
  });
  y -= 30;

  for (const text of testTexts) {
    const shaped = shapeArabicText(text);
    page.drawText(shaped, {
      x: 50, y, size: 14, font: amiri, color: black,
    });

    // Show codepoints for debugging
    const cps = Array.from(shaped).slice(0, 6).map(c =>
      'U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')
    ).join(' ');
    page.drawText(cps, {
      x: 50, y: y - 12, size: 7, font: helvetica, color: rgb(0.6, 0.6, 0.6),
    });
    y -= 36;
  }

  // --- Test 3: With naqqash visual order ---
  y -= 10;
  page.drawText('3. WITH naqqash shapeArabicVisual (shaped + RTL reordered):', {
    x: 50, y, size: 13, font: helveticaBold, color: green,
  });
  y -= 30;

  for (const text of testTexts) {
    const shaped = shapeArabicVisual(text);
    const width = amiri.widthOfTextAtSize(shaped, 14);
    page.drawText(shaped, {
      x: 550 - width, y, size: 14, font: amiri, color: black,
    });
    y -= 26;
  }

  // --- Test 4: Individual character test ---
  y -= 20;
  page.drawText('4. Character form test (beh):', {
    x: 50, y, size: 13, font: helveticaBold, color: blue,
  });
  y -= 25;

  // Raw beh
  const rawBeh = '\u0628';
  page.drawText(`Raw beh (U+0628): `, { x: 50, y, size: 11, font: helvetica, color: black });
  page.drawText(rawBeh, { x: 200, y, size: 16, font: amiri, color: black });
  y -= 22;

  // Isolated form
  const isolBeh = '\uFE8F';
  page.drawText(`PFB isolated (U+FE8F): `, { x: 50, y, size: 11, font: helvetica, color: black });
  page.drawText(isolBeh, { x: 200, y, size: 16, font: amiri, color: black });
  y -= 22;

  // Initial form
  const initBeh = '\uFE91';
  page.drawText(`PFB initial (U+FE91): `, { x: 50, y, size: 11, font: helvetica, color: black });
  page.drawText(initBeh, { x: 200, y, size: 16, font: amiri, color: black });
  y -= 22;

  // Medial form
  const medBeh = '\uFE92';
  page.drawText(`PFB medial (U+FE92): `, { x: 50, y, size: 11, font: helvetica, color: black });
  page.drawText(medBeh, { x: 200, y, size: 16, font: amiri, color: black });
  y -= 22;

  // Final form
  const finBeh = '\uFE90';
  page.drawText(`PFB final (U+FE90): `, { x: 50, y, size: 11, font: helvetica, color: black });
  page.drawText(finBeh, { x: 200, y, size: 16, font: amiri, color: black });

  // Save
  const bytes = await pdfDoc.save();
  fs.writeFileSync('./demo-output.pdf', bytes);
  console.log('✅ Demo PDF saved to demo-output.pdf');
}

demo().catch(console.error);
