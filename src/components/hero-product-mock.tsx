type HeroProductMockProps = {
  className?: string;
};

/**
 * Decorative product preview — low visual weight so the CTA stays the focus
 * (concentration: one attention path).
 */
export function HeroProductMock({ className }: HeroProductMockProps) {
  return (
    <div aria-hidden className={className}>
      <div className="absolute inset-y-8 right-[-8%] hidden w-[58%] max-w-3xl rotate-[-2deg] rounded-2xl border border-white/8 bg-[var(--panel)]/70 p-6 opacity-55 shadow-2xl backdrop-blur-sm lg:block xl:right-[4%]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              exemple.com
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-white/90">
              67
              <span className="ml-2 text-lg font-medium text-white/35">/100</span>
            </p>
          </div>
          <div className="h-20 w-20 rounded-full border-[6px] border-[var(--accent)]/20 border-t-[var(--accent)]/70" />
        </div>
        <div className="space-y-3">
          {[
            "Description Google à rédiger",
            "Textes d’images à compléter",
            "URL de référence à indiquer",
          ].map((title, index) => (
            <div
              key={title}
              className="rounded-xl border border-white/6 bg-white/4 px-4 py-3"
              style={{ opacity: 1 - index * 0.2 }}
            >
              <p className="text-sm font-medium text-white/75">{title}</p>
              <p className="mt-1 text-xs text-white/30">
                {index === 0 ? "À traiter d’abord" : "Utile"} · Corriger avec
                l&apos;IA
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
