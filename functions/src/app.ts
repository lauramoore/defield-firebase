import * as admin from 'firebase-admin';

// Initialize only if the app hasn't been initialized yet
if (!admin.apps.length) {
    admin.initializeApp();
}

// Export the initialized admin object
export { admin };