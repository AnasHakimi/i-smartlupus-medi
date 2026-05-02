"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md " +
  "transition-[background-color,transform] duration-base ease-ios-out " +
  "active:scale-[0.97] active:duration-fast " +
  "focus-visible:outline-none focus-visible:shadow-ring " +
  "disabled:opacity-40 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  lg: "min-h-touch px-5 text-body",   // 48px — full-width sticky submit (login, form bottom bar)
  md: "h-9 px-3.5 text-subhead",      // 36px — default, Anaskimi's preferred density
  sm: "h-8 px-2.5 text-footnote",     // 32px — ultra-dense inline (table rows)
};

const variants: Record<Variant, string> = {
  primary:
    "font-bold bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-tactile),var(--shadow-inner-glow)]",
  secondary:
    "font-semibold bg-[var(--surface-elevated)] text-[var(--fg)] border border-[var(--border-strong)] " +
    "hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] shadow-sm",
  destructive:
    "font-bold bg-[var(--destructive)] text-[var(--on-destructive)] hover:brightness-95 shadow-[var(--shadow-tactile),var(--shadow-inner-glow)]",
  ghost:
    "font-medium bg-transparent text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, sizes[size], variants[variant], className)}
        {...rest}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" role="status" aria-label="Memuatkan" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
