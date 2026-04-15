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
import SalesManager from './components/Sales/SalesManager';
import ExpenseManager from './components/Expenses/ExpenseManager';
import FinancialReport from './components/Finance/FinancialReport';
import { LayoutDashboard, List, PlusCircle, LogOut, CalendarDays, PiggyBank, Menu, X, Wallet, TrendingUp } from 'lucide-react';
import { cn } from './lib/utils';
import { auth } from './firebase';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { useUserProfile } from './hooks/useUserProfile';
import UserProfileModal from './components/UserProfileModal';

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { profile, updateProfilePicture } = useUserProfile(isAuthReady && !!user);
  const { sows, addSow, recordEvent, deleteSow, loading } = useSows(isAuthReady && !!user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'add' | 'calendar' | 'sales' | 'expenses' | 'report'>('dashboard');
  const [selectedSowId, setSelectedSowId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
      <div className="min-h-[100dvh] bg-gray-200 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-app-bg min-h-[100dvh] shadow-xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-500 font-medium text-lg">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-gray-200 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-app-card min-h-[100dvh] shadow-xl flex flex-col items-center justify-center p-8">
          <div className="text-7xl mb-6">🐷</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">นิพนธุ์ฟาร์ม</h1>
          <p className="text-gray-500 mb-10 text-center text-lg">ระบบจัดการวงจรชีวิตแม่หมูในฟาร์ม</p>
          <button 
            onClick={handleLogin}
            className="w-full max-w-sm bg-emerald-600 text-white font-bold py-4 px-6 rounded-full hover:bg-emerald-700 transition-colors shadow-md text-lg"
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-200 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-app-bg min-h-[100dvh] shadow-xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
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
      case 'sales':
        return <SalesManager isAuthReady={isAuthReady && !!user} />;
      case 'expenses':
        return <ExpenseManager isAuthReady={isAuthReady && !!user} />;
      case 'report':
        return <FinancialReport isAuthReady={isAuthReady && !!user} />;
      case 'add':
        return <AddSow onAdd={(id, breed, birthDate, entryDate) => { addSow(id, breed, birthDate, entryDate); setActiveTab('list'); }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-200 flex justify-center print:bg-white">
      <div className="w-full max-w-2xl bg-app-bg h-[100dvh] shadow-xl relative flex flex-col overflow-hidden print:max-w-none print:h-auto print:shadow-none print:bg-white print:overflow-visible">
        {/* Header */}
        <header className="bg-emerald-700 text-white p-4 shadow-md z-10 flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-emerald-800 rounded-full transition-colors">
              <Menu size={28} />
            </button>
            <h1 className="text-2xl font-bold">🐷 นิพนธุ์ฟาร์ม</h1>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 hover:border-white transition-colors bg-emerald-100 flex items-center justify-center shrink-0"
            title="โปรไฟล์และการตั้งค่า"
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </button>
        </header>

        {/* Profile Modal */}
        <UserProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userEmail={user?.email}
          profile={profile}
          onUpdatePicture={updateProfilePicture}
          onLogout={() => {
            setIsProfileModalOpen(false);
            handleLogout();
          }}
        />

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-emerald-50">
                <h2 className="text-xl font-bold text-emerald-800">เมนูระบบ</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-emerald-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); setSelectedSowId(null); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-full text-left font-medium transition-colors", ['dashboard', 'list', 'calendar', 'add'].includes(activeTab) ? "bg-emerald-100 text-emerald-800" : "text-gray-700 hover:bg-gray-100")}
                >
                  <LayoutDashboard size={24} />
                  ระบบแม่พันธุ์
                </button>
                <button 
                  onClick={() => { setActiveTab('sales'); setIsSidebarOpen(false); setSelectedSowId(null); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-full text-left font-medium transition-colors", activeTab === 'sales' ? "bg-emerald-100 text-emerald-800" : "text-gray-700 hover:bg-gray-100")}
                >
                  <PiggyBank size={24} />
                  ระบบหมูขุน (ขายหมู)
                </button>
                <button 
                  onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); setSelectedSowId(null); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-full text-left font-medium transition-colors", activeTab === 'expenses' ? "bg-emerald-100 text-emerald-800" : "text-gray-700 hover:bg-gray-100")}
                >
                  <Wallet size={24} />
                  ระบบรายจ่าย
                </button>
                <button 
                  onClick={() => { setActiveTab('report'); setIsSidebarOpen(false); setSelectedSowId(null); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-full text-left font-medium transition-colors", activeTab === 'report' ? "bg-emerald-100 text-emerald-800" : "text-gray-700 hover:bg-gray-100")}
                >
                  <TrendingUp size={24} />
                  รายงานผลประกอบการ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        {!selectedSowId && ['dashboard', 'list', 'calendar', 'add'].includes(activeTab) && (
          <nav className="w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 shrink-0">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn("flex flex-col items-center px-4 py-2 rounded-full transition-colors", activeTab === 'dashboard' ? "bg-emerald-100 text-emerald-800" : "text-gray-500 hover:bg-gray-100")}
            >
              <LayoutDashboard size={24} />
              <span className="text-xs mt-1 font-medium">แดชบอร์ด</span>
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={cn("flex flex-col items-center px-4 py-2 rounded-full transition-colors", activeTab === 'list' ? "bg-emerald-100 text-emerald-800" : "text-gray-500 hover:bg-gray-100")}
            >
              <List size={24} />
              <span className="text-xs mt-1 font-medium">รายชื่อ</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={cn("flex flex-col items-center px-4 py-2 rounded-full transition-colors", activeTab === 'calendar' ? "bg-emerald-100 text-emerald-800" : "text-gray-500 hover:bg-gray-100")}
            >
              <CalendarDays size={24} />
              <span className="text-xs mt-1 font-medium">ปฏิทิน</span>
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={cn("flex flex-col items-center px-4 py-2 rounded-full transition-colors", activeTab === 'add' ? "bg-emerald-100 text-emerald-800" : "text-gray-500 hover:bg-gray-100")}
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
