import { useState, useEffect } from 'react';
import { Download, MoreVertical, X } from 'lucide-react';
import { triggerVibration } from '../lib/vibration';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { deferredPrompt, isDismissed, dismiss, clearPrompt } = usePWAInstall();
  const [isStandalone, setIsStandalone] = useState(true); // Default true to avoid flash
  const [isAndroid, setIsAndroid] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    triggerVibration('SUCCESS');

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    clearPrompt();
  };

  const handleDismiss = () => {
    dismiss();
  };

  if (isStandalone || isDismissed) return null;

  // Fallback Manual Install Prompt for Android when automatic prompt fails to fire
  if (!deferredPrompt && isAndroid) {
    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mb-6 rounded-r-xl sm:rounded-xl">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 text-white p-3 rounded-full shadow-sm flex-shrink-0">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-0.5">ใช้งานฟาร์มได้สะดวกขึ้น</h3>
              <p className="text-gray-600 text-sm">ติดตั้งแอปลงหน้าจอมือถือของคุณ ทำตามขั้นตอนง่ายๆ เพื่อเพิ่มแอป</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-3 mt-2 sm:mt-0">
            <button 
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-4 py-3 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-colors text-center text-sm"
              style={{ minHeight: '48px', minWidth: '80px' }}
            >
              ไว้ทีหลัง
            </button>
            <button 
              onClick={() => { triggerVibration('SUCCESS'); setShowManualModal(true); }}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md text-center"
              style={{ minHeight: '48px', minWidth: '120px' }}
            >
              วิธีติดตั้ง
            </button>
          </div>
        </div>

        {/* Manual Install Tutorial Modal */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                <h3 className="font-bold border-b border-blue-500/50 pb-1 text-lg">วิธีติดตั้งลงมือถือ Android</h3>
                <button onClick={() => setShowManualModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 text-gray-700 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 text-gray-800 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 shadow-sm mt-1">1</div>
                  <div>
                    <p className="font-medium">แตะที่เมนู 3 จุด</p>
                    <p className="text-sm text-gray-500 leading-relaxed">มองหาจุด 3 จุดที่มุมขวาบนของเบราว์เซอร์ Chrome <MoreVertical size={16} className="inline text-gray-400" /></p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 text-gray-800 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 shadow-sm mt-1">2</div>
                  <div>
                    <p className="font-medium">เลือกเมนู ติดตั้งแอป</p>
                    <p className="text-sm text-gray-500 leading-relaxed">กดที่คำว่า <strong>"เพิ่มลงในหน้าจอหลัก"</strong> (Add to Home screen) หรือ <strong>"ติดตั้งแอป"</strong> (Install app)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 text-gray-800 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 shadow-sm mt-1">3</div>
                  <div>
                    <p className="font-medium">ยืนยันการติดตั้ง</p>
                    <p className="text-sm text-gray-500 leading-relaxed">กดปุ่มเพิ่ม หรือ ติดตั้ง เพื่อนำแอปไปไว้หน้าจอหลักของโทรศัพท์</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Hide automatic prompt if it doesn't exist
  if (!deferredPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-500 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mb-6 rounded-r-xl sm:rounded-xl">
      <div className="flex items-center gap-4">
        <div className="bg-pink-500 text-white p-3 rounded-full shadow-sm flex-shrink-0">
          <Download size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-0.5">ติดตั้งแอปลงเครื่อง</h3>
          <p className="text-gray-600 text-sm">เข้าใช้งานได้เร็วขึ้น ทำงานออฟไลน์ได้ดีขึ้น และรองรับการแจ้งเตือนอย่างเต็มรูปแบบ</p>
        </div>
      </div>
      <div className="flex w-full sm:w-auto gap-3 mt-2 sm:mt-0">
        <button 
          onClick={handleDismiss}
          className="flex-1 sm:flex-none px-4 py-3 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-colors text-center text-sm"
          style={{ minHeight: '48px', minWidth: '80px' }}
        >
          ไว้ทีหลัง
        </button>
        <button 
          onClick={handleInstallClick}
          className="flex-1 sm:flex-none px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-colors shadow-md text-center"
          style={{ minHeight: '48px', minWidth: '120px' }}
        >
          ติดตั้งแอป
        </button>
      </div>
    </div>
  );
}
