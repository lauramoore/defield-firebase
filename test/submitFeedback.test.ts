import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'defield-data',
};

describe('submitFeedback Cloud Function', () => {
  let app: any;
  let auth: any;
  let functions: any;
  let submitFeedback: any;
  let db: any

  beforeAll(async () => {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    connectAuthEmulator(auth, 'http://localhost:9099');
    functions = getFunctions(app);
    connectFunctionsEmulator(functions, 'localhost', 5001);

    await signInAnonymously(auth);
    submitFeedback = httpsCallable(functions, 'submitFeedback');
  });

  test('should successfully submit valid feedback', async () => {
    const result = await submitFeedback({
      feedback: 'Test feedback from automated test',
      teamNumber: 2974
    });
    
    expect(result.data).toBeDefined();
    expect(result.data.success).toBe(true);
  });

  test('should handle feedback with special characters', async () => {
    const result = await submitFeedback({
      feedback: 'Test feedback with special chars: !@#$%^&*()',
      teamNumber: 1234
    });
    
    expect(result.data).toBeDefined();
    expect(result.data.success).toBe(true);
  });

  test('should handle long feedback text', async () => {
    const longFeedback = 'A'.repeat(1000);
    const result = await submitFeedback({
      feedback: longFeedback,
      teamNumber: 5678
    });
    
    expect(result.data).toBeDefined();
    expect(result.data.success).toBe(true);
  });

  test('should reject feedback without teamNumber', async () => {
    await expect(submitFeedback({
      feedback: 'Test feedback without team number'
    })).rejects.toThrow();
  });

  test('should reject feedback without feedback text', async () => {
    await expect(submitFeedback({
      teamNumber: 1234
    })).rejects.toThrow();
  });

  test('should reject empty feedback text', async () => {
    await expect(submitFeedback({
      feedback: '',
      teamNumber: 1234
    })).rejects.toThrow();
  });

  test('should reject invalid team number format', async () => {
    await expect(submitFeedback({
      feedback: 'Test feedback',
      teamNumber: 'invalid'
    })).rejects.toThrow();
  });

  test('should reject negative team number', async () => {
    await expect(submitFeedback({
      feedback: 'Test feedback',
      teamNumber: -1
    })).rejects.toThrow();
  });
});
