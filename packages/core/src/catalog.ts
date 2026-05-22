export const TOON_COMPONENT_KEYS = [
  'text',
  'heading',
  'separator',
  'card',
  'form',
  'field',
  'button',
  'confirm',
  'list',
  'item',
  'badge',
  'alert',
  'table',
  'empty',
  'tabs',
  'accordion',
  'dialog',
  'sheet',
  'popover',
  'tooltip',
  'progress',
  'loading',
  'toast',
  'breadcrumb',
  'pagination',
  'menu',
  'command',
  'chart',
] as const;

export const TOON_BUTTON_VARIANTS = ['primary', 'secondary', 'danger', 'ghost', 'outline'] as const;
export const TOON_BADGE_VARIANTS = ['success', 'warning', 'danger', 'neutral', 'info'] as const;
export const TOON_ALERT_VARIANTS = ['info', 'success', 'warning', 'danger'] as const;
export const TOON_CONFIRM_VARIANTS = ['neutral', 'info', 'warning', 'danger', 'success'] as const;
export const TOON_FIELD_TYPES = [
  'text',
  'email',
  'number',
  'password',
  'date',
  'time',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'combobox',
  'otp',
  'slider',
  'multiselect',
] as const;
export const TOON_CHART_TYPES = ['bar', 'line', 'area', 'pie'] as const;
export const TOON_SHEET_SIDES = ['left', 'right', 'top', 'bottom'] as const;
export const TOON_SEPARATOR_ORIENTATIONS = ['horizontal', 'vertical'] as const;

