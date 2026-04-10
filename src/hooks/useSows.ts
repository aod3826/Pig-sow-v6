import { useState, useEffect } from 'react';
import { Sow, SowEvent, EventType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'sow_management_data';

export function useSows() {
  const [sows, setSows] = useState<Sow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchFromSupabase();
    } else {
      // Fallback to local storage if Supabase is not configured
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setSows(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse sows from local storage', e);
        }
      }
      setLoading(false);
    }
  }, []);

  // Save to local storage only if Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured && !loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sows));
    }
  }, [sows, loading]);

  const fetchFromSupabase = async () => {
    try {
      const { data: sowsData, error: sowsError } = await supabase!.from('sows').select('*');
      if (sowsError) throw sowsError;

      const { data: eventsData, error: eventsError } = await supabase!.from('sow_events').select('*');
      if (eventsError) throw eventsError;

      const formattedSows: Sow[] = sowsData.map(s => ({
        id: s.id,
        breed: s.breed,
        birthDate: s.birth_date,
        entryDate: s.entry_date,
        status: s.status,
        parity: s.parity,
        currentCycleStartDate: s.current_cycle_start_date,
        farrowDate: s.farrow_date,
        weanDate: s.wean_date,
        history: eventsData
          .filter(e => e.sow_id === s.id)
          .map(e => ({
            id: e.id,
            type: e.type,
            date: e.date,
            notes: e.notes,
            parity: e.parity,
            boarId: e.boar_id,
            inseminator: e.inseminator,
            pregResult: e.preg_result,
            pigletCount: e.piglet_count,
            liveBorn: e.live_born,
            stillborn: e.stillborn,
            mummified: e.mummified,
            avgBirthWeight: e.avg_birth_weight,
            weanedCount: e.weaned_count,
            totalWeanWeight: e.total_wean_weight,
            cullReason: e.cull_reason,
            cullPrice: e.cull_price
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }));

      setSows(formattedSows);
    } catch (error) {
      console.error('Supabase fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSow = async (id: string, breed: string, birthDate: string, entryDate: string) => {
    const newEventId = crypto.randomUUID();
    const newSow: Sow = {
      id,
      breed,
      birthDate,
      entryDate,
      status: 'IDLE',
      parity: 0,
      history: [
        {
          id: newEventId,
          type: 'ENTRY',
          date: entryDate,
          parity: 0,
        }
      ]
    };

    // Optimistic UI update
    setSows(prev => [...prev, newSow]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sows').insert({
          id,
          breed,
          birth_date: birthDate || null,
          entry_date: entryDate,
          status: 'IDLE',
          parity: 0
        });
        await supabase.from('sow_events').insert({
          id: newEventId,
          sow_id: id,
          type: 'ENTRY',
          date: entryDate,
          parity: 0
        });
      } catch (error) {
        console.error('Error adding sow to Supabase:', error);
      }
    }
  };

  const recordEvent = async (sowId: string, type: EventType, date: string, payload: Partial<SowEvent> = {}) => {
    let updatedSowData: Partial<Sow> | null = null;
    let newEventData: SowEvent | null = null;

    setSows(prev => prev.map(sow => {
      if (sow.id !== sowId) return sow;

      let newParity = sow.parity || 0;
      if (type === 'BREED' && (sow.status === 'IDLE' || sow.status === 'CULL_SUGGESTED')) {
        newParity += 1;
      }

      const newEvent: SowEvent = {
        id: crypto.randomUUID(),
        type,
        date,
        parity: newParity,
        ...payload
      };

      const updatedSow = { ...sow, parity: newParity, history: [...sow.history, newEvent] };

      // State Machine Logic
      switch (type) {
        case 'BREED':
          updatedSow.status = 'BRED';
          updatedSow.currentCycleStartDate = date;
          break;
        case 'CHECK_ESTRUS':
        case 'ULTRASOUND':
          if (payload.pregResult === 'POSITIVE') {
            updatedSow.status = 'PREGNANT';
          } else if (payload.pregResult === 'NEGATIVE' || payload.pregResult === 'ABORTION') {
            updatedSow.status = 'IDLE';
            updatedSow.weanDate = date; // Reset cycle timing
          }
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
            if (newParity >= 7) {
              updatedSow.status = 'CULL_SUGGESTED';
            } else {
              updatedSow.status = 'IDLE';
            }
            updatedSow.weanDate = date;
          }
          break;
        case 'RETURN_ESTRUS':
          updatedSow.status = 'IDLE';
          updatedSow.weanDate = date; 
          break;
        case 'CULL':
          updatedSow.status = 'CULLED';
          break;
      }

      updatedSowData = updatedSow;
      newEventData = newEvent;

      return updatedSow;
    }));

    if (isSupabaseConfigured && supabase && updatedSowData && newEventData) {
      try {
        await supabase.from('sows').update({
          status: updatedSowData.status,
          parity: updatedSowData.parity,
          current_cycle_start_date: updatedSowData.currentCycleStartDate,
          farrow_date: updatedSowData.farrowDate,
          wean_date: updatedSowData.weanDate
        }).eq('id', sowId);

        await supabase.from('sow_events').insert({
          id: newEventData.id,
          sow_id: sowId,
          type: newEventData.type,
          date: newEventData.date,
          parity: newEventData.parity,
          notes: newEventData.notes,
          boar_id: newEventData.boarId,
          inseminator: newEventData.inseminator,
          preg_result: newEventData.pregResult,
          piglet_count: newEventData.pigletCount,
          live_born: newEventData.liveBorn,
          stillborn: newEventData.stillborn,
          mummified: newEventData.mummified,
          avg_birth_weight: newEventData.avgBirthWeight,
          weaned_count: newEventData.weanedCount,
          total_wean_weight: newEventData.totalWeanWeight,
          cull_reason: newEventData.cullReason,
          cull_price: newEventData.cullPrice
        });
      } catch (error) {
        console.error('Error recording event to Supabase:', error);
      }
    }
  };

  const deleteSow = async (sowId: string) => {
    setSows(prev => prev.filter(s => s.id !== sowId));
    
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sows').delete().eq('id', sowId);
      } catch (error) {
        console.error('Error deleting sow from Supabase:', error);
      }
    }
  };

  return { sows, addSow, recordEvent, deleteSow, loading };
}
