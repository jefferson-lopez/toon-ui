"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Package2, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { DemoPlayer, type DemoTimeline } from "uitodemo";
import {
  ToonMessage,
  createToonAdapter,
  createToonClient,
  getToonButtonProps,
  getToonInputProps,
  type ToonAlertComponentProps,
  type ToonBadgeComponentProps,
  type ToonButtonComponentProps,
  type ToonCardComponentProps,
  type ToonConfirmComponentProps,
  type ToonFieldComponentProps,
  type ToonFormComponentProps,
  type ToonItemComponentProps,
  type ToonListComponentProps,
  type ToonReplyPayload,
  type ToonSubmitPayload,
  type ToonTextComponentProps,
} from "@toon-ui/toon-ui";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type FlowStep =
  | "delete-request"
  | "awaiting-delete-confirm"
  | "awaiting-create-request"
  | "awaiting-form-submit"
  | "awaiting-info-request"
  | "completed";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function DemoToonText({ node }: ToonTextComponentProps) {
  return <p className="m-0 text-sm leading-6 text-slate-600">{node.value}</p>;
}

function DemoToonBadge({ node }: ToonBadgeComponentProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        node.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        node.variant === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        node.variant === "danger" && "border-red-200 bg-red-50 text-red-700",
        node.variant === "info" && "border-sky-200 bg-sky-50 text-sky-700",
        (!node.variant || node.variant === "neutral") &&
          "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {node.label}
    </span>
  );
}

function DemoToonList({ node, children }: ToonListComponentProps) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-slate-900">{node.title}</p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function DemoToonItem({ node, children }: ToonItemComponentProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">{node.title}</p>
      {children ? <div className="mt-2 grid gap-2">{children}</div> : null}
    </div>
  );
}

function DemoToonCard({ node, children }: ToonCardComponentProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{node.title}</p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function DemoToonConfirm({ node, children }: ToonConfirmComponentProps) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-2xl border bg-white p-4 shadow-sm",
        node.variant === "danger"
          ? "border-red-200"
          : node.variant === "warning"
            ? "border-amber-200"
            : "border-slate-200",
      )}
    >
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-slate-900">{node.title}</p>
        <p className="text-sm text-slate-500">
          Confirma la acción para que el host decida qué hacer después.
        </p>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function DemoToonAlert({ node, children }: ToonAlertComponentProps) {
  const Icon =
    node.variant === "success"
      ? CheckCircle2
      : node.variant === "danger"
        ? XCircle
        : node.variant === "warning"
          ? AlertTriangle
          : Info;

  return (
    <div
      className={cn(
        "grid gap-2 rounded-2xl border p-4",
        node.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        node.variant === "danger" && "border-red-200 bg-red-50 text-red-900",
        node.variant === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
        node.variant === "info" && "border-sky-200 bg-sky-50 text-sky-900",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <p className="text-sm font-semibold">{node.title}</p>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function DemoToonForm({ node, children, submitForm, disabled }: ToonFormComponentProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitForm();
      }}
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-slate-900">{node.title}</p>
        <p className="text-sm text-slate-500">
          El formulario vive dentro de ToonUI y el host recibe un submit tipado.
        </p>
      </div>
      <div className="grid gap-4">{children}</div>
      {disabled ? <input type="submit" hidden /> : null}
    </form>
  );
}

function DemoToonField(props: ToonFieldComponentProps) {
  const inputProps = getToonInputProps(props);
  const targetId = `toon-field-${slugify(props.node.name)}`;

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-900">{props.node.label}</span>
      <input
        {...inputProps}
        data-demo={targetId}
        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300"
      />
    </label>
  );
}

function DemoToonButton(props: ToonButtonComponentProps) {
  const actionId =
    props.node.action.kind === "reply"
      ? `toon-reply-${slugify(props.node.action.value)}`
      : `toon-submit-${slugify(props.node.label)}`;

  const variant =
    props.node.variant === "primary"
      ? "default"
      : props.node.variant === "secondary"
        ? "secondary"
        : props.node.variant === "outline"
          ? "outline"
          : props.node.variant === "ghost"
            ? "ghost"
            : "outline";

  return (
    <Button
      {...getToonButtonProps(props)}
      data-demo={actionId}
      variant={variant}
      className={cn(
        "w-fit rounded-xl",
        props.node.variant === "danger" &&
          "border-red-200 bg-red-600 text-white hover:bg-red-500 hover:text-white",
      )}
    >
      {props.node.label}
    </Button>
  );
}

