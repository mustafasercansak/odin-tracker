import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance, db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Requests notification permission and returns the FCM token.
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          updatedAt: new Date().toISOString(),
        });
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Sets up a listener for foreground messages.
 */
export async function onForegroundMessage() {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
  });
}
