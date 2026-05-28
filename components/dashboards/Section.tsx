import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className = "" }: SectionProps) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-5 ${className}`}
    >
      <header className="mb-3">
        <h3 className="text-subhead font-semibold text-[var(--fg)] tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-caption text-[var(--fg-muted)] mt-0.5">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}
