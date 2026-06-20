import type { ReactNode } from "react";

interface SettingsGroupProps {
  children: ReactNode;
  description: string;
  id: string;
  title: string;
}

export function SettingsGroup({
  children,
  description,
  id,
  title
}: SettingsGroupProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="grid gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 scroll-mt-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
      id={id}
    >
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {title}
        </p>
        <h2 className="text-2xl font-bold" id={`${id}-title`}>
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </section>
  );
}
