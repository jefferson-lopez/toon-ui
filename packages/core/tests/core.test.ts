import { describe, expect, it } from 'vitest';
import {
  TOON_CATALOG,
  ToonSyntaxError,
  createToonCatalog,
  createToonCoreRuntime,
  createToonProtocol,
  extractToonBlocks,
  parseToonUI,
  validateToonUI,
} from '../src';

describe('toon core', () => {
  it('extracts toon-ui blocks from markdown', () => {
    const blocks = extractToonBlocks('Hello\n```toon-ui\ntext "Hi"\n```');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.raw).toContain('text "Hi"');
    expect(blocks[0]?.complete).toBe(true);
  });

  it('extracts a renderable partial block while the toon-ui fence is still streaming', () => {
    const blocks = extractToonBlocks([
      'Hola',
      '```toon-ui',
      'card "Cliente":',
      '  text "Activo"',
      'card "Siguiente',
    ].join('\n'));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      complete: false,
      raw: ['card "Cliente":', '  text "Activo"'].join('\n'),
    });
  });

  it('parses and validates a simple form', () => {
    const document = parseToonUI([
      'form "Crear producto":',
      '  field name text "Nombre" placeholder="Ej: Coca-Cola" required',
      '  button primary "Crear producto" submit',
    ].join('\n'));

    const result = validateToonUI(document);
    expect(result.ok).toBe(true);
    expect(document.body[0]).toMatchObject({ type: 'form', line: 1, column: 1 });
    expect((document.body[0] as { children: Array<{ placeholder?: string }> }).children[0]?.placeholder).toBe('Ej: Coca-Cola');
  });

  it('rejects meta because the official catalog is closed', () => {
    expect(() => parseToonUI('meta "juan@email.com"')).toThrow(/not allowed/);
  });

  it('throws structured syntax errors for unknown components', () => {
    try {
      parseToonUI('sidebar "No"');
      throw new Error('Expected parseToonUI to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ToonSyntaxError);
      expect((error as ToonSyntaxError).code).toBe('INVALID_COMPONENT');
      expect((error as ToonSyntaxError).line).toBe(1);
    }
  });

  it('detects missing submit buttons and unsafe text', () => {
    const document = parseToonUI([
      'form "Crear producto":',
      '  field name text "Nombre"',
      'card "Tarjeta":',
      '  text "<script>alert(1)</script>"',
    ].join('\n'));

    const result = validateToonUI(document);
    expect(result.ok).toBe(false);
    expect(result.errors.some((issue) => issue.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    expect(result.errors.some((issue) => issue.code === 'UNSAFE_CONTENT')).toBe(true);
  });

  it('detects invalid list nesting and invalid table rows', () => {
    const document = parseToonUI([
      'list "Clientes":',
      '  text "No permitido"',
      'table "Productos":',
      '  columns: Nombre, Precio',
      '  row: Coca-Cola',
    ].join('\n'));

    const result = validateToonUI(document);
    expect(result.errors.some((issue) => issue.code === 'INVALID_NESTING')).toBe(true);
    expect(result.errors.some((issue) => issue.code === 'INVALID_PROP')).toBe(true);
  });

  it('parses quoted table cells with commas without breaking the row shape', () => {
    const document = parseToonUI([
      'table "Ventas":',
      '  columns: "Fecha", "Total", "Estado"',
      '  row: "14 de mayo", "$ 8,155.35", "Completado"',
    ].join('\n'));

    const result = validateToonUI(document);
    expect(result.ok).toBe(true);
    expect(document.body[0]).toMatchObject({
      type: 'table',
      columns: ['Fecha', 'Total', 'Estado'],
      rows: [['14 de mayo', '$ 8,155.35', 'Completado']],
    });
  });

  it('builds protocol events through the explicit events api', () => {
    const protocol = createToonProtocol();
    const reply = protocol.events.reply('Sí, elimínalo', { source: 'confirm' });
    const submit = protocol.events.submit('create_product', { name: 'Coca-Cola', price: 2500 });

    expect(reply).toMatchObject({ kind: 'ui_reply', value: 'Sí, elimínalo' });
    expect(submit).toMatchObject({ kind: 'ui_submit', intent: 'create_product' });
  });

  it('creates structured reply and submit contents with event ids', () => {
    const protocol = createToonProtocol();
    const reply = protocol.messages.toContent(protocol.events.reply('Sí, elimínalo', { source: 'confirm' }));
    const submit = protocol.messages.toContent({
      kind: 'ui_submit',
      eventId: 'submit_123',
      source: 'form',
      intent: 'create_product',
      formTitle: 'Crear producto',
      values: { name: 'Coca-Cola', price: 2500 },
    });

    expect(reply).toContain('ui_reply:');
    expect(reply).toContain('eventId:');
    expect(submit).toContain('ui_submit:');
    expect(submit).toContain('eventId: submit_123');
  });

  it('creates a protocol with catalog, events and message helpers', () => {
    const protocol = createToonProtocol();

    expect(protocol.prompt).toContain('You are generating ToonUI');
    expect(protocol.rules.components).toContain('form');
    expect(protocol.catalog.components.form.syntax).toContain('form "Title"');
    expect(protocol.events.reply('Abrir detalle')).toMatchObject({ kind: 'ui_reply', value: 'Abrir detalle' });
    expect(protocol.messages.toContent({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Abrir detalle',
    })).toContain('ui_reply:');
  });

  it('creates chat-ready model messages for reply and submit interactions', () => {
    const protocol = createToonProtocol();
    const reply = protocol.messages.toModelMessage({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Sí, elimínalo',
    });

    const submit = protocol.messages.toModelMessage({
      kind: 'ui_submit',
      eventId: 'submit_123',
      source: 'form',
      intent: 'create_product',
      formTitle: 'Crear producto',
      values: { name: 'Coca-Cola', price: 2500 },
      node: {
        type: 'form',
        title: 'Crear producto',
        line: 1,
        column: 1,
        children: [
          { type: 'field', name: 'name', fieldType: 'text', label: 'Nombre', required: true, line: 2, column: 1 },
          { type: 'field', name: 'price', fieldType: 'number', label: 'Precio', required: true, line: 3, column: 1 },
        ],
      },
    });

    expect(reply).toMatchObject({
      role: 'user',
      kind: 'ui_reply',
      displayContent: 'Sí, elimínalo',
      content: expect.stringContaining('ui_reply:'),
    });
    expect(submit).toMatchObject({
      role: 'user',
      kind: 'ui_submit',
      displayContent: 'Crear producto\nNombre: Coca-Cola\nPrecio: 2500',
      content: expect.stringContaining('ui_submit:'),
    });
  });

  it('creates ui-message-shaped chat entries with metadata for frontend rendering', () => {
    const protocol = createToonProtocol();
    const reply = protocol.messages.toUIMessage({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Sí, elimínalo',
    });

    expect(reply).toMatchObject({
      id: 'reply_123',
      role: 'user',
      parts: [{ type: 'text', text: expect.stringContaining('ui_reply:') }],
      metadata: {
        displayContent: 'Sí, elimínalo',
        kind: 'ui_reply',
      },
    });
  });

  it('creates stronger prompt guidance from the centralized catalog', () => {
    const protocol = createToonProtocol();

    expect(protocol.prompt).toContain('Canonical syntax rules:');
    expect(protocol.prompt).toContain('UI decision policy:');
    expect(protocol.prompt).toContain('Use form blocks immediately for create, edit, register, capture, or update flows');
    expect(protocol.prompt).toContain('Do NOT ask the user whether they want a UI');
    expect(protocol.prompt).toContain('placeholder="..."');
    expect(protocol.prompt).toContain('badge "Label" <variant>');
    expect(protocol.prompt).toContain('NEVER invent components such as header');
    expect(protocol.prompt).toContain('badge success "Customer" -> INVALID');
    expect(protocol.prompt).toContain('The prompt instructions stay in English, but visible UI labels');
  });

  it('preserves runtime components while exposing catalog/message namespaces', () => {
    const button = Symbol('button');
    const runtime = createToonCoreRuntime({
      components: { button },
    });

    expect(runtime.prompt).toContain('Allowed components');
    expect(runtime.components.button).toBe(button);
    expect(runtime.catalog.components.button.summary).toContain('interaction');
    expect(runtime.messages.toModelMessage({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Crear producto',
    }).displayContent).toBe('Crear producto');
  });

  it('exposes a single central catalog object', () => {
    expect(createToonCatalog()).toBe(TOON_CATALOG);
    expect(TOON_CATALOG.components.chart.children).toContain('series');
    expect(TOON_CATALOG.examples.valid.length).toBeGreaterThan(0);
  });
});
