import { parseToonUI } from './parser';
import type { ToonBlock, ToonContentSegment } from './types';

const BLOCK_REGEX = /```toon-ui[^\n\r]*\r?\n([\s\S]*?)```/g;
const OPEN_BLOCK_REGEX = /```toon-ui[^\n\r]*\r?\n?/g;

function createBlock(raw: string, start: number, end: number, complete: boolean): ToonBlock {
  return {
    raw: raw.trim(),
    language: 'toon-ui',
    start,
    end,
    complete,
  };
}

function getRenderablePartialRaw(raw: string): string {
  const lines = raw.split(/\r?\n/);

  while (lines.length > 0) {
    const candidate = lines.join('\n').trim();
    if (!candidate) return '';

    try {
      parseToonUI(candidate);
      return candidate;
    } catch {
      lines.pop();
    }
  }

  return '';
}

export function extractToonBlocks(content: string): ToonBlock[] {
  const blocks = [...content.matchAll(BLOCK_REGEX)].map((match) =>
    createBlock(
      match[1] ?? '',
      match.index ?? 0,
      (match.index ?? 0) + match[0].length,
      true,
    ),
  );

  const lastCompleteBlockEnd = blocks.at(-1)?.end ?? 0;
  const trailingContent = content.slice(lastCompleteBlockEnd);
  const openMatches = [...trailingContent.matchAll(OPEN_BLOCK_REGEX)];
  const lastOpenMatch = openMatches.at(-1);

  if (!lastOpenMatch) {
    return blocks;
  }

  const openFenceIndex = lastCompleteBlockEnd + (lastOpenMatch.index ?? 0);
  const openFence = lastOpenMatch[0] ?? '';
  const partialSourceStart = openFenceIndex + openFence.length;
  const partialRaw = getRenderablePartialRaw(content.slice(partialSourceStart));

  if (!partialRaw) {
    return blocks;
  }

  return [...blocks, createBlock(partialRaw, openFenceIndex, content.length, false)];
}

export function extractToonSegments(content: string): ToonContentSegment[] {
  const blocks = extractToonBlocks(content);

  if (blocks.length === 0) {
    return content
      ? [{ type: 'markdown', content, start: 0, end: content.length }]
      : [];
  }

  const segments: ToonContentSegment[] = [];
  let cursor = 0;

  for (const block of blocks) {
    if (block.start > cursor) {
      segments.push({
        type: 'markdown',
        content: content.slice(cursor, block.start),
        start: cursor,
        end: block.start,
      });
    }

    segments.push({
      ...block,
      type: 'toon-ui',
    });

    cursor = block.end;
  }

  if (cursor < content.length) {
    segments.push({
      type: 'markdown',
      content: content.slice(cursor),
      start: cursor,
      end: content.length,
    });
  }

  return segments;
}
