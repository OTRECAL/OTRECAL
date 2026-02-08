export type BusinessEvent = {
  eventId: string;
  chatId: number;
  messageId: number;
  payload: unknown;
};

export class BusinessGateway {
  constructor(private readonly webhookSecret: string) {}

  verifySignature(signature: string) {
    return signature === this.webhookSecret;
  }

  parseEvent(payload: unknown): BusinessEvent {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid payload");
    }

    const event = payload as Record<string, unknown>;
    return {
      eventId: String(event.event_id ?? ""),
      chatId: Number(event.chat_id ?? 0),
      messageId: Number(event.message_id ?? 0),
      payload: event
    };
  }
}
