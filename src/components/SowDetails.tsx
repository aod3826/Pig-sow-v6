import { useState } from 'react';
import { Sow, EventType } from '../types';
import { getUpcomingTasksForSow, EVENT_LABELS, STATUS_LABELS } from '../lib/cycleEngine';
import { cn, formatDate } from '../lib/utils';
import { ArrowLeft, CheckCircle2, Circle, Clock, Trash2, Info, ListTodo, History } from 'lucide-react';
import { format } from 'date-fns';

interface SowDetailsProps {
  sow: Sow;
  onBack: () => void;
  onRecordEvent: (sowId: string, type: EventType, date: string, pigletCount?: number, notes?: string) => void;
  onDelete: () => void;
}

export default function SowDetails({ sow, onBack, onRecordEvent, onDelete }: SowDetailsProps) {
  const tasks = getUpcomingTasksForSow(sow);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'history'>('details');
  const [showEventModal, setShowEventModal] = useState<EventType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const getStatusColor = (status: Sow['status']) => {
    switch (status) {
      case 'IDLE': return 'bg-gray-100 text-gray-700';
      case 'BRED': return 'bg-blue-100 text-blue-800';
      case 'PREGNANT': return 'bg-purple-100 text-purple-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'NURSING': return 'bg-green-100 text-green-800';
      case 'CULL_SUGGESTED': return 'bg-red-100 text-red-800';
      case 'CULLED': return 'bg-gray-800 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgress = () => {
    if (sow.status === 'IDLE') return 0;
    if (!sow.currentCycleStartDate) return 0;
    
    const start = new Date(sow.currentCycleStartDate).getTime();
    const now = new Date().getTime();
    const totalDays = 135; // 114 to farrow + 21 to wean
    const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
    
    let progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
    return progress;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{sow.id}</h2>
        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 -mr-2 rounded-full hover:bg-red-50 text-red-500">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-[53px] z-10 shadow-sm">
        <button 
          onClick={() => setActiveTab('details')}
          className={cn("flex-1 py-3 flex flex-col items-center justify-center text-xs font-bold border-b-2 transition-colors", activeTab === 'details' ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <Info className="w-5 h-5 mb-1" />
          รายละเอียด
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn("flex-1 py-3 flex flex-col items-center justify-center text-xs font-bold border-b-2 transition-colors relative", activeTab === 'tasks' ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <ListTodo className="w-5 h-5 mb-1" />
          กำหนดการ
          {tasks.length > 0 && (
            <span className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex-1 py-3 flex flex-col items-center justify-center text-xs font-bold border-b-2 transition-colors", activeTab === 'history' ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <History className="w-5 h-5 mb-1" />
          ประวัติ
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto pb-24">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center animate-in fade-in duration-200">
            <p className="text-sm text-gray-500 mb-1">สถานะปัจจุบัน</p>
            <div className={cn("inline-block px-4 py-1.5 rounded-full font-bold text-lg mb-4", getStatusColor(sow.status))}>
              {STATUS_LABELS[sow.status]}
            </div>

            {/* Progress Bar */}
            {sow.status !== 'IDLE' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                  <span>เริ่มผสม</span>
                  <span>หย่านม</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${getProgress()}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            {sow.status !== 'CULLED' && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {sow.status === 'IDLE' && (
                  <button 
                    onClick={() => setShowEventModal('BREED')}
                    className="col-span-2 bg-pink-100 text-pink-700 font-bold py-2 rounded-xl hover:bg-pink-200"
                  >
                    บันทึกการผสมพันธุ์
                  </button>
                )}
                {sow.status === 'CULL_SUGGESTED' && (
                  <div className="col-span-2 bg-red-100 text-red-700 font-bold py-2 rounded-xl text-center border border-red-200">
                    แม่หมูตัวนี้ควรคัดออก (ครบ 7 รอบ)
                  </div>
                )}
                {(sow.status !== 'IDLE' && sow.status !== 'CULL_SUGGESTED') && (
                  <button 
                    onClick={() => setShowEventModal('RETURN_ESTRUS')}
                    className="col-span-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200"
                  >
                    กลับสัด
                  </button>
                )}
                <button 
                  onClick={() => setShowEventModal('CULL')}
                  className={cn("font-bold py-2 rounded-xl hover:bg-red-200 bg-red-50 text-red-600", (sow.status === 'IDLE' || sow.status === 'CULL_SUGGESTED') ? 'col-span-2' : 'col-span-1')}
                >
                  คัดออก
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <section className="animate-in fade-in duration-200">
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                        task.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                        task.status === 'TODAY' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{EVENT_LABELS[task.type]}</p>
                        <p className={cn(
                          "text-sm font-medium",
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
                      className="px-3 py-1.5 bg-pink-50 text-pink-600 text-sm font-bold rounded-lg hover:bg-pink-100"
                    >
                      บันทึก
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <p>ไม่มีกำหนดการในขณะนี้</p>
              </div>
            )}
          </section>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <section className="animate-in fade-in duration-200">
            {sow.history.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <p>ยังไม่มีประวัติกิจกรรม</p>
              </div>
            ) : (
              Array.from(new Set(sow.history.map(e => e.parity || 1))).sort((a, b) => b - a).map(parityLevel => {
                const eventsInParity = sow.history.filter(e => (e.parity || 1) === parityLevel).reverse();
                const farrowEvent = eventsInParity.find(e => e.type === 'FARROW');
                
                return (
                  <div key={parityLevel} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-lg inline-block">รอบที่ {parityLevel}</h4>
                      {farrowEvent?.pigletCount !== undefined && (
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">ให้ลูก: {farrowEvent.pigletCount} ตัว</span>
                      )}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                        {eventsInParity.map((event) => (
                          <div key={event.id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 bg-white">
                              <CheckCircle2 className="w-4 h-4 text-green-500 bg-white rounded-full" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{EVENT_LABELS[event.type]}</p>
                              <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                              
                              {/* Extra Details based on event type */}
                              <div className="mt-1 text-sm text-gray-700 space-y-0.5">
                                {event.type === 'BREED' && (
                                  <>
                                    {event.boarId && <p>พ่อพันธุ์: <span className="font-medium">{event.boarId}</span></p>}
                                    {event.inseminator && <p>ผู้ผสม: <span className="font-medium">{event.inseminator}</span></p>}
                                  </>
                                )}
                                {event.type === 'CHECK_ESTRUS' && event.pregResult && (
                                  <p>ผลตรวจ: <span className={cn("font-bold", event.pregResult === 'POSITIVE' ? 'text-green-600' : 'text-red-600')}>
                                    {event.pregResult === 'POSITIVE' ? 'ไม่กลับสัด' : 'กลับสัด (ไม่ติด)'}
                                  </span></p>
                                )}
                                {event.type === 'ULTRASOUND' && event.pregResult && (
                                  <p>ผลตรวจ: <span className={cn("font-bold", event.pregResult === 'POSITIVE' ? 'text-green-600' : 'text-red-600')}>
                                    {event.pregResult === 'POSITIVE' ? 'ท้อง' : event.pregResult === 'NEGATIVE' ? 'ไม่ท้อง' : 'แท้ง'}
                                  </span></p>
                                )}
                                {event.type === 'FARROW' && (
                                  <div className="bg-pink-50 p-2 rounded-md mt-2">
                                    <p>มีชีวิต: <span className="font-bold text-pink-700">{event.liveBorn || 0}</span> ตัว</p>
                                    <p>ตายโคม: <span className="font-bold text-red-600">{event.stillborn || 0}</span> ตัว</p>
                                    <p>มัมมี่: <span className="font-bold text-orange-600">{event.mummified || 0}</span> ตัว</p>
                                    {event.avgBirthWeight && <p>นน.เฉลี่ย: <span className="font-bold">{event.avgBirthWeight}</span> กก.</p>}
                                  </div>
                                )}
                                {event.type === 'WEAN' && (
                                  <div className="bg-green-50 p-2 rounded-md mt-2">
                                    <p>หย่านม: <span className="font-bold text-green-700">{event.weanedCount || 0}</span> ตัว</p>
                                    {event.totalWeanWeight && <p>นน.รวม: <span className="font-bold">{event.totalWeanWeight}</span> กก.</p>}
                                  </div>
                                )}
                                {event.type === 'CULL' && (
                                  <div className="bg-red-50 p-2 rounded-md mt-2">
                                    {event.cullReason && <p>สาเหตุ: <span className="font-bold text-red-700">{event.cullReason}</span></p>}
                                    {event.cullPrice && <p>ราคาขาย: <span className="font-bold">{event.cullPrice}</span> บาท</p>}
                                  </div>
                                )}
                                {event.notes && <p className="text-gray-500 italic">"{event.notes}"</p>}
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
              <h3 className="text-xl font-bold text-gray-900">บันทึก: {EVENT_LABELS[showEventModal]}</h3>
              <button onClick={() => setShowEventModal(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRecordEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ดำเนินการ</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              {/* Dynamic Fields based on Event Type */}
              {showEventModal === 'BREED' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสพ่อพันธุ์ / เบอร์น้ำเชื้อ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.boarId || ''}
                      onChange={(e) => setFormData({...formData, boarId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ผสม</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.inseminator || ''}
                      onChange={(e) => setFormData({...formData, inseminator: e.target.value})}
                    />
                  </div>
                </>
              )}

              {showEventModal === 'CHECK_ESTRUS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผลการตรวจสัด (21 วัน)</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                    value={formData.pregResult || ''}
                    onChange={(e) => setFormData({...formData, pregResult: e.target.value})}
                  >
                    <option value="" disabled>เลือกผลการตรวจ</option>
                    <option value="POSITIVE">ไม่กลับสัด (รอยืนยันอัลตราซาวด์)</option>
                    <option value="NEGATIVE">กลับสัด (ไม่ติด)</option>
                  </select>
                </div>
              )}

              {showEventModal === 'ULTRASOUND' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผลอัลตราซาวด์ (30 วัน)</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                    value={formData.pregResult || ''}
                    onChange={(e) => setFormData({...formData, pregResult: e.target.value})}
                  >
                    <option value="" disabled>เลือกผลการตรวจ</option>
                    <option value="POSITIVE">ท้อง (พบตัวอ่อน)</option>
                    <option value="NEGATIVE">ไม่ท้อง (ท้องลม)</option>
                    <option value="ABORTION">แท้ง</option>
                  </select>
                </div>
              )}

              {showEventModal === 'FARROW' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">มีชีวิต (ตัว)</label>
                    <input
                      type="number" required min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.liveBorn || ''}
                      onChange={(e) => setFormData({...formData, liveBorn: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตายโคม (ตัว)</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.stillborn || ''}
                      onChange={(e) => setFormData({...formData, stillborn: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">มัมมี่ (ตัว)</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.mummified || ''}
                      onChange={(e) => setFormData({...formData, mummified: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">นน.เฉลี่ย (กก.)</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.avgBirthWeight || ''}
                      onChange={(e) => setFormData({...formData, avgBirthWeight: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {showEventModal === 'WEAN' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนหย่านม (ตัว)</label>
                    <input
                      type="number" required min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.weanedCount || ''}
                      onChange={(e) => setFormData({...formData, weanedCount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">นน.รวม (กก.)</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.totalWeanWeight || ''}
                      onChange={(e) => setFormData({...formData, totalWeanWeight: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {showEventModal === 'CULL' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สาเหตุที่คัดออก</label>
                    <input
                      type="text" required
                      placeholder="เช่น แก่, ไม่ติด, ป่วย"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.cullReason || ''}
                      onChange={(e) => setFormData({...formData, cullReason: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) - ไม่บังคับ</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                      value={formData.cullPrice || ''}
                      onChange={(e) => setFormData({...formData, cullPrice: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-pink-700 mt-4"
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
