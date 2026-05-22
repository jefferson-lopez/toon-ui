import { describe, expect, it } from 'vitest';
import {
  TOON_CATALOG,
  ToonSyntaxError,
  createToonCatalog,
  createCatalogCoveragePrompt,
  createCatalogOverviewPrompt,
  createSyntaxPrompt,
  createFallbackPrompt,
  createSelfCheckPrompt,
  createDecisionPrompt,
  createExamplesPrompt,
  createCompositionPrompt,
  createToonCoreRuntime,
  createToonProtocol,
  extractToonBlocks,
  extractToonSegments,
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

  it('extracts ordered markdown and toon-ui segments without losing the original sequence', () => {
    const content = [
      'Claro, aquí tienes algunos ejemplos:',
      '',
      '```toon-ui',
      'card "Demo":',
      '  text "Uno"',
      '```',
      '',
      'Si necesitas algo más, dímelo.',
    ].join('\n');

    const intro = 'Claro, aquí tienes algunos ejemplos:\n\n';
    const blockSource = ['```toon-ui', 'card "Demo":', '  text "Uno"', '```'].join('\n');
    const outro = '\n\nSi necesitas algo más, dímelo.';

    expect(extractToonSegments(content)).toEqual([
      {
        type: 'markdown',
        content: intro,
        start: 0,
        end: intro.length,
      },
      {
        type: 'toon-ui',
        raw: ['card "Demo":', '  text "Uno"'].join('\n'),
        language: 'toon-ui',
        start: intro.length,
        end: intro.length + blockSource.length,
        complete: true,
      },
      {
        type: 'markdown',
        content: outro,
        start: intro.length + blockSource.length,
        end: content.length,
      },
    ]);
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

  it('parses optional descriptions on supported containers', () => {
    const document = parseToonUI([
      'card "Cliente" description="Cuenta premium":',
      '  text "Activo"',
      'form "Registrar usuario" description="Completa los campos obligatorios":',
      '  field nombre text "Nombre" required',
      '  button primary "Guardar" submit',
      'confirm warning "Eliminar usuario" description="Esta acción no se puede deshacer":',
      '  text "Confirma para continuar"',
      'item "Pedido #123" description="Pendiente de pago":',
      '  text "Total: $20"',
      'empty "Sin resultados" description="Prueba con otro filtro":',
      '  text "No encontramos coincidencias"',
    ].join('\n'));

    expect(document.body[0]).toMatchObject({ type: 'card', description: 'Cuenta premium' });
    expect(document.body[1]).toMatchObject({ type: 'form', description: 'Completa los campos obligatorios' });
    expect(document.body[2]).toMatchObject({ type: 'confirm', description: 'Esta acción no se puede deshacer' });
    expect(document.body[3]).toMatchObject({ type: 'item', description: 'Pendiente de pago' });
    expect(document.body[4]).toMatchObject({ type: 'empty', description: 'Prueba con otro filtro' });
  });

  it('makes the prompt explicit about optional description notation', () => {
    const syntaxPrompt = createSyntaxPrompt();
    const fallbackPrompt = createFallbackPrompt();
    const selfCheckPrompt = createSelfCheckPrompt();

    expect(syntaxPrompt).toContain('NEVER output literal [] characters in ToonUI');
    expect(syntaxPrompt).toContain('item "Juan Pérez" description="juan@example.com":');
    expect(syntaxPrompt).toContain('list only accepts item children');
    expect(fallbackPrompt).toContain('NEVER write [description="..."] literally.');
    expect(selfCheckPrompt).toContain('NEVER emit square brackets such as [description="..."] in final ToonUI output');
    expect(selfCheckPrompt).toContain('If the request asks for all or exhaustive coverage');
  });

  it('pushes the model toward complete and less repetitive coverage', () => {
    const catalogOverviewPrompt = createCatalogOverviewPrompt();
    const catalogCoveragePrompt = createCatalogCoveragePrompt();
    const compositionPrompt = createCompositionPrompt();
    const decisionPrompt = createDecisionPrompt();
    const examplesPrompt = createExamplesPrompt();

    expect(catalogOverviewPrompt).toContain('Catalog overview by component group:');
    expect(catalogOverviewPrompt).toContain('navigation:');
    expect(catalogOverviewPrompt).toContain('command: Command palette style action list.');
    expect(catalogCoveragePrompt).toContain('Official component coverage checklist:');
    expect(catalogCoveragePrompt).toContain('content: text, heading, separator, badge');
    expect(catalogCoveragePrompt).toContain('overlay: dialog, sheet, popover, tooltip');
    expect(compositionPrompt).toContain('cover less-common official components too instead of repeating only form, confirm, table, and alert');
    expect(decisionPrompt).toContain('enumerate each official component explicitly before claiming coverage');
    expect(decisionPrompt).toContain('Do NOT claim a response is complete or exhaustive unless every official component has been explicitly covered');
    expect(examplesPrompt).toContain('Catalog-derived valid examples:');
    expect(examplesPrompt).toContain('list "Registered customers":');
    expect(examplesPrompt).toContain('sheet "Customer activity" side="right":');
    expect(examplesPrompt).toContain('command "Quick actions":');
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

  it('detects invalid field types when field name and type are malformed', () => {
    const document = parseToonUI([
      'form "Ingresar Precio":',
      '  field numberProducto "Producto Price"',
      '  button primary "Guardar Precio" submit',
    ].join('\n'));

    const result = validateToonUI(document);
    expect(result.ok).toBe(false);
    expect(result.errors.some((issue) => issue.code === 'INVALID_PROP' && issue.message.includes('Invalid field type'))).toBe(true);
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
