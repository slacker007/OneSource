type SectionHighlight = {
  label: string;
  value: string;
  detail: string;
};

type SectionPlaceholderProps = {
  description: string;
  eyebrow: string;
  highlights: SectionHighlight[];
  title: string;
};

export function SectionPlaceholder({
  description,
  eyebrow,
  highlights,
  title,
}: SectionPlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="border-border bg-surface rounded-[28px] border px-5 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6">
        <p className="text-muted text-xs tracking-[0.24em] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted mt-4 max-w-3xl text-sm leading-7 sm:text-base">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.label}
            className="border-border rounded-[24px] border bg-white p-5 shadow-[0_14px_34px_rgba(20,37,34,0.06)]"
          >
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              {highlight.label}
            </p>
            <p className="font-heading text-foreground mt-4 text-2xl font-semibold tracking-[-0.03em]">
              {highlight.value}
            </p>
            <p className="text-muted mt-3 text-sm leading-6">
              {highlight.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
