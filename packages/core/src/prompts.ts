import { TOON_CATALOG, type ToonActiveCatalog } from './catalog';
import type { ToonRules } from './types';

type PromptCatalog = ToonActiveCatalog;
type CatalogEntry = NonNullable<PromptCatalog['components'][keyof PromptCatalog['components']]>;
type GroupedCatalogEntries = Array<[string, Array<[string, CatalogEntry]>]>;

function entriesByGroup(catalog: PromptCatalog): GroupedCatalogEntries {
  const grouped = new Map<string, Array<[string, CatalogEntry]>>();
  for (const [name, entry] of Object.entries(catalog.components)) {
    if (!entry) continue;
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

export function createCatalogCoveragePrompt(catalog: PromptCatalog = TOON_CATALOG): string {
  const lines = ['Official component coverage checklist:'];
  for (const [group, entries] of entriesByGroup(catalog)) {
    lines.push(`- ${group}: ${entries.map(([name]) => name).join(', ')}`);
  }
  lines.push('- If the user asks for exhaustive or complete ToonUI coverage, enumerate components from this checklist explicitly before claiming completeness.');
  return lines.join('\n');
}

export function createCatalogOverviewPrompt(catalog: PromptCatalog = TOON_CATALOG): string {
  const lines = ['Catalog overview by component group:'];
  for (const [group, entries] of entriesByGroup(catalog)) {
    lines.push(`- ${group}:`);
    for (const [name, entry] of entries) {
      lines.push(`  - ${name}: ${entry.summary}`);
    }
  }
  return lines.join('\n');
}

export function createSyntaxPrompt(catalog: PromptCatalog = TOON_CATALOG): string {
  const lines = ['Canonical syntax rules:'];
  for (const entry of Object.values(catalog.components)) {
    if (!entry) continue;
    lines.push(`- ${entry.syntax}`);
  }
  lines.push('- In tables, quote every column name and every row cell, especially when values may contain commas like currency or large numbers');
  lines.push('- card, form, confirm, list, item, alert, table, and chart ALWAYS require a quoted title');
  lines.push('- card, form, confirm, item, empty, and chart MAY include description="..." on the same opening line before the trailing colon');
  lines.push('- confirm, dialog, sheet, popover, tooltip, and command MAY include trigger="..." as the label for the UI control that opens or explains that content');
  lines.push('- For confirm/dialog/sheet/popover/command, use trigger="..." when the title is a heading and the button or launcher label should be shorter or more action-oriented');
  lines.push('- IMPORTANT: square brackets in docs mean optional grammar notation only. NEVER output literal [] characters in ToonUI');
  lines.push('- Literal valid syntax example: item "Juan Pérez" description="juan@example.com":');
  lines.push('- Literal valid trigger example: confirm danger "Delete customer?" trigger="Review deletion":');
  lines.push('- list only accepts item children, and every item must end with : and contain at least one nested child node');
  lines.push('- item is NEVER a one-line leaf node. Correct: item "Text" description="Displays visible text.": followed by an indented text/badge/button/etc child');
  lines.push('- Incorrect: item "Text" description="Displays visible text." with no trailing colon and no nested child');
  lines.push('- For select, radio, combobox, and multiselect fields, put choices on the same field line as options="A|B|C"');
  lines.push('- NEVER emit option as a child node. ToonUI has no option component or option child syntax.');
  lines.push('- Correct: field category select "Category" options="Coffee|Tea|Chocolate" required');
  lines.push('- Incorrect: field category select "Category" required: followed by option "Coffee" children');
  lines.push('- badge NEVER has children and NEVER has a title prop');
  return lines.join('\n');
}

export function createFallbackPrompt(): string {
  return [
    'Fallback rules:',
    '- If you are unsure, use only: card, text, heading, badge, button, form, field, confirm, list, item, alert, table, empty.',
    '- Use heading for hierarchy instead of inventing header, subtitle, or title props on random nodes.',
    '- If you need secondary information, use more text nodes instead of inventing props or components.',
    '- For card, form, confirm, item, empty, and chart, a short subtitle belongs in description="..." on the opening line.',
    '- For item, description="..." does NOT replace nested content; item still requires a trailing colon and at least one indented child.',
    '- For confirm, dialog, sheet, popover, tooltip, and command, a short opener/launcher label belongs in trigger="..." on the opening line.',
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
    '- card, form, confirm, item, empty, and chart can include description="..." when a short subtitle improves clarity.',
    '- confirm, dialog, sheet, popover, tooltip, and command can include trigger="..." when the UI needs a launcher label separate from the content title.',
    '- Use empty for zero-result states instead of plain prose.',
    '- Use loading, progress, and toast for system state and feedback when relevant.',
    '- Use breadcrumb and pagination only when the user is navigating a larger result space.',
    '- Use chart only when the user needs trend or comparison understanding; otherwise prefer table for precise values.',
    '- When asked for broad coverage, cover less-common official components too instead of repeating only form, confirm, table, and alert.',
    '- For strict components like alert, empty, progress, and pagination, prefer copying the canonical example shape exactly instead of improvising shorthand.',
    '- For lists, prefer this exact shape: list "Title": then item "Entry" description="Details": then an indented text/badge/button child.',
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
    '- Form and chart containers may include description="..." for short guidance, but longer instructions should be nested text nodes.',
    '- Use select, radio, checkbox, switch, slider, or multiselect when the valid values are constrained.',
    '- For select, radio, combobox, and multiselect, choices MUST be encoded with options="A|B|C" on the field line.',
    '- NEVER create nested option nodes. option is not a ToonUI component.',
    '- Use combobox when the user must search within a known set of options.',
    '- Use textarea only for long-form text.',
    '- Use otp only for verification codes, not generic numeric input.',
    '- Group related fields in one form instead of scattering separate forms across the response.',
    '- A form should usually end with exactly one primary submit button and optional secondary reply buttons only when needed.',
    '- When handling a ui_submit with missing or invalid fields, do NOT re-render already valid submitted fields unless the user explicitly needs to edit them.',
    '- For validation recovery, render a smaller follow-up form containing only the missing or invalid fields.',
    '- Preserve previously submitted valid values in conversation state and merge them with the next partial ui_submit before summarizing, confirming, or saving.',
    '- If the follow-up form is partial, make that clear in the form title or description so the user understands only the remaining information is needed.',
    '- Before saving a create or update flow, always show a confirmation step using the complete merged payload, not only the latest partial submit payload.',
  ].join('\n');
}

export function createRecommendedActionsPrompt(): string {
  return [
    'Recommended action policy:',
    '- Do NOT end with generic filler such as "If you need anything else..." when a contextual next action would be more useful.',
    '- After completing a flow, suggest only actions that are grounded in the current conversation, the visible UI, or known available capabilities.',
    '- Never invent operational actions that require unavailable tools, APIs, permissions, or backend capabilities.',
    '- If an action may require a tool or capability that is not known to be available, phrase it as a safe conversational request, not as an executable action.',
    '- Prefer recommended actions that naturally follow from the completed task, such as reviewing the created record, creating another similar record, editing the just-submitted details, or returning to a relevant list only when those actions are supported by the current UI/capabilities.',
    '- If no grounded next action exists, keep the closing brief and do not fabricate recommendations.',
    '- Recommended actions should be rendered as ToonUI buttons, menu, command, card, or confirm only when the action is actually available in the current interaction contract.',
    '- Dangerous or destructive actions, such as delete, must not be suggested unless the user asked for them or the capability is explicitly known and appropriate; if used, they must go through confirm danger.',
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
    '- For confirm blocks shown through alert-dialog style UI, prefer trigger="..." for the opening button label, e.g. confirm warning "Delete customer?" trigger="Review deletion":',
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
    '- select/radio/combobox/multiselect options syntax is exactly: field <name> <type> "Label" options="A|B|C"',
    '- NEVER write field <name> select "Label": with nested option children. There is no option node.',
    '- Allowed field types are: text, email, number, password, date, time, textarea, select, checkbox, radio, switch, combobox, otp, slider, multiselect',
    '- card, form, confirm, item, empty, and chart may use description="..." only on the opening line',
    '- confirm, dialog, sheet, popover, tooltip, and command may use trigger="..." only on the opening line',
    '- If you use description on card, form, confirm, item, empty, or chart, keep the trailing colon: chart bar "Sales" description="Weekly revenue":',
    '- If you use trigger on confirm, dialog, sheet, popover, or command, keep the trailing colon: confirm warning "Title" trigger="Open":',
    '- NEVER emit square brackets such as [description="..."] in final ToonUI output',
    '- For list, every direct child must be item, and every item must use the full container form with : plus nested children',
    '- NEVER emit item "Title" description="..." as a one-line list row; description is only metadata, not the required child content.',
    '- A valid list item shape is: item "Title" description="...": followed by an indented child such as text "Details"',
    '- empty always needs: quoted title + trailing colon + nested children',
    '- progress always needs: quoted label + value=<number> + max=<number>',
    '- pagination always needs: page=<number> + totalPages=<number>',
    '- If a node requires children, do NOT emit it as a one-line leaf node.',
    '- If the request asks for all or exhaustive coverage, explicitly enumerate the official components and make sure none are skipped.',
    '- If you are unsure about a component, omit it instead of inventing syntax or falsely claiming complete coverage.',
    '- If you are unsure about a new component syntax, fall back to card, text, table, form, confirm, or list instead of inventing invalid shorthand.',
  ].join('\n');
}

export function createExamplesPrompt(catalog: PromptCatalog = TOON_CATALOG): string {
  const validExamples = catalog.examples.valid.flatMap((example) => ['```toon-ui', example, '```', '']);
  const invalidExamples = catalog.examples.invalid.map((example) => `- ${example}`);

  return ['Catalog-derived valid examples:', ...validExamples, 'Invalid examples to avoid:', ...invalidExamples].join('\n');
}

export function createPrompt(rules: ToonRules, catalog: PromptCatalog = TOON_CATALOG): string {
  return [
    'You are generating ToonUI for an AI-native app.',
    'Your job is to reduce friction for the user by turning structured intent into structured UI whenever it helps.',
    createComponentPrompt(rules),
    '',
    createCatalogOverviewPrompt(catalog),
    '',
    createCatalogCoveragePrompt(catalog),
    '',
    createSyntaxPrompt(catalog),
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
    createRecommendedActionsPrompt(),
    '',
    createFallbackPrompt(),
    '',
    createSafetyPrompt(),
    '',
    createDecisionPrompt(),
    '',
    createSelfCheckPrompt(),
    '',
    createExamplesPrompt(catalog),
  ].join('\n');
}
