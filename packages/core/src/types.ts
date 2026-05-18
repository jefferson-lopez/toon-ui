export const OFFICIAL_COMPONENT_KEYS = ["text", "card", "form", "field", "button", "confirm", "list", "item", "badge", "alert", "table"] as const;
export const BUTTON_VARIANTS = ["primary", "secondary", "danger", "ghost", "outline"] as const;
export const BADGE_VARIANTS = ["success", "warning", "danger", "neutral", "info"] as const;
export const ALERT_VARIANTS = ["info", "success", "warning", "danger"] as const;
export const FIELD_TYPES = ["text", "email", "number", "password", "date", "time", "textarea", "select", "checkbox"] as const;

export type ToonComponentKey = (typeof OFFICIAL_COMPONENT_KEYS)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];
export type AlertVariant = (typeof ALERT_VARIANTS)[number];
export type FieldType = (typeof FIELD_TYPES)[number];
export type SubmitValue = string | number | boolean;

export type ToonErrorCode =
  | "INVALID_COMPONENT"
  | "INVALID_PROP"
  | "INVALID_VARIANT"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_NESTING"
  | "INVALID_SYNTAX"
  | "UNSAFE_CONTENT";

export interface BaseNode {
  type: ToonComponentKey;
  line: number;
  column: number;
}

export interface TextNode extends BaseNode {
  type: "text";
  value: string;
}

export interface BadgeNode extends BaseNode {
  type: "badge";
  label: string;
  variant: BadgeVariant;
}

export interface ButtonNode extends BaseNode {
  type: "button";
  variant: ButtonVariant;
  label: string;
  action: { kind: "reply"; value: string } | { kind: "submit" };
}

export interface FieldNode extends BaseNode {
  type: "field";
  name: string;
  fieldType: FieldType;
  label: string;
  required: boolean;
}

export interface CardNode extends BaseNode {
  type: "card";
  title: string;
  children: ToonNode[];
}

export interface ConfirmNode extends BaseNode {
  type: "confirm";
  title: string;
  children: ToonNode[];
}

export interface ItemNode extends BaseNode {
  type: "item";
  title: string;
  children: ToonNode[];
}

export interface ListNode extends BaseNode {
  type: "list";
  title: string;
  children: ItemNode[];
}

export interface AlertNode extends BaseNode {
  type: "alert";
  variant: AlertVariant;
  title: string;
  children: ToonNode[];
}

export interface TableNode extends BaseNode {
  type: "table";
  title: string;
  columns: string[];
  rows: string[][];
}

export interface FormNode extends BaseNode {
  type: "form";
  title: string;
  children: ToonNode[];
}

export interface ToonNodeByType {
  text: TextNode;
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
}

export type ToonNode = ToonNodeByType[keyof ToonNodeByType];

export interface ToonDocument {
  type: "document";
  body: ToonNode[];
}

export interface ToonBlock {
  raw: string;
  language: "toon-ui";
  start: number;
  end: number;
  complete: boolean;
}

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
  fieldTypes: readonly FieldType[];
}

export interface ReplyPayload {
  kind: "ui_reply";
  eventId: string;
  source: "button";
  value: string;
  component: "button";
  line?: number;
  context?: Record<string, SubmitValue>;
}

export interface SubmitPayload {
  kind: "ui_submit";
  eventId: string;
  source: "form";
  intent: string;
  formTitle: string;
  values: Record<string, SubmitValue>;
  line?: number;
}

export type ToonInteractionPayload = ReplyPayload | SubmitPayload;

export interface ToonChatMessage<TPayload extends ToonInteractionPayload = ToonInteractionPayload> {
  role: "user";
  kind: TPayload["kind"];
  content: string;
  displayContent: string;
  payload: TPayload;
}

export interface ToonChatUIMessageMetadata<TPayload extends ToonInteractionPayload = ToonInteractionPayload> {
  displayContent: string;
  kind: TPayload["kind"];
}

export interface ToonChatUIMessagePart {
  type: "text";
  text: string;
}

export interface ToonChatUIMessage<TPayload extends ToonInteractionPayload = ToonInteractionPayload> {
  id: string;
  role: "user";
  parts: [ToonChatUIMessagePart];
  metadata: ToonChatUIMessageMetadata<TPayload>;
}

export interface ToonProtocol {
  prompt: string;
  rules: ToonRules;
  formatSubmitMessage: typeof import('./runtime').formatSubmitMessage;
  formatReplyMessage: typeof import('./runtime').formatReplyMessage;
  createChatMessage: typeof import('./runtime').createChatMessage;
  createChatUIMessage: typeof import('./runtime').createChatUIMessage;
}

export type ToonComponentRegistry = Partial<{ [K in keyof ToonNodeByType]: unknown }>;

export interface CreateToonUIOptions<TComponents extends ToonComponentRegistry = ToonComponentRegistry> {
  components?: TComponents;
}

export interface ToonRuntime<TComponents extends ToonComponentRegistry = ToonComponentRegistry> extends ToonProtocol {
  components: TComponents;
  parse: typeof import('./parser').parseToonUI;
  validate: typeof import('./validator').validateToonUI;
  extractBlocks: typeof import('./formatter').extractToonBlocks;
}
