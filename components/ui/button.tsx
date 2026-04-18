"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md " +
  "transition-[background-color,transform] duration-base ease-ios-out " +
  "active:scale-[0.97] active:duration-fast " +
  "focus-visible:outline-none focus-visible:shadow-ring " +
  "disabled:opacity-40 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "min-h-touch px-5 text-body",
  sm: "h-10 px-3 text-subhead",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)]",
  secondary:
    "bg-[var(--primary-tint)] text-[var(--primary)] hover:bg-[var(--primary-tint)] " +
    "hover:brightness-95 dark:hover:brightness-110",
  destructive:
    "bg-[var(--destructive)] text-[var(--on-destructive)] hover:brightness-95 " +
    "data-variant-destructive",
  ghost:
    "bg-transparent text-[var(--primary)] hover:bg-[var(--primary-tint)]",
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
