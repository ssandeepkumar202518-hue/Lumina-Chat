import React from 'react';
import { Message, User } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Reply } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  sender: User | null;
  onReply?: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, sender, onReply }) => {
  const isMedia = message.messageType !== 'text';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={cn(
        "flex gap-3 mb-4 group",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isMe && (
        <Avatar className="w-8 h-8 mt-1 border border-border/50 shadow-sm shrink-0">
          <AvatarImage src={sender?.photoURL} />
          <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-[85%] sm:max-w-[70%]",
        isMe ? "items-end" : "items-start"
      )}>
        <div className="relative group/bubble flex items-center gap-2">
          {isMe && (
            <button 
              onClick={() => onReply?.(message)}
              className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 hover:bg-secondary rounded-full text-muted-foreground"
            >
              <Reply className="w-4 h-4 scale-x-[-1]" />
            </button>
          )}

          <div className={cn(
            "relative px-4 py-2.5 shadow-sm overflow-hidden",
            isMe ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-t-3xl rounded-bl-3xl rounded-br-sm" 
                 : "bg-secondary text-foreground rounded-t-3xl rounded-br-3xl rounded-bl-sm border border-border/40",
            isMedia && "p-1.5 rounded-[2rem]"
          )}>
            {message.replyTo && (
              <div className={cn(
                "mb-2 p-2 rounded-xl text-xs bg-black/10 border-l-2 border-primary/50 backdrop-blur-sm truncate max-w-full",
                isMe ? "text-white/80" : "text-muted-foreground"
              )}>
                Replied to a message
              </div>
            )}

            {message.messageType === 'text' && (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
            )}

            {message.messageType === 'image' && (
              <div className="rounded-[1.7rem] overflow-hidden border border-white/10">
                <img src={message.mediaUrl} alt="Shared image" className="max-w-full max-h-[350px] object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
              </div>
            )}

            {message.messageType === 'doodle' && (
              <div className="rounded-[1.7rem] overflow-hidden bg-white/5 border border-white/10 p-2">
                <img src={message.mediaUrl} alt="Doodle" className="bg-white max-w-full rounded-2xl" />
              </div>
            )}

            {(message.messageType === 'sticker' || message.messageType === 'gif') && (
              <div className="rounded-2xl overflow-hidden min-w-[120px]">
                <img src={message.mediaUrl} alt="Sticker/Gif" className="w-full h-auto" />
              </div>
            )}

            {/* Glass effect reflection for me */}
            {isMe && (
              <div className="absolute top-0 left-0 w-full h-[150%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none -rotate-45 -translate-y-full group-hover/bubble:translate-y-full transition-transform duration-1000" />
            )}
          </div>

          {!isMe && (
            <button 
              onClick={() => onReply?.(message)}
              className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 hover:bg-secondary rounded-full text-muted-foreground"
            >
              <Reply className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-2 mt-1 px-1",
          isMe ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] font-medium text-muted-foreground/60">
            {format(message.timestamp, 'HH:mm')}
          </span>
          {isMe && (
            <span className="flex">
              {message.seen ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <Check className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
            </span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={cn(
            "flex gap-1 mt-1 flex-wrap",
            isMe ? "justify-end" : "justify-start"
          )}>
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button 
                key={emoji}
                className="flex items-center bg-secondary/80 hover:bg-secondary border border-border/40 rounded-full px-1.5 py-0.5 text-[10px] gap-1 transition-colors scale-90"
              >
                <span>{emoji}</span>
                <span className="font-semibold text-muted-foreground">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
