import {
  OFFICIAL_COMPONENT_KEYS,
  type ActionNode,
  type AccordionNode,
  type AlertNode,
  type BadgeNode,
  type BreadcrumbNode,
  type ButtonNode,
  type CardNode,
  type ChartNode,
  type ChartPointNode,
  type ChartSeriesNode,
  type CommandNode,
  type ConfirmNode,
  type CrumbNode,
  type DialogNode,
  type EmptyNode,
  type FieldNode,
  type FormNode,
  type HeadingNode,
  type ItemNode,
  type ListNode,
  type LoadingNode,
  type MenuNode,
  type PaginationNode,
  type PopoverNode,
  type ProgressNode,
  type SectionNode,
  type SeparatorNode,
  type SheetNode,
  type TabNode,
  type TableNode,
  type TabsNode,
  type TextNode,
  type ToastNode,
  type ToonDocument,
  type ToonErrorCode,
  type ToonNode,
  type TooltipNode,
  type ValidationIssue,
} from './types';

interface StackEntry {
  indent: number;
  node: ToonNode | ToonDocument;
}

export class ToonSyntaxError extends Error {
  code: ToonErrorCode;
  line: number;
  column: number;

  constructor(issue: ValidationIssue) {
    super(issue.message);
    this.name = 'ToonSyntaxError';
    this.code = issue.code;
    this.line = issue.line ?? 1;
    this.column = issue.column ?? 1;
  }
}

const quoted = /"([^"]*)"/g;

function getIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function getQuotedValues(input: string): string[] {
  return [...input.matchAll(quoted)].map((match) => match[1]);
}

function getStringAttribute(input: string, name: string): string | undefined {
  return input.match(new RegExp(`${name}="([^"]*)"`))?.[1];
}

function getNumberAttribute(input: string, name: string): number | undefined {
  const value = input.match(new RegExp(`${name}=([^\s]+)`))?.[1];
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getBooleanAttribute(input: string, name: string): boolean | undefined {
  const value = input.match(new RegExp(`${name}=(true|false)`))?.[1];
  if (value === undefined) return undefined;
  return value === 'true';
}

function getDelimitedAttribute(input: string, name: string, delimiter = '|'): string[] | undefined {
  const value = getStringAttribute(input, name);
  if (!value) return undefined;
  return value.split(delimiter).map((entry) => entry.trim()).filter(Boolean);
}

function parseDelimitedValues(input: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      const value = current.trim();
      if (value) {
        values.push(value);
      }
      current = '';
      continue;
    }

    current += character;
  }

  const finalValue = current.trim();
  if (finalValue) {
    values.push(finalValue);
  }

  return values.map((value) => value.replace(/^"(.*)"$/s, '$1').trim());
}