const toon = createToonClient({
  adapter: createToonAdapter({
    level: "default",
    components: {
      text: DemoToonText,
      badge: DemoToonBadge,
      list: DemoToonList,
      item: DemoToonItem,
      card: DemoToonCard,
      confirm: DemoToonConfirm,
      alert: DemoToonAlert,
      form: DemoToonForm,
      field: DemoToonField,
      button: DemoToonButton,
    },
  }),
});

const initialPrompt = "quiero eliminar el producto Dulces";

const confirmAssistantMessage = [
  "Claro. Antes de eliminar el producto, necesito una confirmación explícita.",
  "",
  "Así la intención queda clara y el host recibe una señal confiable para decidir si ejecuta la acción real.",
  "",
  "```toon-ui",
  'confirm danger "¿Estás seguro que quieres eliminar este producto?":',
  '  text "El producto Dulces será eliminado."',
  '  button secondary "Cancelar" reply="cancel-delete"',
  '  button danger "Sí, estoy seguro" reply="confirm-delete"',
  "```",
].join("\n");

const successAssistantMessage = [
  "Perfecto. El host recibió la confirmación y completó la eliminación.",
  "",
  "```toon-ui",
  'alert success "Producto eliminado con éxito":',
  '  text "El producto Dulces ha sido eliminado con éxito."',
  "```",
].join("\n");

const createProductIntroMessage = [
  "Claro. Primero llena los campos del formulario con el nombre y el precio del producto.",
  "",
  "Después se hace clic en crear y el host recibe un submit estructurado.",
].join("\n");

const createProductMessage = [
  "```toon-ui",
  'form "Crear producto":',
  '  field name text "Nombre" required',
  '  field price number "Precio" required',
  '  button primary "Crear producto" submit',
  "```",
].join("\n");

function getCreatedProductMessage(name: string, price: string) {
  return [
    "```toon-ui",
    'alert success "Producto creado con éxito":',
    `  text "El producto ${name} fue creado con éxito con precio $${price}."`,
    "```",
  ].join("\n");
}

function getProductInfoMessage(name: string, price: string) {
  return [
    "Claro. Aquí tienes la información completa del producto nuevo.",
    "",
    "```toon-ui",
    'card "Información del producto":',
    `  text "${name}"`,
    '  badge "Activo" success',
    '  list "Detalles":',
    '    item "Nombre":',
    `      text "${name}"`,
    '    item "Precio":',
    `      text "$${price}"`,
    '    item "Estado":',
    '      text "Disponible para venta"',
    "```",
  ].join("\n");
}

function streamText(
  value: string,
  onUpdate: (next: string) => void,
  onDone: () => void,
  charsPerTick = 2,
  tickMs = 18,
) {
  let index = 0;
  const timer = window.setInterval(() => {
    index += charsPerTick;
    onUpdate(value.slice(0, index));

    if (index >= value.length) {
      window.clearInterval(timer);
      onDone();
    }
  }, tickMs);

  return () => window.clearInterval(timer);
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
  };
}

function getReplyDisplayLabel(value: string): string {
  if (value === "confirm-delete") return "Sí, estoy seguro";
  if (value === "cancel-delete") return "Cancelar";
  return value;
}

function renderAssistantMarkdown(markdown: string) {
  return <MessageResponse>{markdown}</MessageResponse>;
}

