import React, { createContext, useContext, useMemo, useState } from 'react';
import type {
  AlertNode,
  BadgeNode,
  ButtonNode,
  CardNode,
  ConfirmNode,
  FieldNode,
  FormNode,
  ItemNode,
  ListNode,
  ReplyPayload,
  SubmitPayload,
  TableNode,
  TextNode,
  ToonNode,
  ToonNodeByType,
  ToonRuntime,
} from '@toon-ui/core';

export type ToonFieldValue = string | number | boolean;

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
  formatSubmitMessage: ToonRuntime['formatSubmitMessage'];
  formatReplyMessage: ToonRuntime['formatReplyMessage'];
}

type BaseProps<TNode extends ToonNode> = {
  node: TNode;
  children?: React.ReactNode;
  context: ToonRenderContextValue;
};

export type ToonTextComponentProps = BaseProps<TextNode>;
export type ToonCardComponentProps = BaseProps<CardNode>;
export type ToonConfirmComponentProps = BaseProps<ConfirmNode>;
export type ToonListComponentProps = BaseProps<ListNode>;
export type ToonItemComponentProps = BaseProps<ItemNode>;
export type ToonBadgeComponentProps = BaseProps<BadgeNode>;
export type ToonAlertComponentProps = BaseProps<AlertNode>;
export type ToonTableComponentProps = BaseProps<TableNode>;
export type ToonButtonComponentProps = BaseProps<ButtonNode> & {
  sendReply: (reply?: string) => void;
  submitForm: () => void;
};
export type ToonFieldComponentProps = BaseProps<FieldNode> & {
  value: ToonFieldValue | undefined;
  onChange: (value: ToonFieldValue) => void;
};
export type ToonFormComponentProps = BaseProps<FormNode> & {
  submitForm: () => void;
  values: Record<string, ToonFieldValue>;
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
}

export type ToonReactComponentRegistry = Partial<{
  [K in keyof ToonReactComponentPropsByType]: React.ComponentType<ToonReactComponentPropsByType[K]>;
}>;

export type ToonReactRuntime = ToonRuntime<ToonReactComponentRegistry>;

const ToonRuntimeContext = createContext<ToonReactRuntime | null>(null);
const ToonRenderContext = createContext<ToonRenderContextValue | null>(null);

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

function getDefaultFieldValue(field: FieldNode): ToonFieldValue {
  return field.fieldType === 'checkbox' ? false : '';
}

function normalizeFieldValue(field: FieldNode, value: ToonFieldValue): ToonFieldValue {
  if (field.fieldType === 'number') {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (field.fieldType === 'checkbox') {
    return Boolean(value);
  }
  return value;
}

export function ToonProvider({
  runtime,
  children,
  onReply,
  onSubmit,
}: {
  runtime: ToonReactRuntime;
  children: React.ReactNode;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
}) {
  const [formState, setFormState] = useState<Record<string, Record<string, ToonFieldValue>>>({});

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
    formatSubmitMessage: runtime.formatSubmitMessage,
    formatReplyMessage: runtime.formatReplyMessage,
  }), [formState, onReply, onSubmit, runtime]);

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
    formatSubmitMessage: runtime.formatSubmitMessage,
    formatReplyMessage: runtime.formatReplyMessage,
  };
}

function useToonRenderContext() {
  const context = useContext(ToonRenderContext);
  if (!context) {
    throw new Error('Toon rendering requires ToonProvider.');
  }
  return context;
}

function renderFallback(node: ToonNode, children: React.ReactNode, form: FormNode | undefined, context: ToonRenderContextValue, key: React.Key): React.ReactNode {
  switch (node.type) {
    case 'text':
      return <p key={key}>{node.value}</p>;
    case 'badge':
      return <span key={key}>{node.label}</span>;
    case 'button':
      return (
        <button
          key={key}
          type="button"
          onClick={() => node.action.kind === 'reply' ? context.sendReply({ kind: 'ui_reply', eventId: createEventId('reply'), source: 'button', component: 'button', value: node.action.value, line: node.line, node }) : form ? context.submitForm(form) : undefined}
        >
          {node.label}
        </button>
      );
    case 'field':
      return (
        <label key={key}>
          {node.label}
          <input
            name={node.name}
            value={String(context.getFieldValue(form, node) ?? '')}
            onChange={(event) => context.setFieldValue(form, node, event.target.value)}
          />
        </label>
      );
    case 'card':
    case 'confirm':
    case 'form':
    case 'item':
    case 'alert':
      return <section key={key}><strong>{node.title}</strong><div>{children}</div></section>;
    case 'list':
      return <section key={key}><strong>{node.title}</strong><div>{children}</div></section>;
    case 'table':
      return <pre key={key}>{JSON.stringify({ columns: node.columns, rows: node.rows }, null, 2)}</pre>;
    default:
      return null;
  }
}

