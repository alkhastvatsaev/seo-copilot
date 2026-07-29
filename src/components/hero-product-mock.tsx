type HeroProductMockProps = {
  className?: string;
};

/**
 * Decorative product preview — after CTA in DOM, low opacity, no action copy
 * (concentration: one attention path).
 */
export function HeroProductMock({ className }: HeroProductMockProps) {
  return (
    <div aria-hidden className={className}>
      <div className="absolute inset-y-8 right-[-8%] hidden w-[58%] max-w-3xl rotate-[-2deg] rounded-2xl border border-white/6 bg-[var(--panel)]/50 p-6 opacity-40 shadow-xl backdrop-blur-sm lg:block xl:right-[4%]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              exemple.com
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-white/80">
              67
              <span className="ml-2 text-lg font-medium text-white/30">/100</span>
            </p>
          </div>
          <div className="h-20 w-20 rounded-full border-[6px] border-[var(--accent)]/15 border-t-[var(--accent)]/60" />
        </div>
        <div className="space-y-3">
          {[
            { title: "Description Google à rédiger", tag: "À traiter d’abord" },
            { title: "Textes d’images à compléter", tag: "Utile" },
            { title: "URL de référence à indiquer", tag: "Utile" },
          ].map((item, index) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/5 bg-white/3 px-4 py-3"
              style={{ opacity: 1 - index * 0.22 }}
            >
              <p className="text-sm font-medium text-white/65">{item.title}</p>
              <p className="mt-1 text-xs text-white/25">{item.tag}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
