import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePdfDir(): string {
  const fromBuild = path.resolve(__dirname, '../../src/mastra/data/pdfs');
  if (existsSync(fromBuild)) return fromBuild;

  const fromSource = path.resolve(__dirname, '../data/pdfs');
  if (existsSync(fromSource)) return fromSource;

  return fromBuild;
}

export const PDF_DIR = resolvePdfDir();

export interface ParsedPdf {
  source: string;
  year: number;
  text: string;
}

export async function parsePdf(filePath: string): Promise<ParsedPdf> {
  const data = await readFile(filePath);
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    const source = path.basename(filePath);
    const year = Number.parseInt(source.replace('.pdf', ''), 10);

    if (!Number.isInteger(year)) {
      throw new Error(`Could not infer year from PDF filename: ${source}`);
    }

    return {
      source,
      year,
      text: normalizePdfText(result.text),
    };
  } finally {
    await parser.destroy();
  }
}

export async function parseAllPdfs(pdfDir = PDF_DIR): Promise<ParsedPdf[]> {
  const files = await readdir(pdfDir);
  const pdfFiles = files
    .filter((file) => /^\d{4}\.pdf$/i.test(file))
    .sort((a, b) => a.localeCompare(b));

  if (pdfFiles.length === 0) {
    throw new Error(`No shareholder letter PDFs found in ${pdfDir}`);
  }

  return Promise.all(pdfFiles.map((file) => parsePdf(path.join(pdfDir, file))));
}

function normalizePdfText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
