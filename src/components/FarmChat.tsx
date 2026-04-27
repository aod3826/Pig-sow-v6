import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { auth } from '../firebase';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function FarmChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const { messages, sendMessage, isLoading } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;

  const lastReadTimeRef = useRef<number>(parseInt(localStorage.getItem('farmChatLastRead') || Date.now().toString(), 10));
  const [unreadCount, setUnreadCount] = useState(0);
  const initialLoadDone = useRef(false);
  const lastAnalyzedMessageId = useRef<string | null>(null);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const updateAppBadgeAndTitle = (count: number) => {
    // Update document title
    if (count > 0) {
      document.title = `(${count}) นิพนธุ์ฟาร์ม`;
    } else {
      document.title = 'นิพนธุ์ฟาร์ม';
    }

    // Update PWA App Badge (for mobile home screen icon)
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch((e: any) => console.error("Badge error:", e));
        } else {
          (navigator as any).clearAppBadge().catch((e: any) => console.error("Badge error:", e));
        }
      } catch (e) {
        console.error("Badge API not supported:", e);
      }
    }
  };

  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      lastAnalyzedMessageId.current = latestMessage.id;
      const unreads = messages.filter(m => new Date(m.createdAt).getTime() > lastReadTimeRef.current && m.userId !== currentUser?.uid);
      setUnreadCount(unreads.length);
      updateAppBadgeAndTitle(unreads.length);
      return;
    }

    if (isOpen) {
      lastReadTimeRef.current = Date.now();
      localStorage.setItem('farmChatLastRead', lastReadTimeRef.current.toString());
      if (unreadCount > 0) {
        setUnreadCount(0);
        updateAppBadgeAndTitle(0);
      }
      lastAnalyzedMessageId.current = latestMessage.id;
    } else {
      const unreads = messages.filter(m => new Date(m.createdAt).getTime() > lastReadTimeRef.current && m.userId !== currentUser?.uid);
      setUnreadCount(unreads.length);
      updateAppBadgeAndTitle(unreads.length);

      // Play sound if there's a new message from someone else
      if (latestMessage.id !== lastAnalyzedMessageId.current && latestMessage.userId !== currentUser?.uid) {
         playNotificationSound();
      }
      lastAnalyzedMessageId.current = latestMessage.id;
    }
  }, [messages, isOpen, currentUser, isLoading, unreadCount]);

  const handleOpenChat = () => {
    setIsOpen(true);
    lastReadTimeRef.current = Date.now();
    localStorage.setItem('farmChatLastRead', lastReadTimeRef.current.toString());
    setUnreadCount(0);
    updateAppBadgeAndTitle(0);
  };


  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !imagePreview) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage, imagePreview || undefined);
      setNewMessage('');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setIsSending(false);
    }
  };

  const currentUserId = currentUser?.uid;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full 
                     shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50"
        >
          <MessageCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-[350px] sm:max-w-[400px] h-[550px] max-h-[80vh] 
                        bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle size={22} className="text-pink-100" />
              <h3 className="font-bold text-lg">แชททีมฟาร์ม</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                <MessageCircle size={40} className="mb-2 opacity-20" />
                <p>ยังไม่มีข้อความ</p>
                <p>เริ่มคุยกับทีมงานได้เลย!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.userId === currentUserId;
                const showAvatar = !isMe && (index === 0 || messages[index - 1].userId !== msg.userId);

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    {!isMe && (
                      <div className="w-8 shrink-0 mr-2">
                        {showAvatar && (
                          msg.userAvatar ? (
                           <img src={msg.userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
                              {msg.userName.charAt(0).toUpperCase()}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      {!isMe && showAvatar && (
                        <span className="text-[10px] text-gray-500 mb-1 ml-1">{msg.userName}</span>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-2 ${
                        isMe 
                          ? 'bg-rose-500 text-white rounded-br-sm' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.imageUrl && (
                          <img 
                            src={msg.imageUrl} 
                            alt="Shared image" 
                            className="max-w-full rounded-lg mb-2 object-cover border border-black/10"
                            style={{ maxHeight: '200px' }}
                          />
                        )}
                        {msg.text && <p className="text-sm whitespace-pre-wrap word-break">{msg.text}</p>}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {format(new Date(msg.createdAt), 'HH:mm', { locale: th })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview Area */}
          {imagePreview && (
            <div className="relative p-3 bg-gray-100 border-t border-gray-200">
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 object-cover rounded-lg border border-gray-300" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white p-1 rounded-full hover:bg-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors flex-shrink-0"
              >
                <ImageIcon size={22} />
              </button>
              
              <div className="flex-1 bg-gray-100 rounded-2xl relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความ..."
                  className="w-full bg-transparent p-3 pr-12 text-sm resize-none focus:outline-none max-h-24 min-h-[44px]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && !imagePreview)}
                  className="absolute bottom-2 right-2 p-1.5 text-white bg-pink-500 rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
