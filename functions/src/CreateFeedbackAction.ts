import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {defineString } from 'firebase-functions/params';

// Define parameters - adjust these based on your actual config needs
const rateLimitSeconds = defineString('RATE_LIMIT_SECONDS', { default: '60' });
// Example if you had secrets:
// const apiKey = defineSecret('API_KEY');

export const submitFeedback = onCall({
  cors: true,
  region: "us-central1"
  // If you were using secrets, you'd include them here:
  // secrets: [apiKey],
}, async (request) => {
  // Require authentication (anonymous or regular)
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const uid = request.auth.uid;
  const feedbackText = request.data.feedback;
  const teamNumber = request.data.teamNumber;
  const sessionId = request.data.sessionId;
  if (!feedbackText || typeof feedbackText !== 'string') {
    throw new HttpsError('invalid-argument', 'Feedback text required.');
  }
  if (!teamNumber || typeof teamNumber !== 'number') {
    throw new HttpsError('invalid-argument', 'Team number required.');
  }
  
  const db = getFirestore();
  
  // Verify team number exists in the teams collection
  const teamDoc = await db.collection('teams').doc(teamNumber.toString()).get();
  if (!teamDoc.exists) {
    throw new HttpsError('not-found', 'Team number does not exist.');
  }
  
  if (sessionId) {
    if( typeof sessionId !== 'string' || sessionId.trim().length < 7) {
       throw new HttpsError('invalid-argument', 'Not a valid sessionId.');
    }
     // Verify sessionId exists in the sessions collection
     const sessionDoc = await db.collection('sessions').doc(sessionId).get();
     if (!sessionDoc.exists) {
        throw new HttpsError('not-found', 'Session ID does not exist.');
     }
  }
 
  
  // Rate limit: Use param for rate limit duration
  const rateLimitMs = parseInt(rateLimitSeconds.value()) * 1000;
  const feedbackRef = db.collection('feedback');
  const recent = await feedbackRef
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!recent.empty) {
    const last = recent.docs[0].data();
    const now = Date.now();
    if (last.createdAt && now - last.createdAt.toMillis() < rateLimitMs) {
      throw new HttpsError('resource-exhausted', 'Please wait before submitting more feedback.');
    }
  }

  // Create feedback with marker for security rule
  await feedbackRef.add({
    userId: uid,
    feedback: feedbackText,
    teamNumber: teamNumber,
    createdAt: new Date(),
    xCreatedByFunction: true
  });

  return { success: true };
});