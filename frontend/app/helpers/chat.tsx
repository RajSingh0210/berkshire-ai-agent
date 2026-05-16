import { ReactNode } from "react";
import { Citation } from "../../types/chat";

const CITATION_MARKER_PATTERN = /\[(\d+)\]/g;
const NUMBERED_LINE_PATTERN = /^\d+\.\s/;
const BULLET_LINE_PATTERN = /^[•\-*]\s+/;
const SOURCES_SECTION_PATTERN = /^(#{1,3}\s*)?(sources|references|letter excerpts used)\s*:?\s*$/i;

export function getUniqueSourceLabels(citations?: Citation[]): string[] {
  if (!citations?.length) {
    return [];
  }

  const byYear = new Map<number, string>();
  for (const citation of citations) {
    const label = citation.label ?? `${citation.year} Shareholder Letter`;
    if (!byYear.has(citation.year)) {
      byYear.set(citation.year, label);
    }
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([, label]) => label);
}

export function renderFormattedMessage(content: string, citations?: Citation[]): ReactNode[] {
  let cleaned = stripTrailingSourcesSection(content);
  
  // Group list items that are wrongly separated by double newlines by the AI
  cleaned = cleaned.replace(/^([•\-*]\s+[^\n]+)\n{2,}(?=[•\-*]\s+)/gm, "$1\n");
  cleaned = cleaned.replace(/^(\d+\.\s+[^\n]+)\n{2,}(?=\d+\.\s+)/gm, "$1\n");

  const citationByIndex = buildCitationMap(citations);
  const blocks = cleaned.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    const isNumberedList = lines.length > 1 && lines.every((line) => NUMBERED_LINE_PATTERN.test(line.trim()));
    const isBulletList =
      lines.length > 0 && lines.filter((line) => BULLET_LINE_PATTERN.test(line.trim())).length >= Math.max(1, lines.length - 1);

    if (isBulletList) {
      return (
        <ul key={`block-${blockIndex}`} className="list-none space-y-2.5 pl-0">
          {lines.map((line, lineIndex) => {
            const body = line.trim().replace(BULLET_LINE_PATTERN, "");

            return (
              <li key={`line-${blockIndex}-${lineIndex}`} className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-black/50">•</span>
                <span className="flex-1 leading-relaxed">{renderInlineText(body, citationByIndex, `b${blockIndex}-l${lineIndex}`)}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    if (isNumberedList) {
      return (
        <ol key={`block-${blockIndex}`} className="list-none space-y-2.5 pl-0">
          {lines.map((line, lineIndex) => {
            const match = line.trim().match(/^(\d+)\.\s*(.+)$/);
            const body = match?.[2] ?? line.trim();

            return (
              <li key={`line-${blockIndex}-${lineIndex}`} className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-black/45">{match?.[1] ?? lineIndex + 1}.</span>
                <span className="flex-1">{renderInlineText(body, citationByIndex, `b${blockIndex}-l${lineIndex}`)}</span>
              </li>
            );
          })}
        </ol>
      );
    }

    if (lines.length === 1) {
      return (
        <p key={`block-${blockIndex}`} className="leading-relaxed">
          {renderInlineText(lines[0] ?? "", citationByIndex, `b${blockIndex}`)}
        </p>
      );
    }

    return (
      <div key={`block-${blockIndex}`} className="space-y-2">
        {lines.map((line, lineIndex) => (
          <p key={`line-${blockIndex}-${lineIndex}`} className="leading-relaxed">
            {renderInlineText(line, citationByIndex, `b${blockIndex}-l${lineIndex}`)}
          </p>
        ))}
      </div>
    );
  });
}

function stripTrailingSourcesSection(content: string): string {
  const lines = content.split("\n");
  let end = lines.length;

  while (end > 0) {
    const line = lines[end - 1]?.trim() ?? "";
    if (line.length === 0) {
      end -= 1;
      continue;
    }
    if (SOURCES_SECTION_PATTERN.test(line)) {
      end -= 1;
      continue;
    }
    break;
  }

  return lines.slice(0, end).join("\n").trim();
}

function buildCitationMap(citations?: Citation[]): Map<number, Citation> {
  if (!citations?.length) {
    return new Map();
  }

  return new Map(
    citations.map((citation, i) => [
      citation.index ?? i + 1,
      {
        ...citation,
        index: citation.index ?? i + 1,
        shortLabel: citation.shortLabel ?? `${citation.year} letter`,
        label: citation.label ?? `${citation.year} Shareholder Letter`,
      },
    ]),
  );
}

function renderInlineText(text: string, citationByIndex: Map<number, Citation>, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let partKey = 0;
  const pattern = new RegExp(CITATION_MARKER_PATTERN.source, "g");

  for (const match of text.matchAll(pattern)) {
    const markerIndex = match.index ?? 0;
    const citationNumber = Number.parseInt(match[1] ?? "", 10);
    const citation = citationByIndex.get(citationNumber);

    if (markerIndex > lastIndex) {
      parts.push(...renderBoldSegments(text.slice(lastIndex, markerIndex), `${keyPrefix}-t${partKey++}`));
    }

    if (citation) {
      const yearAlreadyMentioned = yearMentionedBefore(text, markerIndex, citation.year);
      if (!yearAlreadyMentioned) {
        parts.push(
          <span key={`${keyPrefix}-c${partKey++}`} className="text-black/55">
            {" "}
            ({citation.year} shareholder letter)
          </span>,
        );
      }
    }

    lastIndex = markerIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...renderBoldSegments(text.slice(lastIndex), `${keyPrefix}-t${partKey++}`));
  }

  return parts.length > 0 ? parts : renderBoldSegments(text, keyPrefix);
}

function renderBoldSegments(text: string, keyPrefix: string): ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter((segment) => segment.length > 0);

  if (segments.length === 1 && !segments[0]?.startsWith("**")) {
    return [text];
  }

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-b${index}`} className="font-semibold">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return segment;
  });
}

function yearMentionedBefore(content: string, markerIndex: number, year: number): boolean {
  const lookback = content.slice(Math.max(0, markerIndex - 100), markerIndex);
  return lookback.includes(String(year));
}
