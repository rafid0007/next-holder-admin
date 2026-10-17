"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-card hover:brightness-110 active:brightness-95 disabled:bg-brand/50",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-card hover:bg-surface-hover",
  ghost: "text-ink-muted hover:bg-surface-hover hover:text-ink",
  danger: "bg-bad-soft text-bad border border-bad/25 hover:bg-bad/15",
  subtle: "bg-brand-soft text-brand-ink hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[13px]",
  md: "h-9.5 gap-2 px-3.5 text-sm",
  icon: "h-9 w-9 justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center rounded-lg font-medium whitespace-nowrap transition-[background-color,color,filter,box-shadow] disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
