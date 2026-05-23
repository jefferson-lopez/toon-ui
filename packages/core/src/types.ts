import {
  TOON_ALERT_VARIANTS,
  TOON_BADGE_VARIANTS,
  TOON_BUTTON_VARIANTS,
  TOON_CATALOG,
  TOON_CHART_TYPES,
  TOON_COMPONENT_KEYS,
  TOON_CONFIRM_VARIANTS,
  TOON_FIELD_TYPES,
  TOON_SEPARATOR_ORIENTATIONS,
  TOON_SHEET_SIDES,
  type ToonActiveCatalog,
  type ToonCatalog,
} from './catalog';

export const OFFICIAL_COMPONENT_KEYS = TOON_COMPONENT_KEYS;
export const BUTTON_VARIANTS = TOON_BUTTON_VARIANTS;
export const BADGE_VARIANTS = TOON_BADGE_VARIANTS;
export const ALERT_VARIANTS = TOON_ALERT_VARIANTS;
export const CONFIRM_VARIANTS = TOON_CONFIRM_VARIANTS;
export const FIELD_TYPES = TOON_FIELD_TYPES;
export const CHART_TYPES = TOON_CHART_TYPES;
export const SHEET_SIDES = TOON_SHEET_SIDES;
export const SEPARATOR_ORIENTATIONS = TOON_SEPARATOR_ORIENTATIONS;

export type ToonComponentKey = (typeof TOON_COMPONENT_KEYS)[number];
export type ButtonVariant = (typeof TOON_BUTTON_VARIANTS)[number];
export type BadgeVariant = (typeof TOON_BADGE_VARIANTS)[number];
export type AlertVariant = (typeof TOON_ALERT_VARIANTS)[number];
export type ConfirmVariant = (typeof TOON_CONFIRM_VARIANTS)[number];
export type FieldType = (typeof TOON_FIELD_TYPES)[number];
export type ChartType = (typeof TOON_CHART_TYPES)[number];
export type SheetSide = (typeof TOON_SHEET_SIDES)[number];
export type SeparatorOrientation = (typeof TOON_SEPARATOR_ORIENTATIONS)[number];
export type SubmitScalar = string | number | boolean;
export type SubmitValue = SubmitScalar | SubmitScalar[];

export type ToonErrorCode =
  | 'INVALID_COMPONENT'
  | 'INVALID_PROP'
  | 'INVALID_VARIANT'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_NESTING'
  | 'INVALID_SYNTAX'
  | 'UNSAFE_CONTENT';

export interface BaseNode {
  type: string;
  line: number;
  column: number;
}

export interface TextNode extends BaseNode {
  type: 'text';
  value: string;
}

