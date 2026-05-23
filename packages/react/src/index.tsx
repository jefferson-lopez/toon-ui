import React, { createContext, memo, useContext, useMemo, useRef, useState } from 'react';
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
import { createToonCatalog, createToonCoreRuntime } from '@toon-ui/core';

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
export type ToonGenericComponentProps<TType extends keyof ToonNodeByType> = BaseProps<ToonNodeByType[TType]>;
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

export type ToonReactComponentPropsByType = {
  [K in keyof ToonNodeByType]: ToonGenericComponentProps<K>;
} & {
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
};

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
  'heading',
  'separator',
  'tabs',
  'tab',
  'accordion',
  'section',
  'dialog',
  'sheet',
  'popover',
  'tooltip',
  'progress',
  'loading',
  'toast',
  'breadcrumb',
  'crumb',
  'pagination',
  'menu',
  'command',
  'action',
  'chart',
  'series',
  'point',
] as const;

export type ToonReactAdapterComponentKey = (typeof TOON_REACT_ADAPTER_KEYS)[number];

export type ToonReactComponentRegistry = Partial<{
  [K in keyof ToonReactComponentPropsByType]: React.ComponentType<ToonReactComponentPropsByType[K]>;
}>;

export type ToonReactAdapterLevel = 'minimal' | 'strict';

export interface ToonReactAdapterMeta {
  level: ToonReactAdapterLevel;
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
  components?: ToonReactComponentRegistry;
  adapterLevel?: ToonReactAdapterLevel;
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
  const level = options.level ?? 'minimal';
  const components = mergeToonComponentRegistry(options.components);

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

  const adapter = options.adapter ?? createToonReactAdapter({
    level: options.adapterLevel ?? 'minimal',
    components: options.components,
  });
  if (adapter.meta.providedKeys.length === 0) {
    throw new Error('createToonReactRuntime requires a ToonUI component catalog. Pass components or an explicit adapter.');
  }

  return {
    ...createToonCoreRuntime<ToonReactComponentRegistry>({
      components: adapter.components,
      catalog: createToonCatalog({ components: adapter.components }),
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
  const onReplyRef = useRef<typeof onReply>(onReply);
  const onSubmitRef = useRef<typeof onSubmit>(onSubmit);
  onReplyRef.current = onReply;
  onSubmitRef.current = onSubmit;

  const contextValue = useMemo<ToonRenderContextValue>(() => ({
    sendReply: (payload) => {
      onReplyRef.current?.(payload);
    },
    submitForm: (form) => {
      const fields = form.children.filter((child): child is FieldNode => child.type === 'field');
      const key = getFormKey(form);
      const existing = formState[key] ?? {};
      const values = fields.reduce<Record<string, ToonFieldValue>>((accumulator, field) => {
        accumulator[field.name] = existing[field.name] ?? getDefaultFieldValue(field);
        return accumulator;
      }, {});

      onSubmitRef.current?.({
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
  }), [formState, interactive, resolvedBlocks]);

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

function renderFallback(node: ToonNode, _children: React.ReactNode, _form: FormNode | undefined, _context: ToonRenderContextValue, key: React.Key, _blockResolved = false): React.ReactNode {
  return (
    <ToonError
      key={key}
      message={`Component "${node.type}" is not registered in the active ToonUI React adapter.`}
      details={['Register this standard ToonUI component or remove it from the server catalog used to generate toon.prompt.']}
    />
  );
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
    default: {
      const Component = runtime.components[node.type as keyof ToonReactComponentRegistry] as React.ComponentType<BaseProps<ToonNode>> | undefined;
      return Component ? <Component node={node} context={context} disabled={blockResolved}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey, blockResolved);
    }
  }
}

function ToonRenderedBlockComponent({
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
  const parsed = useMemo(() => {
    try {
      const ast = runtime.parse(block.raw);
      const result = runtime.validate(ast, runtime.catalog);

      return { kind: 'success' as const, ast, result };
    } catch (error) {
      return { kind: 'parse-error' as const, error };
    }
  }, [block.raw, runtime]);

  if (parsed.kind === 'parse-error') {
    const errorState: ToonRenderErrorState = {
      kind: 'parse',
      block,
      message: 'This interface could not be displayed.',
      details: [parsed.error instanceof Error ? parsed.error.message : 'Unknown ToonUI error'],
      cause: parsed.error,
    };

    return renderError
      ? <>{renderError(errorState)}</>
      : <ToonError message={errorState.message} details={showErrorDetails ? errorState.details : []} />;
  }

  if (block.complete && !parsed.result.ok) {
    const errorState: ToonRenderErrorState = {
      kind: 'validation',
      block,
      message: 'This interface could not be displayed.',
      details: parsed.result.errors.map((error) => error.message),
    };

    return renderError
      ? <>{renderError(errorState)}</>
      : <ToonError message={errorState.message} details={showErrorDetails ? errorState.details : []} />;
  }

  return (
    <div data-toon-ui-block style={createStackStyle(runtime.layout.blockGap)}>
      {parsed.ast.body.map((node, nodeIndex) => (
        <RegisteredNode key={`${index}-${nodeIndex}`} node={node} nodeKey={`${index}-${nodeIndex}`} blockId={`block-${index}`} />
      ))}
    </div>
  );
}

const ToonRenderedBlock = memo(ToonRenderedBlockComponent, (previous, next) => (
  previous.index === next.index
  && previous.block.raw === next.block.raw
  && previous.block.start === next.block.start
  && previous.block.end === next.block.end
  && previous.block.complete === next.block.complete
  && previous.renderError === next.renderError
  && previous.showErrorDetails === next.showErrorDetails
));

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
  const blocks = useMemo(() => runtime.extractBlocks(content), [content, runtime]);
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

export interface ToonMessageProps {
  content: string;
  runtime: ToonReactRuntime;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
  renderMarkdown?: ToonMarkdownRenderer;
  interactive?: boolean;
  renderError?: ToonErrorRenderer;
  showErrorDetails?: boolean;
}

function ToonMessageComponent({
  content,
  runtime,
  onReply,
  onSubmit,
  renderMarkdown = (markdown) => <ReactMarkdown>{markdown}</ReactMarkdown>,
  interactive = true,
  renderError,
  showErrorDetails = false,
}: ToonMessageProps) {
  const segments = useMemo(() => extractToonSegments(content), [content]);

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

export const ToonMessage = memo(ToonMessageComponent, (previous, next) => (
  previous.content === next.content
  && previous.runtime === next.runtime
  && previous.onReply === next.onReply
  && previous.onSubmit === next.onSubmit
  && previous.renderMarkdown === next.renderMarkdown
  && previous.interactive === next.interactive
  && previous.renderError === next.renderError
  && previous.showErrorDetails === next.showErrorDetails
));

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
