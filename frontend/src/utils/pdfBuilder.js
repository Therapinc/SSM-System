/**
 * pdfBuilder.js
 * Shared PDF helper utilities for consistent, page-break-aware PDF generation.
 *
 * Usage:
 *   import { sanitizeText, PdfBuilder } from "../utils/pdfBuilder";
 *   const pb = new PdfBuilder(doc, { margins: { top: 20, bottom: 20, left: 15, right: 15 } });
 *   pb.addHeading("Section Title");
 *   pb.addText("Some body text that may be very long...");
 *   pb.addField("Label", value);
 */

// ─── Text Sanitization ──────────────────────────────────────────────────
/**
 * Sanitize user-entered or copy-pasted text before rendering in jsPDF.
 * Handles: \r\n → \n, tabs → spaces, control chars, collapsed whitespace lines.
 */
// eslint-disable-next-line no-control-regex
export const sanitizeText = (text) => {
  if (text === null || text === undefined) return "";
  
  return String(text)
    // 1. Line endings & tabs
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "    ")
    
    // 2. Zero-width and invisible formatting characters
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    
    // 3. Smart quotes & apostrophes (Word, Google Docs, iOS, Mac)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2039\u203A]/g, "'")
    .replace(/[\u00AB\u00BB]/g, '"')
    .replace(/`/g, "'")
    
    // 4. Dashes, hyphens & minus signs
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    
    // 5. Bullets, list markers & corrupted bullet sequences (e.g. Word mojibake %ªþ or â€¢)
    .replace(/(?:%ªþ|â€¢|Â·)/g, "* ")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB]/g, "* ")
    .replace(/[\u2026]/g, "...")
    
    // 6. Common mathematical & currency symbols
    .replace(/[\u00D7]/g, "x")
    .replace(/[\u00F7]/g, "/")
    .replace(/[\u2260]/g, "!=")
    .replace(/[\u2264]/g, "<=")
    .replace(/[\u2265]/g, ">=")
    .replace(/[\u2248]/g, "~")
    .replace(/[\u00B1]/g, "+/-")
    .replace(/[\u20AC]/g, "EUR ")
    .replace(/[\u00A3]/g, "GBP ")
    .replace(/[\u20B9]/g, "Rs. ")
    .replace(/[\u00A5]/g, "Yen ")
    
    // 7. Checkmarks, arrows & symbols
    .replace(/[\u2713\u2714\u2611]/g, "[x]")
    .replace(/[\u2717\u2718\u2612]/g, "[ ]")
    .replace(/[\u2192\u2794\u27A1]/g, "->")
    .replace(/[\u2190]/g, "<-")
    .replace(/[\u2194]/g, "<->")
    
    // 8. Emojis and surrogate pairs (convert or strip so jsPDF doesn't render garbage/crash)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    
    // 9. Non-printable control characters (except newline \n)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    
    // 10. Collapse excessive blank lines
    .replace(/\n{4,}/g, "\n\n\n");
};


// ─── PdfBuilder Class ────────────────────────────────────────────────────
export class PdfBuilder {
  /**
   * @param {jsPDF} doc - An already-constructed jsPDF instance.
   * @param {object} opts
   * @param {object} opts.margins - { top, bottom, left, right } in the doc's unit.
   * @param {number} opts.lineHeight - Default line height (default 6 for mm, 14 for pt).
   * @param {number} opts.fontSize - Default body font size.
   * @param {string} opts.fontFamily - Default font family.
   */
  constructor(doc, opts = {}) {
    this.doc = doc;
    const unit = doc.internal.scaleFactor === 1 ? "mm" : "pt";
    const defaultMargin = unit === "pt" ? 32 : 15;

    this.margins = {
      top: opts.margins?.top ?? defaultMargin,
      bottom: opts.margins?.bottom ?? defaultMargin,
      left: opts.margins?.left ?? defaultMargin,
      right: opts.margins?.right ?? defaultMargin,
    };

    this.pageW = doc.internal.pageSize.getWidth();
    this.pageH = doc.internal.pageSize.getHeight();
    this.contentW = this.pageW - this.margins.left - this.margins.right;

    // Defaults tuned for the doc's unit
    this.lineHeight = opts.lineHeight ?? (unit === "pt" ? 14 : 6);
    this.fontSize = opts.fontSize ?? (unit === "pt" ? 11 : 10);
    this.fontFamily = opts.fontFamily ?? "times";

    this.y = this.margins.top;
  }

  /** Usable Y at the bottom of the page. */
  get maxY() {
    return this.pageH - this.margins.bottom;
  }

  // ── Page Break ──────────────────────────────────────────────────────
  /**
   * If `neededHeight` won't fit below the current Y, add a new page.
   * Returns true if a new page was added.
   */
  ensureSpace(neededHeight) {
    if (this.y + neededHeight > this.maxY) {
      this.doc.addPage();
      this.y = this.margins.top;
      return true;
    }
    return false;
  }

  // ── Text Rendering (page-break aware) ──────────────────────────────
  /**
   * Write wrapped text, checking page breaks PER LINE.
   * @param {string} rawText
   * @param {object} opts - { fontSize, bold, indent, color, maxWidth }
   * @returns {number} - The new Y position after writing.
   */
  addText(rawText, opts = {}) {
    const text = sanitizeText(rawText);
    const fontSize = opts.fontSize ?? this.fontSize;
    const bold = opts.bold ?? false;
    const indent = opts.indent ?? 0;
    const maxWidth = opts.maxWidth ?? this.contentW - indent;
    const lh = opts.lineHeight ?? this.lineHeight;
    const x = this.margins.left + indent;

    this.doc.setFontSize(fontSize);
    this.doc.setFont(this.fontFamily, bold ? "bold" : "normal");
    if (opts.color) {
      this.doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }

    const lines = this.doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      this.ensureSpace(lh);
      this.doc.text(line, x, this.y);
      this.y += lh;
    });

    // Reset text color
    this.doc.setTextColor(0, 0, 0);

    return this.y;
  }

  /**
   * Add a heading with spacing.
   */
  addHeading(title, opts = {}) {
    const fontSize = opts.fontSize ?? this.fontSize + 3;
    const gapBefore = opts.gapBefore ?? this.lineHeight;
    const gapAfter = opts.gapAfter ?? this.lineHeight * 0.8;

    this.ensureSpace(gapBefore + fontSize * 0.5 + gapAfter);
    this.y += gapBefore;

    this.doc.setFontSize(fontSize);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text(sanitizeText(title), this.margins.left, this.y);
    this.y += gapAfter;
  }

  /**
   * Add a sub-heading.
   */
  addSubHeading(title, opts = {}) {
    const fontSize = opts.fontSize ?? this.fontSize + 1;
    this.ensureSpace(this.lineHeight * 2);
    this.y += 4;
    this.doc.setFontSize(fontSize);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text(sanitizeText(title), this.margins.left, this.y);
    this.y += this.lineHeight + 1;
    this.doc.setFont(this.fontFamily, "normal");
  }

  // ── Field Rendering (label + value box) ────────────────────────────
  /**
   * Draw a labeled field with a bordered value box that auto-sizes.
   * @param {string} label
   * @param {*} value
   * @param {object} opts - { labelWidth, boxGap, boxPadding }
   */
  addField(label, value, opts = {}) {
    const labelWidth = opts.labelWidth ?? this.contentW * 0.35;
    const boxGap = opts.boxGap ?? 5;
    const boxPadding = opts.boxPadding ?? 2;
    const boxX = this.margins.left + labelWidth + boxGap;
    const boxWidth = this.contentW - labelWidth - boxGap;
    const defaultBoxH = opts.minBoxHeight ?? 8;
    const lh = this.lineHeight;
    const fieldGap = opts.fieldGap ?? 5;

    const text = sanitizeText(String(value ?? "N/A"));
    const maxTextWidth = boxWidth - boxPadding * 2;

    this.doc.setFontSize(this.fontSize);
    this.doc.setFont(this.fontFamily, "normal");
    const lines = text ? this.doc.splitTextToSize(text, maxTextWidth) : [""];
    const neededHeight = Math.max(defaultBoxH, lines.length * lh + boxPadding * 2);

    // Page break if needed
    this.ensureSpace(neededHeight + fieldGap);

    // Draw label
    this.doc.setFontSize(opts.labelFontSize ?? this.fontSize);
    this.doc.text(sanitizeText(String(label || "")), this.margins.left, this.y + lh);

    // Draw value box
    this.doc.rect(boxX, this.y, boxWidth, neededHeight);

    // Draw value text inside box
    this.doc.setFontSize(this.fontSize);
    let textY = this.y + lh;
    lines.forEach((ln) => {
      this.doc.text(ln, boxX + boxPadding, textY);
      textY += lh;
    });

    this.y += neededHeight + fieldGap;
  }

  // ── Table Rendering (page-break aware, row-by-row) ─────────────────
  /**
   * Draw a table that automatically breaks across pages.
   * Re-draws the header row at the top of each new page.
   *
   * @param {string[]} headers - Column header labels.
   * @param {string[][]} rows - Array of rows, each row is an array of cell strings.
   * @param {object} opts - { colWidths, headerBg, cellPadding, fontSize, headerFontSize }
   */
  addTable(headers, rows, opts = {}) {
    const cellPad = opts.cellPadding ?? 4;
    const fontSize = opts.fontSize ?? this.fontSize - 1;
    const headerFontSize = opts.headerFontSize ?? fontSize;
    const lh = opts.lineHeight ?? this.lineHeight;
    const minRowH = opts.minRowHeight ?? lh + cellPad * 2;

    // Compute column widths
    const colWidths = opts.colWidths ?? headers.map(() => this.contentW / headers.length);
    const tableX = this.margins.left;

    // Pre-compute usable text widths per column
    const usableWidths = colWidths.map((w) => w - cellPad * 2);

    const drawHeaderRow = () => {
      this.doc.setFontSize(headerFontSize);
      this.doc.setFont(this.fontFamily, "bold");

      const wrappedHeaders = headers.map((h, i) =>
        this.doc.splitTextToSize(sanitizeText(h), usableWidths[i])
      );
      const maxLines = Math.max(1, ...wrappedHeaders.map((l) => l.length));
      const headerH = Math.max(minRowH, maxLines * lh + cellPad * 2);

      // Draw header cells
      let x = tableX;
      wrappedHeaders.forEach((lines, i) => {
        this.doc.setLineWidth(0.5);
        this.doc.rect(x, this.y, colWidths[i], headerH, "S");
        this.doc.text(lines, x + cellPad, this.y + cellPad + lh * 0.6);
        x += colWidths[i];
      });
      this.y += headerH;
    };

    const drawDataRow = (rowCells) => {
      this.doc.setFontSize(fontSize);
      this.doc.setFont(this.fontFamily, "normal");

      const wrappedCells = rowCells.map((cell, i) =>
        this.doc.splitTextToSize(sanitizeText(cell), usableWidths[i])
      );
      const maxLines = Math.max(1, ...wrappedCells.map((l) => l.length));
      const rowH = Math.max(minRowH, maxLines * lh + cellPad * 2);

      // Page break check — if row won't fit, start new page with header
      if (this.y + rowH > this.maxY) {
        this.doc.addPage();
        this.y = this.margins.top;
        drawHeaderRow(); // re-draw header on new page
      }

      // Draw row cells
      let x = tableX;
      wrappedCells.forEach((lines, i) => {
        this.doc.setLineWidth(0.5);
        this.doc.rect(x, this.y, colWidths[i], rowH, "S");
        this.doc.text(lines, x + cellPad, this.y + cellPad + lh * 0.6);
        x += colWidths[i];
      });
      this.y += rowH;
    };

    // Draw initial header
    this.ensureSpace(minRowH * 2); // at least header + one row
    drawHeaderRow();

    // Draw data rows
    rows.forEach((row) => drawDataRow(row));
  }

  // ── Convenience ────────────────────────────────────────────────────
  /** Add vertical gap. */
  addGap(height) {
    this.y += height ?? this.lineHeight;
  }

  /** Draw a horizontal separator line. */
  addSeparator() {
    this.ensureSpace(this.lineHeight);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margins.left, this.y, this.margins.left + this.contentW, this.y);
    this.y += this.lineHeight;
  }

  /** Get wrapping lines for a text at a given width. */
  wrapText(text, maxWidth) {
    return this.doc.splitTextToSize(sanitizeText(text), maxWidth ?? this.contentW);
  }

  /** Add page footer (call after all content is done). */
  addFooters(leftText, rightText) {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont(this.fontFamily, "normal");
      this.doc.setTextColor(120, 120, 120);
      const footerY = this.pageH - this.margins.bottom * 0.5;
      if (leftText) {
        this.doc.text(leftText, this.margins.left, footerY);
      }
      if (rightText !== false) {
        this.doc.text(
          rightText ?? `Page ${i} of ${totalPages}`,
          this.pageW - this.margins.right,
          footerY,
          { align: "right" }
        );
      }
      this.doc.setTextColor(0, 0, 0);
    }
  }
}

export default PdfBuilder;
