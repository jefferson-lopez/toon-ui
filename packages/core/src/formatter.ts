import type { ToonBlock } from './types';

const BLOCK_REGEX = /```toon-ui\n([\s\S]*?)```/g;

export function extractToonBlocks(content: string): ToonBlock[] {
  return [...content.matchAll(BLOCK_REGEX)].map((match) => ({
    raw: match[1].trim(),
    language: 'toon-ui',
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}
