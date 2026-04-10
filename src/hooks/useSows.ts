import { useState, useEffect } from 'react';
import { Sow, SowEvent, EventType } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collectionGroup,
  query,
  getDocs
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const STORAGE_KEY = 'sow_management_data';

export function useSows(isAuthReady: boolean) {
  const [sows, setSows] = useState<Sow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    // Listen to sows collection
    const unsubscribeSows = onSnapshot(collection(db, 'sows'), async (snapshot) => {
      const sowsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Fetch all activities across all sows
      const activitiesQuery = query(collectionGroup(db, 'activities'));
      
      const unsubscribeActivities = onSnapshot(activitiesQuery, (actSnapshot) => {
        const eventsData = actSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        const formattedSows: Sow[] = sowsData.map(s => ({
          id: s.id,
          breed: s.breed,
          birthDate: s.birthDate,
          entryDate: s.entryDate,
          status: s.status,
          parity: s.parity || 0,
          currentCycleStartDate: s.currentCycleStartDate,
          farrowDate: s.farrowDate,
          weanDate: s.weanDate,
          history: eventsData
            .filter(e => e.sowId === s.id)
            .map(e => ({
              id: e.id,
              type: e.type,
              date: e.date,
              notes: e.notes,
              parity: e.parity,
              boarId: e.boarId,
              inseminator: e.inseminator,
              pregResult: e.pregResult,
              pigletCount: e.pigletCount,
              liveBorn: e.liveBorn,
              stillborn: e.stillborn,
              mummified: e.mummified,
              avgBirthWeight: e.avgBirthWeight,
              weanedCount: e.weanedCount,
              totalWeanWeight: e.totalWeanWeight,
              cullReason: e.cullReason,
              cullPrice: e.cullPrice,
              createdAt: e.createdAt
            }))
            .sort((a, b) => {
              const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
              if (dateDiff !== 0) return dateDiff;
              return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            })
        }));

        setSows(formattedSows);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'activities (collectionGroup)');
        setLoading(false);
      });

      return () => unsubscribeActivities();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sows');
      setLoading(false);
    });

    return () => unsubscribeSows();
  }, [isAuthReady]);

  const addSow = async (id: string, breed: string, birthDate: string, entryDate: string) => {
    const newEventId = crypto.randomUUID();
    
    try {
      // Create sow document
      await setDoc(doc(db, 'sows', id), {
        breed,
        birthDate: birthDate || null,
        entryDate,
        status: 'IDLE',
        parity: 0,
        createdAt: new Date().toISOString()
      });

      // Create initial activity in sub-collection
      await setDoc(doc(db, `sows/${id}/activities`, newEventId), {
        sowId: id,
        type: 'ENTRY',
        date: entryDate,
        parity: 0,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `sows/${id}`);
    }
  };

  const recordEvent = async (sowId: string, type: EventType, date: string, payload: Partial<SowEvent> = {}) => {
    const sow = sows.find(s => s.id === sowId);
    if (!sow) return;

    let newParity = sow.parity || 0;
    const eventParity = newParity; // Record the event under the current cycle before incrementing
    let newStatus = sow.status;
    let currentCycleStartDate = sow.currentCycleStartDate;
    let farrowDate = sow.farrowDate;
    let weanDate = sow.weanDate;

    // State Machine Logic & Parity Update
    switch (type) {
      case 'BREED':
        newStatus = 'BRED';
        currentCycleStartDate = date;
        break;
      case 'CHECK_ESTRUS':
        if (payload.pregResult === 'NEGATIVE' || payload.pregResult === 'ABORTION') {
          newStatus = 'IDLE';
        }
        // If POSITIVE, status remains BRED (wait for ULTRASOUND to confirm PREGNANT)
        break;
      case 'ULTRASOUND':
        if (payload.pregResult === 'POSITIVE') {
          newStatus = 'PREGNANT';
        } else if (payload.pregResult === 'NEGATIVE' || payload.pregResult === 'ABORTION') {
          newStatus = 'IDLE';
        }
        break;
      case 'MOVE_TO_PEN':
        if (sow.status === 'PREGNANT') newStatus = 'PREPARING';
        break;
      case 'FARROW':
        if (sow.status === 'PREPARING') {
          newStatus = 'NURSING';
          farrowDate = date;
        }
        break;
      case 'WEAN':
        if (sow.status === 'NURSING') {
          // Increment parity on WEAN as requested
          newParity += 1;
          if (newParity >= 7) {
            newStatus = 'CULL_SUGGESTED';
          } else {
            newStatus = 'IDLE';
          }
          weanDate = date;
        }
        break;
      case 'RETURN_ESTRUS':
        newStatus = 'IDLE';
        weanDate = date; 
        break;
      case 'CULL':
        newStatus = 'CULLED';
        break;
    }

    const newEventId = crypto.randomUUID();

    try {
      // Update sow document
      await updateDoc(doc(db, 'sows', sowId), {
        status: newStatus,
        parity: newParity,
        currentCycleStartDate: currentCycleStartDate || null,
        farrowDate: farrowDate || null,
        weanDate: weanDate || null,
        updatedAt: new Date().toISOString()
      });

      // Add activity to sub-collection
      await setDoc(doc(db, `sows/${sowId}/activities`, newEventId), {
        sowId,
        type,
        date,
        parity: eventParity, // Use the pre-incremented parity so WEAN stays in the same cycle group
        ...payload,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sows/${sowId}`);
    }
  };

  const deleteSow = async (sowId: string) => {
    try {
      const sowActivities = sows.find(s => s.id === sowId)?.history || [];
      for (const activity of sowActivities) {
        await deleteDoc(doc(db, `sows/${sowId}/activities`, activity.id));
      }
      
      await deleteDoc(doc(db, 'sows', sowId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sows/${sowId}`);
    }
  };

  return { sows, addSow, recordEvent, deleteSow, loading };
}