export interface HeadingNode extends BaseNode {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface SeparatorNode extends BaseNode {
  type: 'separator';
  orientation: SeparatorOrientation;
}

export interface BadgeNode extends BaseNode {
  type: 'badge';
  label: string;
  variant: BadgeVariant;
}

export interface ButtonNode extends BaseNode {
  type: 'button';
  variant: ButtonVariant;
  label: string;
  action: { kind: 'reply'; value: string } | { kind: 'submit' };
}

export interface FieldNode extends BaseNode {
  type: 'field';
  name: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  helper?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  value?: SubmitValue;
}

export interface CardNode extends BaseNode {
  type: 'card';
  title: string;
  description?: string;
  children: ToonNode[];
}

export interface ConfirmNode extends BaseNode {
  type: 'confirm';
  variant: ConfirmVariant;
  title: string;
  description?: string;
  trigger?: string;
  children: ToonNode[];
}

export interface ItemNode extends BaseNode {
  type: 'item';
  title: string;
  description?: string;
  children: ToonNode[];
}

export interface ListNode extends BaseNode {
  type: 'list';
  title: string;
  children: ToonNode[];
}

export interface AlertNode extends BaseNode {
  type: 'alert';
  variant: AlertVariant;
  title: string;
  children: ToonNode[];
}

export interface TableNode extends BaseNode {
  type: 'table';
  title: string;
  columns: string[];
  rows: string[][];
}

export interface FormNode extends BaseNode {
  type: 'form';
  title: string;
  description?: string;
  children: ToonNode[];
}

export interface EmptyNode extends BaseNode {
  type: 'empty';
  title: string;
  description?: string;
  children: ToonNode[];
}

export interface TabNode extends BaseNode {
  type: 'tab';
  label: string;
  children: ToonNode[];
}

export interface TabsNode extends BaseNode {
  type: 'tabs';
  title: string;
  children: TabNode[];
}

export interface SectionNode extends BaseNode {
  type: 'section';
  title: string;
  children: ToonNode[];
}

export interface AccordionNode extends BaseNode {
  type: 'accordion';
  title: string;
  children: SectionNode[];
}

export interface DialogNode extends BaseNode {
  type: 'dialog';
  title: string;
  trigger?: string;
  children: ToonNode[];
}

export interface SheetNode extends BaseNode {
  type: 'sheet';
  title: string;
  trigger?: string;
  side: SheetSide;
  children: ToonNode[];
}

export interface PopoverNode extends BaseNode {
  type: 'popover';
  title: string;
  trigger?: string;
  children: ToonNode[];
}

export interface TooltipNode extends BaseNode {
  type: 'tooltip';
  text: string;
  trigger?: string;
}

export interface ProgressNode extends BaseNode {
  type: 'progress';
  label: string;
  value: number;
  max: number;
}

export interface LoadingNode extends BaseNode {
  type: 'loading';
  text: string;
}

export interface ToastNode extends BaseNode {
  type: 'toast';
  variant: AlertVariant;
  text: string;
}

export interface CrumbNode extends BaseNode {
  type: 'crumb';
  label: string;
  action?: { kind: 'reply'; value: string };
}

export interface BreadcrumbNode extends BaseNode {
  type: 'breadcrumb';
  children: CrumbNode[];
}

export interface PaginationNode extends BaseNode {
  type: 'pagination';
  page: number;
  totalPages: number;
}

export interface ActionNode extends BaseNode {
  type: 'action';
  label: string;
  action: { kind: 'reply'; value: string } | { kind: 'submit' };
  variant?: ButtonVariant;
}

export interface MenuNode extends BaseNode {
  type: 'menu';
  title: string;
  children: ActionNode[];
}

export interface CommandNode extends BaseNode {
  type: 'command';
  title: string;
  trigger?: string;
  children: ActionNode[];
}

export interface ChartPointNode extends BaseNode {
  type: 'point';
  label: string;
  value: number;
}

export interface ChartSeriesNode extends BaseNode {
  type: 'series';
  label: string;
  children: ChartPointNode[];
}

export interface ChartNode extends BaseNode {
  type: 'chart';
  chartType: ChartType;
  title: string;
  description?: string;
  xLabel?: string;
  yLabel?: string;
  children: ChartSeriesNode[];
}

export interface ToonNodeByType {
  text: TextNode;
  heading: HeadingNode;
  separator: SeparatorNode;
  card: CardNode;
  form: FormNode;
  field: FieldNode;
  button: ButtonNode;
  confirm: ConfirmNode;
  list: ListNode;
  item: ItemNode;
  badge: BadgeNode;
  alert: AlertNode;
  table: TableNode;
  empty: EmptyNode;
  tabs: TabsNode;
  tab: TabNode;
  accordion: AccordionNode;
  section: SectionNode;
  dialog: DialogNode;
  sheet: SheetNode;
  popover: PopoverNode;
  tooltip: TooltipNode;
  progress: ProgressNode;
  loading: LoadingNode;
  toast: ToastNode;
  breadcrumb: BreadcrumbNode;
  crumb: CrumbNode;
  pagination: PaginationNode;
  menu: MenuNode;
  command: CommandNode;
  action: ActionNode;
  chart: ChartNode;
  series: ChartSeriesNode;
  point: ChartPointNode;
}

export type ToonNode = ToonNodeByType[keyof ToonNodeByType];

export interface ToonDocument {
  type: 'document';
  body: ToonNode[];
}

export interface ToonBlock {
  raw: string;
  language: 'toon-ui';
  start: number;
  end: number;
  complete: boolean;
}

export interface ToonMarkdownSegment {
  type: 'markdown';
  content: string;
  start: number;
  end: number;
}

export interface ToonUIBlockSegment extends ToonBlock {
  type: 'toon-ui';
}

export type ToonContentSegment = ToonMarkdownSegment | ToonUIBlockSegment;

export interface ValidationIssue {
  code: ToonErrorCode;
  message: string;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ToonRules {
  components: readonly ToonComponentKey[];
  buttonVariants: readonly ButtonVariant[];
  badgeVariants: readonly BadgeVariant[];
  alertVariants: readonly AlertVariant[];
  confirmVariants: readonly ConfirmVariant[];
  fieldTypes: readonly FieldType[];
  chartTypes: readonly ChartType[];
}

export interface ReplyPayload {
  kind: 'ui_reply';
  eventId: string;
  source: 'button';
  value: string;
  component: 'button';
  line?: number;
  context?: Record<string, SubmitValue>;
}

export interface SubmitPayload {
  kind: 'ui_submit';
  eventId: string;
  source: 'form';
  intent: string;
  formTitle: string;
  values: Record<string, SubmitValue>;
  line?: number;
}

export type ToonInteractionPayload = ReplyPayload | SubmitPayload;

export interface ToonModelMessage<TPayload extends ToonInteractionPayload = ToonInteractionPayload> {
  role: 'user';
  kind: TPayload['kind'];
  content: string;
  displayContent: string;
  payload: TPayload;
}

export interface ToonUIMessageMetadata<TPayload extends ToonInteractionPayload = ToonInteractionPayload> {
  displayContent: string;
  kind: TPayload['kind'];
}

export interface ToonUIMessagePart {
  type: 'text';
  text: string;
}

export interface ToonUIMessage<TPayload extends ToonInteractionPayload = ToonInteractionPayload> {
  id: string;
  role: 'user';
  parts: [ToonUIMessagePart];
  metadata: ToonUIMessageMetadata<TPayload>;
}

export type ToonChatMessage<TPayload extends ToonInteractionPayload = ToonInteractionPayload> = ToonModelMessage<TPayload>;
export type ToonChatUIMessage<TPayload extends ToonInteractionPayload = ToonInteractionPayload> = ToonUIMessage<TPayload>;

export interface ToonEventsApi {
  reply: typeof import('./runtime').createReplyEvent;
  submit: typeof import('./runtime').createSubmitEvent;
}

export interface ToonMessagesApi {
  toContent: typeof import('./runtime').toToonEventContent;
  toDisplayContent: typeof import('./runtime').toToonDisplayContent;
  toModelMessage: typeof import('./runtime').toToonModelMessage;
  toUIMessage: typeof import('./runtime').toToonUIMessage;
}

export interface ToonProtocol {
  prompt: string;
  rules: ToonRules;
  catalog: ToonActiveCatalog;
  events: ToonEventsApi;
  messages: ToonMessagesApi;
}

export type ToonComponentRegistry = Partial<{ [K in keyof ToonNodeByType]: unknown }>;

export interface CreateToonUIOptions<TComponents extends ToonComponentRegistry = ToonComponentRegistry> {
  components?: TComponents;
  catalog?: ToonActiveCatalog;
}

export interface ToonRuntime<TComponents extends ToonComponentRegistry = ToonComponentRegistry> extends ToonProtocol {
  components: TComponents;
  parse: typeof import('./parser').parseToonUI;
  validate: typeof import('./validator').validateToonUI;
  extractBlocks: typeof import('./formatter').extractToonBlocks;
}

export const toonCatalog = TOON_CATALOG;
