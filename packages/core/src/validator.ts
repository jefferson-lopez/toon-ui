import { z } from 'zod';
import { TOON_ALERT_VARIANTS as ALERT_VARIANTS, TOON_BADGE_VARIANTS as BADGE_VARIANTS, TOON_BUTTON_VARIANTS as BUTTON_VARIANTS, TOON_CATALOG, TOON_CHART_TYPES as CHART_TYPES, TOON_CONFIRM_VARIANTS as CONFIRM_VARIANTS, TOON_FIELD_TYPES as FIELD_TYPES, TOON_SEPARATOR_ORIENTATIONS as SEPARATOR_ORIENTATIONS, TOON_SHEET_SIDES as SHEET_SIDES, type ToonActiveCatalog } from './catalog';
import { type ActionNode, type ChartNode, type ConfirmNode, type CrumbNode, type FieldNode, type ToonDocument, type ToonNode, type ValidationIssue, type ValidationResult } from './types';

const buttonVariantSchema = z.enum(BUTTON_VARIANTS);
const badgeVariantSchema = z.enum(BADGE_VARIANTS);
const alertVariantSchema = z.enum(ALERT_VARIANTS);
const confirmVariantSchema = z.enum(CONFIRM_VARIANTS);
const fieldTypeSchema = z.enum(FIELD_TYPES);
const chartTypeSchema = z.enum(CHART_TYPES);
const sheetSideSchema = z.enum(SHEET_SIDES);
const separatorOrientationSchema = z.enum(SEPARATOR_ORIENTATIONS);

function validateReplyLikeAction(node: ActionNode | CrumbNode | { line: number; column: number; action?: { kind: 'reply'; value: string } | { kind: 'submit' } }, issues: ValidationIssue[]): void {
  if (node.action?.kind === 'reply' && !node.action.value.trim()) {
    issues.push(issue('MISSING_REQUIRED_FIELD', 'Reply actions require a non-empty value.', node.line, node.column));
  }
}

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
  if (['select', 'radio', 'multiselect'].includes(field.fieldType) && (!field.options || field.options.length === 0)) {
    issues.push(issue('MISSING_REQUIRED_FIELD', `${field.fieldType} fields must include options.`, field.line, field.column));
  }
  if (['slider'].includes(field.fieldType)) {
    if (field.min === undefined || field.max === undefined) {
      issues.push(issue('MISSING_REQUIRED_FIELD', 'Slider fields must include min and max.', field.line, field.column));
    }
  }
}

function validateConfirmNode(confirm: ConfirmNode, issues: ValidationIssue[], catalog: ToonActiveCatalog): void {
  if (!confirmVariantSchema.safeParse(confirm.variant).success) {
    issues.push(issue('INVALID_VARIANT', `Invalid confirm variant: ${confirm.variant}`, confirm.line, confirm.column));
  }
  confirm.children.forEach((child) => visit(child, issues, catalog));
}

function validateChartNode(chart: ChartNode, issues: ValidationIssue[], catalog: ToonActiveCatalog): void {
  if (!chartTypeSchema.safeParse(chart.chartType).success) {
    issues.push(issue('INVALID_PROP', `Invalid chart type: ${chart.chartType}`, chart.line, chart.column));
  }
  if (chart.children.length === 0) {
    issues.push(issue('MISSING_REQUIRED_FIELD', 'Charts must include at least one series.', chart.line, chart.column));
  }
  chart.children.forEach((series) => {
    if (!catalog.components.series) {
      issues.push(issue('INVALID_COMPONENT', 'Component "series" is not enabled in the active ToonUI catalog.', series.line, series.column));
      return;
    }
    if (series.type !== 'series') {
      issues.push(issue('INVALID_NESTING', 'Charts can only contain series nodes.', series.line, series.column));
      return;
    }
    if (series.children.length === 0) {
      issues.push(issue('MISSING_REQUIRED_FIELD', 'Chart series must include at least one point.', series.line, series.column));
    }
    series.children.forEach((point) => {
      if (!catalog.components.point) {
        issues.push(issue('INVALID_COMPONENT', 'Component "point" is not enabled in the active ToonUI catalog.', point.line, point.column));
        return;
      }
      if (point.type !== 'point') {
        issues.push(issue('INVALID_NESTING', 'Chart series can only contain point nodes.', point.line, point.column));
      }
    });
  });
}

