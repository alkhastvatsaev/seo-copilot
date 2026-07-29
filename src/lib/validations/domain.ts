import { z } from "zod";
import { isBlockedHostname } from "@/lib/crawl/ssrf-host";

/** Strip protocol, path, query, port — visitors often paste full URLs. */
export function normalizeDomainInput(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^\/\//, "");
  const hostPart = value.split(/[/?#]/)[0] ?? value;
  const withoutPort = hostPart.includes(":")
    ? (hostPart.split(":")[0] ?? hostPart)
    : hostPart;
  return withoutPort.replace(/\.$/, "");
}

/** Hostname without protocol or path (e.g. example.com). */
const domainHostnameSchema = z
  .string()
  .transform(normalizeDomainInput)
  .refine((value) => {
    if (!value || value.includes("/") || value.includes(":")) return false;
    const labels = value.split(".");
    if (labels.length < 2) return false;
    return labels.every((label) =>
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label),
    );
  }, "Indiquez un domaine valide (ex. exemple.com)")
  .refine((value) => !isBlockedHostname(value), {
    message: "Ce domaine n'est pas autorisé pour un audit.",
  });

export const domainInputSchema = z.object({
  domain: domainHostnameSchema,
});

export const createAuditRequestSchema = domainInputSchema;

export type DomainInput = z.infer<typeof domainInputSchema>;
