import React, { createContext, useContext, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type {
  AlertNode,
  BadgeNode,
  ButtonNode,
  CardNode,
  ConfirmNode,
  EmptyNode,
  FieldNode,
  FormNode,
  ItemNode,
  ListNode,
  ReplyPayload,
  SubmitPayload,
  TableNode,
  TextNode,
  ToonBlock,
  ToonNode,
  ToonNodeByType,
  ToonRuntime,
} from '@toon-ui/core';
import { createToonCoreRuntime } from '@toon-ui/core';

export type ToonFieldValue = string | number | boolean | string[];

export type ToonReplyPayload = ReplyPayload & {
  node: ButtonNode;
};

export type ToonSubmitPayload = SubmitPayload & {
  node: FormNode;
};

export interface ToonRenderContextValue {
  sendReply: (payload: ToonReplyPayload) => void;
  submitForm: (form: FormNode) => void;
  getFieldValue: (form: FormNode | undefined, field: FieldNode) => ToonFieldValue | undefined;
  setFieldValue: (form: FormNode | undefined, field: FieldNode, value: ToonFieldValue) => void;
  isBlockResolved: (blockId: string) => boolean;
  resolveBlock: (blockId: string) => void;
}

type BaseProps<TNode extends ToonNode> = {
  node: TNode;
  children?: React.ReactNode;
  context: ToonRenderContextValue;
  disabled?: boolean;
};

export type ToonTextComponentProps = BaseProps<TextNode>;
export type ToonCardComponentProps = BaseProps<CardNode>;
export type ToonConfirmComponentProps = BaseProps<ConfirmNode>;
export type ToonListComponentProps = BaseProps<ListNode>;
export type ToonItemComponentProps = BaseProps<ItemNode>;
export type ToonBadgeComponentProps = BaseProps<BadgeNode>;
export type ToonAlertComponentProps = BaseProps<AlertNode>;
export type ToonTableComponentProps = BaseProps<TableNode>;
export type ToonEmptyComponentProps = BaseProps<EmptyNode>;
export type ToonButtonComponentProps = BaseProps<ButtonNode> & {
  sendReply: (reply?: string) => void;
  submitForm: () => void;
  disabled: boolean;
};
export type ToonFieldComponentProps = BaseProps<FieldNode> & {
  value: ToonFieldValue | undefined;
  onChange: (value: ToonFieldValue) => void;
  disabled: boolean;
};
export type ToonFormComponentProps = BaseProps<FormNode> & {
  submitForm: () => void;
  values: Record<string, ToonFieldValue>;
  disabled: boolean;
};

export interface ToonReactComponentPropsByType {
  text: ToonTextComponentProps;
  card: ToonCardComponentProps;
  form: ToonFormComponentProps;
  field: ToonFieldComponentProps;
  button: ToonButtonComponentProps;
  confirm: ToonConfirmComponentProps;
  list: ToonListComponentProps;
  item: ToonItemComponentProps;
  badge: ToonBadgeComponentProps;
  alert: ToonAlertComponentProps;
  table: ToonTableComponentProps;
  empty: ToonEmptyComponentProps;
}

export const TOON_REACT_ADAPTER_KEYS = [
  'text',
  'card',
  'form',
  'field',
  'button',
  'confirm',
  'list',
  'item',
  'badge',
  'alert',
  'table',
  'empty',
] as const;

export type ToonReactAdapterComponentKey = (typeof TOON_REACT_ADAPTER_KEYS)[number];

export type ToonReactComponentRegistry = Partial<{
  [K in keyof ToonReactComponentPropsByType]: React.ComponentType<ToonReactComponentPropsByType[K]>;
}>;

export type ToonReactAdapterLevel = 'minimal' | 'default' | 'strict';

export interface ToonReactAdapterMeta {
  level: ToonReactAdapterLevel;
  includesDefaults: boolean;
  isComplete: boolean;
  providedKeys: ToonReactAdapterComponentKey[];
  missingKeys: ToonReactAdapterComponentKey[];
}

export interface ToonReactAdapter {
  components: ToonReactComponentRegistry;
  meta: ToonReactAdapterMeta;
}

export interface ToonRenderErrorState {
  kind: 'parse' | 'validation';
  block: ToonBlock;
  message: string;
  details: string[];
  cause?: unknown;
}

export type ToonErrorRenderer = (error: ToonRenderErrorState) => React.ReactNode;

export interface CreateToonReactAdapterOptions {
  components?: ToonReactComponentRegistry;
  level?: ToonReactAdapterLevel;
}

export interface ToonReactLayoutOptions {
  messageGap?: React.CSSProperties['gap'];
  blockGap?: React.CSSProperties['gap'];
  nodeGap?: React.CSSProperties['gap'];
}

export interface CreateToonReactRuntimeOptions {
  adapter?: ToonReactAdapter;
  layout?: ToonReactLayoutOptions;
}

interface ResolvedToonReactLayout {
  messageGap: NonNullable<React.CSSProperties['gap']>;
  blockGap: NonNullable<React.CSSProperties['gap']>;
  nodeGap: NonNullable<React.CSSProperties['gap']>;
}

export type ToonReactRuntime = ToonRuntime<ToonReactComponentRegistry> & {
  adapter: ToonReactAdapter;
  layout: ResolvedToonReactLayout;
};
export type ToonMarkdownRenderer = (markdown: string) => React.ReactNode;
export type ToonResolvedButtonProps = Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'disabled' | 'onClick'
>;
export type ToonResolvedInputProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id' | 'name' | 'type' | 'required' | 'disabled' | 'value' | 'checked' | 'placeholder' | 'onChange'
>;
export type ToonResolvedTextareaProps = Pick<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'name' | 'required' | 'disabled' | 'value' | 'placeholder' | 'onChange'
>;

const defaultLayout: ResolvedToonReactLayout = {
  messageGap: 16,
  blockGap: 16,
  nodeGap: 12,
};

export function mergeToonComponentRegistry(...registries: Array<ToonReactComponentRegistry | undefined>): ToonReactComponentRegistry {
  return registries.reduce<ToonReactComponentRegistry>((accumulator, registry) => ({
    ...accumulator,
    ...(registry ?? {}),
  }), {});
}

function createAdapterErrorMessage(missingKeys: ToonReactAdapterComponentKey[]): string {
  return `Strict ToonUI adapter requires full coverage. Missing components: ${missingKeys.join(', ')}`;
}

export function getToonAdapterCoverage(
  components: ToonReactComponentRegistry,
  level: ToonReactAdapterLevel = 'minimal',
): ToonReactAdapterMeta {
  const providedKeys = TOON_REACT_ADAPTER_KEYS.filter((key) => Boolean(components[key]));
  const missingKeys = TOON_REACT_ADAPTER_KEYS.filter((key) => !components[key]);
  const isComplete = missingKeys.length === 0;

  return {
    level,
    includesDefaults: level === 'default',
    isComplete,
    providedKeys: [...providedKeys],
    missingKeys: [...missingKeys],
  };
}

export function assertToonReactAdapter(adapter: ToonReactAdapter): ToonReactAdapter {
  if (adapter.meta.level === 'strict' && !adapter.meta.isComplete) {
    throw new Error(createAdapterErrorMessage(adapter.meta.missingKeys));
  }

  return adapter;
}

export function createToonReactAdapter(
  options: CreateToonReactAdapterOptions = {},
): ToonReactAdapter {
  const level = options.level ?? 'default';
  const components = level === 'default'
    ? mergeToonComponentRegistry(basicPreset(), options.components)
    : mergeToonComponentRegistry(options.components);

  const adapter = {
    components,
    meta: getToonAdapterCoverage(components, level),
  } satisfies ToonReactAdapter;

  return assertToonReactAdapter(adapter);
}

export const createToonAdapter = createToonReactAdapter;

export function createToonReactRuntime(
  options: CreateToonReactRuntimeOptions = {},
): ToonReactRuntime {
  const layout: ResolvedToonReactLayout = {
    messageGap: options.layout?.messageGap ?? defaultLayout.messageGap,
    blockGap: options.layout?.blockGap ?? defaultLayout.blockGap,
    nodeGap: options.layout?.nodeGap ?? defaultLayout.nodeGap,
  };

  const adapter = options.adapter ?? createToonReactAdapter({ level: 'default' });

  return {
    ...createToonCoreRuntime<ToonReactComponentRegistry>({
      components: adapter.components,
    }),
    adapter,
    layout,
  } as ToonReactRuntime;
}

export function extractToonMarkdown(content: string): string {
  return extractToonSegments(content)
    .filter((segment) => segment.type === 'markdown')
    .map((segment) => segment.content)
    .join('')
    .trim();
}

function renderNodeDescription(description?: string): React.ReactNode {
  return description ? <p style={{ margin: 0, color: '#4b5563' }}>{description}</p> : null;
}

function getNodeDescription(node: ToonNode): string | undefined {
  return 'description' in node && typeof node.description === 'string' ? node.description : undefined;
}

type ToonMessageSegment =
  | { type: 'markdown'; content: string; start: number; end: number }
  | ({ type: 'toon-ui' } & ToonBlock);

function extractToonSegments(content: string): ToonMessageSegment[] {
  const blocks = createToonCoreRuntime().extractBlocks(content);

  if (blocks.length === 0) {
    return content
      ? [{ type: 'markdown', content, start: 0, end: content.length }]
      : [];
  }

  const segments: ToonMessageSegment[] = [];
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

const ToonRuntimeContext = createContext<ToonReactRuntime | null>(null);
const ToonRenderContext = createContext<ToonRenderContextValue | null>(null);

function createStackStyle(gap: React.CSSProperties['gap']): React.CSSProperties {
  return { display: 'grid', gap, width: '100%', minWidth: 0 };
}

function createSurfaceStyle(gap: React.CSSProperties['gap'], extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    ...createStackStyle(gap),
    boxSizing: 'border-box',
    ...extra,
  };
}

function createEventId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function getFormKey(form: FormNode): string {
  return `${slugify(form.title)}_${form.line}`;
}

export function getToonFieldId(node: FieldNode): string {
  return `${node.name}-${node.line}`;
}

export function getToonButtonProps({
  node,
  sendReply,
  submitForm,
  disabled,
}: Pick<ToonButtonComponentProps, 'node' | 'sendReply' | 'submitForm' | 'disabled'>): ToonResolvedButtonProps {
  return {
    type: 'button',
    disabled,
    onClick: () => {
      if (disabled) return;
      if (node.action.kind === 'reply') {
        sendReply(node.action.value);
        return;
      }
      submitForm();
    },
  };
}

export function getToonInputProps({
  node,
  value,
  onChange,
  disabled,
}: Pick<ToonFieldComponentProps, 'node' | 'value' | 'onChange' | 'disabled'>): ToonResolvedInputProps {
  return {
    id: getToonFieldId(node),
    name: node.name,
    type: node.fieldType === 'textarea' || node.fieldType === 'select' || node.fieldType === 'checkbox' ? 'text' : node.fieldType,
    required: node.required,
    disabled,
    placeholder: node.placeholder,
    value: typeof value === 'number' ? String(value) : String(value ?? ''),
    onChange: (event) => {
      if (node.fieldType === 'number') {
        const nextValue = event.currentTarget.value;
        onChange(nextValue === '' ? '' : Number(nextValue));
        return;
      }

      onChange(event.currentTarget.value);
    },
  };
}

export function getToonTextareaProps({
  node,
  value,
  onChange,
  disabled,
}: Pick<ToonFieldComponentProps, 'node' | 'value' | 'onChange' | 'disabled'>): ToonResolvedTextareaProps {
  return {
    id: getToonFieldId(node),
    name: node.name,
    required: node.required,
    disabled,
    placeholder: node.placeholder,
    value: String(value ?? ''),
    onChange: (event) => onChange(event.currentTarget.value),
  };
}

export function getToonCheckboxProps({
  node,
  value,
  onChange,
  disabled,
}: Pick<ToonFieldComponentProps, 'node' | 'value' | 'onChange' | 'disabled'>): ToonResolvedInputProps {
  return {
    id: getToonFieldId(node),
    name: node.name,
    type: 'checkbox',
    required: node.required,
    disabled,
    checked: Boolean(value),
    value: String(Boolean(value)),
    onChange: (event) => onChange(event.currentTarget.checked),
  };
}

function getDefaultFieldValue(field: FieldNode): ToonFieldValue {
  if (field.fieldType === 'checkbox' || field.fieldType === 'switch') return false;
  if (field.fieldType === 'multiselect') return [];
  return '';
}

function normalizeFieldValue(field: FieldNode, value: ToonFieldValue): ToonFieldValue {
  if (field.fieldType === 'number' || field.fieldType === 'slider') {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (field.fieldType === 'checkbox' || field.fieldType === 'switch') {
    return Boolean(value);
  }
  if (field.fieldType === 'multiselect') {
    return Array.isArray(value) ? value : String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return value;
}

export function ToonProvider({
  runtime,
  children,
  onReply,
  onSubmit,
  interactive = true,
}: {
  runtime: ToonReactRuntime;
  children: React.ReactNode;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
  interactive?: boolean;
}) {
  const [formState, setFormState] = useState<Record<string, Record<string, ToonFieldValue>>>({});
  const [resolvedBlocks, setResolvedBlocks] = useState<Record<string, true>>({});

  const contextValue = useMemo<ToonRenderContextValue>(() => ({
    sendReply: (payload) => {
      onReply?.(payload);
    },
    submitForm: (form) => {
      const fields = form.children.filter((child): child is FieldNode => child.type === 'field');
      const key = getFormKey(form);
      const existing = formState[key] ?? {};
      const values = fields.reduce<Record<string, ToonFieldValue>>((accumulator, field) => {
        accumulator[field.name] = existing[field.name] ?? getDefaultFieldValue(field);
        return accumulator;
      }, {});

      onSubmit?.({
        kind: 'ui_submit',
        eventId: createEventId('submit'),
        source: 'form',
        intent: slugify(form.title),
        formTitle: form.title,
        values,
        line: form.line,
        node: form,
      });
    },
    getFieldValue: (form, field) => {
      if (!form) return undefined;
      const key = getFormKey(form);
      return formState[key]?.[field.name] ?? getDefaultFieldValue(field);
    },
    setFieldValue: (form, field, value) => {
      if (!form) return;
      const key = getFormKey(form);
      const normalized = normalizeFieldValue(field, value);
      setFormState((current) => ({
        ...current,
        [key]: {
          ...(current[key] ?? {}),
          [field.name]: normalized,
        },
      }));
    },
    isBlockResolved: (blockId) => !interactive || Boolean(resolvedBlocks[blockId]),
    resolveBlock: (blockId) => {
      setResolvedBlocks((current) => (current[blockId] ? current : { ...current, [blockId]: true }));
    },
  }), [formState, interactive, onReply, onSubmit, resolvedBlocks, runtime]);

  return (
    <ToonRuntimeContext.Provider value={runtime}>
      <ToonRenderContext.Provider value={contextValue}>{children}</ToonRenderContext.Provider>
    </ToonRuntimeContext.Provider>
  );
}

export function useToonUI(): ToonReactRuntime {
  const runtime = useContext(ToonRuntimeContext);
  if (!runtime) {
    throw new Error('useToonUI must be used within ToonProvider.');
  }
  return runtime;
}

export function useToonReply() {
  const context = useContext(ToonRenderContext);
  if (!context) {
    throw new Error('useToonReply must be used within ToonProvider.');
  }
  return context.sendReply;
}

export function useToonSubmit() {
  const context = useContext(ToonRenderContext);
  if (!context) {
    throw new Error('useToonSubmit must be used within ToonProvider.');
  }
  return context.submitForm;
}

export function useToonAction() {
  const runtime = useToonUI();
  return {
    events: runtime.events,
    messages: runtime.messages,
  };
}

function useToonRenderContext() {
  const context = useContext(ToonRenderContext);
  if (!context) {
    throw new Error('Toon rendering requires ToonProvider.');
  }
  return context;
}

function renderFallback(node: ToonNode, children: React.ReactNode, form: FormNode | undefined, context: ToonRenderContextValue, key: React.Key, blockResolved = false): React.ReactNode {
  const layout = useToonUI().layout;
  const nestedBlockStyle = createStackStyle(layout.nodeGap);
  const surfaceStyle = createSurfaceStyle(layout.nodeGap);

  switch (node.type) {
    case 'text':
      return <p key={key} style={{ margin: 0 }}>{node.value}</p>;
    case 'heading':
      if (node.level === 1) return <h1 key={key} style={{ margin: 0 }}>{node.text}</h1>;
      if (node.level === 2) return <h2 key={key} style={{ margin: 0 }}>{node.text}</h2>;
      if (node.level === 3) return <h3 key={key} style={{ margin: 0 }}>{node.text}</h3>;
      if (node.level === 4) return <h4 key={key} style={{ margin: 0 }}>{node.text}</h4>;
      if (node.level === 5) return <h5 key={key} style={{ margin: 0 }}>{node.text}</h5>;
      return <h6 key={key} style={{ margin: 0 }}>{node.text}</h6>;
    case 'separator':
      return <hr key={key} style={{ width: '100%', border: 0, borderTop: '1px solid #d1d5db' }} />;
    case 'badge':
      return <span key={key} style={{ display: 'inline-flex', width: 'fit-content' }}>{node.label}</span>;
    case 'button':
      return (
        <button
          key={key}
          type="button"
          disabled={blockResolved}
          onClick={() => blockResolved ? undefined : node.action.kind === 'reply' ? context.sendReply({ kind: 'ui_reply', eventId: createEventId('reply'), source: 'button', component: 'button', value: node.action.value, line: node.line, node }) : form ? context.submitForm(form) : undefined}
        >
          {node.label}
        </button>
      );
    case 'field':
      return (
        <label key={key} style={createSurfaceStyle(6)}>
          {node.label}
          {node.fieldType === 'textarea' ? (
            <textarea
              name={node.name}
              disabled={blockResolved}
              placeholder={node.placeholder}
              style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
              value={String(context.getFieldValue(form, node) ?? '')}
              onChange={(event) => blockResolved ? undefined : context.setFieldValue(form, node, event.target.value)}
            />
          ) : node.fieldType === 'checkbox' ? (
            <input
              type="checkbox"
              name={node.name}
              disabled={blockResolved}
              checked={Boolean(context.getFieldValue(form, node))}
              onChange={(event) => blockResolved ? undefined : context.setFieldValue(form, node, event.target.checked)}
            />
          ) : (
            <input
              name={node.name}
              disabled={blockResolved}
              placeholder={node.placeholder}
              style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
              value={Array.isArray(context.getFieldValue(form, node)) ? (context.getFieldValue(form, node) as string[]).join(', ') : String(context.getFieldValue(form, node) ?? '')}
              onChange={(event) => blockResolved ? undefined : context.setFieldValue(form, node, event.target.value)}
            />
          )}
        </label>
      );
    case 'card':
    case 'confirm':
    case 'form':
    case 'item':
    case 'alert':
    case 'empty':
    case 'dialog':
    case 'sheet':
    case 'popover':
      return <section key={key} style={surfaceStyle}><strong>{node.title}</strong>{renderNodeDescription(getNodeDescription(node))}<div style={nestedBlockStyle}>{children}</div></section>;
    case 'list':
    case 'tabs':
    case 'accordion':
    case 'menu':
    case 'command':
      return <section key={key} style={surfaceStyle}><strong>{node.title}</strong><div style={nestedBlockStyle}>{children}</div></section>;
    case 'tab':
      return <section key={key} style={createSurfaceStyle(8, { border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 })}><strong>{node.label}</strong><div style={nestedBlockStyle}>{children}</div></section>;
    case 'section':
      return <section key={key} style={createSurfaceStyle(8, { border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 })}><strong>{node.title}</strong><div style={nestedBlockStyle}>{children}</div></section>;
    case 'series':
      return <section key={key} style={createSurfaceStyle(8, { border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 })}><strong>{node.label}</strong><div style={nestedBlockStyle}>{children}</div></section>;
    case 'tooltip':
      return <span key={key} style={{ display: 'inline-flex', width: 'fit-content', padding: '4px 8px', borderRadius: 999, background: '#111827', color: '#fff' }}>{node.text}</span>;
    case 'progress':
      return (
        <div key={key} style={surfaceStyle}>
          <strong>{node.label}</strong>
          <progress value={node.value} max={node.max} style={{ width: '100%' }} />
          <span>{node.value}/{node.max}</span>
        </div>
      );
    case 'loading':
      return <div key={key} style={surfaceStyle}><strong>Cargando</strong><span>{node.text}</span></div>;
    case 'toast':
      return <div key={key} style={createSurfaceStyle(6, { border: '1px solid #d1d5db', borderRadius: 10, padding: 12 })}><strong>{node.variant.toUpperCase()}</strong><span>{node.text}</span></div>;
    case 'breadcrumb':
      return <nav key={key} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</nav>;
    case 'crumb':
      return <span key={key} style={{ color: '#4b5563' }}>{node.label}</span>;
    case 'pagination':
      return <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><strong>Página</strong><span>{node.page} de {node.totalPages}</span></div>;
    case 'action':
      return (
        <button
          key={key}
          type="button"
          disabled={blockResolved}
          onClick={() => blockResolved ? undefined : node.action.kind === 'reply' ? context.sendReply({ kind: 'ui_reply', eventId: createEventId('reply'), source: 'button', component: 'button', value: node.action.value, line: node.line, node: node as never }) : form ? context.submitForm(form) : undefined}
        >
          {node.label}
        </button>
      );
    case 'table':
      return <pre key={key}>{JSON.stringify({ columns: node.columns, rows: node.rows }, null, 2)}</pre>;
    case 'chart':
      return (
        <section key={key} style={surfaceStyle}>
          <strong>{node.title}</strong>
          <div style={nestedBlockStyle}>
            {node.children.map((series) => (
              <div key={`${series.label}-${series.line}`} style={createSurfaceStyle(6, { border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 })}>
                <strong>{series.label}</strong>
                {series.children.map((point) => (
                  <div key={`${point.label}-${point.line}`} style={{ display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>{point.label}</span>
                      <span>{point.value}</span>
                    </div>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999 }}>
                      <div style={{ width: `${Math.max(4, Math.min(100, point.value))}%`, height: '100%', background: '#111827', borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

function RegisteredNode({ node, form, nodeKey, blockId }: { node: ToonNode; form?: FormNode; nodeKey: React.Key; blockId: string }) {
  const runtime = useToonUI();
  const context = useToonRenderContext();
  const activeForm = node.type === 'form' ? node : form;
  const blockResolved = context.isBlockResolved(blockId);
  const children = 'children' in node ? node.children.map((child, index) => <RegisteredNode key={`${String(nodeKey)}-${index}`} node={child} form={activeForm} nodeKey={`${String(nodeKey)}-${index}`} blockId={blockId} />) : undefined;

  switch (node.type) {
    case 'text': {
      const Component = runtime.components.text;
      return Component ? <Component node={node} context={context} disabled={blockResolved} /> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'badge': {
      const Component = runtime.components.badge;
      return Component ? <Component node={node} context={context} disabled={blockResolved} /> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'button': {
      const Component = runtime.components.button;
      const sendReply = (reply = node.action.kind === 'reply' ? node.action.value : '') => {
        if (blockResolved) return;
        if (node.action.kind === 'reply') {
          context.resolveBlock(blockId);
          context.sendReply({ kind: 'ui_reply', eventId: createEventId('reply'), source: 'button', component: 'button', value: reply, line: node.line, node });
        }
      };
      const submitForm = () => {
        if (blockResolved) return;
        if (activeForm) {
          context.resolveBlock(blockId);
          context.submitForm(activeForm);
        }
      };
      return Component
        ? <Component node={node} context={context} sendReply={sendReply} submitForm={submitForm} disabled={blockResolved} />
        : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'field': {
      const Component = runtime.components.field;
      const value = context.getFieldValue(activeForm, node);
      const onChange = (nextValue: ToonFieldValue) => {
        if (blockResolved) return;
        context.setFieldValue(activeForm, node, nextValue);
      };
      return Component
        ? <Component node={node} context={context} value={value} onChange={onChange} disabled={blockResolved} />
        : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'form': {
      const Component = runtime.components.form;
      const fields = node.children.filter((child): child is FieldNode => child.type === 'field');
      const values = fields.reduce<Record<string, ToonFieldValue>>((accumulator, field) => {
        accumulator[field.name] = context.getFieldValue(node, field) ?? getDefaultFieldValue(field);
        return accumulator;
      }, {});
      const submitForm = () => {
        if (blockResolved) return;
        context.resolveBlock(blockId);
        context.submitForm(node);
      };
      return Component
        ? <Component node={node} context={context} values={values} submitForm={submitForm} disabled={blockResolved}>{children}</Component>
        : renderFallback(node, children, node, context, nodeKey, blockResolved);
    }
    case 'card': {
      const Component = runtime.components.card;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'confirm': {
      const Component = runtime.components.confirm;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'list': {
      const Component = runtime.components.list;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'item': {
      const Component = runtime.components.item;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'alert': {
      const Component = runtime.components.alert;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'empty': {
      const Component = runtime.components.empty;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    case 'table': {
      const Component = runtime.components.table;
      return Component ? <Component node={node} context={context} disabled={blockResolved} /> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
    default:
      return renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
  }
}

function ToonRenderedBlock({
  block,
  index,
  renderError,
  showErrorDetails = false,
}: {
  block: ReturnType<ToonReactRuntime['extractBlocks']>[number];
  index: number;
  renderError?: ToonErrorRenderer;
  showErrorDetails?: boolean;
}) {
  const runtime = useToonUI();

  try {
    const ast = runtime.parse(block.raw);
    const result = runtime.validate(ast);
    if (block.complete && !result.ok) {
      const errorState: ToonRenderErrorState = {
        kind: 'validation',
        block,
        message: 'This interface could not be displayed.',
        details: result.errors.map((error) => error.message),
      };

      return renderError
        ? <>{renderError(errorState)}</>
        : <ToonError message={errorState.message} details={showErrorDetails ? errorState.details : []} />;
    }

    return (
      <div data-toon-ui-block style={createStackStyle(runtime.layout.blockGap)}>
        {ast.body.map((node, nodeIndex) => (
          <RegisteredNode key={`${index}-${nodeIndex}`} node={node} nodeKey={`${index}-${nodeIndex}`} blockId={`block-${index}`} />
        ))}
      </div>
    );
  } catch (error) {
    const errorState: ToonRenderErrorState = {
      kind: 'parse',
      block,
      message: 'This interface could not be displayed.',
      details: [error instanceof Error ? error.message : 'Unknown ToonUI error'],
      cause: error,
    };

    return renderError
      ? <>{renderError(errorState)}</>
      : <ToonError message={errorState.message} details={showErrorDetails ? errorState.details : []} />;
  }
}

function ToonRendererInner({
  content,
  renderError,
  showErrorDetails,
}: {
  content: string;
  renderError?: ToonErrorRenderer;
  showErrorDetails?: boolean;
}) {
  const runtime = useToonUI();
  const blocks = runtime.extractBlocks(content);
  if (blocks.length === 0) return null;

  return (
    <div data-toon-ui-renderer style={createStackStyle(runtime.layout.blockGap)}>
      {blocks.map((block, index) => <ToonRenderedBlock key={index} block={block} index={index} renderError={renderError} showErrorDetails={showErrorDetails} />)}
    </div>
  );
}

export function ToonRenderer({
  content,
  runtime,
  onReply,
  onSubmit,
  interactive = true,
  renderError,
  showErrorDetails = false,
}: {
  content: string;
  runtime: ToonReactRuntime;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
  interactive?: boolean;
  renderError?: ToonErrorRenderer;
  showErrorDetails?: boolean;
}) {
  return (
    <ToonProvider runtime={runtime} onReply={onReply} onSubmit={onSubmit} interactive={interactive}>
      <ToonRendererInner content={content} renderError={renderError} showErrorDetails={showErrorDetails} />
    </ToonProvider>
  );
}

export function ToonMessage({
  content,
  runtime,
  onReply,
  onSubmit,
  renderMarkdown = (markdown) => <ReactMarkdown>{markdown}</ReactMarkdown>,
  interactive = true,
  renderError,
  showErrorDetails = false,
}: {
  content: string;
  runtime: ToonReactRuntime;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
  renderMarkdown?: ToonMarkdownRenderer;
  interactive?: boolean;
  renderError?: ToonErrorRenderer;
  showErrorDetails?: boolean;
}) {
  const segments = extractToonSegments(content);

  return (
    <div data-toon-ui-message style={createStackStyle(runtime.layout.messageGap)}>
      <ToonProvider runtime={runtime} onReply={onReply} onSubmit={onSubmit} interactive={interactive}>
        {segments.map((segment, index) => {
          if (segment.type === 'markdown') {
            const markdown = segment.content.trim();
            return markdown ? (
              <div key={`${segment.type}-${segment.start}-${index}`} data-toon-markdown>
                {renderMarkdown(markdown)}
              </div>
            ) : null;
          }

          return <ToonRenderedBlock key={`${segment.type}-${segment.start}-${index}`} block={segment} index={index} renderError={renderError} showErrorDetails={showErrorDetails} />;
        })}
      </ToonProvider>
    </div>
  );
}

export function ToonError({ message, details = [] }: { message: string; details?: string[] }) {
  return (
    <div role="alert" data-toon-error>
      <strong>{message}</strong>
      {details.length > 0 ? (
        <ul>
          {details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

export type ToonTypedNode<TType extends keyof ToonNodeByType> = ToonNodeByType[TType];

function presetTone(variant?: string): React.CSSProperties {
  switch (variant) {
    case 'primary':
    case 'success':
    case 'info':
      return { background: '#111827', color: '#ffffff' };
    case 'neutral':
    case 'secondary':
      return { background: '#e5e7eb', color: '#111827' };
    case 'danger':
      return { background: '#dc2626', color: '#ffffff' };
    case 'warning':
      return { background: '#f59e0b', color: '#111827' };
    case 'ghost':
    case 'outline':
      return { background: 'transparent', color: '#111827', border: '1px solid #d1d5db' };
    default:
      return { background: '#f3f4f6', color: '#111827' };
  }
}

function createPresetSurface(variant?: string): React.CSSProperties {
  const tone = presetTone(variant);
  return {
    border: `1px solid ${variant === 'danger' ? '#fca5a5' : variant === 'warning' ? '#fcd34d' : variant === 'success' ? '#86efac' : variant === 'info' ? '#93c5fd' : '#e5e7eb'}`,
    borderRadius: 12,
    padding: 16,
    display: 'grid',
    gap: 12,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    background: tone.background === 'transparent' ? '#ffffff' : tone.background,
    color: tone.color,
  };
}

export function basicPreset(): ToonReactComponentRegistry {
  return {
    text: ({ node }: ToonTextComponentProps) => <p style={{ margin: 0 }}>{node.value}</p>,
    badge: ({ node }: ToonBadgeComponentProps) => <span style={{ ...presetTone(node.variant), padding: '2px 8px', borderRadius: 999, display: 'inline-flex', width: 'fit-content' }}>{node.label}</span>,
    button: ({ node, sendReply, submitForm, disabled }: ToonButtonComponentProps) => (
      <button
        style={{ ...presetTone(node.variant), padding: '8px 12px', borderRadius: 8 }}
        {...getToonButtonProps({ node, sendReply, submitForm, disabled })}
      >
        {node.label}
      </button>
    ),
    field: ({ node, value, onChange, disabled }: ToonFieldComponentProps) => (
      <label style={{ display: 'grid', gap: 6, width: '100%', minWidth: 0 }}>
        <span>{node.label}</span>
        <input
          style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
          {...getToonInputProps({ node, value, onChange, disabled })}
          aria-required={node.required}
        />
      </label>
    ),
    card: ({ node, children }: ToonCardComponentProps) => (
      <section style={createPresetSurface()}>
        <strong>{node.title}</strong>
        {renderNodeDescription(node.description)}
        {children}
      </section>
    ),
    confirm: ({ node, children }: ToonConfirmComponentProps) => (
      <section style={createPresetSurface(node.variant)}>
        <strong>{node.title}</strong>
        {renderNodeDescription(node.description)}
        {children}
      </section>
    ),
    form: ({ node, children }: ToonFormComponentProps) => (
      <section style={createPresetSurface()}>
        <strong>{node.title}</strong>
        {renderNodeDescription(node.description)}
        {children}
      </section>
    ),
    item: ({ node, children }: ToonItemComponentProps) => (
      <section style={createPresetSurface()}>
        <strong>{node.title}</strong>
        {renderNodeDescription(node.description)}
        {children}
      </section>
    ),
    list: ({ node, children }: ToonListComponentProps) => (
      <section style={{ display: 'grid', gap: 12, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    alert: ({ node, children }: ToonAlertComponentProps) => (
      <section style={createPresetSurface(node.variant)}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    empty: ({ node, children }: ToonEmptyComponentProps) => (
      <section style={createPresetSurface()}>
        <strong>{node.title}</strong>
        {renderNodeDescription(node.description)}
        {children}
      </section>
    ),
    table: ({ node }: ToonTableComponentProps) => (
      <table>
        <thead>
          <tr>{node.columns.map((column: string) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {node.rows.map((row: string[], rowIndex: number) => (
            <tr key={rowIndex}>{row.map((cell: string, cellIndex: number) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    ),
  };
}
