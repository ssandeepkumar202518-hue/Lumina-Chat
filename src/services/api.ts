import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDocs,
  limit,
  setDoc,
  increment,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Message, Chat, User, MessageType } from '../types';

export const chatService = {
  // Get all chats for the current user
  getChats: (userId: string, callback: (chats: Chat[]) => void) => {
    const path = 'chats';
    const q = query(
      collection(db, path),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, 
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  },

  // Get or create a chat between two users
  getOrCreateChat: async (userId1: string, userId2: string) => {
    const participants = [userId1, userId2].sort();
    const path = 'chats';
    try {
      const q = query(
        collection(db, path),
        where('participants', '==', participants)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      const newChatRef = await addDoc(collection(db, path), {
        participants,
        updatedAt: Date.now(),
        createdAt: serverTimestamp()
      });
      return newChatRef.id;
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, path);
       return ''; // unreachable
    }
  },

  // Send a message
  sendMessage: async (
    chatId: string, 
    senderId: string, 
    receiverId: string, 
    text: string, 
    type: MessageType = 'text',
    mediaUrl?: string,
    replyTo?: string
  ) => {
    const path = `chats/${chatId}/messages`;
    try {
      const message: Omit<Message, 'id'> = {
        chatId,
        senderId,
        receiverId,
        text,
        mediaUrl,
        messageType: type,
        timestamp: Date.now(),
        seen: false,
        replyTo,
        reactions: {}
      };

      await addDoc(collection(db, path), message);
      
      // Update chat last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text: type === 'text' ? text : `Shared a ${type}`,
          senderId,
          timestamp: Date.now()
        },
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Mark messages as seen
  markAsSeen: async (chatId: string, userId: string) => {
    const path = `chats/${chatId}/messages`;
    try {
      const q = query(
        collection(db, path),
        where('receiverId', '==', userId),
        where('seen', '==', false)
      );
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map(d => updateDoc(d.ref, { seen: true }));
      await Promise.all(batchPromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Listen for messages in a chat
  getMessages: (chatId: string, callback: (messages: Message[]) => void) => {
    const path = `chats/${chatId}/messages`;
    const q = query(
      collection(db, path),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, 
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  },

  // Add reaction
  addReaction: async (chatId: string, messageId: string, userId: string, emoji: string) => {
    const path = `chats/${chatId}/messages/${messageId}`;
    try {
      const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayUnion(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

export const userService = {
  searchUsers: async (searchTerm: string, currentUserId: string) => {
    const path = 'users';
    try {
      if (!searchTerm) return [];
      const q = query(
        collection(db, path),
        where('username', '>=', searchTerm.toLowerCase()),
        where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data() as User)
        .filter(u => u.uid !== currentUserId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  getUser: async (userId: string) => {
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as User : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
       return null;
    }
  },

  updateTyping: async (userId: string, chatId: string, isTyping: boolean) => {
    const path = `presence/${userId}`;
    try {
      const presenceRef = doc(db, 'presence', userId);
      await setDoc(presenceRef, {
        typingAt: {
          [chatId]: isTyping ? Date.now() : 0
        }
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
