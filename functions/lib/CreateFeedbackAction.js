"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedback = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.submitFeedback = (0, https_1.onCall)(async (request) => {
    // Require authentication (anonymous or regular)
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const feedbackText = request.data.feedback;
    const teamNumber = request.data.teamNumber;
    const sessionId = request.data.sessionId;
    if (!feedbackText || typeof feedbackText !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Feedback text required.');
    }
    if (!teamNumber || typeof teamNumber !== 'number') {
        throw new https_1.HttpsError('invalid-argument', 'Team number required.');
    }
    // Verify team number exists in the teams collection
    const teamDoc = await admin.firestore().collection('teams').doc(teamNumber.toString()).get();
    if (!teamDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Team number does not exist.');
    }
    if (!sessionId || typeof sessionId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Session ID required.');
    }
    // Verify sessionId exists in the sessions collection
    const sessionDoc = await admin.firestore().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Session ID does not exist.');
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
            throw new https_1.HttpsError('resource-exhausted', 'Please wait before submitting more feedback.');
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
//# sourceMappingURL=CreateFeedbackAction.js.map