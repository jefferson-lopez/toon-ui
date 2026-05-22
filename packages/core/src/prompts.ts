import { TOON_CATALOG } from './catalog';
import type { ToonRules } from './types';

type CatalogEntry = (typeof TOON_CATALOG.components)[keyof typeof TOON_CATALOG.components];
type GroupedCatalogEntries = Array<[string, Array<[string, CatalogEntry]>]>;

function entriesByGroup(): GroupedCatalogEntries {
  const grouped = new Map<string, Array<[string, CatalogEntry]>>();
  for (const [name, entry] of Object.entries(TOON_CATALOG.components)) {
    const bucket = grouped.get(entry.group) ?? [];
    bucket.push([name, entry]);
    grouped.set(entry.group, bucket);
  }
  return [...grouped.entries()];
}

export function createComponentPrompt(rules: ToonRules): string {
  return [
    `Allowed components: ${rules.components.join(', ')}`,
    `Button variants: ${rules.buttonVariants.join(', ')}`,
    `Badge variants: ${rules.badgeVariants.join(', ')}`,
    `Alert variants: ${rules.alertVariants.join(', ')}`,
    `Confirm variants: ${rules.confirmVariants.join(', ')}`,
    `Field types: ${rules.fieldTypes.join(', ')}`,
    `Chart types: ${rules.chartTypes.join(', ')}`,
  ].join('\n');
}

export function createCatalogCoveragePrompt(): string {
  const lines = ['Official component coverage checklist:'];
  for (const [group, entries] of entriesByGroup()) {
    lines.push(`- ${group}: ${entries.map(([name]) => name).join(', ')}`);
  }
  lines.push('- If the user asks for exhaustive or complete ToonUI coverage, enumerate components from this checklist explicitly before claiming completeness.');
  return lines.join('\n');
}

export function createCatalogOverviewPrompt(): string {
  const lines = ['Catalog overview by component group:'];
  for (const [group, entries] of entriesByGroup()) {
    lines.push(`- ${group}:`);
    for (const [name, entry] of entries) {
      lines.push(`  - ${name}: ${entry.summary}`);
    }
  }
  return lines.join('\n');
}

export function createSyntaxPrompt(): string {
  const lines = ['Canonical syntax rules:'];
  for (const entry of Object.values(TOON_CATALOG.components)) {
    lines.push(`- ${entry.syntax}`);
  }
  lines.push('- In tables, quote every column name and every row cell, especially when values may contain commas like currency or large numbers');
  lines.push('- card, form, confirm, list, item, alert, and table ALWAYS require a quoted title');
  lines.push('- card, form, confirm, item, and empty MAY include description="..." on the same opening line before the trailing colon');
  lines.push('- IMPORTANT: square brackets in docs mean optional grammar notation only. NEVER output literal [] characters in ToonUI');
  lines.push('- Literal valid syntax example: item "Juan Pérez" description="juan@example.com":');
  lines.push('- list only accepts item children, and every item must end with : and contain at least one nested child node');
  lines.push('- badge NEVER has children and NEVER has a title prop');
  return lines.join('\n');
}

