import { describe, expect, it } from 'vitest';
import { ToonSyntaxError, createChatMessage, createChatUIMessage, createToonCoreRuntime, createToonProtocol, extractToonBlocks, formatReplyMessage, formatSubmitMessage, parseToonUI, validateToonUI } from '../src';

describe('toon core', () => {
  it('extracts toon-ui blocks from markdown', () => {
    const blocks = extractToonBlocks('Hello\n```toon-ui\ntext "Hi"\n```');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.raw).toContain('text "Hi"');
  });

  it('parses and validates a simple form', () => {
    const document = parseToonUI([
      'form "Crear producto":',
      '  field name text "Nombre" required',
      '  button primary "Crear producto" submit',
    ].join('\n'));

    const result = validateToonUI(document);
    expect(result.ok).toBe(true);
    expect(document.body[0]).toMatchObject({ type: 'form', line: 1, column: 1 });
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

  it('creates structured reply and submit messages with event ids', () => {
    const reply = formatReplyMessage('Sí, elimínalo', { source: 'confirm' });
    const submit = formatSubmitMessage({
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

  it('creates a protocol-only runtime for server-side prompt usage', () => {
    const protocol = createToonProtocol();

    expect(protocol.prompt).toContain('You are generating ToonUI');
    expect(protocol.rules.components).toContain('form');
    expect(protocol.createChatMessage({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Abrir detalle',
    }).content).toContain('ui_reply:');
  });

  it('creates chat-ready messages for reply and submit interactions', () => {
    const reply = createChatMessage({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Sí, elimínalo',
    });

    const submit = createChatMessage({
      kind: 'ui_submit',
      eventId: 'submit_123',
      source: 'form',
      intent: 'create_product',
      formTitle: 'Crear producto',
      values: { name: 'Coca-Cola', price: 2500 },
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
      displayContent: 'Crear producto\nname: Coca-Cola\nprice: 2500',
      content: expect.stringContaining('ui_submit:'),
    });
  });

  it('creates ui-message-shaped chat entries with metadata for frontend rendering', () => {
    const reply = createChatUIMessage({
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

  it('creates a runtime prompt and preserves the component registry', () => {
    const button = Symbol('button');
    const runtime = createToonCoreRuntime({
      components: { button },
    });

    expect(runtime.prompt).toContain('Allowed components');
    expect(runtime.prompt).not.toContain('Available tools');
    expect(runtime.components.button).toBe(button);
    expect(runtime.createChatMessage({
      kind: 'ui_reply',
      eventId: 'reply_123',
      source: 'button',
      component: 'button',
      value: 'Crear producto',
    }).displayContent).toBe('Crear producto');
    expect(runtime.createChatUIMessage({
      kind: 'ui_reply',
      eventId: 'reply_124',
      source: 'button',
      component: 'button',
      value: 'Crear producto',
    }).metadata.displayContent).toBe('Crear producto');
  });
});
