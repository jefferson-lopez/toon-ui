import React, { useMemo, useState } from 'react';
import { ToonMessage, createToonUI } from '@toon-ui/toon-ui';

const sample = [
  'Claro, encontré este producto.',
  '',
  '```toon-ui',
  'card "Producto encontrado":',
  '  text "Coca-Cola 400ml"',
  '  badge "Activo" success',
  '  button secondary "Ver producto" reply="Ver producto"',
  '```',
].join('\n');

const toon = createToonUI();

export default function App() {
  const [content, setContent] = useState(sample);

  const analysis = useMemo(() => {
    try {
      const blocks = toon.extractBlocks(content);
      const ast = blocks.map((block) => toon.parse(block.raw));
      const validation = ast.map((document) => toon.validate(document));
      return { blocks, ast, validation, error: null };
    } catch (error) {
      return { blocks: [], ast: [], validation: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [content]);

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'grid', gap: 24, gridTemplateColumns: '1.2fr 1fr 1fr' }}>
      <section style={{ background: '#ffffff', borderRadius: 16, padding: 20, display: 'grid', gap: 12 }}>
        <header>
          <h1 style={{ margin: 0 }}>ToonUI Playground</h1>
          <p style={{ marginBottom: 0, color: '#4b5563' }}>Editor mínimo para escribir markdown + toon-ui, ver render, AST y errores.</p>
        </header>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={28}
          style={{ width: '100%', borderRadius: 12, padding: 12, border: '1px solid #d1d5db', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setContent(sample)} style={{ borderRadius: 10, padding: '10px 14px', background: '#111827', color: '#fff', border: 0 }}>Restaurar ejemplo</button>
          <button onClick={() => navigator.clipboard?.writeText(toon.prompt)} style={{ borderRadius: 10, padding: '10px 14px', background: '#e5e7eb', border: 0 }}>Copiar prompt</button>
        </div>
      </section>

      <section style={{ background: '#ffffff', borderRadius: 16, padding: 20, display: 'grid', gap: 16, alignContent: 'start' }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Render UI</h2>
          <ToonMessage content={content} runtime={toon} />
        </div>

        <div>
          <h2>Errores</h2>
          <pre style={{ background: '#f9fafb', borderRadius: 12, padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {analysis.error
              ? analysis.error
              : JSON.stringify(analysis.validation.flatMap((result) => result.errors), null, 2) || '[]'}
          </pre>
        </div>

        <div>
          <h2>Prompt generado</h2>
          <pre style={{ background: '#f9fafb', borderRadius: 12, padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{toon.prompt}</pre>
        </div>
      </section>

      <section style={{ background: '#111827', color: '#f9fafb', borderRadius: 16, padding: 20, display: 'grid', gap: 16, alignContent: 'start' }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Blocks</h2>
          <pre style={{ background: '#1f2937', borderRadius: 12, padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(analysis.blocks, null, 2)}</pre>
        </div>
        <div>
          <h2>AST</h2>
          <pre style={{ background: '#1f2937', borderRadius: 12, padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(analysis.ast, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
