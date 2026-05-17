import { createPrompt } from './prompts';
import { parseToonUI } from './parser';
import { validateToonUI } from './validator';
import { extractToonBlocks } from './formatter';
import { ALERT_VARIANTS, BADGE_VARIANTS, BUTTON_VARIANTS, FIELD_TYPES, OFFICIAL_COMPONENT_KEYS, type CreateToonUIOptions, type ReplyPayload, type SubmitPayload, type ToonComponentRegistry, type ToonRules, type ToonRuntime } from './types';

function createEventId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createRules(): ToonRules {
  return {
    components: OFFICIAL_COMPONENT_KEYS,
    buttonVariants: BUTTON_VARIANTS,
    badgeVariants: BADGE_VARIANTS,
    alertVariants: ALERT_VARIANTS,
    fieldTypes: FIELD_TYPES,
  };
}

export function formatSubmitMessage(intentOrPayload: string | SubmitPayload, values?: Record<string, string | number | boolean>): string {
  const payload: SubmitPayload = typeof intentOrPayload === 'string'
    ? {
        kind: 'ui_submit',
        eventId: createEventId('submit'),
        source: 'form',
        intent: intentOrPayload,
        formTitle: intentOrPayload,
        values: values ?? {},
      }
    : intentOrPayload;

  const lines = ['ui_submit:', `  eventId: ${payload.eventId}`, `  intent: ${payload.intent}`, `  formTitle: ${payload.formTitle}`];
  Object.entries(payload.values).forEach(([key, value]) => {
    lines.push(`  ${key}: ${JSON.stringify(value)}`);
  });
  return lines.join('\n');
}

export function formatReplyMessage(valueOrPayload: string | ReplyPayload, metadata: Record<string, string | number | boolean> = {}): string {
  const payload: ReplyPayload = typeof valueOrPayload === 'string'
    ? {
        kind: 'ui_reply',
        eventId: createEventId('reply'),
        source: 'button',
        component: 'button',
        value: valueOrPayload,
        context: metadata,
      }
    : valueOrPayload;

  const lines = ['ui_reply:', `  eventId: ${payload.eventId}`, `  value: ${payload.value}`, `  source: ${payload.source}`, `  component: ${payload.component}`];
  Object.entries(payload.context ?? {}).forEach(([key, entry]) => {
    lines.push(`  ${key}: ${JSON.stringify(entry)}`);
  });
  return lines.join('\n');
}

export function createToonUI<TComponents extends ToonComponentRegistry = ToonComponentRegistry>(options: CreateToonUIOptions<TComponents> = {}): ToonRuntime<TComponents> {
  const rules = createRules();
  return {
    components: (options.components ?? {}) as TComponents,
    prompt: createPrompt(rules),
    rules,
    parse: parseToonUI,
    validate: validateToonUI,
    extractBlocks: extractToonBlocks,
    formatSubmitMessage,
    formatReplyMessage,
  };
}
