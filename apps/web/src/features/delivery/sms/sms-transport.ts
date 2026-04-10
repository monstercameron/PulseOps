export type SmsMessage = {
  body: string;
  to: string;
};

export interface SmsTransport {
  send(message: SmsMessage): Promise<{ messageId: string }>;
}

export function createLocalSmsTransport(
  sentMessages: SmsMessage[] = [],
): SmsTransport {
  return {
    async send(message) {
      sentMessages.push(message);

      return {
        messageId: `sms_${sentMessages.length}`,
      };
    },
  };
}
