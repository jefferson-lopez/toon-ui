import { OFFICIAL_COMPONENT_KEYS, type AlertNode, type BadgeNode, type ButtonNode, type CardNode, type ConfirmNode, type FieldNode, type FormNode, type ItemNode, type ListNode, type TableNode, type TextNode, type ToonDocument, type ToonErrorCode, type ToonNode, type ValidationIssue } from './types';

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

const quoted = /"([^"]+)"/g;

function getIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function getQuotedValues(input: string): string[] {
  return [...input.matchAll(quoted)].map((match) => match[1]);
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

function syntaxIssue(code: ToonErrorCode, message: string, line: number, column = 1): never {
  throw new ToonSyntaxError({ code, message, line, column });
}

function basePosition(line: number, raw: string) {
  return { line, column: getIndent(raw) + 1 };
}

function parseLine(content: string, line: number, column: number): ToonNode {
  if (content.startsWith('text ')) {
    const [value] = getQuotedValues(content);
    if (!value) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: text requires a quoted value.`, line, column);
    return { type: 'text', value, line, column } satisfies TextNode;
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
    const replyMatch = content.match(/reply="([^"]+)"/);
    const isSubmit = /\bsubmit\b/.test(content);
    if (!replyMatch && !isSubmit) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: button requires reply or submit.`, line, column);
    return {
      type: 'button',
      variant: variant as ButtonNode['variant'],
      label,
      action: replyMatch ? { kind: 'reply', value: replyMatch[1] } : { kind: 'submit' },
      line,
      column,
    } satisfies ButtonNode;
  }

  if (content.startsWith('field ')) {
    const tokens = content.trim().split(/\s+/);
    const [label] = getQuotedValues(content);
    const placeholderMatch = content.match(/placeholder="([^"]+)"/);
    if (tokens.length < 4 || !label) syntaxIssue('MISSING_REQUIRED_FIELD', `Line ${line}: field requires name, type and label.`, line, column);
    return {
      type: 'field',
      name: tokens[1],
      fieldType: tokens[2] as FieldNode['fieldType'],
      label,
      placeholder: placeholderMatch?.[1],
      required: /\brequired\b/.test(content),
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
    return { type: 'confirm', title, children: [], line, column } satisfies ConfirmNode;
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
  if (parent.type === 'document') {
    parent.body.push(node);
    return;
  }

  if ('children' in parent && Array.isArray(parent.children)) {
    parent.children.push(node as never);
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
