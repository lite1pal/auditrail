interface SectionHeaderProps {
  eyebrow: string;
  description?: string;
  title: string;
}

export function SectionHeader({ description, eyebrow, title }: SectionHeaderProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="grid gap-2">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h1 className="text-[32px] leading-tight tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
