"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { domainInputSchema } from "@/lib/validations/domain";
import { cn } from "@/lib/utils";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

type DomainAuditFormProps = {
  variant?: "default" | "hero";
  className?: string;
};

export function DomainAuditForm({
  variant = "default",
  className,
}: DomainAuditFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [domain, setDomain] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const isHero = variant === "hero";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const parsed = domainInputSchema.safeParse({ domain });
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ?? "Indiquez un domaine valide",
      );
      return;
    }

    setDomain(parsed.data.domain);
    setFormState({ status: "loading" });

    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });

      const json = (await response.json()) as
        | { data: { auditId: string } }
        | { error: { code: string; message: string } };

      if (!response.ok || "error" in json) {
        const message =
          "error" in json
            ? json.error.message
            : "Impossible de lancer l'audit.";
        setFormState({ status: "error", message });
        return;
      }

      router.push(`/audits/${json.data.auditId}`);
    } catch {
      setFormState({
        status: "error",
        message: "Erreur réseau. Réessayez dans un instant.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      method="post"
      action="#"
      className={cn("w-full space-y-3", className)}
      aria-busy={formState.status === "loading"}
      noValidate
    >
      <div className="space-y-2">
        <Label
          htmlFor="domain"
          className={cn(isHero && "sr-only")}
        >
          Votre domaine
        </Label>
        <div
          className={cn(
            "flex flex-col gap-2 sm:flex-row sm:items-stretch",
            isHero &&
              "rounded-xl bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur-md",
          )}
        >
          <Input
            ref={inputRef}
            id="domain"
            name="domain"
            type="text"
            inputMode="url"
            enterKeyHint="go"
            placeholder="exemple.com"
            autoComplete="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            disabled={formState.status === "loading"}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "domain-error" : undefined}
            className={cn(
              "h-12 text-base",
              isHero &&
                "border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0",
            )}
          />
          <Button
            type="submit"
            size="lg"
            disabled={formState.status === "loading"}
            className={cn(
              "h-12 shrink-0 gap-2 px-6",
              isHero &&
                "bg-[var(--accent)] text-accent-foreground hover:bg-[var(--accent)]/90",
            )}
          >
            {formState.status === "loading" ? "Analyse…" : "Auditer"}
            {formState.status !== "loading" && <ArrowRight />}
          </Button>
        </div>
        {fieldError && (
          <p
            id="domain-error"
            className={cn(
              "text-sm",
              isHero ? "text-[var(--accent)]" : "text-destructive",
            )}
            role="alert"
          >
            {fieldError}
          </p>
        )}
      </div>

      {formState.status === "error" && (
        <div className="space-y-2" role="alert">
          <p
            className={cn(
              "text-sm",
              isHero ? "text-[var(--accent)]" : "text-destructive",
            )}
          >
            {formState.message}
          </p>
          <p
            className={cn(
              "text-sm",
              isHero ? "text-white/60" : "text-muted-foreground",
            )}
          >
            <Link
              href="/audits/demo"
              className={cn(
                "underline underline-offset-2",
                isHero ? "text-white" : "text-foreground",
              )}
            >
              Voir un exemple d&apos;audit
            </Link>
          </p>
        </div>
      )}
    </form>
  );
}
