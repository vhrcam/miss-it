export type Cue = {
  startSec: number;
  endSec: number;
  text: string;
};

const TIMING =
  /^((?:\d+:)?\d{1,2}:\d{2}\.\d{3})\s+-->\s+((?:\d+:)?\d{1,2}:\d{2}\.\d{3})/;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&lrm;': '',
  '&rlm;': '',
};

export function parseTimestamp(value: string): number {
  return value
    .split(':')
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

function cleanText(lines: string[]): string {
  return lines
    .join('\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|nbsp|lrm|rlm);/g, (entity) => ENTITIES[entity])
    .trim();
}

export function parseWebVTT(source: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split('\n');
    const timingLine = lines.findIndex((line) => line.includes('-->'));
    const timing =
      timingLine === -1 ? null : TIMING.exec(lines[timingLine].trim());
    if (!timing) {
      continue;
    }
    const text = cleanText(lines.slice(timingLine + 1));
    if (text) {
      cues.push({
        startSec: parseTimestamp(timing[1]),
        endSec: parseTimestamp(timing[2]),
        text,
      });
    }
  }

  return cues.sort((a, b) => a.startSec - b.startSec);
}
