import { useState, useEffect } from 'react';
import { Sow, SowEvent, EventType } from '../types';

const STORAGE_KEY = 'sow_management_data';

export function useSows() {
  const [sows, setSows] = useState<Sow[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sows from local storage', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sows));
  }, [sows]);

  const addSow = (id: string, breedDate: string) => {
    const newSow: Sow = {
      id,
      status: 'BRED',
      currentCycleStartDate: breedDate,
      history: [
        {
          id: crypto.randomUUID(),
          type: 'BREED',
          date: breedDate,
        }
      ]
    };
    setSows(prev => [...prev, newSow]);
  };

  const recordEvent = (sowId: string, type: EventType, date: string, pigletCount?: number, notes?: string) => {
    setSows(prev => prev.map(sow => {
      if (sow.id !== sowId) return sow;

      const newEvent: SowEvent = {
        id: crypto.randomUUID(),
        type,
        date,
        pigletCount,
        notes,
      };

      const updatedSow = { ...sow, history: [...sow.history, newEvent] };

      // State Machine Logic
      switch (type) {
        case 'BREED':
          updatedSow.status = 'BRED';
          updatedSow.currentCycleStartDate = date;
          break;
        case 'ULTRASOUND':
          if (sow.status === 'BRED') updatedSow.status = 'PREGNANT';
          break;
        case 'MOVE_TO_PEN':
          if (sow.status === 'PREGNANT') updatedSow.status = 'PREPARING';
          break;
        case 'FARROW':
          if (sow.status === 'PREPARING') {
            updatedSow.status = 'NURSING';
            updatedSow.farrowDate = date;
          }
          break;
        case 'WEAN':
          if (sow.status === 'NURSING') {
            updatedSow.status = 'IDLE';
            updatedSow.weanDate = date;
          }
          break;
        case 'RETURN_ESTRUS':
          updatedSow.status = 'IDLE';
          // reset dates so it waits for breed
          updatedSow.weanDate = date; // Treat return to estrus similar to wean for re-breed timing, or just wait for breed.
          break;
        // CHECK_ESTRUS and FEED_BOOST don't change status
      }

      return updatedSow;
    }));
  };

  const deleteSow = (sowId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบแม่หมูตัวนี้?')) {
      setSows(prev => prev.filter(s => s.id !== sowId));
    }
  };

  return { sows, addSow, recordEvent, deleteSow };
}
