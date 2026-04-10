export type EmailMessage = {
  htmlBody?: string;
  subject: string;
  textBody: string;
  to: string;
};

export interface EmailTransport {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}

export function createLocalEmailTransport(
  sentMessages: EmailMessage[] = [],
): EmailTransport {
  return {
    async send(message) {
      sentMessages.push(message);

      return {
        messageId: `email_${sentMessages.length}`,
      };
    },
  };
}
