import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService, userService } from '../../services/api';
import { Chat, User } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Search, Plus, LogOut, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  onSelectChat: (chatId: string, otherUser: User) => void;
  selectedChatId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [chatUsers, setChatUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = chatService.getChats(user.uid, (newChats) => {
      setChats(newChats);
      // Fetch users for these chats
      newChats.forEach(async (chat) => {
        const otherId = chat.participants.find(p => p !== user.uid);
        if (otherId && !chatUsers[otherId]) {
          const u = await userService.getUser(otherId);
          if (u) setChatUsers(prev => ({ ...prev, [otherId]: u }));
        }
      });
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    const performSearch = async () => {
      if (search.length > 1 && user) {
        const results = await userService.searchUsers(search, user.uid);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [search, user?.uid]);

  const handleStartChat = async (otherUser: User) => {
    if (!user) return;
    const chatId = await chatService.getOrCreateChat(user.uid, otherUser.uid);
    setSearch('');
    setSearchResults([]);
    onSelectChat(chatId, otherUser);
  };

  return (
    <div className="w-full md:w-80 lg:w-[320px] flex flex-col h-full border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-bold text-xl tracking-tight">Chats</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={logout} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search users..." 
            className="pl-10 h-10 bg-secondary/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <AnimatePresence mode="popLayout">
          {searchResults.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-2 p-2"
            >
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2">People</p>
              {searchResults.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => handleStartChat(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all active:scale-[0.98]"
                >
                  <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                    <AvatarImage src={u.photoURL} />
                    <AvatarFallback>{u.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">@{u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.displayName}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              {chats.map((chat) => {
                const otherId = chat.participants.find(p => p !== user?.uid);
                const otherUser = otherId ? chatUsers[otherId] : null;
                if (!otherUser) return null;

                const isSelected = selectedChatId === chat.id;

                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id, otherUser)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 outline-none group relative",
                      isSelected ? "bg-secondary" : "hover:bg-secondary/40"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-14 h-14 border-2 border-background shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={otherUser.photoURL} />
                        <AvatarFallback>{otherUser.username[0]}</AvatarFallback>
                      </Avatar>
                      {otherUser.isOnline && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-4 border-background rounded-full shadow-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left py-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className={cn("font-semibold truncate text-[15px]", isSelected ? "text-primary" : "text-foreground")}>
                          {otherUser.displayName}
                        </p>
                        {chat.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium whitespace-nowrap ml-2">
                            {formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        isSelected ? "text-muted-foreground" : "text-muted-foreground/70"
                      )}>
                        {chat.lastMessage ? (
                          <>
                            {chat.lastMessage.senderId === user?.uid ? 'You: ' : ''}
                            {chat.lastMessage.text}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div 
                        layoutId="active-bar" 
                        className="absolute left-1 top-4 bottom-4 w-1 bg-primary rounded-full" 
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
              {chats.length === 0 && !search && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
                  <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-2xl">
                    👋
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">No conversations yet</p>
                    <p className="text-xs text-muted-foreground">Start chatting by searching for someone above.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <div className="p-4 border-t border-border/40 bg-secondary/20">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border/50">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback>{user?.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.displayName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">My Profile</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
