interface SectionHeaderProps {
  eyebrow: string;
  description?: string;
  title: string;
}

export function SectionHeader({ description, eyebrow, title }: SectionHeaderProps) {
  return (
    <section className="grid gap-2">
      <div className="grid gap-2">
        <p className="m-0 text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
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