function RegisteredNode({ node, form, nodeKey }: { node: ToonNode; form?: FormNode; nodeKey: React.Key }) {
  const runtime = useToonUI();
  const context = useToonRenderContext();
  const activeForm = node.type === 'form' ? node : form;
  const children = 'children' in node ? node.children.map((child, index) => <RegisteredNode key={`${String(nodeKey)}-${index}`} node={child} form={activeForm} nodeKey={`${String(nodeKey)}-${index}`} />) : undefined;

  switch (node.type) {
    case 'text': {
      const Component = runtime.components.text;
      return Component ? <Component node={node} context={context} /> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'badge': {
      const Component = runtime.components.badge;
      return Component ? <Component node={node} context={context} /> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'button': {
      const Component = runtime.components.button;
      const sendReply = (reply = node.action.kind === 'reply' ? node.action.value : '') => {
        if (node.action.kind === 'reply') {
          context.sendReply({ kind: 'ui_reply', eventId: createEventId('reply'), source: 'button', component: 'button', value: reply, line: node.line, node });
        }
      };
      const submitForm = () => {
        if (activeForm) context.submitForm(activeForm);
      };
      return Component
        ? <Component node={node} context={context} sendReply={sendReply} submitForm={submitForm} />
        : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'field': {
      const Component = runtime.components.field;
      const value = context.getFieldValue(activeForm, node);
      const onChange = (nextValue: ToonFieldValue) => context.setFieldValue(activeForm, node, nextValue);
      return Component
        ? <Component node={node} context={context} value={value} onChange={onChange} />
        : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'form': {
      const Component = runtime.components.form;
      const fields = node.children.filter((child): child is FieldNode => child.type === 'field');
      const values = fields.reduce<Record<string, ToonFieldValue>>((accumulator, field) => {
        accumulator[field.name] = context.getFieldValue(node, field) ?? getDefaultFieldValue(field);
        return accumulator;
      }, {});
      const submitForm = () => context.submitForm(node);
      return Component
        ? <Component node={node} context={context} values={values} submitForm={submitForm}>{children}</Component>
        : renderFallback(node, children, node, context, nodeKey);
    }
    case 'card': {
      const Component = runtime.components.card;
      return Component ? <Component node={node} context={context}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'confirm': {
      const Component = runtime.components.confirm;
      return Component ? <Component node={node} context={context}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'list': {
      const Component = runtime.components.list;
      return Component ? <Component node={node} context={context}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'item': {
      const Component = runtime.components.item;
      return Component ? <Component node={node} context={context}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'alert': {
      const Component = runtime.components.alert;
      return Component ? <Component node={node} context={context}>{children}</Component> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    case 'table': {
      const Component = runtime.components.table;
      return Component ? <Component node={node} context={context} /> : renderFallback(node, children, activeForm, context, nodeKey);
    }
    default:
      return null;
  }
}

function ToonRendererInner({ content }: { content: string }) {
  const runtime = useToonUI();
  const blocks = runtime.extractBlocks(content);
  if (blocks.length === 0) return null;

  return (
    <div data-toon-ui-renderer>
      {blocks.map((block, index) => {
        try {
          const ast = runtime.parse(block.raw);
          const result = runtime.validate(ast);
          if (!result.ok) {
            return <ToonError key={index} message="La interfaz generada no es válida." details={result.errors.map((error) => error.message)} />;
          }

          return (
            <div key={index} data-toon-ui-block>
              {ast.body.map((node, nodeIndex) => (
                <RegisteredNode key={`${index}-${nodeIndex}`} node={node} nodeKey={`${index}-${nodeIndex}`} />
              ))}
            </div>
          );
        } catch (error) {
          return <ToonError key={index} message="La interfaz generada no es válida." details={[error instanceof Error ? error.message : 'Unknown ToonUI error']} />;
        }
      })}
    </div>
  );
}

export function ToonRenderer({
  content,
  runtime,
  onReply,
  onSubmit,
}: {
  content: string;
  runtime: ToonReactRuntime;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
}) {
  return (
    <ToonProvider runtime={runtime} onReply={onReply} onSubmit={onSubmit}>
      <ToonRendererInner content={content} />
    </ToonProvider>
  );
}

export function ToonMessage({
  content,
  runtime,
  onReply,
  onSubmit,
}: {
  content: string;
  runtime: ToonReactRuntime;
  onReply?: (payload: ToonReplyPayload) => void;
  onSubmit?: (payload: ToonSubmitPayload) => void;
}) {
  const blocks = runtime.extractBlocks(content);
  const markdown = content.replace(/```toon-ui[\s\S]*?```/g, '').trim();

  return (
    <div data-toon-ui-message>
      {markdown ? <div data-toon-markdown>{markdown}</div> : null}
      {blocks.length > 0 ? <ToonRenderer content={content} runtime={runtime} onReply={onReply} onSubmit={onSubmit} /> : null}
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
