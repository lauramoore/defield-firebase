import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const submitFeedback = onCall(async (request) => {
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
  // Verify team number exists in the teams collection
  const teamDoc = await admin.firestore().collection('teams').doc(teamNumber.toString()).get();
  if (!teamDoc.exists) {
    throw new HttpsError('not-found', 'Team number does not exist.');
  }
  
  if (!sessionId || typeof sessionId !== 'string') {
    throw new HttpsError('invalid-argument', 'Session ID required.');
  }
  // Verify sessionId exists in the sessions collection
  const sessionDoc = await admin.firestore().collection('sessions').doc(sessionId).get();
  if (!sessionDoc.exists) {
    throw new HttpsError('not-found', 'Session ID does not exist.');
  }
  // Rate limit: Only allow one feedback per 60 seconds per user
  const feedbackRef = admin.firestore().collection('feedback');
  const recent = await feedbackRef
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!recent.empty) {
    const last = recent.docs[0].data();
    const now = Date.now();
    if (last.createdAt && now - last.createdAt.toMillis() < 60000) {
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