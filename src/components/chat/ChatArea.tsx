import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService, userService } from '../../services/api';
import { Message, User } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import MessageBubble from './MessageBubble';
import { 
  Smile, 
  Paperclip, 
  Send, 
  Palette, 
  Image as ImageIcon, 
  MoreVertical, 
  Phone, 
  Video,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MessageInput from './MessageInput';
import DoodleDialog from '../doodle/DoodleDialog';

interface ChatAreaProps {
  chatId: string;
  otherUser: User;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId, otherUser }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showDoodle, setShowDoodle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubMessages = chatService.getMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      // Mark as seen
      if (user) {
        chatService.markAsSeen(chatId, user.uid);
      }
    });

    const unsubPresence = onSnapshot(doc(db, 'presence', otherUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const typingTimestamp = data.typingAt?.[chatId] || 0;
        const now = Date.now();
        setIsOtherTyping(now - typingTimestamp < 3000);
      }
    });

    return () => {
      unsubMessages();
      unsubPresence();
    };
  }, [chatId, user?.uid, otherUser.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOtherTyping]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border/40 backdrop-blur-md bg-background/80 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border border-border/50">
              <AvatarImage src={otherUser.photoURL} />
              <AvatarFallback>{otherUser.username[0]}</AvatarFallback>
            </Avatar>
            {otherUser.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow-sm" />
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-[15px] leading-tight">{otherUser.displayName}</h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              {otherUser.isOnline ? (
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  Active now
                </span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <Phone className="w-4.5 h-4.5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <Video className="w-4.5 h-4.5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <MoreVertical className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
          {/* Welcome/Empty State info */}
          <div className="flex flex-col items-center py-12 space-y-4">
            <Avatar className="w-20 h-20 border-4 border-secondary shadow-xl">
              <AvatarImage src={otherUser.photoURL} />
              <AvatarFallback>{otherUser.username[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">{otherUser.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{otherUser.username} • Lumina Chat</p>
            </div>
            <Button variant="secondary" size="sm" className="rounded-2xl text-xs font-semibold px-4 cursor-default">View Profile</Button>
          </div>

          <div className="space-y-1">
            {messages.map((msg, idx) => {
              const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
              return (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isMe={msg.senderId === user?.uid} 
                  sender={msg.senderId === user?.uid ? user : otherUser}
                />
              );
            })}
          </div>

          <AnimatePresence>
            {isOtherTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 mb-4 px-1"
              >
                <div className="flex gap-1 bg-secondary/80 backdrop-blur-sm rounded-full px-3 py-2 border border-border/40 scale-90 origin-left">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium italic opacity-70">@{otherUser.username} is typing...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border/40 bg-background/95 backdrop-blur-md shrink-0">
        <MessageInput 
          chatId={chatId} 
          receiverId={otherUser.uid} 
          onOpenDoodle={() => setShowDoodle(true)} 
        />
      </div>

      <DoodleDialog 
        open={showDoodle} 
        onClose={() => setShowDoodle(false)} 
        onSend={(doodleUrl) => {
          if (user) {
            chatService.sendMessage(chatId, user.uid, otherUser.uid, 'Sent a doodle', 'doodle', doodleUrl);
          }
           setShowDoodle(false);
        }}
      />
    </div>
  );
};

export default ChatArea;
