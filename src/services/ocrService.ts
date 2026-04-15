import { ExpenseItem } from '../types';

export interface OcrResult {
  shopName: string;
  totalAmount: number;
  date: string;
  items: Omit<ExpenseItem, 'id'>[];
}

/**
 * Mock OCR Service
 * นี่คือ "พิมพ์เขียว" สำหรับจำลองการทำงานของ AI (เช่น Gemini API หรือ Cloud Vision)
 * ในอนาคต เมื่อพร้อมเปิดใช้งาน จะเปลี่ยนโค้ดส่วนนี้ให้ส่งรูปไปหา AI จริงๆ
 */
export const scanReceiptImage = async (file: File): Promise<OcrResult> => {
  // จำลองเวลาประมวลผลของ AI (2 วินาที)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // จำลองข้อมูลที่ AI อ่านได้จากบิล (Mock Data)
  // ในอนาคต ข้อมูลนี้จะถูก Return มาจาก Gemini API
  return {
    shopName: "โรงสีเจริญทรัพย์ (จำลอง AI)",
    totalAmount: 1450,
    date: new Date().toISOString().split('T')[0], // วันนี้
    items: [
      {
        name: "รำละเอียด",
        quantity: 100,
        unit: "กก.",
        unitPrice: 8.5,
        totalPrice: 850
      },
      {
        name: "ปลายข้าว",
        quantity: 50,
        unit: "กก.",
        unitPrice: 12.0,
        totalPrice: 600
      }
    ]
  };
};
