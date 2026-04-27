import { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';

export default function InAppBrowserWarning() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    // Regex for detecting Line, Facebook, Instagram, Messenger in-app browsers
    const inAppRegex = /Line|FBAV|FBAN|Instagram|MicroMessenger/i;
    
    if (inAppRegex.test(userAgent)) {
      setIsInAppBrowser(true);
    }
  }, []);

  if (!isInAppBrowser || isDismissed) return null;

  return (
    <div className="bg-orange-50 border-b-4 border-orange-500 text-orange-900 p-4 flex flex-col gap-3 z-50 animate-in slide-in-from-top-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 font-bold text-lg text-orange-800">
          <ExternalLink size={24} className="text-orange-600" />
          <span>คำแนะนำเพื่อการติดตั้งแอป</span>
        </div>
        <button 
          onClick={() => setIsDismissed(true)} 
          className="p-1.5 hover:bg-orange-200 rounded-full transition-colors shrink-0 -mr-2 -mt-1 text-orange-600"
        >
          <X size={20} />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-orange-800">
        คุณกำลังเปิดลิงก์ผ่านแอปแชท ซึ่งจะทำให้ <strong>ไม่สามารถติดตั้งแอปได้</strong>
        <br/><br/>
        กรุณากดที่เมนูมุมขวาบน (จุด 3 จุด) แล้วเลือก <strong className="bg-orange-200 px-1 rounded">"เปิดในเบราว์เซอร์"</strong> (Open in Browser) หรือเลือกเปิดใน Chrome / Safari
      </p>
    </div>
  );
}
