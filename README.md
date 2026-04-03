# naqqash

Arabic text shaping for PDF generation in JavaScript. MIT licensed, zero dependencies, ~9KB.

Converts raw Arabic Unicode into correctly joined presentation forms so libraries like pdf-lib and jsPDF render connected Arabic text instead of broken isolated letters.

## The problem

PDF libraries in JavaScript (pdf-lib, jsPDF, PDFKit) don't shape Arabic text. When you call `page.drawText('بسم الله')`, each letter renders in its isolated form — disconnected and unreadable.

The standard fix is Puppeteer (300MB headless browser) or HarfBuzz compiled to WASM (3.3MB). Naqqash does it in ~9KB by using Unicode Presentation Forms-B — a lookup table of pre-shaped Arabic letter forms that already exist in most Arabic fonts.

## What it does

- **Contextual joining** — maps each Arabic letter to its correct form (isolated, initial, medial, final) based on neighbors
- **Lam-alef ligatures** — mandatory Arabic ligatures (لا، لأ، لإ، لآ)
- **Diacritics** — preserves tashkeel marks without breaking joins
- **Farsi/Persian** — supports additional characters (پ، چ، ژ، ک، گ)
- **pdf-lib adapter** — `drawArabicText()` with RTL alignment and word wrap

## What it does NOT do

- Full OpenType shaping — for that, use [harfbuzzjs](https://www.npmjs.com/package/harfbuzzjs) (3.3MB WASM, complete correctness)
- Unicode Bidi Algorithm — for mixed RTL/LTR text ordering, use [bidi-js](https://www.npmjs.com/package/bidi-js)
- Complex ligatures beyond lam-alef
- Urdu/Pashto extended characters (only standard Arabic + Farsi)

This is the same approach used by [arabic-reshaper](https://www.npmjs.com/package/arabic-reshaper) (2017, GPL, unmaintained) and jsPDF's internal Arabic module. Naqqash is a modern TypeScript rewrite with MIT license and a pdf-lib adapter.

## Install

```bash
npm install naqqash
```

## Usage

### Basic shaping

```typescript
import { shapeArabicText } from 'naqqash';

const shaped = shapeArabicText('بسم الله الرحمن الرحيم');
// Pass to any drawText() — letters will be connected
```

### With pdf-lib

```typescript
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { drawArabicText } from 'naqqash/pdf-lib';
import fs from 'fs';

const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);

const fontBytes = fs.readFileSync('./Amiri-Regular.ttf');
const font = await pdfDoc.embedFont(fontBytes, { subset: false });
const page = pdfDoc.addPage();

drawArabicText(page, 'فاتورة ضريبية مبسطة', 550, 700, {
  font,
  size: 18,
  align: 'right',
});

drawArabicText(page, 'شركة نقطة للتكنولوجيا', 550, 670, {
  font,
  size: 14,
  maxWidth: 400,
});

const bytes = await pdfDoc.save();
fs.writeFileSync('invoice.pdf', bytes);
```

### Low-level API

```typescript
import { shapeArabic } from 'naqqash';

const result = shapeArabic('بسم');
// [
//   { original: 0x0628, shaped: 0xFE91, isLigature: false }, // beh initial
//   { original: 0x0633, shaped: 0xFEB4, isLigature: false }, // seen medial
//   { original: 0x0645, shaped: 0xFEE2, isLigature: false }, // meem final
// ]
```

### Visual order (for Canvas/WebGL)

```typescript
import { shapeArabicVisual } from 'naqqash';

// For renderers with zero bidi support (raw Canvas fillText, WebGL)
const visual = shapeArabicVisual('مرحبا');
ctx.fillText(visual, x, y);
```

## API

| Function | Use case |
|----------|----------|
| `shapeArabicText(text)` | Returns shaped string. Use for PDF — viewers handle RTL natively |
| `shapeArabic(text)` | Returns `ShapedChar[]` with original/shaped codepoints and ligature info |
| `shapeArabicVisual(text)` | Shaped + reversed for LTR renderers (Canvas, WebGL). Do NOT use for PDF |
| `drawArabicText(page, text, x, y, opts)` | pdf-lib adapter (import from `naqqash/pdf-lib`) |

### `drawArabicText` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `font` | PDFFont | required | Font with Arabic glyphs |
| `size` | number | 12 | Font size in points |
| `color` | Color | — | pdf-lib Color |
| `align` | string | `'right'` | `'right'`, `'left'`, or `'center'` |
| `maxWidth` | number | — | Max line width for word wrap |
| `lineHeight` | number | 1.4 | Line height multiplier |

### Utilities

```typescript
import { isArabicLetter, isDiacritic, getJoiningType } from 'naqqash';
```

## How it works

Arabic letters have 4 contextual forms depending on their position in a word:

| Position | Example (beh) | Unicode |
|----------|--------------|---------|
| Isolated | ب | U+FE8F |
| Initial | بـ | U+FE91 |
| Medial | ـبـ | U+FE92 |
| Final | ـب | U+FE90 |

These forms exist in Unicode's [Presentation Forms-B](https://en.wikipedia.org/wiki/Arabic_Presentation_Forms-B) block (U+FE70-U+FEFF). Most Arabic fonts include glyphs for them.

Naqqash determines each letter's form by checking its neighbors' joining types (right-joining, dual-joining, non-joining), then substitutes the correct codepoint. It also merges lam + alef into mandatory ligature glyphs, and correctly breaks joining after ligatures since the alef end cannot connect forward.

~545 lines of TypeScript. ~160-entry lookup table.

## Fonts

You need an Arabic font with Presentation Forms-B glyphs. Most qualify:

- [Amiri](https://github.com/aliftype/amiri) — traditional Naskh
- [Noto Kufi Arabic](https://fonts.google.com/noto/specimen/Noto+Kufi+Arabic) — modern Kufi
- [Cairo](https://fonts.google.com/specimen/Cairo) — clean modern
- [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic)

When using pdf-lib, embed with `subset: false` to ensure all glyph forms are included.

## Limitations

- Not a replacement for HarfBuzz — it's a lookup table, not a shaping engine
- Complex ligatures beyond lam-alef are not handled
- Mixed Arabic + numbers in the same `drawText` call may have bidi ordering issues — draw numbers separately if needed
- Some fonts may not visually connect Presentation Forms-B glyphs

## Prior art

| Library | License | Status | Approach |
|---------|---------|--------|----------|
| [arabic-reshaper](https://www.npmjs.com/package/arabic-reshaper) | GPL-3.0 | Unmaintained (2017) | Same PFB substitution |
| [arabic-persian-reshaper](https://www.npmjs.com/package/arabic-persian-reshaper) | MIT | Unmaintained (2020) | Same PFB substitution |
| jsPDF arabic module | MIT | Built-in | Same PFB substitution |
| [harfbuzzjs](https://www.npmjs.com/package/harfbuzzjs) | MIT | Active | Full OpenType WASM (3.3MB) |

## License

MIT
