/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useSows } from './hooks/useSows';
import Dashboard from './components/Dashboard';
import SowList from './components/SowList';
import AddSow from './components/AddSow';
import SowDetails from './components/SowDetails';
import { LayoutDashboard, List, PlusCircle } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const { sows, addSow, recordEvent, deleteSow } = useSows();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'add'>('dashboard');
  const [selectedSowId, setSelectedSowId] = useState<string | null>(null);

  const renderContent = () => {
    if (selectedSowId) {
      const sow = sows.find(s => s.id === selectedSowId);
      if (!sow) {
        setSelectedSowId(null);
        return null;
      }
      return <SowDetails sow={sow} onBack={() => setSelectedSowId(null)} onRecordEvent={recordEvent} onDelete={() => { deleteSow(sow.id); setSelectedSowId(null); }} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sows={sows} onSelectSow={setSelectedSowId} />;
      case 'list':
        return <SowList sows={sows} onSelectSow={setSelectedSowId} />;
      case 'add':
        return <AddSow onAdd={(id, date) => { addSow(id, date); setActiveTab('list'); }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-gray-50 min-h-screen shadow-xl relative flex flex-col">
        {/* Header */}
        <header className="bg-pink-600 text-white p-4 shadow-md z-10">
          <h1 className="text-xl font-bold text-center">🐷 Sow Management</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        {!selectedSowId && (
          <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10">
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
