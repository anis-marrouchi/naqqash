import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
// @ts-ignore
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import { shapeArabicText } from './src/shape';

/** Draw right-aligned Arabic text */
function drawRTL(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  const shaped = shapeArabicText(text);
  const width = font.widthOfTextAtSize(shaped, size);
  page.drawText(shaped, { x: rightX - width, y, size, font, color });
}

async function demo() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontBytes = fs.readFileSync('./fonts/Amiri-Regular.ttf');
  const amiri = await pdfDoc.embedFont(fontBytes, { subset: false });

  const page = pdfDoc.addPage([600, 700]);
  const blue = rgb(0, 0.44, 0.96);
  const black = rgb(0, 0, 0);
  const red = rgb(0.8, 0.1, 0.1);
  const green = rgb(0, 0.5, 0.15);
  const gray = rgb(0.4, 0.4, 0.4);
  const rightEdge = 550;

  // Title
  page.drawText('Naqqash Demo', {
    x: 50, y: 660, size: 24, font: helveticaBold, color: blue,
  });
  page.drawText('Arabic PDF text shaping in 15KB. No HarfBuzz. No Puppeteer. No WASM.', {
    x: 50, y: 640, size: 10, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });

  // --- WITHOUT naqqash ---
  page.drawText('WITHOUT naqqash (raw Unicode):', {
    x: 50, y: 600, size: 12, font: helveticaBold, color: red,
  });

  const testTexts = [
    'بسم الله الرحمن الرحيم',
    'فاتورة إلكترونية',
    'شركة نقطة للتكنولوجيا',
  ];

  let y = 574;
  for (const text of testTexts) {
    // Right-aligned raw (broken) Arabic
    const w = amiri.widthOfTextAtSize(text, 16);
    page.drawText(text, { x: rightEdge - w, y, size: 16, font: amiri, color: black });
    y -= 28;
  }

  // --- WITH naqqash ---
  y -= 10;
  page.drawText('WITH naqqash (correctly shaped):', {
    x: 50, y, size: 12, font: helveticaBold, color: green,
  });
  y -= 26;

  for (const text of testTexts) {
    drawRTL(page, text, rightEdge, y, 16, amiri);
    y -= 28;
  }

  // === INVOICE ===
  y -= 20;
  const boxX = 50, boxW = 500, boxRight = boxX + boxW;

  // Invoice border
  page.drawRectangle({
    x: boxX, y: y - 180, width: boxW, height: 210,
    borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 1, opacity: 0,
  });

  // Header row
  page.drawRectangle({ x: boxX, y, width: boxW, height: 28, color: rgb(0.15, 0.35, 0.6) });
  drawRTL(page, 'فاتورة ضريبية مبسطة', boxRight - 10, y + 6, 14, amiri, rgb(1, 1, 1));

  // Draw invoice number: numbers separately to avoid RTL reversal
  const invLabel = shapeArabicText('رقم:');
  const invNum = '2026-0042';
  const numW = amiri.widthOfTextAtSize(invNum, 10);
  page.drawText(invNum, { x: boxX + 10, y: y + 8, size: 10, font: amiri, color: rgb(0.8, 0.85, 1) });
  page.drawText(invLabel, { x: boxX + 14 + numW, y: y + 8, size: 10, font: amiri, color: rgb(0.8, 0.85, 1) });

  y -= 30;

  // Column positions (right-to-left layout)
  const cols = {
    desc: boxRight - 15,   // right edge for description
    qty: boxRight - 310,
    price: boxRight - 370,
    total: boxX + 15,       // left-most = total (rightmost in RTL)
  };

  // Column headers
  page.drawRectangle({ x: boxX, y: y - 4, width: boxW, height: 22, color: rgb(0.94, 0.94, 0.94) });
  drawRTL(page, 'الوصف', cols.desc, y, 10, amiri, gray);
  drawRTL(page, 'الكمية', cols.qty, y, 10, amiri, gray);
  drawRTL(page, 'السعر', cols.price, y, 10, amiri, gray);
  drawRTL(page, 'المجموع', cols.total + 60, y, 10, amiri, gray);

  y -= 24;

  // Invoice lines
  const lines = [
    ['خدمات تطوير برمجيات', '10', '45.00', '450.00'],
    ['استشارات تقنية', '5', '45.00', '225.00'],
    ['تدقيق أمني', '3', '45.00', '135.00'],
  ];

  for (const line of lines) {
    drawRTL(page, line[0], cols.desc, y, 11, amiri);
    drawRTL(page, line[1], cols.qty, y, 11, amiri);
    drawRTL(page, line[2], cols.price, y, 11, amiri);
    drawRTL(page, line[3], cols.total + 60, y, 11, amiri);

    // Separator line
    y -= 4;
    page.drawLine({
      start: { x: boxX + 5, y }, end: { x: boxRight - 5, y },
      thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
    });
    y -= 18;
  }

  // Total row
  y -= 4;
  page.drawRectangle({ x: boxX, y: y - 6, width: boxW, height: 26, color: rgb(0.15, 0.35, 0.6) });
  drawRTL(page, 'الإجمالي:', cols.desc, y, 12, amiri, rgb(1, 1, 1));
  // Total: draw number and currency separately to avoid RTL reversal
  const currency = shapeArabicText('د.ت');
  const currW = amiri.widthOfTextAtSize(currency, 12);
  page.drawText(currency, { x: boxX + 15, y, size: 12, font: amiri, color: rgb(1, 1, 1) });
  page.drawText('810.00', { x: boxX + 20 + currW, y, size: 12, font: amiri, color: rgb(1, 1, 1) });

  // Footer
  y -= 40;
  page.drawText('Generated with naqqash — 0 HarfBuzz, 0 Puppeteer, 0 WASM', {
    x: 50, y, size: 9, font: helvetica, color: rgb(0.6, 0.6, 0.6),
  });

  const bytes = await pdfDoc.save();
  fs.writeFileSync('./demo-output.pdf', bytes);
  console.log('✅ Demo PDF saved to demo-output.pdf');
}

demo().catch(console.error);
