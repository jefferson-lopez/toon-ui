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
    '- field MUST be: field <name> <fieldType> "Label" [required]',
    '- button MUST be: button <variant> "Label" reply="Value" OR button <variant> "Label" submit',
    '- confirm MUST be: confirm "Title": followed by indented child nodes',
    '- list MUST be: list "Title": followed only by item nodes',
    '- item MUST be: item "Title": followed by indented child nodes',
    '- badge MUST be: badge "Label" <variant>',
    '- alert MUST be: alert <variant> "Title": followed by indented child nodes',
    '- table MUST be: table "Title": followed by columns: ... and one or more row: ... lines',
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
  ].join('\n');
}

export function createExamplesPrompt(): string {
  return [
    'Valid examples:',
    '```toon-ui',
    'form "Crear producto":',
    '  field name text "Nombre" required',
    '  field price number "Precio" required',
    '  button primary "Crear producto" submit',
    '```',
    '',
    '```toon-ui',
    'card "Cliente encontrado":',
    '  text "Jefferson Lopez Mendoza"',
    '  badge "Activo" success',
    '  button secondary "Ver historial" reply="Ver historial del cliente"',
    '```',
    '',
    '```toon-ui',
    'confirm "¿Eliminar cliente?":',
    '  text "Esta acción no se puede deshacer."',
    '  button secondary "Cancelar" reply="Cancelar"',
    '  button danger "Sí, eliminar" reply="Sí, eliminar cliente"',
    '```',
    '',
    'Invalid examples to avoid:',
    '- header "Cliente"  -> INVALID because header is not an allowed component',
    '- card:             -> INVALID because card requires a quoted title',
    '- badge success "Cliente" -> INVALID because badge syntax is badge "Label" variant',
    '- form "Cliente": with no submit button -> INVALID',
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
    createExamplesPrompt(),
  ].join('\n');
}
