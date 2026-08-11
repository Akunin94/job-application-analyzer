// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
// eslint-disable-next-line import/extensions -- pdf.js only ships the Node build under this exact path
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ResumePdf } from '../ResumePdf';
import { FULL_RESUME } from './resume.fixture';

interface Row {
  y: number;
  size: number;
  text: string;
}

async function renderRows(): Promise<{ pageCount: number; rows: Row[][] }> {
  const buffer = await renderToBuffer(createElement(ResumePdf, { resume: FULL_RESUME }));
  // Only glyph positions matter here, so skip font loading — it is slow and
  // makes pdf.js fetch font data the test environment has no business serving.
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    disableFontFace: true,
  }).promise;

  const rows: Row[][] = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const content = await (await doc.getPage(p)).getTextContent();
    const items = (content.items as Array<{ transform: number[]; str: string }>)
      .filter(i => i.str.trim())
      .map(i => ({ y: i.transform[5], size: i.transform[0], text: i.str }))
      .sort((a, b) => b.y - a.y);
    rows.push(items);
  }

  return { pageCount: doc.numPages, rows };
}

describe('ResumePdf', () => {
  it('fits a full senior CV on two pages', async () => {
    const { pageCount } = await renderRows();
    expect(pageCount).toBeLessThanOrEqual(2);
  }, 30_000);

  it('never lets two lines of text overlap vertically', async () => {
    const { rows } = await renderRows();

    // Two baselines closer together than the lower line's own font size means
    // the glyphs collide — the exact failure that shipped a broken resume once.
    const collisions = rows.flatMap((page, pageIndex) =>
      page
        .map((row, i) => ({ row, prev: page[i - 1] }))
        .filter(({ row, prev }) => prev && prev.y !== row.y && prev.y - row.y < row.size * 0.9)
        .map(({ row, prev }) => `p${pageIndex + 1}: "${prev.text}" / "${row.text}"`),
    );

    expect(collisions).toEqual([]);
  }, 30_000);
});
