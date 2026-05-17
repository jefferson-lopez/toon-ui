import { z } from 'zod';
import { ALERT_VARIANTS, BADGE_VARIANTS, BUTTON_VARIANTS, FIELD_TYPES, type FieldNode, type ToonDocument, type ToonNode, type ValidationIssue, type ValidationResult } from './types';

const buttonVariantSchema = z.enum(BUTTON_VARIANTS);
const badgeVariantSchema = z.enum(BADGE_VARIANTS);
const alertVariantSchema = z.enum(ALERT_VARIANTS);
const fieldTypeSchema = z.enum(FIELD_TYPES);

function issue(code: ValidationIssue['code'], message: string, line?: number, column?: number): ValidationIssue {
  return { code, message, line, column };
}

function ensureNoUnsafeText(node: ToonNode, issues: ValidationIssue[]): void {
  if (node.type === 'text' && /<[^>]+>|\b(script|javascript:|onerror=|onclick=)\b/i.test(node.value)) {
    issues.push(issue('UNSAFE_CONTENT', 'Raw HTML or script-like content is not allowed in text nodes.', node.line, node.column));
  }
}

function validateFieldNode(field: FieldNode, issues: ValidationIssue[]): void {
  if (!field.name.trim()) {
    issues.push(issue('MISSING_REQUIRED_FIELD', 'Fields must include a name.', field.line, field.column));
  }
  if (!field.label.trim()) {
    issues.push(issue('MISSING_REQUIRED_FIELD', 'Fields must include a label.', field.line, field.column));
  }
  if (!fieldTypeSchema.safeParse(field.fieldType).success) {
    issues.push(issue('INVALID_PROP', `Invalid field type: ${field.fieldType}`, field.line, field.column));
  }
}

function visit(node: ToonNode, issues: ValidationIssue[]): void {
  ensureNoUnsafeText(node, issues);

  switch (node.type) {
    case 'button': {
      if (!buttonVariantSchema.safeParse(node.variant).success) {
        issues.push(issue('INVALID_VARIANT', `Invalid button variant: ${node.variant}`, node.line, node.column));
      }
      if (node.action.kind === 'reply' && !node.action.value.trim()) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Reply actions require a non-empty value.', node.line, node.column));
      }
      break;
    }
    case 'badge': {
      if (!badgeVariantSchema.safeParse(node.variant).success) {
        issues.push(issue('INVALID_VARIANT', `Invalid badge variant: ${node.variant}`, node.line, node.column));
      }
      break;
    }
    case 'alert': {
      if (!alertVariantSchema.safeParse(node.variant).success) {
        issues.push(issue('INVALID_VARIANT', `Invalid alert variant: ${node.variant}`, node.line, node.column));
      }
      node.children.forEach((child) => visit(child, issues));
      break;
    }
    case 'field': {
      validateFieldNode(node, issues);
      break;
    }
    case 'form': {
      const fields = node.children.filter((child) => child.type === 'field');
      const submitButtons = node.children.filter((child) => child.type === 'button' && child.action.kind === 'submit');
      if (fields.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Forms must include at least one field.', node.line, node.column));
      }
      if (submitButtons.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Forms must include a submit button.', node.line, node.column));
      }
      node.children.forEach((child) => visit(child, issues));
      break;
    }
    case 'confirm':
    case 'card':
    case 'item': {
      node.children.forEach((child) => visit(child, issues));
      break;
    }
    case 'list': {
      node.children.forEach((child) => {
        if (child.type !== 'item') {
          issues.push(issue('INVALID_NESTING', 'Lists can only contain item nodes.', child.line, child.column));
        }
        visit(child, issues);
      });
      break;
    }
    case 'table': {
      if (node.columns.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Tables must declare columns.', node.line, node.column));
      }
      node.rows.forEach((row, index) => {
        if (row.length !== node.columns.length) {
          issues.push(issue('INVALID_PROP', `Row ${index + 1} does not match column count.`, node.line, node.column));
        }
      });
      break;
    }
    default:
      break;
  }
}

export function validateToonUI(document: ToonDocument): ValidationResult {
  const errors: ValidationIssue[] = [];
  document.body.forEach((node) => visit(node, errors));
  return { ok: errors.length === 0, errors, warnings: [] };
}
