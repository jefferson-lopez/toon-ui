"use client";

import { type ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export function Message({ className, from, ...props }: ComponentProps<"div"> & { from: "user" | "assistant" }) {
  return (
    <div
      className={cn("flex w-full", from === "user" ? "justify-end" : "justify-start", className)}
      data-role={from}
      {...props}
    />
  );
}

export function MessageContent({ className, from, ...props }: ComponentProps<"div"> & { from?: "user" | "assistant" }) {
  return (
    <div
      className={cn(
        "max-w-[760px] rounded-[28px] px-5 py-4 shadow-sm",
        from === "user"
          ? "max-w-[680px] rounded-br-md bg-slate-900 text-white"
          : "rounded-bl-md border border-slate-200 bg-white text-slate-900",
        className,
      )}
      {...props}
    />
  );
}

export function MessageResponse({ className, children, ...props }: ComponentProps<"div">) {
  const content = typeof children === "string" ? children : "";

  return (
    <div className={cn("[&_p]:my-0 [&_p]:leading-7", className)} {...props}>
      <Streamdown>{content}</Streamdown>
    </div>
  );
}
