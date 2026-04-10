import { describe, expect, it } from "vitest";

import { createWeeklyBriefOutput } from "@/features/brief/domain/weekly-brief-output";
import {
  createLocalEmailTransport,
  type EmailMessage,
} from "@/features/delivery/email/email-transport";
import { sendWeeklyBriefEmail } from "@/features/delivery/email/send-weekly-brief-email";
import { createCitation } from "@/features/trust/domain/citation";

describe("sendWeeklyBriefEmail", () => {
  it("renders and sends a weekly brief email", async () => {
    const sentMessages: EmailMessage[] = [];
    const brief = createWeeklyBriefOutput({
      briefId: "brief_123",
      generatedAt: "2026-04-10T00:00:00.000Z",
      items: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.93,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:invoice-total",
            }),
          ],
          confidenceScore: 0.93,
          estimatedValueCents: 420000,
          id: "item_123",
          impactSummary: "Collect the overdue invoice this week.",
          priorityScore: 6.2,
          questionId: "which-invoices-to-chase-today",
          recommendationKind: "collect-overdue-invoice",
          title: "Call Acme about INV-001",
        },
      ],
      orgId: "org_123",
    });

    const result = await sendWeeklyBriefEmail({
      brief,
      recipientEmail: "owner@example.com",
      transport: createLocalEmailTransport(sentMessages),
    });

    expect(result.messageId).toBe("email_1");
    expect(sentMessages).toHaveLength(1);
    expect(result.message.textBody).toContain("Call Acme about INV-001");
  });
});
