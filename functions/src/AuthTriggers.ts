import * as functions from 'firebase-functions/v1';
import {admin} from './app';




export const processSignUp = functions
  .runWith({ maxInstances: 10 })
  .auth.user().onCreate(async (user) => {
  // Check if the user has an email and was created with the Google provider.
  const isGoogleProvider = user.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );

  // Check if the user signed up with a waltonrobotics.org email via Google
  if (isGoogleProvider && user.email && user.email.endsWith('@waltonrobotics.org')) {
    functions.logger.info(`New waltonrobotics.org user: ${user.email}. Assigning admin role.`);

    const customClaims = {
      role: "admin"
    };

    try {
      // Set custom claims for role-based access control.
      await admin.auth().setCustomUserClaims(user.uid, customClaims);

      // Create a user document in Firestore to mirror the admin role.
      const userDocRef = admin.firestore().collection('users').doc(user.uid);
      await userDocRef.set({
        email: user.email,
        role: 'admin',
        displayName: user.displayName || null
      }, { merge: true });

      functions.logger.info(`Successfully assigned admin role and created user document for ${user.email}`);
    } catch (error) {
      functions.logger.error(`Error setting admin role for user ${user.uid}:`, error);
    }
  }
});
