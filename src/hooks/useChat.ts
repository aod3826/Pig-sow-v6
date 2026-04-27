import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { ChatMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50) // Only load last 50 messages to save bandwidth
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          text: data.text,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
      // Reverse array so newest is at the bottom
      setMessages(msgs.reverse());
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (text: string, imageFile?: string) => {
    if (!auth.currentUser) throw new Error("Not authenticated");

    let imageUrl = '';
    if (imageFile) {
      // imageFile is expected to be a data URL
      const imageRef = ref(storage, `chat_images/${Date.now()}_${auth.currentUser.uid}.jpg`);
      await uploadString(imageRef, imageFile, 'data_url');
      imageUrl = await getDownloadURL(imageRef);
    }

    if (!text.trim() && !imageUrl) return;

    await addDoc(collection(db, 'messages'), {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
      userAvatar: auth.currentUser.photoURL || '',
      text: text.trim(),
      imageUrl,
      createdAt: serverTimestamp()
    });
  };

  return { messages, sendMessage, isLoading };
}
