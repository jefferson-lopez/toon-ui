import React, { useMemo, useState } from 'react';
import { ToonMessage, createToonUI } from '@toon-ui/toon-ui';
import { shadcnPreset } from '@toon-ui/toon-ui/presets/shadcn';
import type { ToonReplyPayload, ToonSubmitPayload } from '@toon-ui/toon-ui';
import { createDisplaySubmitSummary, createHostMessage, simulateAssistantReply, type HostMessage } from './chat-loop';

const toon = createToonUI({
  components: shadcnPreset(),
});

const initialMessages: HostMessage[] = [
  createHostMessage('assistant', [
    'Bienvenido al MVP del chat loop real.',
    '',
    'Aquí ToonUI solo renderiza UI y devuelve eventos estructurados. El host decide todo lo demás.',
  ].join('\n')),
  simulateAssistantReply([]),
];

function surfaceEvent(toonEvent: ToonReplyPayload | ToonSubmitPayload): HostMessage {
  if (toonEvent.kind === 'ui_reply') {
    return createHostMessage('user', toon.formatReplyMessage(toonEvent), 'ui_reply', toonEvent.value);
  }

  const modelMessage = toon.formatSubmitMessage(toonEvent);
  return createHostMessage('user', modelMessage, 'ui_submit', createDisplaySubmitSummary(toonEvent));
}

export default function App() {
  const [messages, setMessages] = useState<HostMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const lastStructuredMessage = useMemo(
    () => [...messages].reverse().find((message) => message.kind === 'ui_reply' || message.kind === 'ui_submit'),
    [messages],
  );

  function pushMessage(message: HostMessage) {
    setMessages((current) => {
      const next = [...current, message];
      const assistant = simulateAssistantReply(next);
      return [...next, assistant];
    });
  }

  function sendDraft() {
    const value = draft.trim();
    if (!value) return;
    setDraft('');
    pushMessage(createHostMessage('user', value, 'plain', value));
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'grid', gap: 24, gridTemplateColumns: '2fr 1fr' }}>
      <section style={{ background: '#ffffff', borderRadius: 16, padding: 20, display: 'grid', gap: 16, minHeight: '80vh' }}>
        <header>
          <h1 style={{ margin: 0 }}>ToonUI — Example vivo</h1>
          <p style={{ marginBottom: 0, color: '#4b5563' }}>Chat host real con loop de interacción estructurada. El modelo recibe `content`; el humano ve `displayContent`.</p>
        </header>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start', overflow: 'auto', paddingRight: 8 }}>
          {messages.map((message) => (
            <article
              key={message.id}
              style={{
                justifySelf: message.role === 'assistant' ? 'start' : 'end',
                maxWidth: '85%',
                background: message.role === 'assistant' ? '#f9fafb' : '#dbeafe',
                borderRadius: 14,
                padding: 14,
                whiteSpace: 'pre-wrap',
                display: 'grid',
                gap: 10,
              }}
            >
              <small style={{ color: '#6b7280', textTransform: 'uppercase' }}>{message.role}</small>
              {message.role === 'assistant' ? (
                <ToonMessage
                  content={message.content}
                  runtime={toon}
                  onReply={(payload) => pushMessage(surfaceEvent(payload))}
                  onSubmit={(payload) => pushMessage(surfaceEvent(payload))}
                />
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{message.displayContent ?? message.content}</pre>
              )}
            </article>
          ))}
        </div>

        <footer style={{ display: 'grid', gap: 12 }}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe 'crear producto' o 'eliminar producto'"
            rows={4}
            style={{ width: '100%', borderRadius: 12, padding: 12, border: '1px solid #d1d5db', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={sendDraft} style={{ borderRadius: 10, padding: '10px 14px', background: '#111827', color: '#fff', border: 0 }}>Enviar al chat</button>
            <button onClick={() => setDraft('crear producto')} style={{ borderRadius: 10, padding: '10px 14px', background: '#e5e7eb', border: 0 }}>Draft crear producto</button>
            <button onClick={() => setDraft('eliminar producto')} style={{ borderRadius: 10, padding: '10px 14px', background: '#fee2e2', border: 0 }}>Draft eliminar producto</button>
          </div>
        </footer>
      </section>

      <aside style={{ background: '#111827', color: '#f9fafb', borderRadius: 16, padding: 20, display: 'grid', gap: 16, alignContent: 'start' }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Qué prueba esto</h2>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>Example vivo</li>
            <li>Chat loop real del host</li>
            <li>Render ToonUI en mensajes del asistente</li>
            <li>Separación entre `content` y `displayContent`</li>
          </ul>
        </div>

        <div>
          <h2>Último evento estructurado</h2>
          <pre style={{ background: '#1f2937', borderRadius: 12, padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {lastStructuredMessage?.content ?? 'Aún no hay eventos ui_reply/ui_submit.'}
          </pre>
        </div>

        <div>
          <h2>Último texto visible</h2>
          <pre style={{ background: '#1f2937', borderRadius: 12, padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {lastStructuredMessage?.displayContent ?? 'Aún no hay displayContent visible.'}
          </pre>
        </div>
      </aside>
    </div>
  );
}
