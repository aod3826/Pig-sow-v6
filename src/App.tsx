/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useSows } from './hooks/useSows';
import Dashboard from './components/Dashboard';
import SowList from './components/SowList';
import AddSow from './components/AddSow';
import SowDetails from './components/SowDetails';
import CalendarView from './components/CalendarView';
import { LayoutDashboard, List, PlusCircle, LogOut, CalendarDays } from 'lucide-react';
import { cn } from './lib/utils';
import { auth } from './firebase';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { sows, addSow, recordEvent, deleteSow, loading } = useSows(isAuthReady && !!user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'add' | 'calendar'>('dashboard');
  const [selectedSowId, setSelectedSowId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
      console.error("Login failed:", error);
      alert("การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง");
    });
  };

  const handleLogout = () => {
    signOut(auth).catch(error => {
      console.error("Logout failed:", error);
    });
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-[100dvh] bg-slate-200 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-slate-100 min-h-[100dvh] shadow-xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
          <p className="text-gray-500 font-medium text-lg">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-slate-200 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-white min-h-[100dvh] shadow-xl flex flex-col items-center justify-center p-8">
          <div className="text-7xl mb-6">🐷</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">นิพนธุ์ฟาร์ม</h1>
          <p className="text-gray-500 mb-10 text-center text-lg">ระบบจัดการวงจรชีวิตแม่หมูในฟาร์ม</p>
          <button 
            onClick={handleLogin}
            className="w-full max-w-sm bg-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-pink-700 transition-colors shadow-md text-lg"
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-200 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-slate-100 min-h-[100dvh] shadow-xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
          <p className="text-gray-500 font-medium text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (selectedSowId) {
      const sow = sows.find(s => s.id === selectedSowId);
      if (!sow) {
        setSelectedSowId(null);
        return null;
      }
      return <SowDetails sow={sow} allSows={sows} onBack={() => setSelectedSowId(null)} onRecordEvent={recordEvent} onDelete={() => { deleteSow(sow.id); setSelectedSowId(null); }} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sows={sows} onSelectSow={setSelectedSowId} />;
      case 'list':
        return <SowList sows={sows} onSelectSow={setSelectedSowId} />;
      case 'calendar':
        return <CalendarView sows={sows} onSelectSow={setSelectedSowId} />;
      case 'add':
        return <AddSow onAdd={(id, breed, birthDate, entryDate) => { addSow(id, breed, birthDate, entryDate); setActiveTab('list'); }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-200 flex justify-center">
      <div className="w-full max-w-2xl bg-slate-100 h-[100dvh] shadow-xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-pink-600 text-white p-4 shadow-md z-10 flex justify-between items-center shrink-0">
          <h1 className="text-2xl font-bold">🐷 นิพนธุ์ฟาร์ม</h1>
          <button onClick={handleLogout} className="p-2 hover:bg-pink-700 rounded-full transition-colors" title="ออกจากระบบ">
            <LogOut size={24} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        {!selectedSowId && (
          <nav className="w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 shrink-0">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn("flex flex-col items-center p-2 rounded-lg transition-colors", activeTab === 'dashboard' ? "text-pink-600" : "text-gray-500 hover:bg-gray-100")}
            >
              <LayoutDashboard size={24} />
              <span className="text-xs mt-1 font-medium">แดชบอร์ด</span>
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={cn("flex flex-col items-center p-2 rounded-lg transition-colors", activeTab === 'list' ? "text-pink-600" : "text-gray-500 hover:bg-gray-100")}
            >
              <List size={24} />
              <span className="text-xs mt-1 font-medium">รายชื่อ</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={cn("flex flex-col items-center p-2 rounded-lg transition-colors", activeTab === 'calendar' ? "text-pink-600" : "text-gray-500 hover:bg-gray-100")}
            >
              <CalendarDays size={24} />
              <span className="text-xs mt-1 font-medium">ปฏิทิน</span>
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={cn("flex flex-col items-center p-2 rounded-lg transition-colors", activeTab === 'add' ? "text-pink-600" : "text-gray-500 hover:bg-gray-100")}
            >
              <PlusCircle size={24} />
              <span className="text-xs mt-1 font-medium">เพิ่มแม่หมู</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
