import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, connectFirestoreEmulator, terminate, Firestore } from 'firebase/firestore';
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';

// Firebase configuration
const firebaseConfig = {
    projectId: "defield-firebase",
    apiKey: "test-api-key",
};

describe('Sessions Integration Tests', () => {
    let app: FirebaseApp;
    let db: Firestore;

    beforeAll(() => {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        // Connect to the Firestore Emulator (default port 8080)
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
    });

    afterAll(async () => {
        // Terminate connection to allow Jest to exit
        await terminate(db);
        await deleteApp(app);
    });

    it('should read sessions collection', async () => {
        const sessionsRef = collection(db, 'sessions');
        const snapshot = await getDocs(sessionsRef);
        
        expect(snapshot).toBeDefined();
        console.log(`Found ${snapshot.size} sessions`);
        snapshot.forEach((doc) => {
            console.log(`Session ID: ${doc.id}`, doc.data());
        });
    });

    it('should read specific session document', async () => {
        const sessionId = 'test-session-id';
        const sessionRef = doc(db, 'sessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);
        
        expect(sessionDoc).toBeDefined();
    });
});