import { TOON_CATALOG, createToonCatalog, type CreateToonCatalogOptions, type ToonActiveCatalog } from './catalog';
import { createPrompt } from './prompts';
import { parseToonUI } from './parser';
import { validateToonUI } from './validator';
import { extractToonBlocks } from './formatter';
import {
  ALERT_VARIANTS,
  BADGE_VARIANTS,
  BUTTON_VARIANTS,
  CHART_TYPES,
  CONFIRM_VARIANTS,
  FIELD_TYPES,
  OFFICIAL_COMPONENT_KEYS,
  type CreateToonUIOptions,
  type ReplyPayload,
  type SubmitPayload,
  type ToonChatMessage,
  type ToonChatUIMessage,
  type ToonComponentRegistry,
  type ToonInteractionPayload,
  type ToonMessagesApi,
  type ToonProtocol,
  type ToonRules,
  type ToonRuntime,
} from './types';

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

export function createRules(catalog: ToonActiveCatalog = TOON_CATALOG): ToonRules {
  const componentKeys = Object.keys(catalog.components) as Array<(typeof OFFICIAL_COMPONENT_KEYS)[number]>;

  return {
    components: componentKeys,
    buttonVariants: BUTTON_VARIANTS,
    badgeVariants: BADGE_VARIANTS,
    alertVariants: ALERT_VARIANTS,
    confirmVariants: CONFIRM_VARIANTS,
    fieldTypes: FIELD_TYPES,
    chartTypes: CHART_TYPES,
  };
}

export function createReplyEvent(valueOrPayload: string | ReplyPayload, metadata: Record<string, string | number | boolean> = {}): ReplyPayload {
  return typeof valueOrPayload === 'string'
    ? {
        kind: 'ui_reply',
        eventId: createEventId('reply'),
        source: 'button',
        component: 'button',
        value: valueOrPayload,
        context: metadata,
      }
    : valueOrPayload;
}

export function createSubmitEvent(intentOrPayload: string | SubmitPayload, values?: Record<string, string | number | boolean>): SubmitPayload {
  return typeof intentOrPayload === 'string'
    ? {
        kind: 'ui_submit',
        eventId: createEventId('submit'),
        source: 'form',
        intent: intentOrPayload,
        formTitle: intentOrPayload,
        values: values ?? {},
      }
    : intentOrPayload;
}

export function toToonEventContent(payload: ToonInteractionPayload): string {
  if (payload.kind === 'ui_reply') {
    const lines = ['ui_reply:', `  eventId: ${payload.eventId}`, `  value: ${payload.value}`, `  source: ${payload.source}`, `  component: ${payload.component}`];
    Object.entries(payload.context ?? {}).forEach(([key, entry]) => {
      lines.push(`  ${key}: ${JSON.stringify(entry)}`);
    });
    return lines.join('\n');
  }

  const lines = ['ui_submit:', `  eventId: ${payload.eventId}`, `  intent: ${payload.intent}`, `  formTitle: ${payload.formTitle}`];
  Object.entries(payload.values).forEach(([key, value]) => {
    lines.push(`  ${key}: ${JSON.stringify(value)}`);
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

export function toToonDisplayContent<TPayload extends ToonInteractionPayload>(payload: TPayload): string {
  return payload.kind === 'ui_reply' ? payload.value : createSubmitDisplayContent(payload);
}

export function toToonModelMessage<TPayload extends ToonInteractionPayload>(payload: TPayload): ToonChatMessage<TPayload> {
  return {
    role: 'user',
    kind: payload.kind,
    content: toToonEventContent(payload),
    displayContent: toToonDisplayContent(payload),
    payload,
  };
}

export function toToonUIMessage<TPayload extends ToonInteractionPayload>(payload: TPayload): ToonChatUIMessage<TPayload> {
  const message = toToonModelMessage(payload);

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

function createMessagesApi(): ToonMessagesApi {
  return {
    toContent: toToonEventContent,
    toDisplayContent: toToonDisplayContent,
    toModelMessage: toToonModelMessage,
    toUIMessage: toToonUIMessage,
  };
}

export interface CreateToonProtocolOptions extends CreateToonCatalogOptions {
  catalog?: ToonActiveCatalog;
}

export function createToonProtocol(options: CreateToonProtocolOptions = {}): ToonProtocol {
  const catalog = options.catalog ?? createToonCatalog({ components: options.components });
  const rules = createRules(catalog);
  const messages = createMessagesApi();

  return {
    prompt: createPrompt(rules, catalog),
    rules,
    catalog,
    events: {
      reply: createReplyEvent,
      submit: createSubmitEvent,
    },
    messages,
  };
}

export function createToonCoreRuntime<TComponents extends ToonComponentRegistry = ToonComponentRegistry>(options: CreateToonUIOptions<TComponents> = {}): ToonRuntime<TComponents> {
  const protocol = createToonProtocol({
    catalog: options.catalog,
    components: options.catalog ? undefined : Object.keys(options.components ?? {}) as Array<(typeof OFFICIAL_COMPONENT_KEYS)[number]>,
  });
  return {
    components: (options.components ?? {}) as TComponents,
    ...protocol,
    parse: parseToonUI,
    validate: validateToonUI,
    extractBlocks: extractToonBlocks,
  };
}
