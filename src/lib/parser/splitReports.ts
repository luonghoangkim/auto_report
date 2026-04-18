/**
 * splitReports.ts
 *
 * Detects report boundaries in a raw text batch that contains reports
 * from multiple team members pasted together.
 *
 * Strategy (in order of confidence):
 * 1. Separator lines: "===", "---", "***", "___" (3+ chars)
 * 2. Numbered sections: "1.", "2." at start of line followed by a name-like word
 * 3. Name headers: "Tên:", "Name:", "Báo cáo của:" / "**Name**:"
 * 4. Bold name pattern: "**Nguyễn Văn A**"
 * 5. ALL-CAPS lines that look like a name
 * 6. Two+ consecutive blank lines
 *
 * Returns an array of raw text blocks, one per member.
 */

const SEPARATOR_PATTERN = /^[-=*_]{3,}\s*$/;
const NAME_HEADER_PATTERN = /^[\*_]*\s*(Tên|Name|Họ tên|Ho ten|Báo cáo|Bao cao|Reporter|Member)\s*[\*_]*\s*[:\-–]/i;
const NUMBERED_SECTION = /^\s*(\d+)[.)]\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ ]+$/;

function normalizeRawBatch(rawText: string): string {
  // Handle pasted blocks where the next member starts right after a URL:
  // ".../5724Name: Lê ..."
  return rawText.replace(
    /(https?:\/\/[^\s]+)(?=\s*(?:Name|Tên|Họ tên|Ho ten)\s*:)/gi,
    "$1\n"
  );
}

/** Try to split at separator lines */
function splitBySeparator(text: string): string[] | null {
  const lines = text.split("\n");
  let hasSep = lines.some((l) => SEPARATOR_PATTERN.test(l));
  if (!hasSep) return null;
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (SEPARATOR_PATTERN.test(line)) {
      if (current.join("").trim()) blocks.push(current.join("\n").trim());
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.join("").trim()) blocks.push(current.join("\n").trim());
  return blocks.filter((b) => b.length > 20);
}

/** Try to split at name-header lines */
function splitByNameHeader(text: string): string[] | null {
  const lines = text.split("\n");
  const splitIndices: number[] = [];
  lines.forEach((line, i) => {
    if (NAME_HEADER_PATTERN.test(line.trim())) splitIndices.push(i);
  });
  if (splitIndices.length < 2) return null;
  const blocks: string[] = [];
  for (let k = 0; k < splitIndices.length; k++) {
    const start = splitIndices[k];
    const end   = splitIndices[k + 1] ?? lines.length;
    const block = lines.slice(start, end).join("\n").trim();
    if (block.length > 20) blocks.push(block);
  }
  return blocks;
}

/** Try to split at numbered header sections */
function splitByNumberedSection(text: string): string[] | null {
  const lines = text.split("\n");
  const splitIndices: number[] = [];
  lines.forEach((line, i) => {
    if (NUMBERED_SECTION.test(line)) splitIndices.push(i);
  });
  if (splitIndices.length < 2) return null;
  const blocks: string[] = [];
  for (let k = 0; k < splitIndices.length; k++) {
    const start = splitIndices[k];
    const end   = splitIndices[k + 1] ?? lines.length;
    const block = lines.slice(start, end).join("\n").trim();
    if (block.length > 20) blocks.push(block);
  }
  return blocks;
}

/** Fallback: split at double blank lines */
function splitByBlankLines(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 20);
}

/**
 * Main entry point.
 * Returns an array of raw text blocks, one per detected member report.
 * Never throws — returns the whole text as a single block on failure.
 */
export function splitIntoMemberBlocks(rawText: string): string[] {
  if (!rawText || rawText.trim().length === 0) return [];
  const normalizedText = normalizeRawBatch(rawText);

  try {
    const bySep = splitBySeparator(normalizedText);
    if (bySep && bySep.length >= 2) return bySep;

    const byHeader = splitByNameHeader(normalizedText);
    if (byHeader && byHeader.length >= 2) return byHeader;

    const byNum = splitByNumberedSection(normalizedText);
    if (byNum && byNum.length >= 2) return byNum;

    const byBlank = splitByBlankLines(normalizedText);
    if (byBlank.length >= 2) return byBlank;

    // Last resort: treat entire text as one report
    return [normalizedText.trim()];
  } catch {
    return [normalizedText.trim()];
  }
}
