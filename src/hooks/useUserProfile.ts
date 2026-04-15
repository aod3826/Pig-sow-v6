import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface UserProfile {
  photoURL?: string;
  displayName?: string;
}

export function useUserProfile(isAuthReady: boolean) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !auth.currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const userRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Fallback to Google Auth profile if no custom profile exists
        setProfile({
          photoURL: auth.currentUser?.photoURL || undefined,
          displayName: auth.currentUser?.displayName || undefined,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, auth.currentUser]);

  const updateProfilePicture = async (base64Image: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const userRef = doc(db, 'users', userId);
    
    try {
      await setDoc(userRef, { photoURL: base64Image }, { merge: true });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  };

  return { profile, loading, updateProfilePicture };
}
