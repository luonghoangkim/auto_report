/**
 * docx.ts
 * Generates professional DOCX files from report text content.
 * Uses the `docx` npm package (pure JS, no external tools needed).
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

export interface DocxSection {
  heading?: string;
  level?: 1 | 2 | 3;
  body?: string;         // pre-formatted text (split by \n)
  table?: { headers: string[]; rows: string[][] };
}

/** Build a DOCX Buffer from report title + sections */
export async function buildDocx(
  title: string,
  subtitle: string,
  sections: DocxSection[]
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // ── Title ──────────────────────────────────────────────────
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })
  );

  if (subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: subtitle, color: "888888", size: 22 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // ── Sections ───────────────────────────────────────────────
  for (const section of sections) {
    if (section.heading) {
      const headingLevel =
        section.level === 1 ? HeadingLevel.HEADING_1 :
        section.level === 2 ? HeadingLevel.HEADING_2 :
                              HeadingLevel.HEADING_3;
      children.push(
        new Paragraph({
          text: section.heading,
          heading: headingLevel,
          spacing: { before: 280, after: 120 },
        })
      );
    }

    if (section.body) {
      const lines = section.body.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(new Paragraph({ text: "" }));
          continue;
        }
        // Bullet lines
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed.replace(/^[-•]\s*/, "") })],
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed })],
              spacing: { after: 80 },
            })
          );
        }
      }
      // Spacer after body
      children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
    }

    if (section.table) {
      const { headers, rows } = section.table;
      const tableRows: TableRow[] = [];

      // Header row
      tableRows.push(
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
                  }),
                ],
                shading: { type: ShadingType.SOLID, color: "2563EB" },
                width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
              })
          ),
        })
      );

      // Data rows
      rows.forEach((row, rIdx) =>
        tableRows.push(
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ text: cell })],
                  shading:
                    rIdx % 2 === 0
                      ? { type: ShadingType.SOLID, color: "F1F5F9" }
                      : undefined,
                  width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
                })
            ),
          })
        )
      );

      children.push(
        ...(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }) as unknown as Paragraph[])   // cast – docx types accept Block[]
      );
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 24 },
        },
      },
    },
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

/** Convert a plain-text report (from our generators) into DOCX sections */
export function reportTextToSections(reportText: string): DocxSection[] {
  const lines = reportText.split("\n");
  const sections: DocxSection[] = [];
  let currentSection: DocxSection | null = null;
  let bodyLines: string[] = [];

  const flush = () => {
    if (currentSection) {
      currentSection.body = bodyLines.join("\n").trim();
      sections.push(currentSection);
      currentSection = null;
      bodyLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { bodyLines.push(""); continue; }

    // Numbered heading: "1. XYZ", "1/ XYZ"
    const numHeadingMatch = trimmed.match(/^(\d+)[./]\s+(.+)/);
    if (numHeadingMatch) {
      flush();
      currentSection = { heading: numHeadingMatch[2], level: 2 };
      continue;
    }

    // All-caps heading (short line)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 80 && !trimmed.startsWith("-")) {
      flush();
      currentSection = { heading: trimmed, level: 1 };
      continue;
    }

    bodyLines.push(line);
  }
  flush();

  // If nothing was sectioned, return as one body
  if (sections.length === 0) {
    return [{ body: reportText }];
  }

  return sections;
}