function visit(node: ToonNode, issues: ValidationIssue[], catalog: ToonActiveCatalog): void {
  if (!catalog.components[node.type as keyof typeof catalog.components]) {
    issues.push(issue('INVALID_COMPONENT', `Component "${node.type}" is not enabled in the active ToonUI catalog.`, node.line, node.column));
    return;
  }

  ensureNoUnsafeText(node, issues);

  switch (node.type) {
    case 'button': {
      if (!buttonVariantSchema.safeParse(node.variant).success) {
        issues.push(issue('INVALID_VARIANT', `Invalid button variant: ${node.variant}`, node.line, node.column));
      }
      validateReplyLikeAction(node, issues);
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
      node.children.forEach((child) => visit(child, issues, catalog));
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
      node.children.forEach((child) => visit(child, issues, catalog));
      break;
    }
    case 'confirm':
      validateConfirmNode(node, issues, catalog);
      break;
    case 'card':
    case 'item': {
      node.children.forEach((child) => visit(child, issues, catalog));
      break;
    }
    case 'heading': {
      if (node.level < 1 || node.level > 6) {
        issues.push(issue('INVALID_PROP', `Invalid heading level: ${node.level}`, node.line, node.column));
      }
      break;
    }
    case 'separator': {
      if (!separatorOrientationSchema.safeParse(node.orientation).success) {
        issues.push(issue('INVALID_PROP', `Invalid separator orientation: ${node.orientation}`, node.line, node.column));
      }
      break;
    }
    case 'list': {
      node.children.forEach((child) => {
        if (child.type !== 'item') {
          issues.push(issue('INVALID_NESTING', 'Lists can only contain item nodes.', child.line, child.column));
        }
        visit(child, issues, catalog);
      });
      break;
    }
    case 'empty':
    case 'dialog':
    case 'popover': {
      node.children.forEach((child) => visit(child, issues, catalog));
      break;
    }
    case 'tabs': {
      if (node.children.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Tabs must include at least one tab.', node.line, node.column));
      }
      node.children.forEach((child) => {
        if (child.type !== 'tab') {
          issues.push(issue('INVALID_NESTING', 'Tabs can only contain tab nodes.', child.line, child.column));
          return;
        }
        if (!catalog.components.tab) {
          issues.push(issue('INVALID_COMPONENT', 'Component "tab" is not enabled in the active ToonUI catalog.', child.line, child.column));
          return;
        }
        child.children.forEach((grandChild) => visit(grandChild, issues, catalog));
      });
      break;
    }
    case 'accordion': {
      if (node.children.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Accordion must include at least one section.', node.line, node.column));
      }
      node.children.forEach((child) => {
        if (child.type !== 'section') {
          issues.push(issue('INVALID_NESTING', 'Accordion can only contain section nodes.', child.line, child.column));
          return;
        }
        if (!catalog.components.section) {
          issues.push(issue('INVALID_COMPONENT', 'Component "section" is not enabled in the active ToonUI catalog.', child.line, child.column));
          return;
        }
        child.children.forEach((grandChild) => visit(grandChild, issues, catalog));
      });
      break;
    }
    case 'sheet': {
      if (!sheetSideSchema.safeParse(node.side).success) {
        issues.push(issue('INVALID_PROP', `Invalid sheet side: ${node.side}`, node.line, node.column));
      }
      node.children.forEach((child) => visit(child, issues, catalog));
      break;
    }
    case 'tooltip':
    case 'loading':
      break;
    case 'progress': {
      if (node.max <= 0 || node.value < 0 || node.value > node.max) {
        issues.push(issue('INVALID_PROP', 'Progress value must be between 0 and max.', node.line, node.column));
      }
      break;
    }
    case 'toast': {
      if (!alertVariantSchema.safeParse(node.variant).success) {
        issues.push(issue('INVALID_VARIANT', `Invalid toast variant: ${node.variant}`, node.line, node.column));
      }
      break;
    }
    case 'breadcrumb': {
      if (node.children.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', 'Breadcrumb must include at least one crumb.', node.line, node.column));
      }
      node.children.forEach((child) => {
        if (child.type !== 'crumb') {
          issues.push(issue('INVALID_NESTING', 'Breadcrumb can only contain crumb nodes.', child.line, child.column));
          return;
        }
        validateReplyLikeAction(child, issues);
      });
      break;
    }
    case 'pagination': {
      if (node.page < 1 || node.totalPages < 1 || node.page > node.totalPages) {
        issues.push(issue('INVALID_PROP', 'Pagination page must be between 1 and totalPages.', node.line, node.column));
      }
      break;
    }
    case 'menu':
    case 'command': {
      if (node.children.length === 0) {
        issues.push(issue('MISSING_REQUIRED_FIELD', `${node.type} must include at least one action.`, node.line, node.column));
      }
      node.children.forEach((child) => {
        if (child.type !== 'action') {
          issues.push(issue('INVALID_NESTING', `${node.type} can only contain action nodes.`, child.line, child.column));
          return;
        }
        if (child.variant && !buttonVariantSchema.safeParse(child.variant).success) {
          issues.push(issue('INVALID_VARIANT', `Invalid action variant: ${child.variant}`, child.line, child.column));
        }
        validateReplyLikeAction(child, issues);
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
    case 'chart': {
      validateChartNode(node, issues, catalog);
      break;
    }
    default:
      break;
  }
}

export function validateToonUI(document: ToonDocument, catalog: ToonActiveCatalog = TOON_CATALOG): ValidationResult {
  const errors: ValidationIssue[] = [];
  document.body.forEach((node) => visit(node, errors, catalog));
  return { ok: errors.length === 0, errors, warnings: [] };
}