export function LandingDemo() {
  const [composerValue, setComposerValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusText, setStatusText] = useState("Esperando el primer mensaje...");
  const [lastInteraction, setLastInteraction] = useState("Sin interacción ToonUI todavía.");
  const [flowStep, setFlowStep] = useState<FlowStep>("delete-request");
  const [createdProduct, setCreatedProduct] = useState({ name: "Nuevo producto", price: "0.00" });
  const [demoRunKey, setDemoRunKey] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const timeline = useMemo<DemoTimeline>(
    () => [
      { type: "focus", target: "chat-input", cursor: "text", delay: 700 },
      {
        type: "type",
        target: "chat-input",
        value: initialPrompt,
        delay: 62,
        cursor: "text",
      },
      { type: "wait", delay: 1400 },
      { type: "click", target: "send-message", cursor: "pointer", hover: true },
      { type: "wait", delay: 4200 },
      { type: "click", target: "toon-reply-confirm-delete", cursor: "pointer", hover: true },
      { type: "wait", delay: 3600 },
      { type: "focus", target: "chat-input", cursor: "text", delay: 900 },
      {
        type: "type",
        target: "chat-input",
        value: "ahora quiero crear un producto",
        delay: 65,
        cursor: "text",
      },
      { type: "wait", delay: 1200 },
      { type: "click", target: "send-message", cursor: "pointer", hover: true },
      { type: "wait", delay: 5000 },
      { type: "focus", target: "toon-field-name", cursor: "text", delay: 900 },
      { type: "type", target: "toon-field-name", value: "Chocolate premium", delay: 85, cursor: "text" },
      { type: "wait", delay: 1400 },
      { type: "focus", target: "toon-field-price", cursor: "text", delay: 650 },
      { type: "type", target: "toon-field-price", value: "12.99", delay: 115, cursor: "text" },
      { type: "wait", delay: 1500 },
      { type: "click", target: "toon-submit-crear-producto", cursor: "pointer", hover: true },
      { type: "wait", delay: 3600 },
      { type: "focus", target: "chat-input", cursor: "text", delay: 900 },
      {
        type: "type",
        target: "chat-input",
        value: "ahora quiero ver la información completa del producto nuevo",
        delay: 55,
        cursor: "text",
      },
      { type: "wait", delay: 1200 },
      { type: "click", target: "send-message", cursor: "pointer", hover: true },
      { type: "wait", delay: 5200 },
    ],
    [demoRunKey],
  );

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  function resetDemoState() {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setComposerValue("");
    setMessages([]);
    setStatusText("Esperando el primer mensaje...");
    setLastInteraction("Sin interacción ToonUI todavía.");
    setFlowStep("delete-request");
    setCreatedProduct({ name: "Nuevo producto", price: "0.00" });
  }

  function restartWholeDemo() {
    resetDemoState();
    setDemoRunKey((current) => current + 1);
  }

  function appendInteractionMessage(interaction: ReturnType<typeof toon.messages.toUIMessage>) {
    const content =
      interaction.metadata.displayContent ??
      interaction.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");

    setMessages((current) => [...current, createMessage("user", content)]);
  }

  function streamAssistantMessage(content: string, onDone?: () => void) {
    const assistantId = `assistant-${Math.random().toString(36).slice(2, 10)}`;
    setMessages((current) => [...current, { id: assistantId, role: "assistant", content: "" }]);

    const initialDelay = window.setTimeout(() => {
      cleanupRef.current = streamText(
        content,
        (next) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content: next } : message,
            ),
          );
        },
        () => {
          onDone?.();
        },
      );
    }, 520);

    cleanupRef.current = () => window.clearTimeout(initialDelay);
  }

  function handlePromptSubmit(message: PromptInputMessage) {
    if (
      !message.text.trim() ||
      flowStep === "awaiting-delete-confirm" ||
      flowStep === "awaiting-form-submit" ||
      flowStep === "completed"
    ) {
      return;
    }

    const userValue = message.text.trim();
    setComposerValue("");
    setMessages((current) => [...current, createMessage("user", userValue)]);

    if (flowStep === "delete-request") {
      setStatusText("La app envió la solicitud de eliminación al modelo...");
      setFlowStep("awaiting-delete-confirm");
      streamAssistantMessage(confirmAssistantMessage, () => {
        setStatusText("La IA respondió con una confirmación estructurada de ToonUI.");
      });
      return;
    }

    if (flowStep === "awaiting-create-request") {
      setStatusText("La app envió la solicitud para crear un producto...");
      setFlowStep("awaiting-form-submit");
      streamAssistantMessage(createProductIntroMessage, () => {
        streamAssistantMessage(createProductMessage, () => {
          setStatusText("La IA mostró el formulario estructurado para crear el producto.");
        });
      });
      return;
    }

    if (flowStep === "awaiting-info-request") {
      setStatusText("La app pidió la información completa del producto...");
      setFlowStep("completed");
      streamAssistantMessage(getProductInfoMessage(createdProduct.name, createdProduct.price), () => {
        setStatusText("El flujo terminó. Reiniciando el chat...");
        window.setTimeout(() => {
          restartWholeDemo();
        }, 1600);
      });
    }
  }

  function handleToonEvent(payload: ToonReplyPayload | ToonSubmitPayload) {
    const interaction = toon.messages.toUIMessage(payload);
    const displayLabel =
      payload.kind === "ui_reply"
        ? getReplyDisplayLabel(payload.value)
        : interaction.metadata.displayContent;

    setLastInteraction(displayLabel);
    setStatusText(`Host recibió el evento estructurado: ${displayLabel}`);
    appendInteractionMessage(interaction);

    if (payload.kind === "ui_submit") {
      const name = String(payload.values.name ?? "Producto");
      const price = String(payload.values.price ?? "0.00");
      setCreatedProduct({ name, price });
      setFlowStep("awaiting-info-request");
      streamAssistantMessage(getCreatedProductMessage(name, price), () => {
        setStatusText("El host recibió el submit estructurado y creó el producto.");
      });
      return;
    }

    if (payload.value === "confirm-delete") {
      setFlowStep("awaiting-create-request");
      streamAssistantMessage(successAssistantMessage, () => {
        setStatusText("El host confirmó la eliminación y el chat quedó listo para el siguiente paso.");
      });
      return;
    }

    if (payload.value === "cancel-delete") {
      streamAssistantMessage(
        [
          "Perfecto. La intención de cancelar también volvió al host como un evento estructurado.",
          "",
          "```toon-ui",
          'alert info "Eliminación cancelada":',
          '  text "El usuario decidió no continuar con la eliminación del producto."',
          "```",
        ].join("\n"),
        () => {
          setStatusText("El host recibió la cancelación.");
        },
      );
      setFlowStep("delete-request");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] overflow-hidden">
      <DemoPlayer
        key={demoRunKey}
        timeline={timeline}
        isActive
        baseWidth={1040}
        baseHeight={720}
        frameBorderRadius="md"
        showControls={false}
        cursor={{ enabled: true, hideNativeCursor: false }}
        className="bg-transparent"
      >
        <div className="flex h-[720px] w-[1040px] flex-col overflow-hidden rounded-[24px] border bg-white text-slate-900">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold tracking-tight text-slate-950">
                  Toon<span className="text-primary">UI</span>
                </p>
                <p className="text-sm text-slate-500">
                  Shell del chat con patrón de AI Elements + contenido estructurado con ToonUI.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
                Demo guiado
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1fr_280px] bg-slate-50">
            <div className="flex min-h-0 flex-col border-r border-slate-200">
              <Conversation className="min-h-0 flex-1">
                <ConversationContent>
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <Message key={message.id} from={message.role === "assistant" ? "assistant" : "user"}>
                        <MessageContent from={message.role === "assistant" ? "assistant" : "user"}>
                          {message.role === "assistant" ? (
                            message.content ? (
                              <ToonMessage
                                content={message.content}
                                runtime={toon}
                                onReply={handleToonEvent}
                                onSubmit={handleToonEvent}
                                renderMarkdown={renderAssistantMarkdown}
                              />
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="size-2 animate-pulse rounded-full bg-slate-400" />
                                La IA está pensando...
                              </div>
                            )
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                          )}
                        </MessageContent>
                      </Message>
                    ))
                  ) : (
                    <ConversationEmptyState
                      icon={<Package2 className="size-6" />}
                      title="Flujo conversacional completo"
                      description="El demo elimina un producto, crea uno nuevo con formulario ToonUI, muestra la card final y reinicia todo el chat al terminar."
                    />
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              <div className="border-t border-slate-200 bg-white px-6 py-5">
                <PromptInput onSubmit={handlePromptSubmit}>
                  <PromptInputTextarea
                    data-demo="chat-input"
                    value={composerValue}
                    onChange={(event) => setComposerValue(event.target.value)}
                    placeholder="Escribe la siguiente acción que quieres hacer..."
                  />

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      AI Elements ordena la experiencia del chat y ToonUI mantiene el flujo estructurado.
                    </p>
                    <PromptInputSubmit
                      data-demo="send-message"
                      disabled={
                        !composerValue.trim() ||
                        flowStep === "awaiting-delete-confirm" ||
                        flowStep === "awaiting-form-submit" ||
                        flowStep === "completed"
                      }
                      status={
                        flowStep === "awaiting-delete-confirm" || flowStep === "awaiting-form-submit"
                          ? "streaming"
                          : "ready"
                      }
                    />
                  </div>
                </PromptInput>
              </div>
            </div>

            <aside className="flex flex-col gap-4 p-6">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Último evento ToonUI</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lastInteraction}</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Bot className="size-4" /> Estado del host
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{statusText}</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Arquitectura del demo</p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  <li>• AI Elements organiza conversación, scroll e input.</li>
                  <li>• `ToonMessage` sigue renderizando markdown + bloques `toon-ui`.</li>
                  <li>• `renderMarkdown` conecta ToonUI con el shell nuevo.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </DemoPlayer>
    </div>
  );
}
