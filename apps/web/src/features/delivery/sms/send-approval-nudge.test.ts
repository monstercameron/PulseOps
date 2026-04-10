import { describe, expect, it } from "vitest";

import {
  createLocalSmsTransport,
  type SmsMessage,
} from "@/features/delivery/sms/sms-transport";
import { sendApprovalNudge } from "@/features/delivery/sms/send-approval-nudge";
import { createCitation } from "@/features/trust/domain/citation";

describe("sendApprovalNudge", () => {
  it("sends concise sms approval nudges for brief items", async () => {
    const sentMessages: SmsMessage[] = [];
    const result = await sendApprovalNudge({
      approvalUrl: "https://example.com/approve/item_123",
      item: {
        citations: [
          createCitation({
            confidenceScore: 0.91,
            documentFamily: "customer-invoice",
            documentId: "doc_123",
            locator: { row: 2 },
            locatorType: "row",
            sourceHash: "sha256:invoice-total",
          }),
        ],
        confidenceScore: 0.91,
        estimatedValueCents: 420000,
        id: "item_123",
        impactSummary: "Collect the overdue invoice this week.",
        priorityScore: 5.9,
        questionId: "which-invoices-to-chase-today",
        recommendationKind: "collect-overdue-invoice",
        title: "Call Acme about INV-001",
      },
      recipientPhone: "+15551234567",
      transport: createLocalSmsTransport(sentMessages),
    });

    expect(result.messageId).toBe("sms_1");
    expect(sentMessages[0]?.body).toContain("Call Acme about INV-001");
  });
});
