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
exports.processSignUp = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const app_1 = require("./app");
exports.processSignUp = functions
    .runWith({ maxInstances: 10 })
    .auth.user().onCreate(async (user) => {
    // Check if the user has an email and was created with the Google provider.
    const isGoogleProvider = user.providerData.some((provider) => provider.providerId === 'google.com');
    // Check if the user signed up with a waltonrobotics.org email via Google
    if (isGoogleProvider && user.email && user.email.endsWith('@waltonrobotics.org')) {
        functions.logger.info(`New waltonrobotics.org user: ${user.email}. Assigning admin role.`);
        const customClaims = {
            role: "admin"
        };
        try {
            // Set custom claims for role-based access control.
            await app_1.admin.auth().setCustomUserClaims(user.uid, customClaims);
            // Create a user document in Firestore to mirror the admin role.
            const userDocRef = app_1.admin.firestore().collection('users').doc(user.uid);
            await userDocRef.set({
                email: user.email,
                role: 'admin',
                displayName: user.displayName || null
            }, { merge: true });
            functions.logger.info(`Successfully assigned admin role and created user document for ${user.email}`);
        }
        catch (error) {
            functions.logger.error(`Error setting admin role for user ${user.uid}:`, error);
        }
    }
});
//# sourceMappingURL=AuthTriggers.js.map