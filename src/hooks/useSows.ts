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
            pigletCount: e.piglet_count,
            parity: e.parity
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

  const addSow = async (id: string, breedDate: string) => {
    const newEventId = crypto.randomUUID();
    const newSow: Sow = {
      id,
      status: 'BRED',
      parity: 1,
      currentCycleStartDate: breedDate,
      history: [
        {
          id: newEventId,
          type: 'BREED',
          date: breedDate,
          parity: 1,
        }
      ]
    };

    // Optimistic UI update
    setSows(prev => [...prev, newSow]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sows').insert({
          id,
          status: 'BRED',
          parity: 1,
          current_cycle_start_date: breedDate
        });
        await supabase.from('sow_events').insert({
          id: newEventId,
          sow_id: id,
          type: 'BREED',
          date: breedDate,
          parity: 1
        });
      } catch (error) {
        console.error('Error adding sow to Supabase:', error);
      }
    }
  };

  const recordEvent = async (sowId: string, type: EventType, date: string, pigletCount?: number, notes?: string) => {
    let updatedSowData: Partial<Sow> | null = null;
    let newEventData: SowEvent | null = null;

    setSows(prev => prev.map(sow => {
      if (sow.id !== sowId) return sow;

      let newParity = sow.parity || 1;
      if (type === 'BREED' && sow.status === 'IDLE') {
        newParity += 1;
      }

      const newEvent: SowEvent = {
        id: crypto.randomUUID(),
        type,
        date,
        pigletCount,
        notes,
        parity: newParity,
      };

      const updatedSow = { ...sow, parity: newParity, history: [...sow.history, newEvent] };

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
          piglet_count: newEventData.pigletCount,
          notes: newEventData.notes,
          parity: newEventData.parity
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
