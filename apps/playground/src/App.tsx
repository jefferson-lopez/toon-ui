import React, { useMemo, useState } from 'react';
import { ToonMessage, createToonRuntime } from '@toon-ui/toon-ui';

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

const showcase = [
  '# Catálogo ToonUI 1.2',
  '',
  'Esta demo carga una muestra amplia del catálogo semántico actual.',
  '',
  '```toon-ui',
  'heading 1 "Showcase de componentes"',
  'text "Esta vitrina ayuda a revisar el parser, el renderer y el prompt en un solo lugar."',
  'separator',
  'alert info "Estado del sistema":',
  '  text "La nueva versión amplía el catálogo semántico y el modo UI-first."',
  'card "Resumen":',
  '  badge "v1.2.0" info',
  '  text "Incluye overlays, navegación ligera, feedback, charts y mejores formularios."',
  'empty "No hay resultados recientes":',
  '  text "Usa este patrón para estados vacíos."',
  '  button secondary "Reintentar" reply="Reintentar búsqueda"',
  'confirm neutral "¿Continuar con la configuración?":',
  '  text "Esta confirmación no es destructiva."',
  '  button secondary "Cancelar" reply="Cancelar"',
  '  button primary "Continuar" reply="Continuar"',
  'form "Crear producto":',
  '  field name text "Nombre" placeholder="Ej: Coca-Cola" required',
  '  field price number "Precio" placeholder="Ej: 25.50" required',
  '  field category select "Categoría" options="Bebidas|Snacks|Lácteos" required',
  '  field notes textarea "Notas" placeholder="Detalles opcionales"',
  '  field active checkbox "Producto activo"',
  '  button primary "Guardar producto" submit',
  'tabs "Vistas de cliente":',
  '  tab "Resumen":',
  '    text "Cliente activo desde 2024."',
  '  tab "Crédito":',
  '    text "Límite disponible: $ 2,500.00"',
  'accordion "Preguntas frecuentes":',
  '  section "Facturación":',
  '    text "Se puede emitir factura desde el historial."',
  '  section "Envíos":',
  '    text "Entrega estimada: 24 a 48 horas."',
  'dialog "Editar cliente":',
  '  text "Úsalo para acciones importantes dentro del flujo."',
  'sheet "Detalle lateral" side="right":',
  '  text "Sirve para contexto secundario."',
  'popover "Ayuda contextual":',
  '  text "Ideal para explicación corta con más contenido que un tooltip."',
  'tooltip "Pasa el mouse para ver ayuda breve"',
  'progress "Carga de inventario" value=65 max=100',
  'loading "Sincronizando productos..."',
  'toast success "Producto creado correctamente"',
  'breadcrumb:',
  '  crumb "Inicio" reply="Ir a inicio"',
  '  crumb "Inventario" reply="Ir a inventario"',
  '  crumb "Productos"',
  'pagination page=2 totalPages=8',
  'menu "Acciones rápidas":',
  '  action "Editar cliente" reply="Editar cliente"',
  '  action "Eliminar cliente" reply="Eliminar cliente" variant=danger',
  'command "Buscar acción":',
  '  action "Crear producto" reply="Crear producto"',
  '  action "Registrar venta" reply="Registrar venta"',
  'list "Clientes encontrados":',
  '  item "Jefferson Lopez":',
  '    text "Cliente frecuente"',
  '  item "Andrea Pérez":',
  '    text "Crédito habilitado"',
  'table "Ventas recientes":',
  '  columns: "Fecha", "Número", "Total", "Estado"',
  '  row: "18 May", "A-1001", "$ 120.00", "Completada"',
  '  row: "18 May", "A-1002", "$ 86.50", "Pendiente"',
  'chart bar "Ventas semanales" x="Día" y="Monto":',
  '  series "Sucursal Centro":',
  '    point "Lun" 20',
  '    point "Mar" 35',
  '    point "Mié" 48',
  '  series "Sucursal Norte":',
  '    point "Lun" 18',
  '    point "Mar" 28',
  '    point "Mié" 52',
  '```',
].join('\n');

const groups = [
  { title: 'Base', items: ['text', 'heading', 'separator', 'badge', 'alert', 'empty'] },
  { title: 'Captura', items: ['form', 'field', 'button', 'confirm'] },
  { title: 'Estructura', items: ['card', 'list', 'item', 'table', 'tabs', 'accordion'] },
  { title: 'Overlays', items: ['dialog', 'sheet', 'popover', 'tooltip'] },
  { title: 'Feedback', items: ['progress', 'loading', 'toast'] },
  { title: 'Navegación', items: ['breadcrumb', 'pagination', 'menu', 'command'] },
  { title: 'Analytics', items: ['chart'] },
];

const toon = createToonRuntime();

function SectionCard({ children }: { children: React.ReactNode }) {
  return <section style={{ background: '#ffffff', borderRadius: 16, padding: 20, display: 'grid', gap: 16, alignContent: 'start' }}>{children}</section>;
}

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
    <div style={{ minHeight: '100vh', padding: 24, display: 'grid', gap: 24, gridTemplateColumns: '1.1fr 1fr 1fr' }}>
      <SectionCard>
        <header>
          <h1 style={{ margin: 0 }}>ToonUI Playground</h1>
          <p style={{ marginBottom: 0, color: '#4b5563' }}>
            Editor para escribir markdown + toon-ui, ver render, AST, errores y ahora también una vitrina rápida del catálogo semántico.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setContent(sample)} style={{ borderRadius: 10, padding: '10px 14px', background: '#111827', color: '#fff', border: 0 }}>Restaurar ejemplo</button>
            <button onClick={() => setContent(showcase)} style={{ borderRadius: 10, padding: '10px 14px', background: '#2563eb', color: '#fff', border: 0 }}>Cargar showcase v1.2</button>
            <button onClick={() => navigator.clipboard?.writeText(toon.prompt)} style={{ borderRadius: 10, padding: '10px 14px', background: '#e5e7eb', border: 0 }}>Copiar prompt</button>
          </div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {groups.map((group) => (
              <div key={group.title} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <strong>{group.title}</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {group.items.map((item) => (
                    <span key={item} style={{ display: 'inline-flex', borderRadius: 999, padding: '4px 8px', background: '#f3f4f6', color: '#111827', fontSize: 13 }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={34}
          style={{ width: '100%', borderRadius: 12, padding: 12, border: '1px solid #d1d5db', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
        />
      </SectionCard>

      <SectionCard>
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
      </SectionCard>

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