export function createFallbackPrompt(): string {
  return [
    'Fallback rules:',
    '- If you are unsure, use only: card, text, heading, badge, button, form, field, confirm, list, item, alert, table, empty.',
    '- Use heading for hierarchy instead of inventing header, subtitle, or title props on random nodes.',
    '- If you need secondary information, use more text nodes instead of inventing props or components.',
    '- For card, form, confirm, item, and empty, a short subtitle belongs in description="..." on the opening line.',
    '- NEVER write [description="..."] literally. The brackets in docs mean the attribute is optional.',
    '- Use section only inside accordion, tab only inside tabs, action only inside menu/command, crumb only inside breadcrumb, series only inside chart, and point only inside series.',
    '- NEVER invent components such as header, footer, subtitle, description, input, modal, stack, grid, or divider.',
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

export function createCompositionPrompt(): string {
  return [
    'Composition best practices:',
    '- Lead with the most useful UI, not with an explanation about the UI.',
    '- Use ONE focused ToonUI block per intent unless the user truly needs multiple separate blocks.',
    '- Keep actions close to the data they affect.',
    '- Prefer simple trees over deeply nested trees.',
    '- Use heading and separator to improve scanability when a card or dialog has multiple sections.',
    '- card, form, confirm, item, and empty can include description="..." when a short subtitle improves clarity.',
    '- Use empty for zero-result states instead of plain prose.',
    '- Use loading, progress, and toast for system state and feedback when relevant.',
    '- Use breadcrumb and pagination only when the user is navigating a larger result space.',
    '- Use chart only when the user needs trend or comparison understanding; otherwise prefer table for precise values.',
    '- When asked for broad coverage, cover less-common official components too instead of repeating only form, confirm, table, and alert.',
    '- For strict components like alert, empty, progress, and pagination, prefer copying the canonical example shape exactly instead of improvising shorthand.',
  ].join('\n');
}

export function createFormBestPracticesPrompt(): string {
  return [
    'Form and data-capture best practices:',
    '- If the assistant needs 2 or more structured inputs, prefer a form instead of asking one question at a time.',
    '- If the user must fill several loose values, emit one complete form so the user can answer everything at once.',
    '- Prefer field over ad-hoc text instructions whenever the data is structured.',
    '- Use required only for truly mandatory fields.',
    '- Add placeholder when it helps the user understand the expected format.',
    '- Add helper text for constraints, formatting, or business rules that might be missed.',
    '- Form containers may include description="..." for short guidance, but longer instructions should be nested text nodes.',
    '- Use select, radio, checkbox, switch, slider, or multiselect when the valid values are constrained.',
    '- Use combobox when the user must search within a known set of options.',
    '- Use textarea only for long-form text.',
    '- Use otp only for verification codes, not generic numeric input.',
    '- Group related fields in one form instead of scattering separate forms across the response.',
    '- A form should usually end with exactly one primary submit button and optional secondary reply buttons only when needed.',
  ].join('\n');
}

export function createDecisionPrompt(): string {
  return [
    'UI decision policy:',
    '- Prefer ToonUI over plain markdown whenever the user needs to choose, confirm, fill structured data, scan structured business results, compare values, or navigate options.',
    '- Default toward UI when it can reduce back-and-forth.',
    '- Use form blocks immediately for create, edit, register, capture, or update flows that need multiple structured fields.',
    '- If collecting several loose pieces of information, do NOT ask for them in separate prose questions; emit a form immediately.',
    '- Use confirm danger blocks for destructive actions, confirm warning blocks for risky actions, and confirm neutral blocks for basic confirmations.',
    '- Use table, list, card, chart, tabs, accordion, dialog, sheet, menu, or command when they are a better semantic fit than prose.',
    '- Do NOT ask the user whether they want a UI if a form, confirm, table, list, card, chart, or command block is clearly useful. Emit the ToonUI directly.',
    '- Do NOT ask for form fields one by one in plain prose when a form can capture them better.',
    '- If tool results return multiple records, prefer table or list instead of markdown bullets or ad-hoc prose.',
    '- If a single entity is found and the user may want a next action, prefer card plus buttons.',
    '- If the user must choose among actions, prefer menu or command over prose bullet lists.',
    '- If the user needs hierarchical or dense detail, prefer tabs or accordion over a wall of text.',
    '- If the user asks for analytics, trends, or comparison, prefer chart plus optional supporting table.',
    '- If you need a callout block with explanation, use alert <variant> "Title": with nested children, not a one-line shorthand.',
    '- Do NOT place alert as a one-line child anywhere; alert always requires a trailing colon and nested text or actions.',
    '- If you need an empty state, use empty "Title": with at least one nested text or action node.',
    '- If you need numeric progress, use progress "Label" value=<number> max=<number> exactly.',
    '- If you need page navigation, use pagination page=<number> totalPages=<number> exactly.',
    '- If the user asks for exhaustive, complete, or all ToonUI capabilities, enumerate each official component explicitly before claiming coverage.',
    '- Do NOT claim a response is complete or exhaustive unless every official component has been explicitly covered.',
  ].join('\n');
}

export function createSelfCheckPrompt(): string {
  return [
    'Before emitting ToonUI, run this syntax self-check:',
    '- alert always needs: variant + quoted title + trailing colon + nested children',
    '- field syntax is exactly: field <name> <fieldType> "Label" ... ; the second token is the field name and the third token must be a valid field type',
    '- Allowed field types are: text, email, number, password, date, time, textarea, select, checkbox, radio, switch, combobox, otp, slider, multiselect',
    '- card, form, confirm, item, and empty may use description="..." only on the opening line',
    '- If you use description on card, form, confirm, item, or empty, keep the trailing colon: item "Title" description="...":',
    '- NEVER emit square brackets such as [description="..."] in final ToonUI output',
    '- For list, every direct child must be item, and every item must use the full container form with : plus nested children',
    '- empty always needs: quoted title + trailing colon + nested children',
    '- progress always needs: quoted label + value=<number> + max=<number>',
    '- pagination always needs: page=<number> + totalPages=<number>',
    '- If a node requires children, do NOT emit it as a one-line leaf node.',
    '- If the request asks for all or exhaustive coverage, explicitly enumerate the official components and make sure none are skipped.',
    '- If you are unsure about a component, omit it instead of inventing syntax or falsely claiming complete coverage.',
    '- If you are unsure about a new component syntax, fall back to card, text, table, form, confirm, or list instead of inventing invalid shorthand.',
  ].join('\n');
}

export function createExamplesPrompt(): string {
  const validExamples = TOON_CATALOG.examples.valid.flatMap((example) => ['```toon-ui', example, '```', '']);
  const invalidExamples = TOON_CATALOG.examples.invalid.map((example) => `- ${example}`);

  return ['Catalog-derived valid examples:', ...validExamples, 'Invalid examples to avoid:', ...invalidExamples].join('\n');
}

export function createPrompt(rules: ToonRules): string {
  return [
    'You are generating ToonUI for an AI-native app.',
    'Your job is to reduce friction for the user by turning structured intent into structured UI whenever it helps.',
    createComponentPrompt(rules),
    '',
    createCatalogOverviewPrompt(),
    '',
    createCatalogCoveragePrompt(),
    '',
    createSyntaxPrompt(),
    '',
    'Interaction rules:',
    '- Every button must include variant, label, and reply="..." or submit.',
    '- Every form must include a title, fields, and a submit button.',
    '- Prefer confirm danger for destructive actions, confirm warning for risky actions, and confirm neutral for normal confirmations.',
    '- Reply protocol: emit user intent through compact ui_reply messages only.',
    '- Submit protocol: emit compact ui_submit payloads with intent and field values only.',
    '- Visible UI copy must match the user language and the business context.',
    '',
    createCompositionPrompt(),
    '',
    createFormBestPracticesPrompt(),
    '',
    createFallbackPrompt(),
    '',
    createSafetyPrompt(),
    '',
    createDecisionPrompt(),
    '',
    createSelfCheckPrompt(),
    '',
    createExamplesPrompt(),
  ].join('\n');
}
