import type { ToonSubmitPayload } from '@toon-ui/toon-ui';

export type HostMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  displayContent?: string;
  kind?: 'plain' | 'ui_reply' | 'ui_submit';
};

function messageId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseUiValue(message: string, key: string): string | undefined {
  const match = message.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'));
  return match?.[1]?.replace(/^"|"$/g, '');
}

export function createHostMessage(
  role: HostMessage['role'],
  content: string,
  kind: HostMessage['kind'] = 'plain',
  displayContent?: string,
): HostMessage {
  return {
    id: messageId(role),
    role,
    content,
    displayContent,
    kind,
  };
}

export function createDisplaySubmitSummary(payload: ToonSubmitPayload): string {
  const fields = payload.node.children.filter((child) => child.type === 'field');
  const entries = fields
    .filter((field) => Object.prototype.hasOwnProperty.call(payload.values, field.name))
    .map((field) => `${field.label}: ${String(payload.values[field.name])}`);

  return [payload.formTitle, ...entries].join('\n');
}

export function simulateAssistantReply(messages: HostMessage[]): HostMessage {
  const last = messages.at(-1)?.content ?? '';

  if (/ui_submit:/i.test(last)) {
    const name = parseUiValue(last, 'name') ?? 'Producto';
    const price = parseUiValue(last, 'price') ?? '0';
    return createHostMessage('assistant', [
      `Perfecto. Recibí el submit estructurado y ahora el host podría decidir si llama una tool.`,
      '',
      '```toon-ui',
      'card "Producto listo para crear":',
      `  text "Nombre: ${name}"`,
      `  badge "Precio ${price}" info`,
      '  button primary "Crear otro" reply="Crear otro producto"',
      '```',
    ].join('\n'));
  }

  if (/ui_reply:/i.test(last)) {
    const value = parseUiValue(last, 'value') ?? '';
    if (/sí, elimínalo/i.test(value)) {
      return createHostMessage('assistant', [
        'Entendido. El mensaje estructurado volvió al chat y AHORA la IA/SDK podría llamar `deleteProduct()` si quisiera.',
        '',
        '```toon-ui',
        'alert success "Confirmación recibida":',
        '  text "Se capturó la intención de eliminar el producto."',
        '```',
      ].join('\n'));
    }

    if (/crear otro producto/i.test(value)) {
      return createHostMessage('assistant', [
        'Vamos a crear otro producto.',
        '',
        '```toon-ui',
        'form "Crear producto":',
        '  field name text "Nombre" required',
        '  field price number "Precio" required',
        '  field stock number "Stock" required',
        '  button primary "Crear producto" submit',
        '```',
      ].join('\n'));
    }

    return createHostMessage('assistant', `Recibí un ui_reply estructurado con valor: ${value}`);
  }

  if (/eliminar producto/i.test(last)) {
    return createHostMessage('assistant', [
      'Encontré el producto. ¿Quieres confirmar la acción?',
      '',
      '```toon-ui',
      'confirm "¿Eliminar producto?":',
      '  text "Coca-Cola 400ml será eliminado."',
      '  button secondary "Cancelar" reply="Cancelar"',
      '  button danger "Sí, eliminar" reply="Sí, elimínalo"',
      '```',
    ].join('\n'));
  }

  if (/crear producto/i.test(last)) {
    return createHostMessage('assistant', [
      'Perfecto. Completa este formulario.',
      '',
      '```toon-ui',
      'form "Crear producto":',
      '  field name text "Nombre" required',
      '  field price number "Precio" required',
      '  field stock number "Stock" required',
      '  button primary "Crear producto" submit',
      '```',
    ].join('\n'));
  }

  return createHostMessage('assistant', [
    'Este example prueba el loop completo host chat -> ToonUI -> interacción -> mensaje estructurado.',
    '',
    'Prueba escribiendo:',
    '- `crear producto`',
    '- `eliminar producto`',
    '',
    '```toon-ui',
    'card "Atajos de prueba":',
    '  text "Usa los botones para disparar respuestas semánticas."',
    '  button secondary "Crear producto" reply="Crear producto"',
    '  button danger "Eliminar producto" reply="Eliminar producto"',
    '```',
  ].join('\n'));
}
