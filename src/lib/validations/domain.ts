import { z } from "zod";
import { isBlockedHostname } from "@/lib/crawl/ssrf-host";

/** Hostname without protocol or path (e.g. example.com). */
const domainHostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => {
    if (value.includes("/") || value.includes(":")) return false;
    const labels = value.split(".");
    if (labels.length < 2) return false;
    return labels.every((label) =>
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label),
    );
  }, "Domaine invalide")
  .refine((value) => !isBlockedHostname(value), {
    message: "Ce domaine n'est pas autorisé pour un audit.",
  });

export const domainInputSchema = z.object({
  domain: domainHostnameSchema,
});

export const createAuditRequestSchema = domainInputSchema;

export type DomainInput = z.infer<typeof domainInputSchema>;
