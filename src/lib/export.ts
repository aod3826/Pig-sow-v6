import { Sow } from '../types';
import { format } from 'date-fns';

export function exportSowsToCSV(sows: Sow[]) {
  // Headers in Thai
  const headers = [
    'รหัสแม่หมู', 
    'สายพันธุ์', 
    'สถานะ', 
    'รอบที่', 
    'วันที่เข้าเล้า', 
    'ลูกเกิดรอดล่าสุด', 
    'ลูกหย่านมล่าสุด'
  ];
  
  const rows = sows.map(sow => {
    // Find latest farrow and wean events
    const farrowEvents = sow.history.filter(e => e.type === 'FARROW');
    const latestFarrow = farrowEvents.length > 0 ? farrowEvents[farrowEvents.length - 1] : null;
    
    const weanEvents = sow.history.filter(e => e.type === 'WEAN');
    const latestWean = weanEvents.length > 0 ? weanEvents[weanEvents.length - 1] : null;
    
    // Format entry date
    const entryDate = sow.entryDate ? format(new Date(sow.entryDate), 'yyyy-MM-dd') : '-';
    
    return [
      sow.id,
      sow.breed || '-',
      sow.status,
      sow.parity || 1,
      entryDate,
      latestFarrow?.liveBorn ?? '-',
      latestWean?.weanedCount ?? '-'
    ].join(',');
  });

  // Add BOM for UTF-8 Excel compatibility
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `sows_export_${format(new Date(), 'yyyyMMdd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
