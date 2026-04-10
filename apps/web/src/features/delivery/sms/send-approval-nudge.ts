import { weeklyBriefOutputItemSchema } from "@/features/brief/domain/weekly-brief-output";
import {
  type SmsTransport,
  type SmsMessage,
} from "@/features/delivery/sms/sms-transport";

export type SentApprovalNudge = {
  message: SmsMessage;
  messageId: string;
};

type SendApprovalNudgeInput = {
  approvalUrl: string;
  item: Parameters<typeof weeklyBriefOutputItemSchema.parse>[0];
  recipientPhone: string;
  transport: SmsTransport;
};

export async function sendApprovalNudge({
  approvalUrl,
  item,
  recipientPhone,
  transport,
}: SendApprovalNudgeInput): Promise<SentApprovalNudge> {
  const parsedItem = weeklyBriefOutputItemSchema.parse(item);
  const message = {
    body: `${parsedItem.title}. Reply approve/reject later at ${approvalUrl}`,
    to: recipientPhone,
  };
  const result = await transport.send(message);

  return {
    message,
    messageId: result.messageId,
  };
}
