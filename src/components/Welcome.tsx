import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogIn, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-6 space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-pink-500/20"
      >
        <MessageSquare className="w-12 h-12 text-white" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Lumina Chat</h1>
        <p className="text-muted-foreground text-lg">
          Connect with style. Private, real-time, and beautifully expressive.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Button 
          size="lg" 
          onClick={signInWithGoogle}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/20"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to connect your Google account safely.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full pt-8">
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50 text-left space-y-1">
          <span className="text-lg">🎨</span>
          <h3 className="font-semibold text-sm">Doodles</h3>
          <p className="text-xs text-muted-foreground font-light">Draw and share instantly.</p>
        </div>
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50 text-left space-y-1">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-sm">Reactions</h3>
          <p className="text-xs text-muted-foreground font-light">Express with emojis.</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
