import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService, userService } from '../../services/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { 
  Smile, 
  Paperclip, 
  Send, 
  Palette, 
  Image as ImageIcon,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../../utils/storage';

interface MessageInputProps {
  chatId: string;
  receiverId: string;
  onOpenDoodle: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatId, receiverId, onOpenDoodle }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (text.length > 0 && user) {
      userService.updateTyping(user.uid, chatId, true);
    }
    const timer = setTimeout(() => {
      if (user) userService.updateTyping(user.uid, chatId, false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [text, chatId, user?.uid]);

  const handleSend = async () => {
    if ((!text.trim() && !isUploading) || !user) return;
    const currentText = text.trim();
    setText('');
    await chatService.sendMessage(chatId, user.uid, receiverId, currentText, 'text');
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !user) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(acceptedFiles[0]);
      await chatService.sendMessage(chatId, user.uid, receiverId, 'Shared an image', 'image', url);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: { 'image/*': [] }
  });

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  return (
    <div {...getRootProps()} className="relative">
      <AnimatePresence>
        {isDragActive && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-3xl backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-10 h-10 text-primary animate-bounce" />
              <p className="font-bold text-primary">Drop to send image</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 max-w-4xl mx-auto bg-secondary/40 border border-border/40 p-2 rounded-[2rem] shadow-sm focus-within:bg-secondary/60 transition-all duration-300">
        <div className="flex items-center gap-1 pl-1 pb-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-muted-foreground hover:bg-background shadow-none">
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="p-0 border-none bg-transparent shadow-2xl" align="start">
              <EmojiPicker 
                theme={Theme.DARK} 
                onEmojiClick={onEmojiClick}
                skinTonesDisabled
                searchDisabled
                width={300}
                height={400}
              />
            </PopoverContent>
          </Popover>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full w-9 h-9 text-muted-foreground hover:bg-background shadow-none"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Paperclip className="w-5 h-5" />
            <input {...getInputProps()} id="file-upload" className="hidden" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full w-9 h-9 text-muted-foreground hover:bg-background shadow-none"
            onClick={onOpenDoodle}
          >
            <Palette className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Write a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            className="border-none bg-transparent shadow-none focus-visible:ring-0 text-[15px] min-h-[44px] py-3 pr-4"
          />
        </div>

        <Button 
          onClick={handleSend}
          disabled={!text.trim() && !isUploading}
          className={cn(
            "rounded-full w-10 h-10 p-0 shadow-lg shadow-primary/20 shrink-0 mb-1 transition-all",
            text.trim() ? "bg-primary text-primary-foreground scale-100" : "bg-muted text-muted-foreground cursor-not-allowed scale-90"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
