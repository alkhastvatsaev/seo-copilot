type HeroProductMockProps = {
  className?: string;
};

/** Decorative product preview for the landing hero plane (not interactive). */
export function HeroProductMock({ className }: HeroProductMockProps) {
  return (
    <div
      aria-hidden
      className={className}
    >
      <div className="absolute inset-y-8 right-[-8%] hidden w-[58%] max-w-3xl rotate-[-2deg] rounded-2xl border border-white/10 bg-[var(--panel)] p-6 shadow-2xl backdrop-blur-sm lg:block xl:right-[4%]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              exemple.com
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-white">
              67
              <span className="ml-2 text-lg font-medium text-white/40">/100</span>
            </p>
          </div>
          <div className="h-20 w-20 rounded-full border-[6px] border-[var(--accent)]/30 border-t-[var(--accent)]" />
        </div>
        <div className="space-y-3">
          {[
            "Meta description manquante",
            "Images sans attribut alt",
            "Canonical manquant",
          ].map((title, index) => (
            <div
              key={title}
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-3"
              style={{ opacity: 1 - index * 0.18 }}
            >
              <p className="text-sm font-medium text-white/90">{title}</p>
              <p className="mt-1 text-xs text-white/40">
                Priorité {index === 0 ? "élevée" : "moyenne"} · Corriger avec l&apos;IA
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
