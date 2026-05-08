import React, { useRef, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../ui/dialog';
import { Button } from '../ui/button';
import CanvasDraw from 'react-canvas-draw';
import { 
  Eraser, 
  Pencil, 
  Trash2, 
  Undo, 
  Send, 
  Download,
  Palette as PaletteIcon,
  Circle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { dataURLtoBlob, uploadFile } from '../../utils/storage';
import { toast } from 'sonner';

interface DoodleDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (url: string) => void;
}

const colors = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#FFFFFF', '#808080'
];

const brushSizes = [2, 5, 10, 20];

const DoodleDialog: React.FC<DoodleDialogProps> = ({ open, onClose, onSend }) => {
  const canvasRef = useRef<CanvasDraw>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isSending, setIsSending] = useState(false);

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleSend = async () => {
    if (!canvasRef.current) return;
    
    setIsSending(true);
    try {
      const dataUrl = canvasRef.current.getDataURL('png', false, '#ffffff');
      const blob = dataURLtoBlob(dataUrl);
      const url = await uploadFile(blob, 'doodles');
      onSend(url);
      handleClear();
      onClose();
    } catch (err) {
      console.error('Doodle upload failed:', err);
      toast.error('Failed to send doodle');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-background/95 backdrop-blur-xl border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <PaletteIcon className="w-5 h-5 text-primary" />
                Doodle Studio
              </DialogTitle>
              <DialogDescription className="text-xs">Express yourself with a quick drawing</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleUndo} className="rounded-xl h-10 w-10 bg-background/50">
                <Undo className="w-4.5 h-4.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClear} className="rounded-xl h-10 w-10 text-destructive bg-destructive/10 hover:bg-destructive/20 border-none transition-colors">
                <Trash2 className="w-4.5 h-4.5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row p-6 gap-6">
          {/* Tools */}
          <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Colors</p>
              <div className="grid grid-cols-5 md:grid-cols-2 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform active:scale-90",
                      brushColor === c ? "border-primary scale-110" : "border-transparent",
                      c === '#FFFFFF' && "border-border shadow-inner"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Size</p>
              <div className="flex md:flex-col gap-2">
                {brushSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={cn(
                      "w-8 h-8 rounded-lg border border-border flex items-center justify-center transition-all bg-background",
                      brushSize === s ? "bg-primary text-primary-foreground border-primary scale-105" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <div className="rounded-full bg-current" style={{ width: s/1.5, height: s/1.5 }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 min-h-[300px] md:min-h-[400px] bg-white rounded-[2rem] border border-border/10 shadow-inner overflow-hidden cursor-crosshair relative">
             <CanvasDraw
              ref={canvasRef}
              brushColor={brushColor}
              brushRadius={brushSize}
              lazyRadius={5}
              canvasWidth={window.innerWidth > 640 ? 500 : 300}
              canvasHeight={400}
              gridColor="transparent"
              hideGrid
              className="!w-full !h-full"
            />
          </div>
        </div>

        <div className="p-6 bg-secondary/30 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-semibold">
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending}
            className="rounded-2xl h-12 px-8 font-bold gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity min-w-[140px]"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Confirm & Send
                <Send className="w-4.5 h-4.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoodleDialog;
