import { MessageStore, StoredMessage } from "./storage.js";
import { MediaScheduler } from "./media.js";
import { BusinessGateway } from "./business.js";

type IncomingMessage = {
  chatId: number;
  messageId: number;
  senderId: number;
  text?: string;
  mediaFileId?: string;
};

type EditedMessage = IncomingMessage;

type DeletedMessage = {
  chatId: number;
  messageId: number;
};

export class DialogSpyBot {
  private store = new MessageStore();
  private mediaScheduler = new MediaScheduler();
  private businessGateway: BusinessGateway;

  constructor(webhookSecret: string, private readonly notify: (text: string) => void) {
    this.businessGateway = new BusinessGateway(webhookSecret);
  }

  handleIncoming(message: IncomingMessage) {
    const record: StoredMessage = {
      chatId: message.chatId,
      messageId: message.messageId,
      senderId: message.senderId,
      text: message.text,
      mediaFileId: message.mediaFileId,
      createdAt: new Date()
    };

    this.store.save(record);

    if (message.mediaFileId) {
      const ttlSeconds = Number(process.env.MEDIA_TTL_SECONDS ?? 3600);
      this.mediaScheduler.scheduleDeletion(message.mediaFileId, ttlSeconds, (fileId) => {
        this.notify(`Медиа ${fileId} удалено по таймеру.`);
      });
    }
  }

  handleEdit(message: EditedMessage) {
    const existing = this.store.get(message.chatId, message.messageId);
    if (!existing) return;

    if (existing.text !== message.text) {
      this.notify(
        `Сообщение изменено: ${existing.text ?? "<пусто>"} → ${message.text ?? "<пусто>"}`
      );
    }

    this.store.save({
      ...existing,
      text: message.text ?? existing.text
    });
  }

  handleDelete(message: DeletedMessage) {
    const existing = this.store.get(message.chatId, message.messageId);
    if (!existing) return;

    this.notify(`Сообщение удалено: ${existing.text ?? "<медиа>"}`);
    this.store.delete(message.chatId, message.messageId);

    if (existing.mediaFileId) {
      this.mediaScheduler.cancel(existing.mediaFileId);
    }
  }

  handleBusinessWebhook(signature: string, payload: unknown) {
    if (!this.businessGateway.verifySignature(signature)) {
      throw new Error("Invalid signature");
    }

    const event = this.businessGateway.parseEvent(payload);
    this.notify(`Business event ${event.eventId} для чата ${event.chatId}.`);
  }
}

const notifier = (text: string) => {
  const target = process.env.NOTIFY_CHAT_ID ?? "unknown";
  console.log(`[notify:${target}]`, text);
};

export const bot = new DialogSpyBot(process.env.BUSINESS_WEBHOOK_SECRET ?? "", notifier);
