import { GoogleGenAI, Type } from "@google/genai";
import { Sow } from "../types";
import { EVENT_LABELS } from "../lib/cycleEngine";
import { formatDate } from "../lib/utils";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to format history for the prompt
function formatHistory(sow: Sow): string {
  if (!sow.history || sow.history.length === 0) return "ไม่มีประวัติ";
  
  return sow.history.map(event => {
    let details = `${formatDate(event.date)}: ${EVENT_LABELS[event.type]}`;
    if (event.type === 'BREED') {
      details += ` (วิธี: ${event.breedingMethod === 'NATURAL' ? 'ผสมจริง' : 'ผสมเทียม'})`;
    }
    if (event.type === 'CHECK_ESTRUS' && event.pregResult) {
      details += ` (ผล: ${event.pregResult === 'POSITIVE' ? 'ไม่กลับสัด' : 'กลับสัด'})`;
    }
    if (event.notes) {
      details += ` - หมายเหตุ: ${event.notes}`;
    }
    return details;
  }).join('\n');
}

export async function generatePregnancyQuestions(imageBase64: string, mimeType: string, sow: Sow): Promise<string[]> {
  const historyText = formatHistory(sow);
  
  const prompt = `
คุณคือสัตวแพทย์ผู้เชี่ยวชาญด้านสุกร 
นี่คือภาพถ่ายพุง/เต้านมของแม่หมู (อายุครรภ์ประมาณ 60 วันหลังผสม)
และนี่คือประวัติของแม่หมูตัวนี้:
${historyText}

หน้าที่ของคุณคือ:
สร้างคำถามเพิ่มเติม 2-3 ข้อ เพื่อให้คนเลี้ยงที่อยู่หน้างานช่วยสังเกตอาการหรือพฤติกรรมของแม่หมูตัวนี้ เพื่อนำมาประกอบการตัดสินใจว่า "ท้อง" หรือ "ไม่ท้อง" (ท้องลม)
คำถามควรเป็นคำถามที่คนเลี้ยงสามารถสังเกตและตอบได้ง่าย เช่น พฤติกรรมการกิน, ลักษณะอวัยวะเพศ, การขยายตัวของเต้านม ฯลฯ

ส่งคืนผลลัพธ์เป็น JSON Array ของ String เท่านั้น
ตัวอย่าง: ["แม่หมูกินอาหารเก่งขึ้นไหม?", "เต้านมเริ่มมีน้ำนมซึมหรือยัง?"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return [];
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("ไม่สามารถสร้างคำถามได้ กรุณาลองใหม่อีกครั้ง");
  }
}

export async function analyzePregnancyResult(
  imageBase64: string, 
  mimeType: string, 
  sow: Sow, 
  qaList: { question: string, answer: string }[]
): Promise<{ result: 'POSITIVE' | 'NEGATIVE', confidence: string, reasoning: string }> {
  const historyText = formatHistory(sow);
  const qaText = qaList.map(qa => `คำถาม: ${qa.question}\nคำตอบ: ${qa.answer}`).join('\n\n');
  
  const prompt = `
คุณคือสัตวแพทย์ผู้เชี่ยวชาญด้านสุกร
นี่คือข้อมูลประกอบการวินิจฉัยการตั้งครรภ์ของแม่หมู (อายุครรภ์ประมาณ 60 วันหลังผสม):

1. ประวัติแม่หมู:
${historyText}

2. ข้อมูลจากการสอบถามคนเลี้ยงหน้างาน:
${qaText}

3. ภาพถ่ายพุง/เต้านมแม่หมู (แนบมาด้วย)

หน้าที่ของคุณคือ:
วิเคราะห์ข้อมูลทั้งหมดและตัดสินใจว่าแม่หมูตัวนี้ "ท้อง" (POSITIVE) หรือ "ไม่ท้อง/ท้องลม" (NEGATIVE) พร้อมระบุเปอร์เซ็นต์ความมั่นใจ และเหตุผลประกอบการตัดสินใจสั้นๆ

ส่งคืนผลลัพธ์เป็น JSON Object
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: {
              type: Type.STRING,
              description: "POSITIVE (ท้อง) หรือ NEGATIVE (ไม่ท้อง)"
            },
            confidence: {
              type: Type.STRING,
              description: "เปอร์เซ็นต์ความมั่นใจ เช่น '85%'"
            },
            reasoning: {
              type: Type.STRING,
              description: "เหตุผลประกอบการตัดสินใจสั้นๆ เป็นภาษาไทย"
            }
          },
          required: ["result", "confidence", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text.trim());
      // Ensure result is either POSITIVE or NEGATIVE
      if (parsed.result !== 'POSITIVE' && parsed.result !== 'NEGATIVE') {
        parsed.result = 'POSITIVE'; // Fallback
      }
      return parsed;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Error analyzing result:", error);
    throw new Error("ไม่สามารถวิเคราะห์ผลได้ กรุณาลองใหม่อีกครั้ง");
  }
}
