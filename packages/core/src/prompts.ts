import type { ToonRules } from './types';

export function createComponentPrompt(rules: ToonRules): string {
  return [
    `Allowed components: ${rules.components.join(', ')}`,
    `Button variants: ${rules.buttonVariants.join(', ')}`,
    `Badge variants: ${rules.badgeVariants.join(', ')}`,
    `Alert variants: ${rules.alertVariants.join(', ')}`,
    `Field types: ${rules.fieldTypes.join(', ')}`,
  ].join('\n');
}

export function createSyntaxPrompt(): string {
  return [
    'Canonical syntax rules:',
    '- text MUST be: text "Visible text"',
    '- card MUST be: card "Title": followed by indented child nodes',
    '- form MUST be: form "Title": followed by one or more field nodes and one submit button',
    '- field MUST be: field <name> <fieldType> "Label" [placeholder="..."] [required]',
    '- button MUST be: button <variant> "Label" reply="Value" OR button <variant> "Label" submit',
    '- confirm MUST be: confirm "Title": followed by indented child nodes',
    '- list MUST be: list "Title": followed only by item nodes',
    '- item MUST be: item "Title": followed by indented child nodes',
    '- badge MUST be: badge "Label" <variant>',
    '- alert MUST be: alert <variant> "Title": followed by indented child nodes',
    '- table MUST be: table "Title": followed by columns: ... and one or more row: ... lines',
    '- In tables, quote every column name and every row cell, especially when values may contain commas like currency or large numbers',
    '- card, form, confirm, list, item, alert, and table ALWAYS require a quoted title',
    '- badge NEVER has children and NEVER has a title prop',
  ].join('\n');
}

export function createFallbackPrompt(): string {
  return [
    'Fallback rules:',
    '- If you are unsure, use only: card, text, badge, button, form, field, confirm, list, item, alert, table.',
    '- If you need a section heading inside a card, use text "..." instead of inventing header, subtitle, section, or footer.',
    '- If you need secondary information, use more text nodes instead of inventing props or components.',
    '- NEVER invent components such as header, section, footer, subtitle, description, input, modal, stack, grid, or divider.',
  ].join('\n');
}

export function createSafetyPrompt(): string {
  return [
    'Safety rules:',
    '- Output normal markdown plus optional ```toon-ui blocks only.',
    '- Never output React, HTML, CSS, JavaScript, or component JSON.',
    '- Never invent components or props outside the official ToonUI catalog.',
    '- Never emit raw HTML, script-like content, or arbitrary CSS.',
    '- Do not execute business actions directly. UI interactions must send user intent back to the chat.',
    '- The prompt instructions stay in English, but visible UI labels, titles, button text, and field labels should follow the user language and conversation context.',
  ].join('\n');
}

export function createDecisionPrompt(): string {
  return [
    'UI decision policy:',
    '- Prefer ToonUI over plain markdown when the user needs to choose, confirm, fill structured data, or scan structured business results.',
    '- Use form blocks immediately for create, edit, register, capture, or update flows that need multiple structured fields.',
    '- Use confirm blocks immediately for destructive, risky, or irreversible actions.',
    '- Use table, list, or card blocks for structured business data such as products, sales, inventory, customers, search results, or status summaries.',
    '- Do NOT ask the user whether they want a UI if a form, confirm, table, list, or card is clearly useful. Emit the ToonUI directly.',
    '- Do NOT ask for form fields one by one in plain prose when a form can capture them better.',
    '- If tool results return multiple records, prefer table or list instead of markdown bullets or ad-hoc prose.',
    '- If a single entity is found and the user may want a next action, prefer card plus buttons.',
  ].join('\n');
}

export function createExamplesPrompt(): string {
  return [
    'Valid examples:',
    '```toon-ui',
    'form "Create product":',
    '  field name text "Name" placeholder="Ex: Coca-Cola" required',
    '  field price number "Price" placeholder="Ex: 25.50" required',
    '  button primary "Create product" submit',
    '```',
    '',
    '```toon-ui',
    'card "Customer found":',
    '  text "Jefferson Lopez Mendoza"',
    '  badge "Active" success',
    '  button secondary "View history" reply="View customer history"',
    '```',
    '',
    '```toon-ui',
    'confirm "Delete customer?":',
    '  text "This action cannot be undone."',
    '  button secondary "Cancel" reply="Cancel"',
    '  button danger "Yes, delete" reply="Yes, delete customer"',
    '```',
    '',
    '```toon-ui',
    'table "Sales":',
    '  columns: "Date", "Sale number", "Total", "Status"',
    '  row: "May 14", "177877222574876", "$ 387.45", "Completed"',
    '  row: "May 09", "177836532655064", "$ 8,155.35", "Completed"',
    '```',
    '',
    '```toon-ui',
    'form "Create product":',
    '  field name text "Name" placeholder="Ex: Coca-Cola" required',
    '  field sku text "SKU" placeholder="Ex: COCA-355" required',
    '  field price number "Price" placeholder="Ex: 25.50" required',
    '  field cost number "Cost" placeholder="Ex: 12.00" required',
    '  field stock number "Initial stock" placeholder="Ex: 50" required',
    '  button primary "Create product" submit',
    '```',
    '',
    'Invalid examples to avoid:',
    '- header "Customer"  -> INVALID because header is not an allowed component',
    '- card:             -> INVALID because card requires a quoted title',
    '- badge success "Customer" -> INVALID because badge syntax is badge "Label" variant',
    '- form "Customer": with no submit button -> INVALID',
    '- row: May 09, $ 8,155.35, Completed -> RISKY because commas inside values can break the table unless cells are quoted',
    '- "Do you want me to build a UI for this?" -> BAD when a form, confirm, table, list, or card is already the obvious best response',
  ].join('\n');
}

export function createPrompt(rules: ToonRules): string {
  return [
    'You are generating ToonUI for an AI-native app.',
    createComponentPrompt(rules),
    '',
    createSyntaxPrompt(),
    '',
    'Interaction rules:',
    '- Every button must include variant, label, and reply="..." or submit.',
    '- Every form must include a title, fields, and a submit button.',
    '- Use confirm blocks for destructive actions.',
    '- Reply protocol: emit user intent through compact ui_reply messages only.',
    '- Submit protocol: emit compact ui_submit payloads with intent and field values only.',
    '',
    createFallbackPrompt(),
    '',
    createSafetyPrompt(),
    '',
    createDecisionPrompt(),
    '',
    createExamplesPrompt(),
  ].join('\n');
}
