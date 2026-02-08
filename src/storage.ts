export type StoredMessage = {
  chatId: number;
  messageId: number;
  senderId: number;
  text?: string;
  mediaFileId?: string;
  createdAt: Date;
};

export class MessageStore {
  private messages = new Map<string, StoredMessage>();

  private key(chatId: number, messageId: number) {
    return `${chatId}:${messageId}`;
  }

  save(message: StoredMessage) {
    this.messages.set(this.key(message.chatId, message.messageId), message);
  }

  get(chatId: number, messageId: number) {
    return this.messages.get(this.key(chatId, messageId));
  }

  delete(chatId: number, messageId: number) {
    this.messages.delete(this.key(chatId, messageId));
  }
}
