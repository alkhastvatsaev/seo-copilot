import { Inngest } from "inngest";
import { env } from "@/lib/env";

export const inngest = new Inngest({
  id: "seo-copilot",
  eventKey: env.INNGEST_EVENT_KEY,
});

export type AuditRunEvent = {
  name: "audit/run";
  data: {
    auditId: string;
    domain: string;
  };
};
