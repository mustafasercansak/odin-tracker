import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

export const checkMedicationReminders = onSchedule({
  schedule: 'every 15 minutes',
  region: 'europe-west1',
}, async (event) => {
  const now = new Date();
  const nextWindow = new Date(now.getTime() + 16 * 60 * 1000); // 16 mins from now

  const nowIso = now.toISOString();
  const windowIso = nextWindow.toISOString();

  // Query medications due in the next window
  const snapshot = await db.collection('medications')
    .where('active', '==', true)
    .where('nextDoseDue', '>=', nowIso)
    .where('nextDoseDue', '<=', windowIso)
    .get();

  if (snapshot.empty) return;

  for (const doc of snapshot.docs) {
    const med = doc.data();
    
    // Get pet info for the notification
    const petDoc = await db.collection('pets').doc(med.petId).get();
    const pet = petDoc.data();
    if (!pet) continue;

    // Get owner tokens
    const ownerDoc = await db.collection('users').doc(pet.ownerId).get();
    const owner = ownerDoc.data();
    const tokens = owner?.fcmTokens || [];

    if (tokens.length === 0) continue;

    const message = {
      notification: {
        title: `🕒 İlaç Vakti: ${pet.name}`,
        body: `${med.name} (${med.dosage}) zamanı geldi.`,
      },
      tokens: tokens,
    };

    try {
      const response = await messaging.sendMulticast(message);
      console.log(`Sent notifications for ${med.name}: ${response.successCount} success`);
      
      // Handle invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        if (failedTokens.length > 0) {
          await db.collection('users').doc(pet.ownerId).update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
          });
        }
      }
    } catch (error) {
      console.error(`Error sending notifications for ${med.name}:`, error);
    }
  }
});
