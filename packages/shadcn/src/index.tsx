import React from 'react';
import type {
  ToonAlertComponentProps,
  ToonBadgeComponentProps,
  ToonButtonComponentProps,
  ToonCardComponentProps,
  ToonConfirmComponentProps,
  ToonFieldComponentProps,
  ToonFormComponentProps,
  ToonItemComponentProps,
  ToonListComponentProps,
  ToonReactComponentRegistry,
  ToonTableComponentProps,
  ToonTextComponentProps,
} from '@toon-ui/react';

function tone(variant?: string): React.CSSProperties {
  switch (variant) {
    case 'primary':
    case 'success':
    case 'info':
      return { background: '#111827', color: '#ffffff' };
    case 'secondary':
    case 'neutral':
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

export function shadcnPreset(): ToonReactComponentRegistry {
  return {
    text: ({ node }: ToonTextComponentProps) => <p>{node.value}</p>,
    badge: ({ node }: ToonBadgeComponentProps) => <span style={{ ...tone(node.variant), padding: '2px 8px', borderRadius: 999 }}>{node.label}</span>,
    button: ({ node, sendReply, submitForm }: ToonButtonComponentProps) => (
      <button
        type="button"
        style={{ ...tone(node.variant), padding: '8px 12px', borderRadius: 8 }}
        onClick={() => node.action.kind === 'reply' ? sendReply(node.action.value) : submitForm()}
      >
        {node.label}
      </button>
    ),
    field: ({ node, value, onChange }: ToonFieldComponentProps) => (
      <label style={{ display: 'grid', gap: 6 }}>
        <span>{node.label}</span>
        <input
          name={node.name}
          type={node.fieldType === 'textarea' || node.fieldType === 'select' || node.fieldType === 'checkbox' ? 'text' : node.fieldType}
          aria-required={node.required}
          value={typeof value === 'boolean' ? String(value) : (value ?? '')}
          onChange={(event) => onChange(node.fieldType === 'checkbox' ? event.currentTarget.checked : event.currentTarget.value)}
        />
      </label>
    ),
    card: ({ node, children }: ToonCardComponentProps) => (
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    confirm: ({ node, children }: ToonConfirmComponentProps) => (
      <section style={{ border: '1px solid #fca5a5', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    form: ({ node, children }: ToonFormComponentProps) => (
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    item: ({ node, children }: ToonItemComponentProps) => (
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    list: ({ node, children }: ToonListComponentProps) => (
      <section style={{ display: 'grid', gap: 12 }}>
        <strong>{node.title}</strong>
        {children}
      </section>
    ),
    alert: ({ node, children }: ToonAlertComponentProps) => (
      <section style={{ ...tone(node.variant), borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
        <strong>{node.title}</strong>
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

export const shadcnAdapter = shadcnPreset;
