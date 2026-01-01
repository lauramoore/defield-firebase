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
exports.createTeamContact = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const params_1 = require("firebase-functions/params");
// Define parameters for Gmail credentials.
// Make sure to set these secrets in your Firebase project:
// firebase functions:secrets:set GMAIL_EMAIL
// firebase functions:secrets:set GMAIL_PASSWORD
const gmailEmail = (0, params_1.defineString)('GMAIL_EMAIL');
const gmailPassword = (0, params_1.defineString)('GMAIL_PASSWORD');
let mailTransport;
exports.createTeamContact = (0, https_1.onCall)(async (request) => {
    // Lazily initialize mail transport to prevent accessing secrets during deployment.
    // .value() should only be called during runtime.
    if (!mailTransport) {
        mailTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailEmail.value(),
                pass: gmailPassword.value(),
            },
        });
    }
    const firestore = admin.firestore();
    const { teamName, teamNumber, email, mobile, name } = request.data;
    if (!teamNumber) {
        throw new https_1.HttpsError('invalid-argument', 'The teamNumber is required');
    }
    if (!email || !mobile) {
        throw new https_1.HttpsError('invalid-argument', 'A contact email and mobile number are required.');
    }
    let teamRef;
    const teams = firestore.collection('teams');
    const teamRecord = await teams
        .where('teamNumber', '==', teamNumber)
        .limit(1)
        .get();
    if (teamRecord.empty) {
        teamRef = teams.doc(); //this creates new record
        await teamRef.set({
            teamName: teamName || null,
            teamNumber: teamNumber,
            createdAt: new Date(),
        });
    }
    else {
        teamRef = teamRecord.docs[0].ref;
    }
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            displayName: name,
            phoneNumber: mobile,
            emailVerified: false,
        });
        const userDocRef = firestore.collection('users').doc(userRecord.uid);
        await userDocRef.set({
            name: name,
            email: email,
            mobileNumber: mobile,
            team: teamRef,
            role: 'contact',
            createdAt: new Date(),
        });
        //send the login email
        const actionCodeSettings = {
            url: 'https://defield.app/login', // Redirect URL after email verification
            handleCodeInApp: true, // This must be true for email link sign-in
        };
        const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
        const mailOptions = {
            from: '"De-Field App" <noreply@firebase.com>',
            to: email,
            subject: 'Sign in to De-Field',
            text: `Hello,\n\nClick the following link to sign in to your De-Field account:\n\n${link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe De-Field Team`,
            html: `<p>Hello,</p><p>Click the following link to sign in to your De-Field account:</p><p><a href="${link}">${link}</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>The De-Field Team</p>`,
        };
        await mailTransport.sendMail(mailOptions);
        console.log('Sign-in email sent to:', email);
    }
    catch (error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
            case 'auth/phone-number-already-in-use':
                // Quietly do nothing to prevent account enumeration.
                // The function will proceed to return a success message.
                break;
            case 'auth/invalid-email':
                console.error('Invalid email format:', email);
                throw new https_1.HttpsError('invalid-argument', 'The email address is not in a valid format.');
            case 'auth/invalid-phone-number':
                console.error('Invalid phone number format:', mobile);
                throw new https_1.HttpsError('invalid-argument', 'The phone number is not in a valid format.');
            default:
                console.error('Error creating user:', error);
                throw error;
        }
    }
    return { success: true, message: 'Check your email for login information.' };
});
//# sourceMappingURL=CreateTeamContactAction.js.map