import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import * as nodemailer from 'nodemailer';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';

// Define parameters for Gmail credentials.
// Make sure to set these secrets in your Firebase project:
// firebase functions:secrets:set GMAIL_EMAIL
// firebase functions:secrets:set GMAIL_PASSWORD
const gmailEmail = defineSecret('GMAIL_EMAIL');
const gmailPassword = defineSecret('GMAIL_PASSWORD');

let mailTransport: nodemailer.Transporter | undefined;

 export const createTeamContact = onCall({ secrets: [gmailEmail, gmailPassword] }, async (request) => {
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
    const firestore = getFirestore();
    const auth = getAuth();
    const { teamName, teamNumber, email, mobile, name } = request.data;

  if (!teamNumber) {
          throw new HttpsError('invalid-argument', 'The teamNumber is required');
  }
  if (!email || !mobile) {
          throw new HttpsError('invalid-argument', 'A contact email and mobile number are required.');
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
         
} else {
        teamRef = teamRecord.docs[0].ref;
}

try {
  const userRecord = await auth.createUser({
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
     const link = await auth.generateSignInWithEmailLink(email, actionCodeSettings);

     const mailOptions = {
          from: '"De-Field App" <noreply@firebase.com>',
          to: email,
          subject: 'Sign in to De-Field',
          text: `Hello,\n\nClick the following link to sign in to your De-Field account:\n\n${link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe De-Field Team`,
          html: `<p>Hello,</p><p>Click the following link to sign in to your De-Field account:</p><p><a href="${link}">${link}</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>The De-Field Team</p>`,
     };

     await mailTransport.sendMail(mailOptions);
     console.log('Sign-in email sent to:', email);
} catch (error: any ){
     switch (error.code) {
          case 'auth/email-already-in-use':
          case 'auth/phone-number-already-in-use':
                // Quietly do nothing to prevent account enumeration.
                // The function will proceed to return a success message.
                break;
          case 'auth/invalid-email':
                console.error('Invalid email format:', email);
                throw new HttpsError('invalid-argument', 'The email address is not in a valid format.');
          case 'auth/invalid-phone-number':
                console.error('Invalid phone number format:', mobile);
                throw new HttpsError('invalid-argument', 'The phone number is not in a valid format.');
          default:
                console.error('Error creating user:', error);
                throw error;
     }
}

 return { success: true, message: 'Check your email for login information.' };
});
