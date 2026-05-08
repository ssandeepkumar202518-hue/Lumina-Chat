export type MessageType = 'text' | 'image' | 'doodle' | 'sticker' | 'gif';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: number;
  };
  updatedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  messageType: MessageType;
  timestamp: number;
  seen: boolean;
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji: [userIds]
}

export interface Presence {
  uid: string;
  isOnline: boolean;
  lastSeen: number;
  typingAt?: Record<string, number>; // chatId: timestamp
}
