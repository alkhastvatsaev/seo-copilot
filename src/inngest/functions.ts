import { inngest } from "@/inngest/client";
import { executeAuditRun } from "@/lib/audits/execute-audit-run";

export const auditRun = inngest.createFunction(
  { id: "audit-run", retries: 2 },
  { event: "audit/run" },
  async ({ event, step }) => {
    return step.run("execute-audit", async () =>
      executeAuditRun({
        auditId: event.data.auditId,
      }),
    );
  },
);

export const inngestFunctions = [auditRun];
