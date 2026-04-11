import { useState } from 'react';
import { Sow, EventType } from '../types';
import { getUpcomingTasksForSow, EVENT_LABELS, STATUS_LABELS } from '../lib/cycleEngine';
import { cn, formatDate } from '../lib/utils';
import { ArrowLeft, CheckCircle2, Circle, Clock, Trash2, ListTodo, History, MoreVertical, Stethoscope, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface SowDetailsProps {
  sow: Sow;
  allSows: Sow[];
  onBack: () => void;
  onRecordEvent: (sowId: string, type: EventType, date: string, pigletCount?: number, notes?: string) => void;
  onDelete: () => void;
}

export default function SowDetails({ sow, allSows, onBack, onRecordEvent, onDelete }: SowDetailsProps) {
  const tasks = getUpcomingTasksForSow(sow);
  const uniqueBoars = Array.from(new Set(allSows.flatMap(s => s.history.map(h => h.boarId)).filter(Boolean))) as string[];
  const uniqueSemen = Array.from(new Set(allSows.flatMap(s => s.history.map(h => h.semenId)).filter(Boolean))) as string[];
  const uniqueSemenSources = Array.from(new Set(allSows.flatMap(s => s.history.map(h => h.semenSource)).filter(Boolean))) as string[];
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');
  const [showEventModal, setShowEventModal] = useState<EventType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState<any>({
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleRecordEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEventModal) return;
    
    // Parse numeric fields
    const payload: any = { ...formData };
    delete payload.date; // Date is passed separately
    
    ['pigletCount', 'liveBorn', 'stillborn', 'mummified', 'avgBirthWeight', 'weanedCount', 'totalWeanWeight', 'cullPrice'].forEach(key => {
      if (payload[key]) {
        payload[key] = parseFloat(payload[key]);
      }
    });
    
    onRecordEvent(
      sow.id, 
      showEventModal, 
      new Date(formData.date).toISOString(), 
      payload
    );
    
    setShowEventModal(null);
    setFormData({ date: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 flex items-center gap-1">
          <ArrowLeft className="w-7 h-7 text-gray-700" />
          <span className="font-medium text-gray-700 text-base">กลับ</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900">{sow.id}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-full hover:bg-red-50 text-red-500">
            <Trash2 className="w-6 h-6" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-700">
              <MoreVertical className="w-6 h-6" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <button 
                    onClick={() => { setShowEventModal('HEALTH_NOTE'); setShowMenu(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium"
                  >
                    <Stethoscope className="w-5 h-5 text-blue-500" /> บันทึกสุขภาพ/หมายเหตุ
                  </button>
                  {['BRED', 'PREGNANT', 'PREPARING'].includes(sow.status) && (
                    <button 
                      onClick={() => { setShowEventModal('RETURN_ESTRUS'); setShowMenu(false); }} 
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-orange-600 font-medium"
                    >
                      <RefreshCw className="w-5 h-5" /> แจ้งกลับสัด
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowEventModal('CULL'); setShowMenu(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-red-600 font-medium"
                  >
                    <AlertTriangle className="w-5 h-5" /> คัดออก
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-[65px] z-10 shadow-sm">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn("flex-1 py-4 flex flex-col items-center justify-center text-sm font-bold border-b-2 transition-colors relative", activeTab === 'tasks' ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <ListTodo className="w-6 h-6 mb-1" />
          กำหนดการ
          {tasks.length > 0 && (
            <span className="absolute top-3 right-6 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex-1 py-4 flex flex-col items-center justify-center text-sm font-bold border-b-2 transition-colors", activeTab === 'history' ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <History className="w-6 h-6 mb-1" />
          ประวัติ
        </button>
      </div>

      <div className="p-4 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <section className="animate-in fade-in duration-200 flex flex-col gap-6">
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mr-4 text-lg font-bold",
                        task.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                        task.status === 'TODAY' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{EVENT_LABELS[task.type]}</p>
                        <p className={cn(
                          "text-base font-medium",
                          task.status === 'OVERDUE' ? 'text-red-600' :
                          task.status === 'TODAY' ? 'text-yellow-600' :
                          'text-gray-500'
                        )}>
                          {formatDate(task.expectedDate)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowEventModal(task.type)}
                      className="px-4 py-2 bg-pink-50 text-pink-600 text-base font-bold rounded-lg hover:bg-pink-100"
                    >
                      บันทึก
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-400 mb-4" />
                <p className="text-lg">ไม่มีกำหนดการในขณะนี้</p>
              </div>
            )}
          </section>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <section className="animate-in fade-in duration-200">
            {sow.history.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <p className="text-lg">ยังไม่มีประวัติกิจกรรม</p>
              </div>
            ) : (
              Array.from(new Set(sow.history.map(e => e.parity || 0))).sort((a, b) => b - a).map(parityLevel => {
                const eventsInParity = sow.history.filter(e => (e.parity || 0) === parityLevel).reverse();
                const farrowEvent = eventsInParity.find(e => e.type === 'FARROW');
                const cycleNum = Math.min(parityLevel + 1, 7);
                
                return (
                  <div key={parityLevel} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-pink-600 bg-pink-50 px-4 py-1.5 rounded-lg inline-block">รอบที่ {cycleNum}/7</h4>
                      {farrowEvent?.pigletCount !== undefined && (
                        <span className="text-base font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md">ให้ลูก: {farrowEvent.pigletCount} ตัว</span>
                      )}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
                        {eventsInParity.map((event) => (
                          <div key={event.id} className="relative pl-8">
                            <div className="absolute -left-[11px] top-1 bg-white">
                              <CheckCircle2 className="w-5 h-5 text-green-500 bg-white rounded-full" />
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900">{EVENT_LABELS[event.type]}</p>
                              <p className="text-base text-gray-500">{formatDate(event.date)}</p>
                              
                              {/* Extra Details based on event type */}
                              <div className="mt-2 text-base text-gray-700 space-y-1">
                                {event.type === 'BREED' && (
                                  <>
                                    <p>วิธีผสม: <span className="font-medium">{event.breedingMethod === 'NATURAL' ? 'ผสมจริง' : 'ผสมเทียม'}</span></p>
                                    {event.breedingMethod === 'NATURAL' && event.boarId && <p>เบอร์หูพ่อพันธุ์: <span className="font-medium">{event.boarId}</span></p>}
                                    {event.breedingMethod !== 'NATURAL' && event.semenId && <p>รหัสน้ำเชื้อ: <span className="font-medium">{event.semenId}</span></p>}
                                    {event.breedingMethod !== 'NATURAL' && event.semenSource && <p>แหล่งที่มา: <span className="font-medium">{event.semenSource}</span></p>}
                                    {event.inseminator && <p>ผู้ผสม: <span className="font-medium">{event.inseminator}</span></p>}
                                  </>
                                )}
                                {event.type === 'CHECK_ESTRUS' && event.pregResult && (
                                  <p>ผลตรวจ: <span className={cn("font-bold", event.pregResult === 'POSITIVE' ? 'text-green-600' : 'text-red-600')}>
                                    {event.pregResult === 'POSITIVE' ? 'ไม่กลับสัด (ท้อง)' : event.pregResult === 'NEGATIVE' ? 'กลับสัด (ไม่ติด)' : 'แท้ง'}
                                  </span></p>
                                )}
                                {event.type === 'FARROW' && (
                                  <div className="bg-pink-50 p-3 rounded-md mt-2">
                                    <p>มีชีวิต: <span className="font-bold text-pink-700">{event.liveBorn || 0}</span> ตัว</p>
                                    <p>ตายโคม: <span className="font-bold text-red-600">{event.stillborn || 0}</span> ตัว</p>
                                    <p>มัมมี่: <span className="font-bold text-orange-600">{event.mummified || 0}</span> ตัว</p>
                                    {event.avgBirthWeight && <p>นน.เฉลี่ย: <span className="font-bold">{event.avgBirthWeight}</span> กก.</p>}
                                  </div>
                                )}
                                {event.type === 'WEAN' && (
                                  <div className="bg-green-50 p-3 rounded-md mt-2">
                                    <p>หย่านม: <span className="font-bold text-green-700">{event.weanedCount || 0}</span> ตัว</p>
                                    {event.totalWeanWeight && <p>นน.รวม: <span className="font-bold">{event.totalWeanWeight}</span> กก.</p>}
                                  </div>
                                )}
                                {event.type === 'CULL' && (
                                  <div className="bg-red-50 p-3 rounded-md mt-2">
                                    {event.cullReason && <p>สาเหตุ: <span className="font-bold text-red-700">{event.cullReason}</span></p>}
                                    {event.cullPrice && <p>ราคาขาย: <span className="font-bold">{event.cullPrice}</span> บาท</p>}
                                  </div>
                                )}
                                {event.type === 'HEALTH_NOTE' && (
                                  <div className={cn(
                                    "p-3 rounded-md mt-2 border",
                                    event.noteCategory === 'SICK' ? "bg-red-50 border-red-100 text-red-800" :
                                    event.noteCategory === 'VACCINE' ? "bg-blue-50 border-blue-100 text-blue-800" :
                                    "bg-gray-50 border-gray-200 text-gray-800"
                                  )}>
                                    <p className="font-bold mb-1">
                                      {event.noteCategory === 'SICK' ? '💊 ป่วย / รักษา' :
                                       event.noteCategory === 'VACCINE' ? '💉 ฉีดวัคซีน / บำรุง' :
                                       '📝 หมายเหตุทั่วไป'}
                                    </p>
                                    {event.notes && <p className="text-sm">{event.notes}</p>}
                                  </div>
                                )}
                                {event.notes && event.type !== 'HEALTH_NOTE' && <p className="text-gray-500 italic mt-2">"{event.notes}"</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">บันทึก: {EVENT_LABELS[showEventModal]}</h3>
              <button onClick={() => setShowEventModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRecordEvent} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">วันที่ดำเนินการ</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              {/* Dynamic Fields based on Event Type */}
              {showEventModal === 'HEALTH_NOTE' && (
                <>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">ประเภท</label>
                    <select
                      required
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white text-lg"
                      value={formData.noteCategory || 'GENERAL'}
                      onChange={(e) => setFormData({...formData, noteCategory: e.target.value})}
                    >
                      <option value="SICK">ป่วย / รักษา</option>
                      <option value="VACCINE">ฉีดวัคซีน / บำรุง</option>
                      <option value="GENERAL">หมายเหตุทั่วไป</option>
                    </select>
                  </div>
                </>
              )}

              {showEventModal === 'BREED' && (
                <>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">วิธีการผสม</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="breedingMethod" 
                          value="ARTIFICIAL" 
                          checked={formData.breedingMethod !== 'NATURAL'} 
                          onChange={() => setFormData({...formData, breedingMethod: 'ARTIFICIAL'})}
                          className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-lg">ผสมเทียม</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="breedingMethod" 
                          value="NATURAL" 
                          checked={formData.breedingMethod === 'NATURAL'} 
                          onChange={() => setFormData({...formData, breedingMethod: 'NATURAL'})}
                          className="w-5 h-5 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-lg">ผสมจริง</span>
                      </label>
                    </div>
                  </div>
                  {formData.breedingMethod === 'NATURAL' && (
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">เบอร์หูพ่อพันธุ์</label>
                      <input
                        type="text"
                        list="boar-list"
                        className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                        value={formData.boarId || ''}
                        onChange={(e) => setFormData({...formData, boarId: e.target.value})}
                      />
                      <datalist id="boar-list">
                        {uniqueBoars.map(id => <option key={id} value={id} />)}
                      </datalist>
                    </div>
                  )}
                  {formData.breedingMethod !== 'NATURAL' && (
                    <>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">รหัสน้ำเชื้อ</label>
                        <input
                          type="text"
                          list="semen-list"
                          className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                          value={formData.semenId || ''}
                          onChange={(e) => setFormData({...formData, semenId: e.target.value})}
                        />
                        <datalist id="semen-list">
                          {uniqueSemen.map(id => <option key={id} value={id} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">แหล่งที่มา / จากฟาร์ม</label>
                        <input
                          type="text"
                          list="source-list"
                          className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                          value={formData.semenSource || ''}
                          onChange={(e) => setFormData({...formData, semenSource: e.target.value})}
                        />
                        <datalist id="source-list">
                          {uniqueSemenSources.map(src => <option key={src} value={src} />)}
                        </datalist>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">ผู้ผสม</label>
                    <input
                      type="text"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.inseminator || ''}
                      onChange={(e) => setFormData({...formData, inseminator: e.target.value})}
                    />
                  </div>
                </>
              )}

              {showEventModal === 'CHECK_ESTRUS' && (
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">ผลการตรวจกลับสัด</label>
                  <select
                    required
                    className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white text-lg"
                    value={formData.pregResult || ''}
                    onChange={(e) => setFormData({...formData, pregResult: e.target.value})}
                  >
                    <option value="" disabled>เลือกผลการตรวจ</option>
                    <option value="POSITIVE">ไม่กลับสัด (ท้อง)</option>
                    <option value="NEGATIVE">กลับสัด (ไม่ติด)</option>
                    <option value="ABORTION">แท้ง</option>
                  </select>
                </div>
              )}

              {showEventModal === 'FARROW' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">มีชีวิต (ตัว)</label>
                    <input
                      type="number" required min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.liveBorn || ''}
                      onChange={(e) => setFormData({...formData, liveBorn: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">ตายโคม (ตัว)</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.stillborn || ''}
                      onChange={(e) => setFormData({...formData, stillborn: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">มัมมี่ (ตัว)</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.mummified || ''}
                      onChange={(e) => setFormData({...formData, mummified: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">นน.เฉลี่ย (กก.)</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.avgBirthWeight || ''}
                      onChange={(e) => setFormData({...formData, avgBirthWeight: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {showEventModal === 'WEAN' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">จำนวนหย่านม (ตัว)</label>
                    <input
                      type="number" required min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.weanedCount || ''}
                      onChange={(e) => setFormData({...formData, weanedCount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">นน.รวม (กก.)</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.totalWeanWeight || ''}
                      onChange={(e) => setFormData({...formData, totalWeanWeight: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {showEventModal === 'CULL' && (
                <>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">สาเหตุที่คัดออก</label>
                    <input
                      type="text" required
                      placeholder="เช่น แก่, ไม่ติด, ป่วย"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.cullReason || ''}
                      onChange={(e) => setFormData({...formData, cullReason: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">ราคาขาย (บาท) - ไม่บังคับ</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                      value={formData.cullPrice || ''}
                      onChange={(e) => setFormData({...formData, cullPrice: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">หมายเหตุเพิ่มเติม</label>
                <textarea
                  className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none resize-none text-lg"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-pink-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-pink-700 mt-6 text-lg"
              >
                บันทึกข้อมูล
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ลบข้อมูลแม่หมู?</h3>
              <p className="text-gray-500 mb-6">
                คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ <strong className="text-gray-800">{sow.id}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
