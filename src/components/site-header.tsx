import Link from "next/link";
import { auth, isGoogleAuthEnabled, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  className?: string;
  tone?: "light" | "dark";
};

export async function SiteHeader({
  className,
  tone = "light",
}: SiteHeaderProps) {
  const isDark = tone === "dark";
  const session = isGoogleAuthEnabled ? await auth() : null;

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
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/audits/demo"
            className={cn(
              "text-sm font-medium transition-opacity hover:opacity-70",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            Voir un exemple
          </Link>
          {isGoogleAuthEnabled && !session?.user && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className={cn(
                  isDark &&
                    "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Connexion
              </Button>
            </form>
          )}
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  "hidden max-w-[10rem] truncate text-sm sm:inline",
                  isDark ? "text-white/60" : "text-muted-foreground",
                )}
              >
                {session.user.name ?? session.user.email}
              </span>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className={cn(isDark && "border-transparent text-white/80 hover:bg-white/10")}
              >
                Déconnexion
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
