"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        style={{ animation: "overlay-in 140ms ease-out" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ animation: "panel-in 180ms cubic-bezier(0.16,1,0.3,1)" }}
        className={cn(
          "bg-surface border-line shadow-overlay relative flex max-h-[90vh] w-full flex-col rounded-t-2xl border sm:rounded-2xl",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-xl",
          size === "lg" && "sm:max-w-3xl",
        )}
      >
        <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-ink text-[15px] font-semibold">{title}</h2>
            {description && <p className="text-ink-muted mt-0.5 text-[13px]">{description}</p>}
          </div>
          <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-line bg-surface-muted/60 flex items-center justify-end gap-2 rounded-b-2xl border-t px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        style={{ animation: "overlay-in 140ms ease-out" }}
      />
      <aside
        aria-label={title}
        className="bg-surface border-line shadow-overlay relative flex h-full w-full max-w-lg flex-col border-l"
        style={{ animation: "panel-in 200ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-ink truncate text-[15px] font-semibold">{title}</h2>
            {subtitle && <p className="text-ink-muted mt-0.5 truncate text-[13px]">{subtitle}</p>}
          </div>
          <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-line bg-surface-muted/60 flex items-center justify-end gap-2 border-t px-5 py-3.5">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
