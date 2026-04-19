import React, { useState, useEffect, useRef } from 'react';
import { Sow } from '../types';
import { Search, X, Move, Lock, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper component for individual cages
const Cage = ({ 
  cageId, 
  sow, 
  viewMode, 
  isMoving, 
  isHighlighted, 
  onClick 
}: { 
  cageId: string, 
  sow?: Sow, 
  viewMode: 'NORMAL' | 'COMPACT',
  isMoving: boolean,
  isHighlighted: boolean,
  onClick: () => void 
}) => {
  const displayId = cageId.replace(/([LR])0?/, '$1-'); 
  const numberOnly = cageId.replace(/[LR]/, ''); 
  
  // 3 กรงพ่อพันธุ์ จะมีขนาดใหญ่กว่ากรงอื่น
  const isBoarCage = cageId === 'R01' || cageId === 'R02' || cageId === 'R03';
  
  const heightClass = viewMode === 'NORMAL' 
    ? (isBoarCage ? 'h-20 sm:h-24' : 'h-10 sm:h-12') // สูงกว่าปกติสำหรับกรงพ่อพันธุ์
    : (isBoarCage ? 'h-12 sm:h-14' : 'h-6 sm:h-8');
  
  return (
    <div 
      id={`cage-element-${cageId}`}
      onClick={onClick}
      className={cn(
        "relative rounded-lg border flex flex-col justify-center transition-all cursor-pointer overflow-hidden",
        heightClass,
        viewMode === 'NORMAL' ? "p-1 sm:p-2" : "p-0 items-center",
        isMoving ? "border-yellow-400 border-2 bg-yellow-50 shadow-[0_0_15px_rgba(250,204,21,0.2)]" : 
        sow ? "border-gray-200 bg-white shadow-sm hover:border-pink-300 hover:bg-pink-50" : "border-gray-200/60 bg-gray-50 hover:bg-gray-100",
        isHighlighted && !isMoving && sow ? "ring-2 ring-pink-500 shadow-xl bg-pink-100" : ""
      )}
    >
      {sow ? (
        <>
          {viewMode === 'NORMAL' && <span className="absolute top-0.5 left-1 sm:left-2 text-[8px] sm:text-[9px] font-medium text-gray-400 leading-none">{displayId}</span>}
          <div className={cn("text-center font-bold tracking-wider", 
            viewMode === 'NORMAL' ? "text-xs sm:text-sm mt-0.5" : "text-[9px] sm:text-[10px]",
            sow.status === 'PREGNANT' || sow.status === 'NURSING' ? "text-pink-600" : "text-emerald-600"
          )}>
            {sow.id}
          </div>
          {viewMode === 'NORMAL' && (
            <div className="absolute bottom-0.5 right-1 sm:right-2 text-[7px] sm:text-[8px] text-gray-400 leading-none">
              {['BRED', 'PREGNANT', 'NURSING'].includes(sow.status) ? 'แม่พันธุ์' : 'พ่อพันธุ์/รอผสม'}
            </div>
          )}
          {isMoving && (
            <div className="absolute bottom-0.5 w-full text-center text-yellow-500">
              <Lock className="w-2 h-2 sm:w-3 sm:h-3 mx-auto" />
            </div>
          )}
        </>
      ) : (
        <>
          <span className={cn("text-gray-400 font-medium leading-none absolute", viewMode === 'NORMAL' ? "text-[8px] sm:text-[9px] top-1 left-1.5" : "text-[8px] sm:text-[9px] top-0.5 left-1")}>
            {viewMode === 'NORMAL' ? displayId : numberOnly}
          </span>
          {isBoarCage && viewMode === 'NORMAL' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400">พ่อพันธุ์</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface PenMapProps {
  sows: Sow[];
  onUpdateLocation: (sowId: string, cageId: string | null) => Promise<void>;
}

export default function PenMap({ sows, onUpdateLocation }: PenMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'NORMAL' | 'COMPACT'>('NORMAL');
  const [highlightedCage, setHighlightedCage] = useState<string | null>(null);
  const [movingSowId, setMovingSowId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const foundSow = sows.find(s => s.id.toLowerCase().includes(searchQuery.toLowerCase()));
      if (foundSow && foundSow.cageId) {
        setHighlightedCage(foundSow.cageId);
        const cageEl = document.getElementById(`cage-element-${foundSow.cageId}`);
        if (cageEl && containerRef.current) {
          cageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setHighlightedCage(null);
      }
    } else {
      setHighlightedCage(null);
    }
  }, [searchQuery, sows]);

  const handleItemClick = async (cageId: string | null, sow?: Sow) => {
    if (movingSowId === null) {
      if (sow) {
        setMovingSowId(sow.id);
      }
    } else {
      // Executing a move
      if (sow && sow.id === movingSowId) {
        // Cancel if clicked self
        setMovingSowId(null);
      } else {
        const movingSow = sows.find(s => s.id === movingSowId);
        if (movingSow) {
          // If moving to a target that has a sow already, swap them (or put old to unassigned)
          if (sow && cageId) {
             await onUpdateLocation(sow.id, movingSow.cageId || null);
          }
          await onUpdateLocation(movingSowId, cageId);
        }
        setMovingSowId(null);
      }
    }
  };

  const unassignedSows = sows.filter(s => !s.cageId && !['CULLED'].includes(s.status));
  const assignedSows = sows.filter(s => s.cageId);

  return (
    <div className="flex flex-col h-full bg-slate-100 text-gray-900 font-sans animate-in fade-in">
      {/* Moving Banner */}
      {movingSowId && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-3 flex items-center justify-between shadow-lg z-30 shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <Move size={18} />
            <span>ย้ายตำแหน่ง: {movingSowId}</span>
          </div>
          <button 
            onClick={() => setMovingSowId(null)}
            className="px-4 py-1.5 bg-yellow-100/50 hover:bg-yellow-100/80 rounded-lg text-sm font-bold transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 shrink-0 z-20 bg-white border-b border-gray-200/80 shadow-sm rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#E91E63]">
            <MapPin className="w-6 h-6" />
            ผังเล้าแม่พันธุ์
          </h2>
          <button 
            onClick={() => setViewMode(v => v === 'NORMAL' ? 'COMPACT' : 'NORMAL')}
            className="flex items-center gap-2 text-sm bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm font-medium"
          >
            {viewMode === 'NORMAL' ? 'ย่อมุมมอง' : 'มุมมองปกติ'}
          </button>
        </div>
        
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="ค้นหาเบอร์หูแม่หมู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E91E63] outline-none font-medium placeholder:text-gray-400 text-gray-900 transition-all"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="absolute right-3 top-3.5 bg-gray-200 rounded-full p-0.5 text-gray-500 hover:text-gray-700"
               >
                 <X className="w-4 h-4"/>
               </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Map Area */}
      <div 
        className="flex-1 overflow-y-auto relative pb-8 px-4 sm:px-6 mt-4" 
        ref={containerRef}
      >
        <div className="flex justify-between gap-4 sm:gap-8 max-w-2xl mx-auto relative pt-2">
          {/* Center Divider Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-4 sm:w-8 -translate-x-1/2 flex justify-center pointer-events-none">
            <div className="w-0.5 h-full bg-gray-300 border-l-2 border-dashed border-gray-300/60"></div>
          </div>
          
          {/* Left Wing (Column) */}
          <div className="flex-1 flex flex-col gap-1 sm:gap-1.5">
             <div className="text-center font-bold text-gray-400 text-[10px] sm:text-xs mb-1">ฝั่งซ้าย (L)</div>
             {Array.from({ length: 52 }).map((_, idx) => {
               const num = String(idx + 1).padStart(2, '0');
               const leftCageId = `L${num}`;
               const leftSow = assignedSows.find(s => s.cageId === leftCageId);
               return (
                 <Cage 
                    key={leftCageId}
                    cageId={leftCageId} 
                    sow={leftSow}
                    viewMode={viewMode}
                    isMoving={movingSowId === leftSow?.id}
                    isHighlighted={highlightedCage === leftCageId}
                    onClick={() => handleItemClick(leftCageId, leftSow)}
                  />
               );
             })}
          </div>

          {/* Right Wing (Column) - Features Boar Cages at the top */}
          <div className="flex-1 flex flex-col gap-1 sm:gap-1.5">
             <div className="text-center font-bold text-gray-400 text-[10px] sm:text-xs mb-1">ฝั่งขวา (R)</div>
             {Array.from({ length: 50 }).map((_, idx) => {
               const num = String(idx + 1).padStart(2, '0');
               const rightCageId = `R${num}`;
               const rightSow = assignedSows.find(s => s.cageId === rightCageId);
               return (
                 <Cage 
                    key={rightCageId}
                    cageId={rightCageId} 
                    sow={rightSow}
                    viewMode={viewMode}
                    isMoving={movingSowId === rightSow?.id}
                    isHighlighted={highlightedCage === rightCageId}
                    onClick={() => handleItemClick(rightCageId, rightSow)}
                  />
               );
             })}
          </div>

        </div>
      </div>

      {/* Unassigned Zone */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-20 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 font-bold mb-3 text-gray-600">
          <span>จุดพักหมู (รอเข้ากรง)</span>
          <span className="bg-pink-100 text-[#E91E63] px-2 py-0.5 rounded-full text-xs font-bold">{unassignedSows.length}</span>
        </div>
        
        <div 
          className={cn(
            "flex flex-wrap gap-2 min-h-[60px] p-2 rounded-xl transition-all",
            movingSowId ? "border-2 border-dashed border-yellow-400 bg-yellow-50 cursor-pointer" : "bg-slate-50 border border-gray-100"
          )}
          onClick={() => {
            if (movingSowId) {
              handleItemClick(null);
            }
          }}
        >
          {unassignedSows.map(sow => (
            <button
              key={sow.id}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(null, sow);
              }}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-bold transition-all shadow-sm",
                movingSowId === sow.id 
                  ? "border-yellow-500 bg-yellow-100 text-yellow-800 scale-105 ring-2 ring-yellow-400" 
                  : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-pink-300"
              )}
            >
              {sow.id}
            </button>
          ))}
          {unassignedSows.length === 0 && !movingSowId && (
             <div className="text-gray-400 text-sm w-full text-center py-2 flex items-center justify-center font-medium">
               ไม่มีแม่หมูตกค้างจัดสรร
             </div>
          )}
          {movingSowId && (
            <div className="text-yellow-600 text-sm w-full text-center py-2 flex items-center justify-center pointer-events-none font-bold">
              แตะที่นี่เพื่อย้ายหมูมาเก็บในจุดพัก
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
