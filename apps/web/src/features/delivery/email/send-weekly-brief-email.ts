import { type WeeklyBriefOutput } from "@/features/brief/domain/weekly-brief-output";
import {
  type EmailTransport,
  type EmailMessage,
} from "@/features/delivery/email/email-transport";

export type SentWeeklyBriefEmail = {
  message: EmailMessage;
  messageId: string;
};

type SendWeeklyBriefEmailInput = {
  brief: WeeklyBriefOutput;
  recipientEmail: string;
  transport: EmailTransport;
};

export async function sendWeeklyBriefEmail({
  brief,
  recipientEmail,
  transport,
}: SendWeeklyBriefEmailInput): Promise<SentWeeklyBriefEmail> {
  const message = {
    htmlBody: buildWeeklyBriefHtmlBody(brief),
    subject: `Weekly cash and margin brief: ${brief.itemCount} actions`,
    textBody: buildWeeklyBriefTextBody(brief),
    to: recipientEmail,
  };
  const result = await transport.send(message);

  return {
    message,
    messageId: result.messageId,
  };
}

function buildWeeklyBriefTextBody(brief: WeeklyBriefOutput): string {
  const header = [
    `Weekly cash and margin brief for ${brief.orgId}`,
    `Top actions: ${brief.itemCount}`,
    `Estimated value: $${(brief.summary.totalEstimatedValueCents / 100).toFixed(2)}`,
  ];
  const items = brief.items.map(
    (item, index) =>
      `${index + 1}. ${item.title} - ${item.impactSummary} - confidence ${Math.round(item.confidenceScore * 100)}%`,
  );

  return [...header, "", ...items].join("\n");
}

function buildWeeklyBriefHtmlBody(brief: WeeklyBriefOutput): string {
  const items = brief.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}</strong><br/>${escapeHtml(
          item.impactSummary,
        )}<br/>Confidence: ${Math.round(item.confidenceScore * 100)}%</li>`,
    )
    .join("");

  return `<h1>Weekly cash and margin brief</h1><p>${escapeHtml(
    brief.orgId,
  )}</p><ol>${items}</ol>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
