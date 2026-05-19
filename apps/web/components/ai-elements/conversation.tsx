"use client";

import { ChevronDown } from "lucide-react";
import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConversationContextValue = {
  viewportRef: RefObject<HTMLDivElement | null>;
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(null);

function useConversationContext() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error("Conversation components must be used inside <Conversation />");
  }

  return context;
}

export function Conversation({ className, children, ...props }: ComponentProps<"div">) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const element = viewportRef.current;
    if (!element) return;

    element.scrollTo({ top: element.scrollHeight, behavior });
  };

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const update = () => {
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      setIsAtBottom(distanceFromBottom < 24);
    };

    update();
    element.addEventListener("scroll", update);

    return () => element.removeEventListener("scroll", update);
  }, []);

  const value = useMemo(
    () => ({ viewportRef, isAtBottom, scrollToBottom }),
    [isAtBottom],
  );

  return (
    <ConversationContext.Provider value={value}>
      <div className={cn("relative flex min-h-0 flex-1 flex-col", className)} {...props}>
        {children}
      </div>
    </ConversationContext.Provider>
  );
}

export function ConversationContent({ className, children, ...props }: ComponentProps<"div">) {
  const { viewportRef, scrollToBottom, isAtBottom } = useConversationContext();

  useEffect(() => {
    if (!isAtBottom) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [children, isAtBottom, scrollToBottom]);

  return (
    <div
      ref={viewportRef}
      className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ConversationEmptyState({ className, title, description, icon, ...props }: ComponentProps<"div"> & {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid min-h-full place-items-center rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        {icon ? <div className="rounded-full border border-slate-200 bg-slate-50 p-4 text-slate-500">{icon}</div> : null}
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ConversationScrollButton({ className, ...props }: ComponentProps<typeof Button>) {
  const { isAtBottom, scrollToBottom } = useConversationContext();

  if (isAtBottom) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={cn("absolute right-6 bottom-6 z-10 h-10 w-10 rounded-full p-0 shadow-sm", className)}
      onClick={() => scrollToBottom()}
      {...props}
    >
      <ChevronDown className="size-4" />
    </Button>
  );
}
