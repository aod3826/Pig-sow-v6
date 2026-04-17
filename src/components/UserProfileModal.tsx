import { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, LogOut, Camera, Loader2 } from 'lucide-react';
import { UserProfile } from '../hooks/useUserProfile';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  profile: UserProfile | null;
  onUpdatePicture: (base64: string) => Promise<void>;
  onLogout: () => void;
}

export default function UserProfileModal({ isOpen, onClose, userEmail, profile, onUpdatePicture, onLogout }: UserProfileModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setIsUploading(true);

    try {
      // Create a canvas to resize/compress the image
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 300;
      const MAX_HEIGHT = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG format
      const base64String = canvas.toDataURL('image/jpeg', 0.8);
      
      await onUpdatePicture(base64String);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="relative inline-block mt-2 mb-4 group">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-emerald-100 flex items-center justify-center shadow-lg">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 bg-white text-emerald-600 p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-1">{profile?.displayName || 'ผู้ใช้งาน'}</h2>
          <p className="text-emerald-100 text-sm">{userEmail}</p>
        </div>
        
        <div className="p-4 bg-slate-50">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-2xl hover:bg-gray-50 transition-colors mb-3 font-medium shadow-sm"
          >
            <Upload size={18} />
            อัปโหลดรูปโปรไฟล์ใหม่
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 px-4 rounded-2xl hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
