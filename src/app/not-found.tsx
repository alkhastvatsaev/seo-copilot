import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
          Page introuvable
        </h1>
        <p className="mt-3 text-muted-foreground">
          Cet audit n&apos;existe pas ou l&apos;URL est incorrecte.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="underline underline-offset-2">
            Retour à l&apos;accueil
          </Link>
          <Link href="/audits/demo" className="underline underline-offset-2">
            Voir l&apos;exemple d&apos;audit
          </Link>
        </div>
      </main>
    </div>
  );
}