function parseActionDescriptor(input: string, line: number, column: number) {
  const replyMatch = input.match(/reply="([^"]+)"/);
  const isSubmit = /\bsubmit\b/.test(input);
  if (!replyMatch && !isSubmit) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: action requires reply or submit.`, line, column);
  return replyMatch ? { kind: 'reply' as const, value: replyMatch[1] } : { kind: 'submit' as const };
}

function parseFieldValue(fieldType: FieldNode['fieldType'], input: string): FieldNode['value'] {
  if (fieldType === 'multiselect') {
    return input.split('|').map((entry) => entry.trim()).filter(Boolean);
  }
  if (fieldType === 'checkbox' || fieldType === 'switch') {
    return input === 'true';
  }
  if (fieldType === 'number' || fieldType === 'slider') {
    const parsed = Number(input);
    return Number.isNaN(parsed) ? input : parsed;
  }
  return input;
}

function getVariantBeforeQuotedValue(input: string, prefix: string): string | undefined {
  const head = input.slice(prefix.length).trim();
  if (head.startsWith('"')) return undefined;
  return head.split(/\s+/)[0];
}

function syntaxIssue(code: ToonErrorCode, message: string, line: number, column = 1): never {
  throw new ToonSyntaxError({ code, message, line, column });
}

function basePosition(line: number, raw: string) {
  return { line, column: getIndent(raw) + 1 };
}

function parseLine(content: string, line: number, column: number): ToonNode {
  if (content.startsWith('text ')) {
    const [value] = getQuotedValues(content);
    if (value === undefined) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: text requires a quoted value.`, line, column);
    return { type: 'text', value, line, column } satisfies TextNode;
  }

  if (content.startsWith('heading ')) {
    const [text] = getQuotedValues(content);
    const level = Number(content.trim().split(/\s+/)[1]);
    if (!text || Number.isNaN(level)) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: heading requires level and quoted text.`, line, column);
    return { type: 'heading', level: level as HeadingNode['level'], text, line, column } satisfies HeadingNode;
  }

  if (content.startsWith('separator')) {
    const orientation = content.trim().split(/\s+/)[1] ?? 'horizontal';
    return { type: 'separator', orientation: orientation as SeparatorNode['orientation'], line, column } satisfies SeparatorNode;
  }

  if (content.startsWith('badge ')) {
    const [label] = getQuotedValues(content);
    const variant = content.trim().split(/\s+/).at(-1);
    if (!label || !variant) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: badge requires label and variant.`, line, column);
    return { type: 'badge', label, variant: variant as BadgeNode['variant'], line, column };
  }

  if (content.startsWith('button ')) {
    const [label] = getQuotedValues(content);
    const variant = content.trim().split(/\s+/)[1];
    if (!label || !variant) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: button requires variant and label.`, line, column);
    return {
      type: 'button',
      variant: variant as ButtonNode['variant'],
      label,
      action: parseActionDescriptor(content, line, column),
      line,
      column,
    } satisfies ButtonNode;
  }

  if (content.startsWith('field ')) {
    const tokens = content.trim().split(/\s+/);
    const [label] = getQuotedValues(content);
    const fieldType = tokens[2] as FieldNode['fieldType'];
    if (tokens.length < 4 || !label) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: field requires name, type and label.`, line, column);
    const value = getStringAttribute(content, 'value');
    return {
      type: 'field',
      name: tokens[1],
      fieldType,
      label,
      placeholder: getStringAttribute(content, 'placeholder'),
      helper: getStringAttribute(content, 'helper'),
      required: /\brequired\b/.test(content),
      options: getDelimitedAttribute(content, 'options'),
      min: getNumberAttribute(content, 'min'),
      max: getNumberAttribute(content, 'max'),
      step: getNumberAttribute(content, 'step'),
      value: value === undefined ? undefined : parseFieldValue(fieldType, value),
      line,
      column,
    } satisfies FieldNode;
  }

  if (content.startsWith('card ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: card requires a title and nested block.`, line, column);
    return { type: 'card', title, children: [], line, column } satisfies CardNode;
  }

  if (content.startsWith('confirm ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: confirm requires a title and nested block.`, line, column);
    return {
      type: 'confirm',
      variant: (getVariantBeforeQuotedValue(content, 'confirm') ?? 'neutral') as ConfirmNode['variant'],
      title,
      children: [],
      line,
      column,
    } satisfies ConfirmNode;
  }

  if (content.startsWith('form ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: form requires a title and nested block.`, line, column);
    return { type: 'form', title, children: [], line, column } satisfies FormNode;
  }

  if (content.startsWith('list ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: list requires a title and nested block.`, line, column);
    return { type: 'list', title, children: [], line, column } satisfies ListNode;
  }

  if (content.startsWith('item ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: item requires a title and nested block.`, line, column);
    return { type: 'item', title, children: [], line, column } satisfies ItemNode;
  }

  if (content.startsWith('alert ')) {
    const parts = content.trim().split(/\s+/);
    const [title] = getQuotedValues(content);
    if (parts.length < 2 || !title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: alert requires variant, title and nested block.`, line, column);
    return { type: 'alert', variant: parts[1] as AlertNode['variant'], title, children: [], line, column } satisfies AlertNode;
  }

  if (content.startsWith('table ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: table requires a title and nested block.`, line, column);
    return { type: 'table', title, columns: [], rows: [], line, column } satisfies TableNode;
  }

  if (content.startsWith('empty ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: empty requires a title and nested block.`, line, column);
    return { type: 'empty', title, children: [], line, column } satisfies EmptyNode;
  }

  if (content.startsWith('tabs ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: tabs requires a title and nested block.`, line, column);
    return { type: 'tabs', title, children: [], line, column } satisfies TabsNode;
  }

  if (content.startsWith('tab ')) {
    const [label] = getQuotedValues(content);
    if (!label || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: tab requires a label and nested block.`, line, column);
    return { type: 'tab', label, children: [], line, column } satisfies TabNode;
  }

  if (content.startsWith('accordion ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: accordion requires a title and nested block.`, line, column);
    return { type: 'accordion', title, children: [], line, column } satisfies AccordionNode;
  }

  if (content.startsWith('section ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: section requires a title and nested block.`, line, column);
    return { type: 'section', title, children: [], line, column } satisfies SectionNode;
  }

  if (content.startsWith('dialog ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: dialog requires a title and nested block.`, line, column);
    return { type: 'dialog', title, children: [], line, column } satisfies DialogNode;
  }

  if (content.startsWith('sheet ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: sheet requires a title and nested block.`, line, column);
    return { type: 'sheet', title, side: (getStringAttribute(content, 'side') ?? 'right') as SheetNode['side'], children: [], line, column } satisfies SheetNode;
  }

  if (content.startsWith('popover ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: popover requires a title and nested block.`, line, column);
    return { type: 'popover', title, children: [], line, column } satisfies PopoverNode;
  }

  if (content.startsWith('tooltip ')) {
    const [text] = getQuotedValues(content);
    if (!text) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: tooltip requires quoted text.`, line, column);
    return { type: 'tooltip', text, line, column } satisfies TooltipNode;
  }

  if (content.startsWith('progress ')) {
    const [label] = getQuotedValues(content);
    const value = getNumberAttribute(content, 'value');
    const max = getNumberAttribute(content, 'max');
    if (!label || value === undefined || max === undefined) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: progress requires label, value and max.`, line, column);
    return { type: 'progress', label, value, max, line, column } satisfies ProgressNode;
  }

  if (content.startsWith('loading ')) {
    const [text] = getQuotedValues(content);
    if (!text) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: loading requires quoted text.`, line, column);
    return { type: 'loading', text, line, column } satisfies LoadingNode;
  }

  if (content.startsWith('toast ')) {
    const [text] = getQuotedValues(content);
    const variant = content.trim().split(/\s+/)[1];
    if (!text || !variant) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: toast requires variant and quoted text.`, line, column);
    return { type: 'toast', variant: variant as ToastNode['variant'], text, line, column } satisfies ToastNode;
  }

  if (content === 'breadcrumb:' || content.startsWith('breadcrumb ')) {
    if (!content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: breadcrumb requires a nested block.`, line, column);
    return { type: 'breadcrumb', children: [], line, column } satisfies BreadcrumbNode;
  }

  if (content.startsWith('crumb ')) {
    const [label] = getQuotedValues(content);
    if (!label) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: crumb requires quoted text.`, line, column);
    const reply = getStringAttribute(content, 'reply');
    return { type: 'crumb', label, action: reply ? { kind: 'reply', value: reply } : undefined, line, column } satisfies CrumbNode;
  }

  if (content.startsWith('pagination ')) {
    const page = getNumberAttribute(content, 'page');
    const totalPages = getNumberAttribute(content, 'totalPages');
    if (page === undefined || totalPages === undefined) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: pagination requires page and totalPages.`, line, column);
    return { type: 'pagination', page, totalPages, line, column } satisfies PaginationNode;
  }

  if (content.startsWith('menu ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: menu requires a title and nested block.`, line, column);
    return { type: 'menu', title, children: [], line, column } satisfies MenuNode;
  }

  if (content.startsWith('command ')) {
    const [title] = getQuotedValues(content);
    if (!title || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: command requires a title and nested block.`, line, column);
    return { type: 'command', title, children: [], line, column } satisfies CommandNode;
  }

  if (content.startsWith('action ')) {
    const [label] = getQuotedValues(content);
    if (!label) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: action requires quoted text.`, line, column);
    return {
      type: 'action',
      label,
      action: parseActionDescriptor(content, line, column),
      variant: getStringAttribute(content, 'variant') as ActionNode['variant'],
      line,
      column,
    } satisfies ActionNode;
  }

  if (content.startsWith('chart ')) {
    const [title] = getQuotedValues(content);
    const chartType = content.trim().split(/\s+/)[1];
    if (!title || !chartType || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: chart requires type, title and nested block.`, line, column);
    return {
      type: 'chart',
      chartType: chartType as ChartNode['chartType'],
      title,
      xLabel: getStringAttribute(content, 'x'),
      yLabel: getStringAttribute(content, 'y'),
      children: [],
      line,
      column,
    } satisfies ChartNode;
  }

  if (content.startsWith('series ')) {
    const [label] = getQuotedValues(content);
    if (!label || !content.endsWith(':')) syntaxIssue('INVALID_SYNTAX', `Line ${line}: series requires a label and nested block.`, line, column);
    return { type: 'series', label, children: [], line, column } satisfies ChartSeriesNode;
  }

  if (content.startsWith('point ')) {
    const [label] = getQuotedValues(content);
    const valueText = content.trim().match(/"[^"]*"\s+([^\s]+)$/)?.[1];
    const value = valueText === undefined ? Number.NaN : Number(valueText);
    if (!label || Number.isNaN(value)) syntaxIssue('INVALID_SYNTAX', `Line ${line}: point requires a quoted label and numeric value.`, line, column);
    return { type: 'point', label, value, line, column } satisfies ChartPointNode;
  }

  if (content.startsWith('columns:')) {
    const columns = parseDelimitedValues(content.replace('columns:', ''));
    return { type: 'table', title: '__columns__', columns, rows: [], line, column } satisfies TableNode;
  }

  if (content.startsWith('row:')) {
    const row = parseDelimitedValues(content.replace('row:', ''));
    return { type: 'table', title: '__row__', columns: [], rows: [row], line, column } satisfies TableNode;
  }

  const keyword = content.trim().split(/\s+/)[0];
  if (!OFFICIAL_COMPONENT_KEYS.includes(keyword as never)) {
    syntaxIssue('INVALID_COMPONENT', `Line ${line}: component "${keyword}" is not allowed.`, line, column);
  }

  syntaxIssue('INVALID_SYNTAX', `Line ${line}: invalid ToonUI syntax.`, line, column);
}

function appendNode(parent: ToonDocument | ToonNode, node: ToonNode): void {
  if (node.type === 'table' && (node.title === '__columns__' || node.title === '__row__') && parent.type !== 'table') {
    syntaxIssue('INVALID_NESTING', `Line ${node.line}: tables only support columns and row entries inside table blocks.`, node.line, node.column);
  }

  if (parent.type === 'document') {
    parent.body.push(node);
    return;
  }

  if (parent.type === 'table') {
    if (node.type !== 'table') {
      syntaxIssue('INVALID_NESTING', `Line ${node.line}: tables only support columns and row entries.`, node.line, node.column);
    }
    if (node.title === '__columns__') {
      parent.columns = node.columns;
      return;
    }
    if (node.title === '__row__') {
      parent.rows.push(node.rows[0]);
      return;
    }
  }

  if ('children' in parent && Array.isArray(parent.children)) {
    parent.children.push(node as never);
    return;
  }

  syntaxIssue('INVALID_NESTING', `Line ${node.line}: cannot append ${node.type} inside ${parent.type}.`, node.line, node.column);
}

export function parseToonUI(source: string): ToonDocument {
  const document: ToonDocument = { type: 'document', body: [] };
  const stack: StackEntry[] = [{ indent: -1, node: document }];

  source.split(/\r?\n/).forEach((rawLine, index) => {
    if (!rawLine.trim()) return;
    const line = index + 1;
    const indent = getIndent(rawLine);
    const content = rawLine.trimEnd();
    const { column } = basePosition(line, rawLine);

    while (stack.length > 1 && indent <= stack.at(-1)!.indent) {
      stack.pop();
    }

    const parent = stack.at(-1)!.node;
    const node = parseLine(content.trim(), line, column);
    appendNode(parent, node);

    const opensBlock = content.trim().endsWith(':') && 'children' in node;
    const isTable = node.type === 'table' && node.title !== '__columns__' && node.title !== '__row__';
    if (opensBlock || isTable) {
      stack.push({ indent, node });
    }
  });

  return document;
}