export const TOON_CATALOG = {
  components: {
    text: { group: 'content', syntax: 'text "Visible text"', summary: 'Leaf node for visible copy.' },
    heading: { group: 'content', syntax: 'heading <1-6> "Visible text"', summary: 'Semantic heading for hierarchy.' },
    separator: { group: 'content', syntax: 'separator OR separator horizontal|vertical', summary: 'Visual divider between sections.' },
    card: { group: 'structure', syntax: 'card "Title" [description="..."]: followed by indented child nodes', summary: 'General content container.', children: ['*'] },
    form: { group: 'capture', syntax: 'form "Title" [description="..."]: followed by one or more field nodes and one submit button', summary: 'Structured data capture block.', children: ['field', 'button'] },
    field: { group: 'capture', syntax: 'field <name> <fieldType> "Label" [placeholder="..."] [required]', summary: 'Structured form input primitive.' },
    button: { group: 'capture', syntax: 'button <variant> "Label" reply="Value" OR button <variant> "Label" submit', summary: 'Primary interaction trigger.' },
    confirm: { group: 'capture', syntax: 'confirm <variant> "Title" [description="..."]: followed by indented child nodes', summary: 'Confirmation flow container.', children: ['*'] },
    list: { group: 'structure', syntax: 'list "Title": followed only by item nodes', summary: 'Structured repeated result set.', children: ['item'] },
    item: { group: 'structure', syntax: 'item "Title" [description="..."]: followed by indented child nodes', summary: 'Single list entry container.', children: ['*'] },
    badge: { group: 'content', syntax: 'badge "Label" <variant>', summary: 'Short semantic status label.' },
    alert: { group: 'feedback', syntax: 'alert <variant> "Title": followed by indented child nodes', summary: 'Callout block for important state.', children: ['*'] },
    table: { group: 'structure', syntax: 'table "Title": followed by columns: ... and one or more row: ... lines', summary: 'Precise tabular data.', children: ['columns', 'row'] },
    empty: { group: 'feedback', syntax: 'empty "Title" [description="..."]: followed by indented child nodes', summary: 'Zero-result or empty state.', children: ['*'] },
    tabs: { group: 'structure', syntax: 'tabs "Title": followed by one or more tab "Label": blocks', summary: 'Parallel grouped views.', children: ['tab'] },
    accordion: { group: 'structure', syntax: 'accordion "Title": followed by one or more section "Title": blocks', summary: 'Progressive disclosure container.', children: ['section'] },
    dialog: { group: 'overlay', syntax: 'dialog "Title": followed by indented child nodes', summary: 'Modal interaction container.', children: ['*'] },
    sheet: { group: 'overlay', syntax: 'sheet "Title" side="left|right|top|bottom": followed by indented child nodes', summary: 'Edge-attached contextual panel.', children: ['*'] },
    popover: { group: 'overlay', syntax: 'popover "Title": followed by indented child nodes', summary: 'Inline contextual overlay.', children: ['*'] },
    tooltip: { group: 'overlay', syntax: 'tooltip "Visible text"', summary: 'Short contextual hint.' },
    progress: { group: 'feedback', syntax: 'progress "Label" value=<number> max=<number>', summary: 'Deterministic progress indicator.' },
    loading: { group: 'feedback', syntax: 'loading "Visible text"', summary: 'Transient loading feedback.' },
    toast: { group: 'feedback', syntax: 'toast <variant> "Visible text"', summary: 'Ephemeral result feedback.' },
    breadcrumb: { group: 'navigation', syntax: 'breadcrumb: followed by one or more crumb "Label" [reply="..."] lines', summary: 'Hierarchical path navigation.', children: ['crumb'] },
    pagination: { group: 'navigation', syntax: 'pagination page=<number> totalPages=<number>', summary: 'Page navigation state.' },
    menu: { group: 'navigation', syntax: 'menu "Title": followed by one or more action "Label" reply="..." or submit lines', summary: 'Choice list of actions.', children: ['action'] },
    command: { group: 'navigation', syntax: 'command "Title": followed by one or more action "Label" reply="..." or submit lines', summary: 'Command palette style action list.', children: ['action'] },
    chart: { group: 'analytics', syntax: 'chart <type> "Title": followed by one or more series "Label": blocks with point "Label" <number> rows', summary: 'Trend or comparison visualization.', children: ['series'] },
  },
  variants: {
    button: TOON_BUTTON_VARIANTS,
    badge: TOON_BADGE_VARIANTS,
    alert: TOON_ALERT_VARIANTS,
    confirm: TOON_CONFIRM_VARIANTS,
    field: TOON_FIELD_TYPES,
    chart: TOON_CHART_TYPES,
    sheet: TOON_SHEET_SIDES,
    separator: TOON_SEPARATOR_ORIENTATIONS,
  },
  examples: {
    valid: [
      'text "Estado operativo"',
      'heading 2 "Resumen semanal"',
      'separator horizontal',
      ['form "Create product":', '  field name text "Name" placeholder="Ex: Coca-Cola" required', '  field price number "Price" placeholder="Ex: 25.50" required', '  button primary "Create product" submit'].join('\n'),
      ['card "Customer found":', '  text "Jefferson Lopez Mendoza"', '  badge "Active" success', '  button secondary "View history" reply="View customer history"'].join('\n'),
      ['confirm danger "Delete customer?":', '  text "This action cannot be undone."', '  button secondary "Cancel" reply="Cancel"', '  button danger "Yes, delete" reply="Yes, delete customer"'].join('\n'),
      ['confirm neutral "Continue with selected customer?":', '  text "We will use this customer for the current sale."', '  button secondary "Cancel" reply="Cancel"', '  button primary "Continue" reply="Continue with selected customer"'].join('\n'),
      ['list "Registered customers":', '  item "Juan Pérez" description="juan@example.com":', '    text "Active customer"', '  item "Ana López" description="ana@example.com":', '    text "Pending verification"'].join('\n'),
      ['table "Sales":', '  columns: "Date", "Sale number", "Total", "Status"', '  row: "May 14", "177877222574876", "$ 387.45", "Completed"', '  row: "May 09", "177836532655064", "$ 8,155.35", "Completed"'].join('\n'),
      ['alert warning "Low stock":', '  text "Only 3 units remain in the warehouse."'].join('\n'),
      ['empty "No customers found":', '  text "Try another search term or create a new customer."', '  button secondary "Create customer" reply="Create customer"'].join('\n'),
      ['tabs "Customer details":', '  tab "Profile":', '    text "Premium account"', '  tab "Orders":', '    text "12 completed orders"'].join('\n'),
      ['accordion "FAQ":', '  section "Shipping times":', '    text "Orders arrive in 2 to 5 business days."', '  section "Returns":', '    text "Returns are accepted within 30 days."'].join('\n'),
      ['dialog "Edit customer":', '  text "Update contact information."', '  button primary "Save" reply="Save customer changes"'].join('\n'),
      ['sheet "Customer activity" side="right":', '  heading 3 "Latest movement"', '  text "Sale #1234 completed"'].join('\n'),
      ['popover "More details":', '  text "Average order value: $58"'].join('\n'),
      'tooltip "More context about this metric"',
      'progress "Inventory sync" value=65 max=100',
      'loading "Loading customer history"',
      'toast success "Customer created successfully"',
      ['breadcrumb:', '  crumb "Home" reply="Go home"', '  crumb "Customers" reply="Open customers"', '  crumb "Juan Pérez"'].join('\n'),
      'pagination page=2 totalPages=8',
      ['menu "Customer actions":', '  action "Open profile" reply="Open customer profile"', '  action "Suspend account" reply="Suspend customer account"'].join('\n'),
      ['command "Quick actions":', '  action "Create customer" reply="Create customer"', '  action "Search invoices" reply="Search invoices"'].join('\n'),
      ['chart bar "Weekly sales" x="Day" y="Revenue":', '  series "Store A":', '    point "Mon" 1200', '    point "Tue" 980'].join('\n'),
    ],
    invalid: [
      'header "Customer"  -> INVALID because header is not an allowed component',
      'card:             -> INVALID because card requires a quoted title',
      'badge success "Customer" -> INVALID because badge syntax is badge "Label" variant',
      'alert "Low stock" -> INVALID because alert requires a variant and nested block',
      'empty "No data" -> INVALID because empty requires a nested block after :',
      'progress 65 -> INVALID because progress requires a quoted label plus value= and max=',
      'pagination 2/8 -> INVALID because pagination requires page= and totalPages=',
      'confirm "Delete customer?": -> VALID for backward compatibility, but prefer confirm danger|warning|neutral "Title":',
      'form "Customer": with no submit button -> INVALID',
      'row: May 09, $ 8,155.35, Completed -> RISKY because commas inside values can break the table unless cells are quoted',
      '"Do you want me to build a UI for this?" -> BAD when a form, confirm, table, list, or card is already the obvious best response',
    ],
  },
} as const;

export type ToonCatalog = typeof TOON_CATALOG;

export function createToonCatalog(): ToonCatalog {
  return TOON_CATALOG;
}

export function listToonComponentKeys(): Array<(typeof TOON_COMPONENT_KEYS)[number]> {
  return [...TOON_COMPONENT_KEYS];
}
