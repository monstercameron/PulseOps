import { describe, expect, it, vi } from "vitest";

import { createDefaultSettingsRecord } from "@/features/settings/domain/settings-record";
import { handleEmailForwardingWebhook } from "@/features/integrations/email/server/handle-email-forwarding-webhook";

describe("handleEmailForwardingWebhook", () => {
  it("accepts supported forwarded attachments and rejects unsupported ones", async () => {
    const response = await handleEmailForwardingWebhook(
      new Request("http://localhost/api/webhooks/email", {
        body: JSON.stringify({
          attachments: [
            {
              base64Body: Buffer.from(
                "invoice_id,amount_due\nINV-001,4200",
              ).toString("base64"),
              contentType: "text/csv",
              fileName: "invoices.csv",
            },
            {
              base64Body: Buffer.from([0x00, 0x01, 0x02, 0x03]).toString(
                "base64",
              ),
              fileName: "notes.bin",
            },
          ],
          messageId: "msg_123",
          orgId: "org_123",
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "secret-1234",
        },
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(async () => ({
          document: { id: "doc_123" },
          ingestionJob: { id: "job_123" },
        })),
        webhookSecret: "secret-1234",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      acceptedUploads: [
        {
          documentId: "doc_123",
          fileName: "invoices.csv",
          ingestionJobId: "job_123",
        },
      ],
      messageId: "msg_123",
      rejectedAttachments: [
        {
          fileName: "notes.bin",
          reason: expect.stringContaining("Unsupported upload extension"),
        },
      ],
    });
  });

  it("accepts supported json attachments", async () => {
    const response = await handleEmailForwardingWebhook(
      new Request("http://localhost/api/webhooks/email", {
        body: JSON.stringify({
          attachments: [
            {
              base64Body: Buffer.from(
                JSON.stringify({ invoiceId: "INV-001", amountDue: 4200 }),
              ).toString("base64"),
              contentType: "application/json",
              fileName: "invoice.json",
            },
          ],
          messageId: "msg_456",
          orgId: "org_123",
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "secret-1234",
        },
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(async () => ({
          document: { id: "doc_456" },
          ingestionJob: { id: "job_456" },
        })),
        webhookSecret: "secret-1234",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      acceptedUploads: [
        {
          documentId: "doc_456",
          fileName: "invoice.json",
          ingestionJobId: "job_456",
        },
      ],
      messageId: "msg_456",
      rejectedAttachments: [],
    });
  });

  it("uses the email source retention policy when accepting attachments", async () => {
    const submitTabularUpload = vi.fn(async () => ({
      document: { id: "doc_789" },
      ingestionJob: { id: "job_789" },
    }));
    const settingsRecord = createDefaultSettingsRecord(
      "org_123",
      "2026-04-10T12:00:00.000Z",
    );

    const response = await handleEmailForwardingWebhook(
      new Request("http://localhost/api/webhooks/email", {
        body: JSON.stringify({
          attachments: [
            {
              base64Body: Buffer.from(
                "invoice_id,amount_due\nINV-001,4200",
              ).toString("base64"),
              contentType: "text/csv",
              fileName: "invoices.csv",
            },
          ],
          messageId: "msg_789",
          orgId: "org_123",
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "secret-1234",
        },
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        settingsRepository: {
          getByOrgId: vi.fn(async () => ({
            ...settingsRecord,
            dataPolicy: {
              ...settingsRecord.dataPolicy,
              sourceRetentionDays: {
                ...settingsRecord.dataPolicy.sourceRetentionDays,
                email: 21,
              },
            },
          })),
          put: vi.fn(),
        },
        storage: {} as never,
        submitTabularUpload,
        webhookSecret: "secret-1234",
      },
    );

    expect(response.status).toBe(200);
    expect(submitTabularUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        archiveAfterDays: 21,
        source: "email",
      }),
    );
  });

  it("rejects invalid webhook secrets", async () => {
    const response = await handleEmailForwardingWebhook(
      new Request("http://localhost/api/webhooks/email", {
        body: JSON.stringify({
          attachments: [
            {
              base64Body: Buffer.from(
                "invoice_id,amount_due\nINV-001,4200",
              ).toString("base64"),
              fileName: "invoices.csv",
            },
          ],
          messageId: "msg_123",
          orgId: "org_123",
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "wrong-secret",
        },
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(),
        webhookSecret: "secret-1234",
      },
    );

    expect(response.status).toBe(401);
  });
});
