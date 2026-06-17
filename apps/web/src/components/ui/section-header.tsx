interface SectionHeaderProps {
  eyebrow: string;
  title: string;
}

export function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <section className="flex items-center justify-between">
      <div>
        <p className="m-0 text-[13px] font-bold uppercase text-[var(--muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[32px] leading-tight tracking-normal">{title}</h1>
      </div>
    </section>
  );
}
