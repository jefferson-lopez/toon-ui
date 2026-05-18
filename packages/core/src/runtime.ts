import { createPrompt } from './prompts';
import { parseToonUI } from './parser';
import { validateToonUI } from './validator';
import { extractToonBlocks } from './formatter';
import { ALERT_VARIANTS, BADGE_VARIANTS, BUTTON_VARIANTS, CHART_TYPES, CONFIRM_VARIANTS, FIELD_TYPES, OFFICIAL_COMPONENT_KEYS, type CreateToonUIOptions, type ReplyPayload, type SubmitPayload, type ToonChatMessage, type ToonChatUIMessage, type ToonComponentRegistry, type ToonInteractionPayload, type ToonProtocol, type ToonRules, type ToonRuntime } from './types';

function createEventId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

type SubmitPayloadWithOptionalNode = SubmitPayload & {
  node?: {
    children?: Array<{
      type?: string;
      name?: string;
      label?: string;
    }>;
  };
};

export function createRules(): ToonRules {
  return {
    components: OFFICIAL_COMPONENT_KEYS,
    buttonVariants: BUTTON_VARIANTS,
    badgeVariants: BADGE_VARIANTS,
    alertVariants: ALERT_VARIANTS,
    confirmVariants: CONFIRM_VARIANTS,
    fieldTypes: FIELD_TYPES,
    chartTypes: CHART_TYPES,
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

function createSubmitDisplayContent(payload: SubmitPayloadWithOptionalNode): string {
  const fieldLabels = new Map<string, string>();

  payload.node?.children?.forEach((child) => {
    if (child?.type === 'field' && child.name && child.label) {
      fieldLabels.set(child.name, child.label);
    }
  });

  const entries = Object.entries(payload.values).map(([key, value]) => {
    const label = fieldLabels.get(key) ?? key;
    return `${label}: ${String(value)}`;
  });

  return [payload.formTitle, ...entries].join('\n');
}

export function createChatMessage<TPayload extends ToonInteractionPayload>(payload: TPayload): ToonChatMessage<TPayload> {
  if (payload.kind === 'ui_reply') {
    return {
      role: 'user',
      kind: payload.kind,
      content: formatReplyMessage(payload),
      displayContent: payload.value,
      payload,
    };
  }

  return {
    role: 'user',
    kind: payload.kind,
    content: formatSubmitMessage(payload),
    displayContent: createSubmitDisplayContent(payload),
    payload,
  };
}

export function createChatUIMessage<TPayload extends ToonInteractionPayload>(payload: TPayload): ToonChatUIMessage<TPayload> {
  const message = createChatMessage(payload);

  return {
    id: payload.eventId,
    role: message.role,
    parts: [{ type: 'text', text: message.content }],
    metadata: {
      displayContent: message.displayContent,
      kind: message.kind,
    },
  };
}

export function createToonProtocol(): ToonProtocol {
  const rules = createRules();

  return {
    prompt: createPrompt(rules),
    rules,
    formatSubmitMessage,
    formatReplyMessage,
    createChatMessage,
    createChatUIMessage,
  };
}

export function createToonCoreRuntime<TComponents extends ToonComponentRegistry = ToonComponentRegistry>(options: CreateToonUIOptions<TComponents> = {}): ToonRuntime<TComponents> {
  const protocol = createToonProtocol();
  return {
    components: (options.components ?? {}) as TComponents,
    ...protocol,
    parse: parseToonUI,
    validate: validateToonUI,
    extractBlocks: extractToonBlocks,
  };
}
