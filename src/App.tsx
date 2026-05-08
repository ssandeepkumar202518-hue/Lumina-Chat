/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './components/Welcome';
import Sidebar from './components/chat/Sidebar';
import ChatArea from './components/chat/ChatArea';
import { User } from './types';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, LayoutGrid, Ghost } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState<{ id: string; otherUser: User } | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-background">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360] 
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center p-4 shadow-xl shadow-purple-500/20"
        >
          <MessageSquare className="w-full h-full text-white" />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Initializing Lumina...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Welcome />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar 
        onSelectChat={(id, otherUser) => setSelectedChat({ id, otherUser })} 
        selectedChatId={selectedChat?.id}
      />
      
      <main className="flex-1 min-w-0 bg-secondary/10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div
              key={selectedChat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full"
            >
              <ChatArea 
                chatId={selectedChat.id} 
                otherUser={selectedChat.otherUser} 
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full w-full flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="p-8 rounded-[3rem] bg-secondary/50 border border-border/40 backdrop-blur-sm space-y-6 max-w-sm">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600/20 via-pink-500/20 to-orange-400/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-border/50">
                   <Ghost className="w-10 h-10 text-primary opacity-50" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Select a Chat</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose a conversation from the sidebar or search for a new contact to start chatting.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <div className="px-3 py-1 transparent-glass border rounded-full text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Fast</div>
                  <div className="px-3 py-1 transparent-glass border rounded-full text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Private</div>
                  <div className="px-3 py-1 transparent-glass border rounded-full text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Creative</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

