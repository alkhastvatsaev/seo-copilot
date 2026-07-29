import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  className?: string;
  tone?: "light" | "dark";
  /** Show demo link — off on landing to keep one CTA. */
  showDemoLink?: boolean;
};

/** Minimal header: brand only by default (v1 conversion — no auth friction). */
export function SiteHeader({
  className,
  tone = "light",
  showDemoLink = false,
}: SiteHeaderProps) {
  const isDark = tone === "dark";

  return (
    <header className={cn("relative z-20", className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          href="/"
          className={cn(
            "font-[family-name:var(--font-display)] text-xl font-bold tracking-tight",
            isDark ? "text-white" : "text-foreground",
          )}
        >
          SEO Copilot
        </Link>
        {showDemoLink && (
          <Link
            href="/audits/demo"
            className={cn(
              "text-sm font-medium transition-opacity hover:opacity-70",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            Exemple
          </Link>
        )}
      </div>
    </header>
  );
}
