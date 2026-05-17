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
    'Example:',
    '```toon-ui',
    'form "Crear producto":',
    '  field name text "Nombre" required',
    '  field price number "Precio" required',
    '  button primary "Crear producto" submit',
    '```',
  ].join('\n');
}

export function createPrompt(rules: ToonRules): string {
  return [
    'You are generating ToonUI for an AI-native app.',
    createComponentPrompt(rules),
    '',
    'Interaction rules:',
    '- Every button must include variant, label, and reply="..." or submit.',
    '- Every form must include a title, fields, and a submit button.',
    '- Use confirm blocks for destructive actions.',
    '- Reply protocol: emit user intent through compact ui_reply messages only.',
    '- Submit protocol: emit compact ui_submit payloads with intent and field values only.',
    '',
    createSafetyPrompt(),
    '',
    createExamplesPrompt(),
  ].join('\n');
}
