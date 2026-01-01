import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    // Add your Firebase config here
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testReadSessions() {
    try {
        // Test reading all sessions
        console.log('Reading sessions collection...');
        const sessionsRef = collection(db, 'sessions');
        const snapshot = await getDocs(sessionsRef);
        
        if (snapshot.empty) {
            console.log('No sessions found');
        } else {
            console.log(`Found ${snapshot.size} sessions:`);
            snapshot.forEach((doc) => {
                console.log(`Session ID: ${doc.id}`, doc.data());
            });
        }

        // Test reading specific session document
        const sessionId = 'test-session-id'; // Replace with actual session ID
        console.log(`\nReading specific session: ${sessionId}`);
        const sessionRef = doc(db, 'sessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);
        
        if (sessionDoc.exists()) {
            console.log('Session data:', sessionDoc.data());
        } else {
            console.log('Session not found');
        }
        
    } catch (error) {
        console.error('Error reading sessions:', error);
    }
}

// Run the test
testReadSessions();